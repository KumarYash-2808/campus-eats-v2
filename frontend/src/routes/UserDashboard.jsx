import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  LogOut, MapPin, Clock, ChefHat, ArrowRight, Search, 
  ShoppingBag, Star, Sparkles, Flame, CheckCircle, ChevronRight
} from "lucide-react";

// Curated high quality food photography for cafeterias
const cafeteriaImages = [
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80", // Restaurant ambiance
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80", // Food spread
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80", // Pizza
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80", // Burger
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80", // Healthy bowl
];

const UserDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [cafeterias, setCafeterias] = useState([]);
  const [filteredCafeterias, setFilteredCafeterias] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // ✅ Fetch cafeterias
  useEffect(() => {
    const fetchCafeterias = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "cafeterias"));
        const data = querySnapshot.docs.map((doc, index) => ({
          id: doc.id,
          image: cafeteriaImages[index % cafeteriaImages.length],
          rating: (4.0 + (index % 5) * 0.2).toFixed(1),
          ratingCount: 120 + index * 45,
          prepTime: `${10 + (index % 3) * 5}-${15 + (index % 3) * 5} mins`,
          cuisines: ["Campus Fast Food", "North Indian", "Beverages", "Snacks"][index % 4],
          costForTwo: `₹${100 + (index % 3) * 50} for two`,
          discount: index % 2 === 0 ? "FLAT 20% OFF" : "FREE PICKUP",
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
    fetchCafeteriaData();
    async function fetchCafeteriaData() {
      await fetchCafeterias();
    }
  }, []);

  // ✅ Live fetch user's orders
  useEffect(() => {
    if (!currentUser?.email) return;
    const q = query(
      collection(db, "orders"),
      where("userEmail", "==", currentUser.email)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userOrders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Sort newest first
      userOrders.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setOrders(userOrders);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // ✅ Handle search filter
  useEffect(() => {
    let result = cafeterias;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.name?.toLowerCase().includes(term) ||
          c.location?.toLowerCase().includes(term) ||
          c.cuisines?.toLowerCase().includes(term)
      );
    }

    setFilteredCafeterias(result);
  }, [searchTerm, cafeterias]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Find active orders (pending, preparing, ready)
  const activeOrders = orders.filter((o) => {
    const s = (o.status || "").toLowerCase();
    return s === "pending" || s === "preparing" || s === "ready";
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* 🧭 SWIGGY / ZOMATO TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          
          {/* Logo & Campus Geolocation */}
          <div className="flex items-center gap-6">
            <div 
              onClick={() => navigate("/user-dashboard")}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 bg-gradient-to-tr from-orange-600 to-amber-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-gray-900 group-hover:text-orange-600 transition">
                  Campus<span className="text-orange-600">Eats</span>
                </span>
                <span className="hidden sm:inline-block ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-700 rounded-md uppercase">
                  Live
                </span>
              </div>
            </div>

            {/* Campus Location Picker */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 cursor-pointer bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 transition">
              <MapPin className="w-3.5 h-3.5 text-orange-600" />
              <span className="font-semibold text-gray-800">Campus Food Courts</span>
              <span className="text-gray-400">• Block 1-15</span>
            </div>
          </div>

          {/* Search Input in Navbar */}
          <div className="flex-1 max-w-md hidden sm:block relative">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search cafeterias, snacks, dishes..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100 transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            <a 
              href="#recent-orders"
              className="relative p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition flex items-center gap-1.5 text-sm font-medium"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="hidden lg:inline">Orders</span>
              {orders.length > 0 && (
                <span className="w-5 h-5 bg-orange-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                  {orders.length}
                </span>
              )}
            </a>

            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-rose-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {currentUser?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="px-4 pb-3 sm:hidden">
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search cafeterias or dishes..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-orange-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* 🚀 ACTIVE ORDER BANNER (IF ANY LIVE ORDER EXISTS) */}
      {activeOrders.length > 0 && (
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center animate-pulse">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold">
                  Order in Progress (#{activeOrders[0].id.slice(-6)})
                </p>
                <p className="text-xs text-orange-100 capitalize">
                  Status: {activeOrders[0].status} • {activeOrders[0].cafeteriaName || "Campus Cafeteria"}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/order-status/${activeOrders[0].id}`)}
              className="bg-white text-orange-600 hover:bg-orange-50 px-4 py-1.5 rounded-full text-xs font-bold transition shadow-xs flex items-center gap-1"
            >
              Track Live <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 🌟 HERO PROMO BANNER CAROUSEL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <span className="bg-white/20 text-white text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full inline-block mb-3">
                Campus Specials
              </span>
              <h3 className="text-2xl font-extrabold mb-1">Flat 20% OFF</h3>
              <p className="text-orange-100 text-sm">Quick pickup at all campus counters</p>
            </div>
            <p className="text-xs font-bold mt-4 tracking-wider uppercase opacity-90">Use: CAMPUS20</p>
            <Sparkles className="w-24 h-24 text-white/10 absolute -right-4 -bottom-4 pointer-events-none" />
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <span className="bg-white/20 text-white text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full inline-block mb-3">
                Zero Wait Time
              </span>
              <h3 className="text-2xl font-extrabold mb-1">Pre-Order & Skip Lines</h3>
              <p className="text-blue-100 text-sm">Grab your hot food right between classes</p>
            </div>
            <p className="text-xs font-bold mt-4 tracking-wider uppercase opacity-90">⚡ Under 10 Mins</p>
            <Clock className="w-24 h-24 text-white/10 absolute -right-4 -bottom-4 pointer-events-none" />
          </div>

          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-between relative overflow-hidden hidden md:flex">
            <div className="relative z-10">
              <span className="bg-white/20 text-white text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full inline-block mb-3">
                Fresh & Hygienic
              </span>
              <h3 className="text-2xl font-extrabold mb-1">Verified Campus Kitchens</h3>
              <p className="text-emerald-100 text-sm">Prepared fresh daily by university vendors</p>
            </div>
            <p className="text-xs font-bold mt-4 tracking-wider uppercase opacity-90">100% Quality Checked</p>
            <CheckCircle className="w-24 h-24 text-white/10 absolute -right-4 -bottom-4 pointer-events-none" />
          </div>
        </div>
      </section>

      {/* 🏪 RESTAURANT / CAFETERIA DIRECTORY (SWIGGY/ZOMATO CARDS) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex justify-between items-baseline mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Campus Cafeterias & Food Courts
            </h2>
            <p className="text-gray-500 text-sm mt-0.5">
              {filteredCafeterias.length} outlets serving freshly prepared meals
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
                <div className="w-full h-44 bg-gray-200 rounded-xl mb-4"></div>
                <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredCafeterias.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-md mx-auto my-8">
            <ChefHat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800">No cafeterias found</h3>
            <p className="text-gray-500 text-sm mt-1">Try clearing your search or filter</p>
            <button
              onClick={() => {
                setSearchTerm("");
              }}
              className="mt-4 bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCafeterias.map((cafeteria) => (
              <div
                key={cafeteria.id}
                onClick={() => navigate(`/cafeteria/${cafeteria.id}`)}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-orange-200 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between transform hover:-translate-y-1"
              >
                {/* Image Banner with Badges */}
                <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                  <img
                    src={cafeteria.image}
                    alt={cafeteria.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

                  {/* Discount Tag (Bottom Left) */}
                  <div className="absolute bottom-3 left-3 bg-gradient-to-r from-orange-600 to-rose-600 text-white px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider shadow-sm">
                    {cafeteria.discount}
                  </div>

                  {/* Delivery / Prep Time (Bottom Right) */}
                  <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md text-gray-900 px-2 py-0.5 rounded-md text-xs font-bold flex items-center gap-1 shadow-sm">
                    <Clock size={12} className="text-orange-600" />
                    {cafeteria.prepTime}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Title & Rating */}
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition line-clamp-1">
                        {cafeteria.name}
                      </h3>
                      <div className="flex items-center gap-1 bg-emerald-700 text-white px-2 py-0.5 rounded-md text-xs font-bold flex-shrink-0">
                        <span>{cafeteria.rating}</span>
                        <Star size={10} className="fill-white" />
                      </div>
                    </div>

                    {/* Cuisines & Pricing */}
                    <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                      <span className="line-clamp-1">{cafeteria.cuisines}</span>
                      <span className="font-semibold text-gray-700 flex-shrink-0">{cafeteria.costForTwo}</span>
                    </div>

                    {/* Campus Location */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 py-2 border-t border-dashed border-gray-100">
                      <MapPin size={13} className="text-orange-600 flex-shrink-0" />
                      <span className="line-clamp-1">{cafeteria.location || "Campus Building"}</span>
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">
                      🕒 {cafeteria.openingHours || "9:00 AM - 9:00 PM"}
                    </span>
                    <span className="text-xs font-bold text-orange-600 group-hover:text-orange-700 flex items-center gap-1">
                      Explore Menu <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 📜 RECENT ORDERS HISTORY SECTION (SWIGGY STYLE) */}
        <section id="recent-orders" className="mt-16 pt-10 border-t border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                <ShoppingBag className="text-orange-600" />
                Past Campus Orders
              </h2>
              <p className="text-gray-500 text-sm mt-0.5">Track and re-order your favorite campus meals</p>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
              <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600 font-medium">You haven't placed any orders yet.</p>
              <p className="text-gray-400 text-xs mt-1">Choose a cafeteria above to place your first meal!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {orders.slice(0, 6).map((order) => {
                const s = (order.status || "pending").toLowerCase();
                const isCompleted = s === "completed";
                const isReady = s === "ready";
                return (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/order-status/${order.id}`)}
                    className="bg-white rounded-xl p-4 border border-gray-200 hover:border-orange-300 shadow-xs hover:shadow-md transition cursor-pointer flex justify-between items-start gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900 text-sm">
                          {order.cafeteriaName || "Campus Cafeteria"}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            isCompleted
                              ? "bg-gray-100 text-gray-700"
                              : isReady
                              ? "bg-purple-100 text-purple-700 border border-purple-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {order.status || "Pending"}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 mb-2">
                        Order #{order.id.slice(-6)} • {order.createdAt?.toDate?.()?.toLocaleDateString?.() || "Recent"}
                      </p>

                      <div className="text-xs text-gray-700 space-y-0.5">
                        {order.cart?.map((item, i) => (
                          <span key={i} className="inline-block mr-2 text-gray-600">
                            {item.name} × {item.quantity || 1}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-gray-900 text-sm">₹{Number(order.total || 0).toFixed(2)}</p>
                      <span className="text-[11px] text-orange-600 font-bold hover:underline mt-2 inline-block">
                        View Receipt →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default UserDashboard;
