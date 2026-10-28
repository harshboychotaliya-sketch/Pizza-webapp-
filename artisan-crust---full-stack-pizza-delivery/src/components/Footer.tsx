import React from 'react';
import { Link } from 'react-router-dom';
import { Pizza, Phone, MapPin, Clock, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#242424] text-[#EFEAE4] pt-14 pb-10 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-stone-800">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xl font-bold font-display text-white">
              <Pizza className="w-5 h-5 text-[#E23722]" />
              <span>Artisan Crust</span>
            </div>
            <p className="text-stone-400 text-sm leading-relaxed">
              Authentic slow-fermented Neapolitan and sourdough pizzas baked on high-heat stone hearths with fresh farm-to-table ingredients.
            </p>
            <div className="flex items-center gap-2 text-xs text-stone-400 pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Razorpay Verified Test Merchant</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-stone-400">Quick Links</h4>
            <ul className="space-y-2 text-sm text-stone-300">
              <li><Link to="/menu" className="hover:text-white transition-colors">Our Menu</Link></li>
              <li><Link to="/builder" className="hover:text-white transition-colors">Custom Pizza Builder</Link></li>
              <li><Link to="/track" className="hover:text-white transition-colors">Live Order Tracker</Link></li>
              <li><Link to="/orders" className="hover:text-white transition-colors">Customer History</Link></li>
            </ul>
          </div>

          {/* Hours */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-stone-400">Kitchen Hours</h4>
            <div className="text-sm text-stone-300 space-y-1.5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#E06A26]" />
                <span>Mon – Fri: 11:30 AM – 11:00 PM</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#E06A26]" />
                <span>Sat – Sun: 11:00 AM – Midnight</span>
              </div>
              <p className="text-xs text-stone-400 pt-1">Fresh sourdough prep starts daily at 6:00 AM.</p>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-stone-400">Pizzeria Location</h4>
            <div className="text-sm text-stone-300 space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#E23722] shrink-0 mt-0.5" />
                <span>88 Hearthstone Blvd, Indiranagar, Bangalore, Karnataka 560038</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-stone-400" />
                <span>+91 (080) 4123-7890</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-4">
          <p>© {new Date().getFullYear()} Artisan Crust Pizzeria. Oasis Infobyte Full-Stack Internship (OIBSIP Level 3).</p>
          <div className="flex items-center gap-4">
            <span>Privacy Policy</span>
            <span>·</span>
            <span>Terms of Service</span>
            <span>·</span>
            <span>FSSAI Lic. #11223344556677</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
