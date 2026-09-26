import React, { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { addDoc, collection, serverTimestamp, writeBatch, doc, increment } from "firebase/firestore";
import { db, auth } from "../firebase";
import { 
  ArrowLeft, ShieldCheck, MapPin, Clock, CreditCard, 
  Wallet, Banknote, Sparkles, CheckCircle, ChevronRight, Lock
} from "lucide-react";

const CheckoutPage = () => {
  const { cafeteriaId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const cart = state?.cart || [];
  const cafeteria = state?.cafeteria || {};

  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [couponApplied, setCouponApplied] = useState(true);
  const [cookingInstructions, setCookingInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Group items by ID for clean summary
  const groupedCart = Object.values(
    cart.reduce((acc, item) => {
      if (acc[item.id]) {
        acc[item.id].quantity += 1;
        acc[item.id].subtotal += Number(item.price || 0);
      } else {
        acc[item.id] = { ...item, quantity: 1, subtotal: Number(item.price || 0) };
      }
      return acc;
    }, {})
  );

  const itemTotal = cart.reduce((sum, i) => sum + Number(i.price || 0), 0);
  const discount = couponApplied ? Math.min(itemTotal * 0.2, 50) : 0;
  const platformFee = 2;
  const finalTotal = Math.max(itemTotal - discount + platformFee, 0);

  const placeOrder = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("Please log in to complete your order.");
        navigate("/");
        return;
      }

      if (cart.length === 0) {
        alert("Your cart is empty.");
        navigate("/user-dashboard");
        return;
      }

      setSubmitting(true);

      // Create order with full metadata
      const orderRef = await addDoc(collection(db, "orders"), {
        userEmail: user.email,
        cafeteriaId,
        cafeteriaName: cafeteria?.name || "Campus Cafeteria",
        adminEmail: cafeteria?.adminEmail || "",
        cart: groupedCart.map((g) => ({
          id: g.id,
          name: g.name,
          price: g.price,
          quantity: g.quantity,
        })),
        total: finalTotal,
        discountApplied: discount,
        paymentMethod,
        instructions: cookingInstructions.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
      });

      // Atomically decrement stock
      const batch = writeBatch(db);
      groupedCart.forEach((item) => {
        const itemRef = doc(db, "cafeterias", cafeteriaId, "items", item.id);
        batch.update(itemRef, {
          stock: increment(-item.quantity),
        });
      });

      await batch.commit();
      navigate(`/order-status/${orderRef.id}`);
    } catch (err) {
      console.error("Order placement error:", err);
      alert("Error placing order: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-orange-600 transition"
          >
            <ArrowLeft size={18} />
            <span>Back to Menu</span>
          </button>
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <Lock size={13} className="text-emerald-600" />
            <span>100% Secure Checkout</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Pickup Details & Payment */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Pickup Counter Card */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center flex-shrink-0 text-orange-600 font-bold">
                  <MapPin size={20} />
                </div>
                <div className="flex-1">
                  <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                    Counter Pickup
                  </span>
                  <h2 className="text-xl font-extrabold text-gray-900 mt-0.5">
                    {cafeteria?.name || "Campus Cafeteria"}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {cafeteria?.location || "Campus Central Food Court"}
                  </p>

                  <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-gray-700 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                    <Clock size={14} className="text-orange-600" />
                    <span>Estimated Prep Time: <b>10-15 mins</b> after ordering</span>
                  </div>
                </div>
              </div>

              {/* Cooking note */}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Cooking instructions (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Less spicy, extra tissues, no onions..."
                  value={cookingInstructions}
                  onChange={(e) => setCookingInstructions(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Payment Method Selector (Swiggy / Zomato style) */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
              <h3 className="font-extrabold text-gray-900 text-base mb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-orange-600" />
                Select Payment Mode
              </h3>

              <div className="space-y-3">
                {[
                  {
                    id: "upi",
                    title: "UPI / Google Pay / PhonePe",
                    desc: "Pay instantly via your favorite UPI app",
                    badge: "Recommended",
                    icon: Wallet,
                  },
                  {
                    id: "campus_card",
                    title: "Campus Student Card / Meal Wallet",
                    desc: "Auto-debit from student campus mess account",
                    badge: "Zero Fee",
                    icon: CreditCard,
                  },
                  {
                    id: "counter",
                    title: "Pay at Cafeteria Counter",
                    desc: "Pay with Cash or Card upon receiving food token",
                    badge: "Cash / Card",
                    icon: Banknote,
                  },
                ].map(({ id, title, desc, badge, icon: Icon }) => (
                  <label
                    key={id}
                    className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition ${
                      paymentMethod === id
                        ? "border-orange-500 bg-orange-50/40 shadow-xs"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={id}
                      checked={paymentMethod === id}
                      onChange={() => setPaymentMethod(id)}
                      className="mt-1 accent-orange-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">{title}</span>
                        {badge && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                    <Icon size={18} className="text-gray-400 mt-1" />
                  </label>
                ))}
              </div>
            </div>

            {/* Cancellation Policy */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-bold">Campus Food Policy:</p>
              <p className="text-[11px] text-amber-800">
                Orders are freshly prepared by kitchen staff. Once confirmed, you can track live status with your digital token.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary & Bill */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <h3 className="font-extrabold text-gray-900 text-lg">Order Summary</h3>
                <span className="text-xs font-bold text-gray-500">{cart.length} items</span>
              </div>

              {/* Items List */}
              <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto py-2 pr-1">
                {groupedCart.map((item) => (
                  <div key={item.id} className="py-2.5 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2 flex-1 pr-2">
                      <div className="w-3.5 h-3.5 border-2 border-emerald-600 rounded-xs flex items-center justify-center p-0.5 flex-shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div>
                      </div>
                      <span className="font-bold text-gray-900 line-clamp-1">{item.name}</span>
                      <span className="text-gray-400">×{item.quantity}</span>
                    </div>
                    <span className="font-extrabold text-gray-900 flex-shrink-0">
                      ₹{item.subtotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupon Box */}
              <div className="my-4 p-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-orange-600" />
                  <div>
                    <p className="text-xs font-bold text-gray-900">CAMPUS20 Applied</p>
                    <p className="text-[10px] text-emerald-700 font-semibold">20% off campus discount</p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-emerald-600">-₹{discount.toFixed(2)}</span>
              </div>

              {/* Bill Details */}
              <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Item Total</span>
                  <span>₹{itemTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Campus Discount</span>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Counter Pickup & Packaging</span>
                  <span className="text-emerald-700 font-bold">FREE</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Campus Platform Fee</span>
                  <span>₹{platformFee.toFixed(2)}</span>
                </div>

                <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline font-black text-lg text-gray-900">
                  <span>TOTAL TO PAY</span>
                  <span>₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Place Order CTA */}
              <button
                onClick={placeOrder}
                disabled={submitting || cart.length === 0}
                className="w-full mt-6 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-orange-600/25 transition active:scale-98 flex items-center justify-center gap-2 text-sm tracking-wide"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Confirming Order...</span>
                  </span>
                ) : (
                  <>
                    <span>Confirm & Place Order</span>
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;
