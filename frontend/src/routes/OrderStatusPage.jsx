import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { 
  CheckCircle, Clock, Utensils, ArrowLeft, Sparkles, 
  MapPin, ChefHat, Bell, Check, ShoppingBag, ShieldCheck, ChevronDown, ChevronUp
} from "lucide-react";

const statuses = [
  { key: "pending", label: "Confirmed", icon: CheckCircle, desc: "Kitchen received your order" },
  { key: "preparing", label: "Cooking", icon: Utensils, desc: "Chef is preparing your fresh meal" },
  { key: "ready", label: "Ready", icon: Bell, desc: "Pickup at the cafeteria counter" },
  { key: "completed", label: "Fulfilled", icon: Sparkles, desc: "Order collected & enjoyed" },
];

const OrderStatusPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { currentUser, role } = useAuth();

  const [order, setOrder] = useState(null);
  const [isCafeteriaAdmin, setIsCafeteriaAdmin] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Load order & verify admin permissions
  useEffect(() => {
    if (!orderId) return;

    const unsub = onSnapshot(doc(db, "orders", orderId), async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setOrder({ id: snap.id, ...data });

        // Check if current user is admin for this order
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

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-bold text-sm">Locating your live order...</p>
        </div>
      </div>
    );
  }

  const currentStatus = (order.status || "pending").toLowerCase();
  const currentStepIndex = Math.max(
    0,
    statuses.findIndex((s) => s.key === currentStatus)
  );

  // Digital pickup token (e.g. #304)
  const tokenNumber = order.id ? `#${order.id.slice(-4).toUpperCase()}` : "#0001";

  const getStatusHeadline = () => {
    switch (currentStatus) {
      case "pending":
        return {
          title: "Order Placed & Confirmed!",
          subtitle: "Waiting for the kitchen counter to start preparation.",
          color: "from-amber-500 to-orange-500",
          icon: Clock,
        };
      case "preparing":
        return {
          title: "Cooking Your Fresh Meal 👨‍🍳",
          subtitle: "Your food is on the stove and will be ready in ~8 mins.",
          color: "from-orange-500 to-rose-500",
          icon: Utensils,
        };
      case "ready":
        return {
          title: "🔔 Ready for Counter Pickup!",
          subtitle: "Head over to the cafeteria counter and flash your token.",
          color: "from-emerald-500 to-teal-600",
          icon: Bell,
        };
      case "completed":
        return {
          title: "Order Picked Up & Enjoyed! 🎉",
          subtitle: "Thank you for ordering on CampusEats.",
          color: "from-gray-800 to-gray-900",
          icon: CheckCircle,
        };
      default:
        return {
          title: "Tracking Campus Order",
          subtitle: "Live status updates from cafeteria staff.",
          color: "from-orange-500 to-amber-500",
          icon: Clock,
        };
    }
  };

  const statusMeta = getStatusHeadline();
  const StatusIcon = statusMeta.icon;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <button
            onClick={() => navigate(isCafeteriaAdmin ? "/admin-dashboard" : "/user-dashboard")}
            className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-orange-600 transition"
          >
            <ArrowLeft size={18} />
            <span>{isCafeteriaAdmin ? "Admin Dashboard" : "Back to Home"}</span>
          </button>

          <span className="text-xs font-bold text-gray-400">Order ID: {order.id.slice(-6)}</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* 🌟 SWIGGY/ZOMATO LIVE TRACKING HERO CARD */}
        <div className={`bg-gradient-to-tr ${statusMeta.color} rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-orange-500/10 relative overflow-hidden`}>
          <div className="relative z-10">
            
            {/* Top row with token */}
            <div className="flex justify-between items-start gap-4 mb-6">
              <div>
                <span className="bg-white/20 text-white text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full inline-block mb-2">
                  Live Status Tracker
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{statusMeta.title}</h1>
                <p className="text-white/80 text-xs sm:text-sm mt-1">{statusMeta.subtitle}</p>
              </div>

              {/* Digital Pickup Token */}
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 text-center min-w-[90px] shadow-lg flex-shrink-0 text-gray-900">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 block">
                  Pickup Token
                </span>
                <span className="text-2xl font-black tracking-tight block mt-0.5">{tokenNumber}</span>
              </div>
            </div>

            {/* Cafeteria Location pill */}
            <div className="flex items-center gap-2 text-xs font-semibold bg-black/20 backdrop-blur-md px-3.5 py-2 rounded-xl text-white/90 w-fit">
              <MapPin size={14} className="text-orange-300" />
              <span>{order.cafeteriaName || "Campus Cafeteria"}</span>
            </div>
          </div>

          <StatusIcon className="w-36 h-36 text-white/10 absolute -right-6 -bottom-6 pointer-events-none" />
        </div>

        {/* 🔄 LIVE TIMELINE PROGRESS STEPPER (SWIGGY STYLE) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100">
          <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-6">
            Order Lifecycle
          </h2>

          <div className="relative flex justify-between">
            {/* Connecting Track Line */}
            <div className="absolute top-5 left-6 right-6 h-0.5 bg-gray-200 -z-0">
              <div
                className="h-full bg-emerald-600 transition-all duration-500"
                style={{
                  width: `${(currentStepIndex / (statuses.length - 1)) * 100}%`,
                }}
              ></div>
            </div>

            {statuses.map(({ key, label, icon: Icon }, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const isUpcoming = idx > currentStepIndex;

              return (
                <div key={key} className="flex flex-col items-center text-center relative z-10 w-20">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isPast
                        ? "bg-emerald-600 text-white shadow-xs"
                        : isCurrent
                        ? "bg-orange-600 text-white ring-4 ring-orange-100 shadow-md scale-110 animate-pulse"
                        : "bg-white text-gray-400 border-2 border-gray-200"
                    }`}
                  >
                    {isPast ? <Check size={18} className="stroke-[3]" /> : <Icon size={18} />}
                  </div>
                  <span
                    className={`text-xs mt-2.5 font-bold capitalize ${
                      isCurrent
                        ? "text-orange-600 font-black"
                        : isPast
                        ? "text-gray-900"
                        : "text-gray-400"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 👨‍🍳 ADMIN STATUS UPDATE CONTROLS (IF LOGGED IN AS ADMIN) */}
        {isCafeteriaAdmin && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <ChefHat size={18} className="text-blue-700" />
              <h3 className="font-extrabold text-blue-900 text-sm uppercase tracking-wide">
                Vendor Kitchen Control
              </h3>
            </div>
            <p className="text-xs text-blue-700 mb-4">
              Advance the customer's order state with single-click dispatch:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {statuses.map(({ key, label }) => {
                const isActive = currentStatus === key;
                return (
                  <button
                    key={key}
                    onClick={() => updateStatus(key)}
                    disabled={isActive || updating}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition shadow-xs ${
                      isActive
                        ? "bg-blue-600 text-white cursor-default"
                        : "bg-white text-blue-900 hover:bg-blue-600 hover:text-white border border-blue-200"
                    } disabled:opacity-50`}
                  >
                    {isActive ? "✓ " + label : "Set " + label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 🧾 DIGITAL ORDER RECEIPT & BILL BREAKDOWN */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100">
          <div
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex justify-between items-center cursor-pointer select-none"
          >
            <div className="flex items-center gap-2.5">
              <ShoppingBag size={18} className="text-orange-600" />
              <h3 className="font-extrabold text-gray-900 text-base">Receipt & Item Details</h3>
            </div>
            <span className="text-gray-400 hover:text-gray-700">
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </span>
          </div>

          {isExpanded && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              {/* Items */}
              <div className="space-y-3 mb-6">
                {order.cart?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-emerald-600 rounded-xs flex items-center justify-center p-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div>
                      </div>
                      <span className="font-bold text-gray-800">{item.name}</span>
                      <span className="text-gray-400">×{item.quantity || 1}</span>
                    </div>
                    <span className="font-extrabold text-gray-900">
                      ₹{Number(item.price || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Instructions if any */}
              {order.instructions && (
                <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600 mb-4 border border-gray-100">
                  <span className="font-bold text-gray-800">Cooking Note: </span>
                  {order.instructions}
                </div>
              )}

              {/* Financial Breakdown */}
              <div className="border-t border-dashed border-gray-200 pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Payment Mode</span>
                  <span className="font-bold uppercase text-gray-800">
                    {order.paymentMethod || "UPI"}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Counter Pickup</span>
                  <span className="text-emerald-700 font-bold">FREE</span>
                </div>

                <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline font-black text-base text-gray-900">
                  <span>TOTAL PAID</span>
                  <span className="text-orange-600">₹{Number(order.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 🎓 HELP & ACTION */}
        <div className="text-center pt-4">
          <button
            onClick={() => navigate(isCafeteriaAdmin ? "/admin-dashboard" : "/user-dashboard")}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-6 py-2.5 rounded-full transition"
          >
            ← Back to {isCafeteriaAdmin ? "Admin Dashboard" : "Campus Cafeterias"}
          </button>
        </div>

      </main>
    </div>
  );
};

export default OrderStatusPage;
