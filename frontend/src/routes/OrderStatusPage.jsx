import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { CheckCircle, Clock, Utensils, ArrowLeft } from "lucide-react";

const statuses = [
  { key: "pending", label: "Pending", icon: Clock },
  { key: "preparing", label: "Preparing", icon: Utensils },
  { key: "ready", label: "Ready", icon: CheckCircle },
  { key: "completed", label: "Completed", icon: CheckCircle },
];

const getStatusColor = (status = "") => {
  const colors = {
    pending: "bg-yellow-500",
    preparing: "bg-blue-500",
    ready: "bg-purple-500",
    completed: "bg-green-600",
  };
  return colors[status.toLowerCase()] || "bg-gray-400";
};

const OrderStatusPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { currentUser, role } = useAuth();

  const [order, setOrder] = useState(null);
  const [isCafeteriaAdmin, setIsCafeteriaAdmin] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  // ✅ Load order & verify admin permissions
  useEffect(() => {
    if (!orderId) return;

    const unsub = onSnapshot(doc(db, "orders", orderId), async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setOrder(data);

        // ✅ Check if current user is admin for this order
        if (currentUser) {
          if (role === "admin") {
            setIsCafeteriaAdmin(true);
          } else if (data.adminEmail && data.adminEmail === currentUser.email) {
            setIsCafeteriaAdmin(true);
          } else if (data.adminId && data.adminId === currentUser.uid) {
            setIsCafeteriaAdmin(true);
          } else if (data.cafeteriaId) {
            try {
              const cafSnap = await getDoc(doc(db, "cafeterias", data.cafeteriaId));
              if (cafSnap.exists() && cafSnap.data().adminEmail === currentUser.email) {
                setIsCafeteriaAdmin(true);
              } else {
                setIsCafeteriaAdmin(false);
              }
            } catch {
              setIsCafeteriaAdmin(false);
            }
          } else {
            setIsCafeteriaAdmin(false);
          }
        } else {
          setIsCafeteriaAdmin(false);
        }
      } else {
        setOrder(null);
      }
    });

    return () => unsub();
  }, [orderId, currentUser, role]);

  const updateStatus = async (newStatus) => {
    try {
      setUpdating(true);
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
    } catch (err) {
      console.error("Error updating order status:", err);
      alert("Failed to update status: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (!order) return <div className="p-8 text-center text-gray-500">Loading order details...</div>;

  const currentStatusLower = (order.status || "").toLowerCase();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(isCafeteriaAdmin ? "/admin-dashboard" : "/user-dashboard")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium"
        >
          <ArrowLeft size={18} />
          Back to {isCafeteriaAdmin ? "Admin Dashboard" : "Dashboard"}
        </button>

        <h1 className="text-2xl font-bold mb-2">Order Status</h1>
        <p className="text-gray-600 mb-6">Order ID: {orderId}</p>

        {/* ✅ Show status buttons to admin */}
        {isCafeteriaAdmin && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-5">
            <h2 className="font-semibold mb-3 text-gray-900">Update Order Status</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {statuses.map(({ key, label, icon: Icon }) => {
                const isActive = currentStatusLower === key;
                return (
                  <button
                    key={key}
                    onClick={() => updateStatus(key)}
                    disabled={isActive || updating}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl transition font-medium ${
                      isActive
                        ? `${getStatusColor(key)} text-white shadow`
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    } disabled:cursor-default`}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-xs">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Order box */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-6">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full p-6 flex justify-between items-center text-left"
          >
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${getStatusColor(order.status)}`} />
              <h2 className="font-semibold capitalize text-gray-900">{order.status || "Pending"}</h2>
            </div>
            <span className="text-gray-400 font-bold">{isExpanded ? "▲" : "▼"}</span>
          </button>

          {isExpanded && (
            <div className="px-6 pb-4 border-t pt-3">
              {order.cart?.map((item, i) => (
                <div key={i} className="flex justify-between py-1 text-gray-700 text-sm">
                  <span>
                    {item.quantity || 1} x {item.name}
                  </span>
                  <span>₹{Number(item.price || 0).toFixed(2)}</span>
                </div>
              ))}
              <div className="font-bold text-base flex justify-between mt-3 pt-3 border-t">
                <span>Total</span> <span>₹{Number(order.total || 0).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* ✅ Status Progress indicator */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="grid grid-cols-4 gap-2 text-center">
            {statuses.map(({ key, label, icon: Icon }) => {
              const currentIdx = statuses.findIndex((s) => s.key === currentStatusLower);
              const stepIdx = statuses.findIndex((s) => s.key === key);
              const done = currentIdx >= 0 && stepIdx <= currentIdx;

              return (
                <div className="flex flex-col items-center" key={key}>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                      done ? `${getStatusColor(key)} text-white shadow` : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="mt-2 text-xs font-medium text-gray-600">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusPage;
