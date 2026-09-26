import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getItemsByCafeteria } from "../utils/firestoreUtils";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { 
  ArrowLeft, ShoppingBag, Trash2, Star, Clock, MapPin, 
  Plus, Minus, Sparkles, Tag, ChevronRight, CheckCircle2,
  Search, ShieldCheck
} from "lucide-react";

// Dish photography matcher
const getDishImage = (name = "", category = "") => {
  const n = (name + " " + category).toLowerCase();
  if (n.includes("dosa")) return "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=400&q=80";
  if (n.includes("samosa")) return "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80";
  if (n.includes("coffee")) return "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=400&q=80";
  if (n.includes("sandwich")) return "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80";
  if (n.includes("chai") || n.includes("tea")) return "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80";
  if (n.includes("burger")) return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80";
  if (n.includes("pizza")) return "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80";
  if (n.includes("noodle") || n.includes("maggi") || n.includes("chowmein")) return "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80";
  if (n.includes("biryani") || n.includes("rice")) return "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80";
  if (n.includes("roll")) return "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=400&q=80";
  return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80";
};

const getDishDescription = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("dosa")) return "Crispy golden fermented crepe served with fresh coconut chutney & hot sambar.";
  if (n.includes("samosa")) return "Flaky golden pastry filled with spiced potatoes, green peas & mint chutney.";
  if (n.includes("cold coffee") || n.includes("coffee")) return "Rich brewed espresso blended with chilled milk, cream & chocolate drizzle.";
  if (n.includes("sandwich")) return "Toasted buttered bread with garden vegetables, mint spread & mild spices.";
  if (n.includes("chai") || n.includes("tea")) return "Aromatic freshly brewed masala tea with cardamoms & ginger.";
  if (n.includes("burger")) return "Crispy vegetable patty layered with crisp lettuce, sliced tomato & creamy mayo.";
  if (n.includes("pizza")) return "Stone-baked crust topped with rich tomato sauce, mozzarella & fresh herbs.";
  return "Freshly prepared campus specialty made to order with authentic ingredients.";
};

const defaultItems = [
  { id: "1", name: "Masala Dosa", price: 60, stock: 10, category: "South Indian" },
  { id: "2", name: "Samosa", price: 20, stock: 50, category: "Snacks" },
  { id: "3", name: "Cold Coffee", price: 40, stock: 30, category: "Beverages" },
  { id: "4", name: "Veg Sandwich", price: 45, stock: 25, category: "Sandwiches" },
  { id: "5", name: "Chai (Tea)", price: 15, stock: 100, category: "Beverages" },
];

const UserMenu = () => {
  const { cafeteriaId } = useParams();
  const navigate = useNavigate();

  const [cafeteria, setCafeteria] = useState(null);
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [isVegOnly, setIsVegOnly] = useState(false);

  // Fetch cafeteria details
  useEffect(() => {
    const fetchCafeteria = async () => {
      try {
        if (!cafeteriaId) return;
        const docRef = doc(db, "cafeterias", cafeteriaId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCafeteria({ cafeteriaId, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching cafeteria:", error);
      }
    };
    fetchCafeteria();
  }, [cafeteriaId]);

  // Fetch menu items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        if (!cafeteriaId) return;
        const fetchedItems = await getItemsByCafeteria(cafeteriaId);
        if (fetchedItems && fetchedItems.length > 0) {
          setItems(fetchedItems);
        } else {
          setItems(defaultItems);
        }
      } catch (error) {
        console.error("Error fetching items:", error);
        setItems(defaultItems);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [cafeteriaId]);

  // Grouped cart items by ID
  const getGroupedCart = () => {
    const grouped = {};
    cart.forEach((item) => {
      if (grouped[item.id]) {
        grouped[item.id].quantity += 1;
        grouped[item.id].subtotal += Number(item.price || 0);
      } else {
        grouped[item.id] = {
          ...item,
          quantity: 1,
          subtotal: Number(item.price || 0),
        };
      }
    });
    return Object.values(grouped);
  };

  const getItemQuantity = (itemId) => {
    return cart.filter((item) => item.id === itemId).length;
  };

  const addToCart = (item) => {
    const currentQuantity = getItemQuantity(item.id);
    if (currentQuantity < item.stock) {
      setCart((prev) => [...prev, { ...item, cartId: Date.now() + Math.random() }]);
    }
  };

  const removeOneFromCart = (itemId) => {
    setCart((prev) => {
      const index = prev.findIndex((item) => item.id === itemId);
      if (index !== -1) {
        return [...prev.slice(0, index), ...prev.slice(index + 1)];
      }
      return prev;
    });
  };

  const removeAllFromCart = (itemId) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const cartTotal = cart.reduce((total, item) => total + Number(item.price || 0), 0);

  // Filtered dishes
  const displayedItems = items.filter((item) => {
    if (searchFilter && !item.name.toLowerCase().includes(searchFilter.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      {/* 🧭 NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <button
            onClick={() => navigate("/user-dashboard")}
            className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-orange-600 transition"
          >
            <ArrowLeft size={18} />
            <span>All Cafeterias</span>
          </button>

          <span className="font-extrabold text-gray-900 tracking-tight text-base sm:text-lg">
            {cafeteria?.name || "Campus Dining"}
          </span>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <ShieldCheck size={14} />
            <span>Campus Verified</span>
          </div>
        </div>
      </header>

      {/* 🌟 RESTAURANT HERO CARD (SWIGGY/ZOMATO STYLE) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-orange-100 text-orange-700 text-xs font-extrabold px-2.5 py-0.5 rounded-md uppercase">
                  Open Now
                </span>
                <span className="text-gray-400 text-xs">•</span>
                <span className="text-xs font-medium text-gray-500">
                  {cafeteria?.openingHours || "8:30 AM - 10:00 PM"}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
                {cafeteria?.name || "Campus Cafeteria"}
              </h1>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm text-gray-600">
                <div className="flex items-center gap-1.5 font-bold text-gray-900 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
                  <Star size={13} className="fill-emerald-700" />
                  <span>4.3</span>
                  <span className="text-gray-400 font-normal">(350+ ratings)</span>
                </div>

                <div className="flex items-center gap-1">
                  <MapPin size={14} className="text-orange-600" />
                  <span>{cafeteria?.location || "Campus Block 15"}</span>
                </div>

                <div className="flex items-center gap-1">
                  <Clock size={14} className="text-orange-600" />
                  <span>10-15 mins prep time</span>
                </div>
              </div>
            </div>

            {/* Offer Callout */}
            <div className="bg-gradient-to-tr from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4 md:max-w-xs flex-shrink-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-orange-700 mb-1">
                <Tag size={13} />
                <span>CAMPUS EXCLUSIVE</span>
              </div>
              <p className="text-sm font-extrabold text-gray-900">Flat 20% OFF up to ₹50</p>
              <p className="text-xs text-gray-500 mt-0.5">Use coupon <b className="text-orange-600">CAMPUS20</b> at checkout</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search within this menu..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            {/* Pure Veg Toggle Switch (Signature Swiggy Feature) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsVegOnly(!isVegOnly)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border transition ${
                  isVegOnly
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="w-3.5 h-3.5 border-2 border-current rounded-xs flex items-center justify-center p-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                </div>
                <span>Pure Veg</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 🍱 MAIN MENU & CART 2-COLUMN GRID */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: DISHES LIST (SWIGGY/ZOMATO STYLE) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100">
              <div className="flex items-baseline justify-between border-b border-gray-100 pb-4 mb-6">
                <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                  Recommended Dishes ({displayedItems.length})
                </h2>
                <span className="text-xs font-semibold text-gray-400">Prepared fresh to order</span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-gray-400 animate-pulse">Loading menu items...</div>
              ) : displayedItems.length === 0 ? (
                <div className="py-12 text-center text-gray-500">No matching dishes found.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {displayedItems.map((item) => {
                    const quantityInCart = getItemQuantity(item.id);
                    const canAddMore = quantityInCart < item.stock;
                    const isVeg = true; // All campus default items are pure veg

                    return (
                      <div key={item.id} className="py-6 first:pt-2 last:pb-2 flex justify-between items-start gap-4">
                        
                        {/* Dish Details */}
                        <div className="flex-1 pr-2">
                          {/* Veg Mark */}
                          <div className="w-4 h-4 border-2 border-emerald-600 rounded-xs flex items-center justify-center p-0.5 mb-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                          </div>

                          <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                            {item.name}
                          </h3>

                          <p className="font-extrabold text-gray-900 text-sm sm:text-base mt-1">
                            ₹{Number(item.price || 0).toFixed(2)}
                          </p>

                          {/* Star Rating Badge */}
                          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-1 mb-2">
                            <Star size={11} className="fill-emerald-700" />
                            <span>4.2</span>
                            <span className="text-gray-400 font-normal">(48)</span>
                          </div>

                          <p className="text-xs text-gray-500 line-clamp-2 max-w-md leading-relaxed">
                            {getDishDescription(item.name)}
                          </p>

                          {item.stock <= 5 && item.stock > 0 && (
                            <span className="inline-block mt-2 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                              Only {item.stock} left in kitchen
                            </span>
                          )}
                        </div>

                        {/* Dish Image + Signature Swiggy Overlapping ADD button */}
                        <div className="relative flex-shrink-0 w-28 sm:w-32 h-24 sm:h-28">
                          <img
                            src={getDishImage(item.name, item.category)}
                            alt={item.name}
                            className="w-full h-full object-cover rounded-2xl shadow-xs"
                            loading="lazy"
                          />

                          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2">
                            {quantityInCart > 0 ? (
                              <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow-md font-bold text-emerald-600 text-sm overflow-hidden h-8">
                                <button
                                  onClick={() => removeOneFromCart(item.id)}
                                  className="px-2.5 h-full hover:bg-gray-100 transition active:scale-95 text-base"
                                >
                                  -
                                </button>
                                <span className="px-2 select-none text-xs font-extrabold text-gray-900">
                                  {quantityInCart}
                                </span>
                                <button
                                  onClick={() => addToCart(item)}
                                  disabled={!canAddMore}
                                  className="px-2.5 h-full hover:bg-gray-100 transition active:scale-95 text-base disabled:opacity-40"
                                >
                                  +
                                </button>
                              </div>
                            ) : item.stock > 0 ? (
                              <button
                                onClick={() => addToCart(item)}
                                className="bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-500 rounded-lg shadow-md px-5 py-1.5 text-xs font-black text-emerald-600 tracking-wider uppercase transition active:scale-95 flex items-center gap-1"
                              >
                                ADD <Plus size={11} className="stroke-[3]" />
                              </button>
                            ) : (
                              <span className="bg-gray-100 border border-gray-300 rounded-lg px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase shadow-xs whitespace-nowrap">
                                Sold Out
                              </span>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: DESKTOP CART SIDEBAR (SWIGGY/ZOMATO STYLE) */}
          <div className="hidden lg:block lg:col-span-4 sticky top-24">
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="text-orange-600 w-5 h-5" />
                  <h3 className="font-extrabold text-gray-900 text-lg">Your Cart</h3>
                </div>
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                  {cart.length} items
                </span>
              </div>

              {cart.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ShoppingBag className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="font-bold text-gray-800 text-sm">Cart is empty</p>
                  <p className="text-gray-400 text-xs mt-1">Add items from the menu to build your campus order.</p>
                </div>
              ) : (
                <div className="pt-4">
                  {/* Itemized List */}
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {getGroupedCart().map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <div className="flex-1 pr-2">
                          <p className="font-semibold text-gray-800 text-xs line-clamp-1">{item.name}</p>
                          <p className="text-[11px] text-gray-400">₹{Number(item.price).toFixed(2)}</p>
                        </div>

                        {/* Stepper */}
                        <div className="flex items-center border border-gray-200 rounded-lg text-emerald-600 font-bold text-xs h-7">
                          <button onClick={() => removeOneFromCart(item.id)} className="px-2 hover:bg-gray-100 h-full">
                            -
                          </button>
                          <span className="px-2 text-gray-900">{item.quantity}</span>
                          <button
                            onClick={() => addToCart(item)}
                            disabled={item.quantity >= item.stock}
                            className="px-2 hover:bg-gray-100 h-full disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-bold text-gray-900 text-xs ml-3 w-12 text-right">
                          ₹{item.subtotal.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Bill Breakdown */}
                  <div className="mt-5 pt-4 border-t border-dashed border-gray-200 space-y-2 text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span>Item Total</span>
                      <span>₹{cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Campus Counter Pickup</span>
                      <span>FREE</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Platform Fee</span>
                      <span>₹2.00</span>
                    </div>

                    <div className="pt-2 border-t border-gray-200 flex justify-between items-baseline font-extrabold text-base text-gray-900">
                      <span>TO PAY</span>
                      <span>₹{(cartTotal + 2).toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      navigate(`/checkout/${cafeteriaId}`, {
                        state: { cart, cafeteria, total: cartTotal + 2 },
                      })
                    }
                    className="w-full mt-5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold py-3.5 rounded-2xl shadow-lg shadow-orange-600/20 transition active:scale-98 flex items-center justify-center gap-2 text-sm tracking-wide"
                  >
                    <span>Proceed to Checkout</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 📱 MOBILE STICKY FLOATING CART BAR (SWIGGY/ZOMATO SIGNATURE) */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50 lg:hidden">
          <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-extrabold text-orange-200">
                {cart.length} {cart.length === 1 ? "Item" : "Items"} in cart
              </p>
              <p className="text-lg font-black tracking-tight">₹{(cartTotal + 2).toFixed(2)}</p>
            </div>
            <button
              onClick={() =>
                navigate(`/checkout/${cafeteriaId}`, {
                  state: { cart, cafeteria, total: cartTotal + 2 },
                })
              }
              className="bg-white text-orange-600 font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-1 active:scale-95 transition"
            >
              <span>View Cart</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;