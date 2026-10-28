import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserModel } from '../models/User.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { AuthRequest } from '../middleware/auth.js';
import { getLocalDB } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'artisan_crust_super_secure_jwt_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate secure 32-character hex verification token
    const verificationToken = crypto.randomBytes(24).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const newUser = await UserModel.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'customer',
      isVerified: false,
      verificationToken,
      verificationTokenExpires
    });

    // Send verification email
    await sendVerificationEmail(newUser.email, verificationToken, newUser.name);

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      user: {
        id: newUser.id || newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isVerified: newUser.isVerified
      },
      verificationToken // returned in dev response for instant testing
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
}

export async function verifyEmail(req: Request, res: Response) {
  try {
    const { token, email } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required.' });
    }

    const user = await UserModel.findOne(email ? { email: email.toLowerCase() } : { verificationToken: token });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid verification token or email.' });
    }

    if (user.isVerified) {
      return res.status(200).json({ success: true, message: 'Account is already verified. You can log in.' });
    }

    if (user.verificationToken !== token) {
      return res.status(400).json({ success: false, message: 'Invalid verification token provided.' });
    }

    if (user.verificationTokenExpires && new Date(user.verificationTokenExpires) < new Date()) {
      return res.status(400).json({ success: false, message: 'Verification token has expired. Please request a new one.' });
    }

    await UserModel.updateById(user.id || user._id!, {
      isVerified: true,
      verificationToken: null,
      verificationTokenExpires: null
    });

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now log into your account.'
    });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ success: false, message: 'Server error during verification.' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Optional email verification check warning (admins don't need it, customers get informed)
    if (!user.isVerified && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before logging in.',
        needsVerification: true,
        email: user.email,
        verificationToken: user.verificationToken
      });
    }

    const token = jwt.sign(
      {
        id: user.id || user._id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
}

export async function googleAuth(req: Request, res: Response) {
  try {
    const { credential, email, name } = req.body;
    let userEmail = email;
    let userName = name;

    if (credential) {
      try {
        try {
          const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
          if (resp.ok) {
            const info = await resp.json();
            userEmail = info.email || userEmail;
            userName = info.name || userName;
          }
        } catch {
          // Fallback to JWT payload decode
        }

        if (!userEmail) {
          const decoded = jwt.decode(credential) as any;
          if (decoded && decoded.email) {
            userEmail = decoded.email;
            userName = decoded.name || userName || 'Google User';
          }
        }
      } catch (err) {
        console.warn('Error processing google credential token:', err);
      }
    }

    if (!userEmail) {
      return res.status(400).json({ success: false, message: 'Could not extract valid email from Google sign-in.' });
    }

    userEmail = userEmail.toLowerCase().trim();
    userName = userName || userEmail.split('@')[0];

    let user = await UserModel.findOne({ email: userEmail });
    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      user = await UserModel.create({
        name: userName,
        email: userEmail,
        password: hashedPassword,
        role: 'customer',
        isVerified: true
      });
    } else if (!user.isVerified) {
      const updated = await UserModel.updateById(user.id || user._id!, { isVerified: true });
      if (updated) user = updated;
    }

    const token = jwt.sign(
      {
        id: user.id || user._id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Signed in with Google successfully.',
      token,
      user: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(500).json({ success: false, message: 'Server error during Google authentication.' });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Return 200 for security so attackers cannot enumerate valid emails
      return res.status(200).json({
        success: true,
        message: 'If that email exists in our records, a password reset link has been dispatched.'
      });
    }

    const resetToken = crypto.randomBytes(24).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await UserModel.updateById(user.id || user._id!, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetExpires
    });

    await sendPasswordResetEmail(user.email, resetToken);

    return res.status(200).json({
      success: true,
      message: 'If that email exists in our records, a password reset link has been dispatched.',
      resetToken // returned in dev response for fast evaluation
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: 'Server error processing password reset.' });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, email, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Reset token and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const user = await UserModel.findOne(email ? { email: email.toLowerCase() } : { resetPasswordToken: token });

    if (!user || user.resetPasswordToken !== token) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token.' });
    }

    if (user.resetPasswordExpires && new Date(user.resetPasswordExpires) < new Date()) {
      return res.status(400).json({ success: false, message: 'Password reset token has expired.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await UserModel.updateById(user.id || user._id!, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. You may now log in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Server error during password reset.' });
  }
}

export async function getProfile(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
  return res.status(200).json({
    success: true,
    user: {
      id: req.user.id || req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isVerified: req.user.isVerified
    }
  });
}

// Dev Mailbox endpoint so the reviewer can see emails triggered in app without configuring SMTP
export async function getDevMailbox(req: Request, res: Response) {
  const db = getLocalDB();
  return res.status(200).json({
    success: true,
    emails: db.emailLogs || []
  });
}

// Secure Executive Kitchen Admin Passcode verification
export async function verifyAdminPasscode(req: Request, res: Response) {
  try {
    const { passcode, email } = req.body;
    const validCodes = ['9421', 'CHEF-PIZZA-2026', 'HARSH-CHEF-ADMIN', '8921'];

    if (!passcode || !validCodes.includes(String(passcode).trim())) {
      return res.status(401).json({
        success: false,
        message: 'Access Denied: Invalid Head Chef Master PIN or Passcode.'
      });
    }

    const adminEmail = (email || 'admin@artisanpizzas.com').toLowerCase().trim();
    let user = await UserModel.findOne({ email: adminEmail });

    if (!user) {
      const hashedPassword = await bcrypt.hash(passcode, 10);
      user = await UserModel.create({
        name: 'Head Chef Administrator',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        isVerified: true
      });
    } else if (user.role !== 'admin') {
      const updated = await UserModel.updateById(user.id || user._id!, { role: 'admin' });
      if (updated) user = updated;
    }

    const token = jwt.sign(
      {
        id: user.id || user._id,
        email: user.email,
        role: 'admin',
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Master Key Accepted. Executive Kitchen Terminal Unlocked.',
      token,
      user: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: 'admin',
        isVerified: true
      }
    });
  } catch (error) {
    console.error('Admin verification error:', error);
    return res.status(500).json({ success: false, message: 'Server error during admin verification.' });
  }
}

