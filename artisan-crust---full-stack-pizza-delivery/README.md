# 🍕 Artisan Crust - Full-Stack Pizza Delivery Application

**Oasis Infobyte Internship (OIBSIP Level 3 - Full Stack Web Development)**

Artisan Crust is an authentic, full-stack, production-grade pizza delivery platform engineered with a **React (Vite) frontend**, an **Express.js and Node.js backend**, a **MongoDB/Mongoose** architecture (with dual-mode persistent document fallback), **JWT & bcrypt authentication**, **Razorpay test-mode payment verification**, **real-time inventory management**, and **automated scheduled low-stock email alerts**.

---

## 🌟 Key Features

### 1. Customer Experience
- **Interactive Custom Pizza Builder**:
  - 5 selectable pizza crust bases with artisanal fermentation descriptions and live pricing.
  - 5 authentic slow-simmered sauces.
  - Premium cheese options including fior di latte, aged cheddar, gorgonzola, smoked provolone, and vegan cashew cheese.
  - 9 fresh farm-to-table vegetable toppings.
  - Live dynamic price calculation backed by real-time inventory validation on the server.
- **Curated Menu & Search**:
  - Wood-fired signature pizzas with appetizing food photography.
  - Category filters (`Classic`, `Specialty`, `Vegetarian`, `Gourmet`) and instant text search.
- **Cart & Checkout**:
  - Quantity steppers, line-item totals, GST (5%), and free delivery calculation above ₹500.
  - Delivery details collection with validation.
  - Server-side price recalculation and stock reservation.
- **Razorpay Test-Mode Integration**:
  - Secure order creation via backend API.
  - Cryptographic HMAC-SHA256 signature verification (`crypto.createHmac`).
  - Interactive test payment modal with simulated success and failure options.
  - Prevents double-stock deduction on duplicate callbacks.
- **Live 3-Stage Order Tracking**:
  - Follow order status in real time:
    1. **Order Received**
    2. **In Kitchen**
    3. **Sent to Delivery**
    (and *Delivered*)
  - Live auto-polling keeps customer screens in sync whenever an admin updates status.
  - Order history with full ingredient snapshots and historical price retention.

### 2. Authentication & Security
- User registration with bcrypt password hashing (10 salt rounds).
- Expiring email verification tokens (24h lifespan).
- Login using standard JSON Web Tokens (JWT).
- Single-use, expiring password reset tokens (1h lifespan).
- Role-Based Access Control (RBAC) protecting customer and admin endpoints.
- **Dev Mailbox & Alert Inspector**: Interactive UI modal to preview verification emails, password resets, and low-stock alerts without requiring external SMTP configuration.

### 3. Admin Command & Inventory Management
- **Admin Overview KPIs**:
  - Total Orders, Pending Orders, Delivered Orders, and Verified Razorpay Revenue.
  - Automated low-stock warning banners.
- **Inventory Management**:
  - Stock levels for bases, sauces, cheeses, and vegetables.
  - Edit prices, available quantities, and low-stock thresholds.
  - Quick adjustment buttons (`+5`, `-5`) preventing negative inventory.
  - Atomic stock deductions upon successful payment confirmation.
- **Scheduled Low-Stock Alerts**:
  - Configurable `node-cron` scheduled monitoring.
  - Instant manual trigger button ("Scan Low Stock & Alert").
  - Prevents duplicate alert spamming within 24 hours.
- **Order Kitchen Operations**:
  - Filter orders by status.
  - Update status through the required three stages: *Order Received* ➔ *In Kitchen* ➔ *Sent to Delivery*.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, React Router v7, Axios, Lucide React, Space Mono & Fraunces Typography.
- **Backend**: Node.js, Express.js, TypeScript (via `tsx`).
- **Database**: MongoDB with Mongoose (with automated persistent JSON document fallback).
- **Authentication**: JWT (`jsonwebtoken`), Password Hashing (`bcryptjs`), Crypto HMAC.
- **Payments**: Razorpay Test Mode with backend cryptographic signature verification.
- **Emails & Scheduling**: Nodemailer, Node-cron.

---

## 📁 Project Structure

```
├── .env.example              # Environment variables template
├── index.html                # Application entry HTML with fonts and Razorpay SDK
├── package.json              # Project scripts and dependencies
├── server.ts                 # Full-stack entry point mounting Express API + Vite middleware
├── server/
│   └── src/
│       ├── config/
│       │   ├── db.ts         # Dual-mode database manager (MongoDB Atlas + persistent fallback)
│       │   └── seed.ts       # Initial data seeder (Admin, ingredients, curated pizzas)
│       ├── controllers/
│       │   ├── adminController.ts
│       │   ├── authController.ts
│       │   ├── menuController.ts
│       │   └── orderController.ts
│       ├── middleware/
│       │   └── auth.ts       # JWT token verification and RBAC middleware
│       ├── models/
│       │   ├── Ingredient.ts # Inventory model with atomic stock decrement
│       │   ├── Order.ts      # Orders with ingredient and price snapshots
│       │   ├── PizzaMenu.ts  # Curated signature pizzas
│       │   └── User.ts       # User model with auth tokens
│       ├── routes/
│       │   ├── adminRoutes.ts
│       │   ├── authRoutes.ts
│       │   ├── menuRoutes.ts
│       │   └── orderRoutes.ts
│       └── services/
│           ├── cronService.ts     # node-cron scheduled low-stock scanner
│           ├── emailService.ts    # Nodemailer email dispatcher with dev mailbox log
│           └── razorpayService.ts # Razorpay order creation and HMAC verification
└── src/
    ├── App.tsx               # Main React routes and providers
    ├── index.css             # Tailwind CSS imports and custom base fonts
    ├── main.tsx              # React client entry point
    ├── components/
    │   ├── CartDrawer.tsx        # Slide-over cart review
    │   ├── DevMailboxModal.tsx   # Live email/token inspector
    │   ├── Footer.tsx            # Domain footer
    │   ├── Navbar.tsx            # 3-Zone Top Bar with demo role switcher
    │   └── RazorpayModal.tsx     # Razorpay test mode payment interface
    ├── context/
    │   ├── AuthContext.tsx       # Auth state, JWT storage, role switcher
    │   └── CartContext.tsx       # Shopping bag state and price calculations
    ├── pages/
    │   ├── AdminDashboardPage.tsx
    │   ├── AuthPages.tsx
    │   ├── CartCheckoutPage.tsx
    │   ├── CustomBuilderPage.tsx
    │   ├── HomePage.tsx
    │   ├── MenuPage.tsx
    │   ├── OrderHistoryPage.tsx
    │   └── OrderTrackingPage.tsx
    ├── services/
    │   └── api.ts            # Typed Axios client with auth interceptors
    └── types/
        └── index.ts          # Core TypeScript interfaces
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory (or copy from `.env.example`):
```env
PORT=3000
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.example.net/pizza_db?retryWrites=true&w=majority"
JWT_SECRET="artisan_crust_super_secure_jwt_secret_key_2026"
RAZORPAY_KEY_ID="rzp_test_artisancrust1042"
RAZORPAY_KEY_SECRET="secret_artisancrust_test_key_secure"
ADMIN_EMAIL="admin@artisancrust.com"
```
*(Note: If `MONGODB_URI` is omitted or unavailable, the application automatically runs using the persistent local document store, requiring zero setup to start immediately.)*

### 3. Run the Full-Stack Application
```bash
npm run dev
```
The server will start on `http://localhost:3000`, serving both the Express REST APIs under `/api/*` and the interactive React frontend!

---

## 🔑 Demo Credentials

- **Admin Account**:
  - Email: `admin@artisancrust.com`
  - Password: `Admin@12345`
  - Role: `admin` (Full inventory CRUD, order kitchen updates, low-stock alerts)
- **Customer Account**:
  - Email: `customer@example.com`
  - Password: `Customer@12345`
  - Role: `customer` (Order placement, custom pizza builder, tracking)

*(You can also use the **Demo Role Switch** buttons in the top navigation bar to toggle between roles in a single click!)*

---

## 📡 REST API Reference

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new customer account | Public |
| `POST` | `/api/auth/verify-email` | Verify account via token | Public |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT | Public |
| `POST` | `/api/auth/forgot-password` | Request password reset token | Public |
| `POST` | `/api/auth/reset-password` | Set new password with token | Public |
| `GET` | `/api/auth/profile` | Current authenticated profile | User |
| `GET` | `/api/auth/dev-mailbox` | Inspect sent dev emails & tokens | Public |
| `GET` | `/api/menu` | List curated signature pizzas | Public |
| `GET` | `/api/menu/ingredients` | Grouped ingredients and stock | Public |
| `POST` | `/api/menu/validate-custom` | Validate prices & stock for custom pie | Public |
| `POST` | `/api/orders` | Create order & Razorpay order | User |
| `POST` | `/api/orders/verify-payment` | Verify HMAC signature & deduct stock | User |
| `GET` | `/api/orders/my-orders` | Fetch user's order history | User |
| `GET` | `/api/orders/:id/track` | Live order tracking with status history | User |
| `GET` | `/api/admin/stats` | Overview KPIs and low-stock items | Admin |
| `GET` | `/api/admin/orders` | View all customer orders | Admin |
| `PATCH`| `/api/admin/orders/:id/status`| Update order status (1, 2, 3) | Admin |
| `GET` | `/api/admin/inventory` | View all ingredient stock records | Admin |
| `POST` | `/api/admin/inventory` | Create new ingredient | Admin |
| `PUT` | `/api/admin/inventory/:id` | Update ingredient price/threshold | Admin |
| `POST` | `/api/admin/inventory/:id/adjust-stock` | Increment/decrement inventory | Admin |
| `POST` | `/api/admin/check-low-stock` | Trigger automated low-stock email scan | Admin |

---

## 🧪 Testing Checklist

- [x] Register new customer, inspect verification token in Dev Mailbox, and verify email.
- [x] Request password reset and update password using secure token.
- [x] Build custom pizza with 5 bases, 5 sauces, cheeses, and vegetables; inspect dynamic price calculation.
- [x] Attempt ordering an out-of-stock ingredient; verify backend blocks checkout.
- [x] Place an order and authorize via Razorpay test mode.
- [x] Confirm backend verifies HMAC-SHA256 signature and atomically decrements inventory stock.
- [x] Confirm duplicate payment requests do not deduct stock twice.
- [x] Admin updates order status through "Order Received", "In Kitchen", and "Sent to Delivery".
- [x] Customer order tracking page updates automatically via live polling.
- [x] Admin inspects low-stock alerts and adjusts inventory counts.
