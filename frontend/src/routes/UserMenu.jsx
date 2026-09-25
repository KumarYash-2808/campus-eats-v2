import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getItemsByCafeteria } from "../utils/firestoreUtils";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { ArrowLeft, ShoppingCart, Trash2, Loader, AlertCircle, IndianRupee, Plus, Minus } from "lucide-react";

const UserMenu = () => {
  const { cafeteriaId } = useParams();
  const navigate = useNavigate();

  const [cafeteria, setCafeteria] = useState(null);
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState("");

  // ✅ Hardcoded fallback menu
  const defaultItems = [
    { id: "1", name: "Masala Dosa", price: 60, stock: 10, category: "South Indian" },
    { id: "2", name: "Samosa", price: 20, stock: 50, category: "Snacks" },
    { id: "3", name: "Cold Coffee", price: 40, stock: 30, category: "Beverages" },
    { id: "4", name: "Veg Sandwich", price: 45, stock: 25, category: "Sandwiches" },
    { id: "5", name: "Chai (Tea)", price: 15, stock: 100, category: "Beverages" },
  ];

  // ✅ Fetch cafeteria details
  useEffect(() => {
    const fetchCafeteria = async () => {
      try {
        if (!cafeteriaId) {
          setDebugInfo("❌ No cafeteria ID found in URL");
          return;
        }
        const docRef = doc(db, "cafeterias", cafeteriaId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCafeteria({ cafeteriaId, ...docSnap.data() });
          setDebugInfo(`✅ Cafeteria found: ${docSnap.data().name}`);
        } else {
          setDebugInfo(`❌ Cafeteria not found for ID: ${cafeteriaId}`);
        }
      } catch (error) {
        setDebugInfo(`❌ Error fetching cafeteria: ${error.message}`);
        console.error("Error fetching cafeteria:", error);
      }
    };

    fetchCafeteria();
  }, [cafeteriaId]);

  // ✅ Fetch menu items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        if (!cafeteriaId) {
          setDebugInfo((prev) => prev + "\n❌ Cannot fetch items: No ID");
          return;
        }

        const fetchedItems = await getItemsByCafeteria(cafeteriaId);
        
        if (fetchedItems && fetchedItems.length > 0) {
          setItems(fetchedItems);
          setDebugInfo((prev) => prev + `\n✅ Found ${fetchedItems.length} items from Firestore`);
        } else {
          setDebugInfo((prev) => prev + "\n⚠️ No items in Firestore - Using default menu");
          setItems(defaultItems);
        }
      } catch (error) {
        setDebugInfo((prev) => prev + `\n❌ Error fetching items: ${error.message}`);
        console.error("Error fetching items:", error);
        setItems(defaultItems);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [cafeteriaId]);

  // ✅ Group cart items by ID with quantities
  const getGroupedCart = () => {
    const grouped = {};
    cart.forEach(item => {
      if (grouped[item.id]) {
        grouped[item.id].quantity += 1;
        grouped[item.id].subtotal += Number(item.price || 0);
      } else {
        grouped[item.id] = {
          ...item,
          quantity: 1,
          subtotal: Number(item.price || 0)
        };
      }
    });
    return Object.values(grouped);
  };

  // ✅ Get quantity of item in cart
  const getItemQuantity = (itemId) => {
    return cart.filter(item => item.id === itemId).length;
  };

  // ✅ Add to cart handler
  const addToCart = (item) => {
    const currentQuantity = getItemQuantity(item.id);
    if (currentQuantity < item.stock) {
      setCart((prev) => [...prev, { ...item, cartId: Date.now() + Math.random() }]);
    }
  };

  // ✅ Remove one instance of item from cart
  const removeOneFromCart = (itemId) => {
    setCart((prev) => {
      const index = prev.findIndex(item => item.id === itemId);
      if (index !== -1) {
        return [...prev.slice(0, index), ...prev.slice(index + 1)];
      }
      return prev;
    });
  };

  // ✅ Remove all instances of an item from cart
  const removeAllFromCart = (itemId) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  // ✅ Calculate total
  const cartTotal = cart.reduce((total, item) => total + Number(item.price || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <button
            onClick={() => navigate("/user-dashboard")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Cafeterias
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {cafeteria ? cafeteria.name : "Loading..."}
          </h1>
          <div className="w-20"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 relative">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Menu Items Section */}
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Menu</h2>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl">
                <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-600 font-medium">Loading menu items...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg font-medium">
                  No items available for this cafeteria.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {items.map((item) => {
                  const quantityInCart = getItemQuantity(item.id);
                  const canAddMore = quantityInCart < item.stock;
                  
                  return (
                    <div
                      key={item.id}
                      className="group bg-white rounded-2xl shadow-md hover:shadow-xl overflow-hidden border border-gray-200 transition-all duration-300 transform hover:-translate-y-1"
                    >
                      {/* Item Header */}
                      <div className="h-28 bg-gradient-to-br from-orange-400 to-red-500 relative overflow-hidden">
                        {item.stock <= 5 && item.stock > 0 && (
                          <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                            Low Stock
                          </div>
                        )}
                        {quantityInCart > 0 && (
                          <div className="absolute top-3 left-3 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <ShoppingCart className="w-3 h-3" />
                            {quantityInCart} in cart
                          </div>
                        )}
                      </div>

                      {/* Item Content */}
                      <div className="p-5">
                        <div className="mb-3">
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition mb-1">
                            {item.name || "Unnamed Item"}
                          </h3>
                          {item.category && (
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              {item.category}
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 text-sm">Price</span>
                            <span className="flex items-center gap-1 text-lg font-bold text-gray-900">
                              <IndianRupee className="w-4 h-4" />
                              {Number(item.price || 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 text-sm">Available</span>
                            <span
                              className={`text-sm font-semibold ${
                                item.stock > 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {item.stock ?? "N/A"} {item.stock === 1 ? "item" : "items"}
                            </span>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        {item.stock > 0 ? (
                          quantityInCart > 0 ? (
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => removeOneFromCart(item.id)}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                              >
                                <Minus className="w-4 h-4" />
                                Remove
                              </button>
                              <div className="px-4 py-3 bg-gray-100 rounded-lg font-bold text-lg text-gray-900 min-w-[60px] text-center">
                                {quantityInCart}
                              </div>
                              <button
                                onClick={() => addToCart(item)}
                                disabled={!canAddMore}
                                className={`flex-1 font-semibold py-3 rounded-lg transition-all transform flex items-center justify-center gap-2 ${
                                  canAddMore
                                    ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white hover:scale-105 active:scale-95"
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                }`}
                              >
                                <Plus className="w-4 h-4" />
                                Add
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                            >
                              <ShoppingCart className="w-4 h-4" />
                              Add to Cart
                            </button>
                          )
                        ) : (
                          <button
                            disabled
                            className="w-full bg-gray-300 text-gray-500 font-semibold py-3 rounded-lg cursor-not-allowed"
                          >
                            Out of Stock
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              {/* Cart Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-6 h-6" />
                  <h2 className="text-xl font-bold">Your Cart</h2>
                  <span className="ml-auto bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
                    {cart.length}
                  </span>
                </div>
              </div>

              {/* Cart Items - Grouped */}
              <div className="p-6 max-h-96 overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Your cart is empty.</p>
                ) : (
                  <ul className="space-y-3">
                    {getGroupedCart().map((item) => (
                      <li
                        key={item.id}
                        className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-all"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-gray-900">{item.name}</p>
                              <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                                ×{item.quantity}
                              </span>
                            </div>
                            <p className="text-blue-600 font-semibold text-sm">
                              ₹{Number(item.price || 0).toFixed(2)} each
                            </p>
                          </div>
                          <button
                            onClick={() => removeAllFromCart(item.id)}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition"
                            title="Remove all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* Quantity controls in cart */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <button
                            onClick={() => removeOneFromCart(item.id)}
                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          
                          <div className="text-center">
                            <p className="text-xs text-gray-600 mb-1">Subtotal</p>
                            <p className="text-lg font-bold text-gray-900">
                              ₹{item.subtotal.toFixed(2)}
                            </p>
                          </div>
                          
                          <button
                            onClick={() => addToCart(item)}
                            disabled={item.quantity >= item.stock}
                            className={`p-2 rounded-lg transition ${
                              item.quantity >= item.stock
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-green-500 hover:bg-green-600 text-white"
                            }`}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  <div className="mb-4 pb-4 border-b border-gray-300">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 text-sm">Items:</span>
                      <span className="text-gray-900 font-semibold">{cart.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Total:</span>
                      <span className="text-2xl font-bold text-gray-900">
                        ₹{cartTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <button
                  onClick={() => navigate(`/checkout/${cafeteriaId}`, { state: { cart, cafeteria } })}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserMenu;