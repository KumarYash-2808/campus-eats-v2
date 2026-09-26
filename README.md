# 🍔 CampusEats (v2)
🌐 [Live Deployment](https://frontend-one-ruby-178fpdikzo.vercel.app/)
**CampusEats** is a modern, full-stack food pre-ordering and cafeteria management platform tailored for university campuses. It streamlines campus dining by allowing students to browse cafeteria menus, check live stock, and order ahead to skip long lines, while providing cafeteria managers with a real-time order fulfillment dashboard.

### ✨ Key Features

- **👥 Role-Based Authentication:** Distinct student and cafeteria admin portals powered by Firebase Auth & Firestore.
- **⚡ Real-Time Menu & Stock Management:** Cafeteria staff can add items, update pricing, and adjust stock with instant synchronized updates across all clients.
- **🛒 Dynamic Ordering & Atomic Inventory:** Interactive cart with automatic stock checks and atomic quantity decrements upon checkout.
- **📦 Live Order Tracker:** Turn-by-turn order progression (`Pending` ➔ `Preparing` ➔ `Ready` ➔ `Completed`) with real-time Firestore listeners.
- **🎨 Modern Responsive UI:** Built with React 19, Tailwind CSS, and Lucide React icons.

### 🛠️ Tech Stack
- **Frontend:** React 19, Vite, Tailwind CSS, React Router v7, Lucide React
- **Backend & Database:** Firebase Authentication, Cloud Firestore (Real-time DB), Firebase Admin SDK (Node.js)
