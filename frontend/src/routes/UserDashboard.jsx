import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  LogOut, MapPin, Clock, ChefHat, ArrowRight, Search, Loader, 
  ShoppingBag
} from "lucide-react";

const UserDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [cafeterias, setCafeterias] = useState([]);
  const [filteredCafeterias, setFilteredCafeterias] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // ✅ Fetch cafeterias
  useEffect(() => {
    const fetchCafeterias = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "cafeterias"));
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCafeterias(data);
        setFilteredCafeterias(data);
      } catch (error) {
        console.error("Error fetching cafeterias:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCafeterias();
  }, []);

  // ✅ Live fetch user's orders
  useEffect(() => {
    if (!currentUser?.email) return;
    const q = query(
      collection(db, "orders"),
      where("userEmail", "==", currentUser.email),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userOrders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(userOrders);
      setOrderLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // ✅ Handle search
  useEffect(() => {
    const filtered = cafeterias.filter((cafeteria) =>
      cafeteria.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cafeteria.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCafeterias(filtered);
  }, [searchTerm, cafeterias]);

  // ✅ Logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // ✅ Status badge colors
  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "accepted": return "bg-blue-100 text-blue-700";
      case "ready": return "bg-green-100 text-green-700";
      case "completed": return "bg-gray-200 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              CampusEats
            </h1>
          </div>

          {/* Logout */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-500">Logged in as</p>
              <p className="text-sm font-semibold text-gray-900">{currentUser?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-7xl mx-auto px-6 py-12">

        {/* Welcome */}
        <h2 className="text-3xl font-bold mb-2 text-gray-900">Welcome back 👋</h2>
        <p className="text-gray-600 mb-8">Find your favorite cafeterias</p>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search cafeterias..."
            className="w-full pl-12 pr-4 py-3 border rounded-xl shadow-sm bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Cafeteria Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {loading ? (
            <p className="text-center">Loading cafeterias...</p>
          ) : filteredCafeterias.length ? (
            filteredCafeterias.map((cafeteria, idx) => (
              <div key={cafeteria.id}
                className="bg-white rounded-2xl shadow-md border hover:shadow-xl transition p-6"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">{cafeteria.name}</h3>
                <p className="text-sm flex items-center gap-2 text-gray-700"><MapPin size={16} /> {cafeteria.location}</p>
                <p className="text-sm flex items-center gap-2 text-gray-700"><Clock size={16} /> {cafeteria.openingHours}</p>
                
                <button
                  onClick={() => navigate(`/cafeteria/${cafeteria.id}`)}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex justify-center items-center gap-2"
                >
                  View Menu <ArrowRight size={18} />
                </button>
              </div>
            ))
          ) : (
            <p>No cafeterias found.</p>
          )}
        </div>

        {/* ✅ USER ORDERS SECTION */}
        <h3 className="text-2xl font-bold mb-4 text-gray-900 flex items-center gap-2">
          <ShoppingBag /> Your Orders
        </h3>

        {orderLoading ? (
          <p>Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-gray-600">You haven't placed any orders yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white border shadow rounded-xl p-5">
                <div className="flex justify-between">
                  <p className="font-semibold text-gray-900">Order ID: {order.id}</p>
                  <span className={`px-3 py-1 text-xs rounded-full font-semibold ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mt-1">Cafeteria: {order.cafeteriaName}</p>

                <div className="mt-2">
                  {order.items?.map((item, i) => (
                    <p key={i} className="text-sm text-gray-800">
                      {item.name} x {item.quantity}
                    </p>
                  ))}
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  {order.createdAt?.toDate?.().toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
};

export default UserDashboard;
