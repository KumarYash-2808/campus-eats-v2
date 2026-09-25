import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./routes/Auth/LoginSignup"
import UserDashboard from "./routes/UserDashboard";
import UserMenu from "./routes/UserMenu";
import AdminDashboard from "./routes/AdminDashboard";
import CheckoutPage from "./routes/CheckoutPage";
import OrderStatusPage from "./routes/OrderStatusPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login/>}/>
        <Route path="/user-dashboard" element={<UserDashboard />} />
        <Route path="/cafeteria/:cafeteriaId" element={<UserMenu />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/checkout/:cafeteriaId" element={<CheckoutPage />} />
        <Route path="/order-status/:orderId" element={<OrderStatusPage />} />
      </Routes>
    </Router>
  );
}

export default App;
