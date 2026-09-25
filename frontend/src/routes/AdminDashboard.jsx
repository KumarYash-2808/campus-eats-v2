import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, ListOrdered, Package, LogOut, ExternalLink, Clock, Utensils, CheckCircle, Check } from "lucide-react";

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [cafeteria, setCafeteria] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", price: "", stock: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let unsubItems = () => {};
    let unsubOrders = () => {};

    const fetchAdminData = async () => {
      try {
        if (!currentUser?.email) {
          setLoading(false);
          return;
        }

        const q = query(collection(db, "cafeterias"), where("adminEmail", "==", currentUser.email));
        const snap = await getDocs(q);

        if (snap.empty) {
          console.warn("No cafeteria found for admin email:", currentUser.email);
          setCafeteria(null);
          setLoading(false);
          return;
        }

        const cafeDoc = snap.docs[0];
        const cafeData = { id: cafeDoc.id, ...cafeDoc.data() };
        setCafeteria(cafeData);

        // ✅ Real-time listener for Menu Items (instant add & delete reflections)
        unsubItems = onSnapshot(
          collection(db, `cafeterias/${cafeDoc.id}/items`),
          (snapshot) => {
            const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            setMenuItems(items);
          },
          (err) => console.error("Error listening to menu items:", err)
        );

        // ✅ Real-time listener for Orders
        const ordersQuery = query(collection(db, "orders"), where("cafeteriaId", "==", cafeDoc.id));
        unsubOrders = onSnapshot(
          ordersQuery,
          (snapshot) => {
            const orderList = snapshot.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            }));
            // Sort newest first
            orderList.sort((a, b) => {
              const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
              const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
              return timeB - timeA;
            });
            setOrders(orderList);
          },
          (err) => console.error("Error listening to orders:", err)
        );

        setLoading(false);
      } catch (err) {
        console.error("Error loading admin data:", err);
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchAdminData();
    } else {
      setLoading(false);
    }

    return () => {
      unsubItems();
      unsubOrders();
    };
  }, [currentUser]);

  // ✅ Add menu item with validation & immediate UI update
  const addMenuItem = async (e) => {
    if (e) e.preventDefault();
    if (!newItem.name.trim() || !newItem.price || !newItem.stock) {
      alert("Please enter item name, price, and stock quantity.");
      return;
    }

    try {
      setSubmitting(true);
      await addDoc(collection(db, `cafeterias/${cafeteria.id}/items`), {
        name: newItem.name.trim(),
        price: Number(newItem.price),
        stock: Number(newItem.stock),
      });
      setNewItem({ name: "", price: "", stock: "" });
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Failed to add item: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Delete menu item with confirmation
  const deleteMenuItem = async (id, itemName) => {
    if (!window.confirm(`Are you sure you want to delete "${itemName || "this item"}"?`)) return;
    try {
      await deleteDoc(doc(db, `cafeterias/${cafeteria.id}/items`, id));
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item: " + error.message);
    }
  };

  // ✅ Direct inline order status update
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId);
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update status: " + error.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // ✅ Logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const getStatusBadge = (status = "") => {
    const s = status.toLowerCase();
    switch (s) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "preparing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ready":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) return <p className="p-8 text-center text-gray-500">Loading dashboard...</p>;

  if (!currentUser) {
    return (
      <div className="p-8 max-w-md mx-auto text-center">
        <p className="text-red-600 font-semibold mb-4">Please log in as an admin to view this dashboard.</p>
        <button onClick={() => navigate("/")} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
          Go to Login
        </button>
      </div>
    );
  }

  if (!cafeteria)
    return (
      <div className="p-8 max-w-md mx-auto text-center">
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-600 font-semibold mb-4">
          No cafeteria assigned to this admin account ({currentUser.email}).
        </div>
        <button onClick={handleLogout} className="bg-gray-600 text-white px-4 py-2 rounded-lg">
          Logout
        </button>
      </div>
    );

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header with Logout */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 text-sm mt-1">
            Cafeteria: <b className="text-gray-900">{cafeteria.name}</b> ({currentUser.email})
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition shadow-sm font-medium"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {/* MENU SECTION */}
      <section className="bg-white shadow-md rounded-2xl p-6 border border-gray-200 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          Manage Menu ({menuItems.length})
        </h2>

        {/* Add item form */}
        <form onSubmit={addMenuItem} className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            className="border rounded-xl px-4 py-2.5 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Item Name (e.g. Veg Burger)"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            disabled={submitting}
            required
          />
          <input
            className="border rounded-xl px-4 py-2.5 sm:w-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Price (₹)"
            type="number"
            min="0"
            step="any"
            value={newItem.price}
            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
            disabled={submitting}
            required
          />
          <input
            className="border rounded-xl px-4 py-2.5 sm:w-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Stock"
            type="number"
            min="0"
            value={newItem.stock}
            onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
            disabled={submitting}
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 font-medium transition shadow-sm"
          >
            <Plus size={18} />
            <span>Add Item</span>
          </button>
        </form>

        {/* Menu Items List */}
        {menuItems.length === 0 ? (
          <p className="text-gray-500 text-center py-6 bg-gray-50 rounded-xl border border-dashed">
            No items in menu yet. Use the form above to add your first item.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {menuItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-3">
                <div>
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    ₹{Number(item.price || 0).toFixed(2)} • Stock:{" "}
                    <span className={item.stock > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                      {item.stock}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => deleteMenuItem(item.id, item.name)}
                  className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition"
                  title="Delete item"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ORDERS SECTION */}
      <section className="bg-white shadow-md rounded-2xl p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <ListOrdered className="w-6 h-6 text-blue-600" />
          Recent Orders ({orders.length})
        </h2>

        {orders.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-xl text-center border border-dashed">
            <Package className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No orders received yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const currentStatus = (order.status || "pending").toLowerCase();
              return (
                <div
                  key={order.id}
                  className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-300 transition"
                >
                  {/* Order Top Row */}
                  <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900">Order #{order.id.slice(-6)}</p>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold capitalize ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status || "pending"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Customer: {order.userEmail || "Guest"}</p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900">₹{Number(order.total || 0).toFixed(2)}</p>
                      <button
                        onClick={() => navigate(`/order-status/${order.id}`)}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium mt-0.5"
                      >
                        Full Details <ExternalLink size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Order items preview */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-700 space-y-1">
                    {order.cart?.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>
                          {item.name} × {item.quantity || 1}
                        </span>
                        <span className="text-gray-500">₹{Number(item.price || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Inline Status Changer Buttons */}
                  <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Change Status:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: "pending", label: "Pending", color: "hover:bg-yellow-500" },
                        { key: "preparing", label: "Preparing", color: "hover:bg-blue-500" },
                        { key: "ready", label: "Ready", color: "hover:bg-purple-500" },
                        { key: "completed", label: "Completed", color: "hover:bg-green-500" },
                      ].map(({ key, label, color }) => {
                        const isCurrent = currentStatus === key;
                        const isUpdating = updatingOrderId === order.id;
                        return (
                          <button
                            key={key}
                            onClick={() => updateOrderStatus(order.id, key)}
                            disabled={isCurrent || isUpdating}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                              isCurrent
                                ? "bg-gray-900 text-white cursor-default"
                                : `bg-gray-100 text-gray-700 ${color} hover:text-white`
                            } disabled:opacity-60`}
                          >
                            {isCurrent && <Check size={12} className="inline mr-1" />}
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;
