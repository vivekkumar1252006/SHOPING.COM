# SmartCart AI – Modern AI-Powered E-Commerce Platform

An intelligent, full-stack MERN (MongoDB, Express.js, React 18, Node.js) shopping platform powered by Google Gemini AI, featuring Razorpay payment processing, product comparisons, conversational AI shopping assistance, semantic search, and an administrative command center.

---

## 🚀 Live Localhost URLs

- **Frontend Client (Vite + React):** [http://localhost:5173](http://localhost:5173)
- **Backend API (Node + Express):** [http://localhost:5000](http://localhost:5000)
- **API Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 Pre-Seeded Test Credentials

Use these credentials or click the **1-Click Test Credentials** button on `/login`:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Admin** | `admin@smartcart.ai` | `Admin@123` | Full Admin Dashboard (`/admin`), Product Inventory CRUD, Orders Management, User Accounts, Coupon Codes |
| **Customer** | `customer@smartcart.ai` | `Customer@123` | Storefront Shopping, Cart, Wishlist, Checkout, AI Assistant, Order Tracking |

Active Promo Coupons:
- `SMART10` - 10% Off
- `WELCOME20` - 20% Off
- `FLAT50` - Flat ₹500 Off

---

## 🌟 Key Features

1. **Google Gemini AI Shopping Assistant (Nova):**
   - Floating chat concierge with real-time markdown answers and in-chat recommended product cards with direct "Add to Cart" and detail links.
2. **Semantic & Natural Language Search:**
   - Ask complex natural language queries like *"wireless noise cancelling headphones under ₹15000 for travel"* and receive AI-filtered results and reasoning.
3. **Smart Product Comparison Matrix:**
   - Compare up to 4 devices side-by-side with automatic specification alignment.
4. **Interactive Cart & Checkout:**
   - Slide-over cart drawer with free shipping progress bar (threshold ₹999).
   - Razorpay payment gateway integration with 1-click instant demo simulation.
5. **Real-Time Order Tracking:**
   - 5-step visual tracking timeline (`Pending` -> `Processing` -> `Shipped` -> `Out for Delivery` -> `Delivered`).
6. **Admin Management Suite:**
   - Real-time revenue charts (Recharts), order volume analytics, low-stock threshold alerts, customer management, coupon builder, and product catalog CRUD.
7. **Resilient Dual-Mode Database:**
   - Seamlessly connects to local MongoDB or automatically starts an embedded zero-configuration database via `mongodb-memory-server`.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React, Redux Toolkit, Axios, Recharts, Canvas Confetti.
- **Backend:** Node.js, Express.js, Mongoose ODM, JWT, bcryptjs, Razorpay SDK, Google Generative AI SDK (`@google/generative-ai`), Multer.
- **Database:** MongoDB / MongoDB Memory Server.

## Storefront

The customer storefront follows a compact two-row shopping layout: a logo, live product search, account, and cart in the first row; category links and a sliding collections menu in the second. Product cards display in four columns on desktop and two columns on smaller screens, with direct add-to-cart and buy-now actions.

The sample catalog includes the storefront categories and collection products. In development, the Vite client forwards `/api` requests to the Express server at `http://localhost:5000`.

Start the backend and frontend from the project root with `npm run server` and `npm run client` in separate terminals.
