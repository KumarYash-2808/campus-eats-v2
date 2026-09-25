import { useLocation, useNavigate, useParams } from "react-router-dom";
import { addDoc, collection, serverTimestamp, writeBatch, doc, increment } from "firebase/firestore";
import { db, auth } from "../firebase";

const CheckoutPage = () => {
  const { cafeteriaId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const cart = state?.cart || [];
  const cafeteria = state?.cafeteria || {};

  const total = cart.reduce((sum, i) => sum + Number(i.price), 0);

  const placeOrder = async () => {
    try {
    const user = auth.currentUser;
    if (!user) return alert("Login required");

    // Create order
    const orderRef = await addDoc(collection(db, "orders"), {
      userEmail: user.email,
      cafeteriaId,
      cafeteriaName: cafeteria?.name || "Cafeteria",
      adminEmail: cafeteria?.adminEmail || "",
      cart,
      total,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    // ✅ Decrease stock for each item
    const batch = writeBatch(db);

    cart.forEach((item) => {
    const itemRef = doc(db, "cafeterias", cafeteriaId, "items", item.id);

    batch.update(itemRef, {
    stock: increment(-1)   // decrease stock by 1 per item
    });
    });

    await batch.commit();

    navigate(`/order-status/${orderRef.id}`);

    } catch (err) {
    console.error(err);
    alert("Error placing order");
    }
  };


  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>
      <h2 className="mb-3 font-semibold">{cafeteria?.name}</h2>

      <div className="bg-white shadow rounded p-4 mb-6">
        {cart.map((item, i) => (
          <div key={i} className="flex justify-between mb-2">
            <span>{item.name}</span>
            <span>₹{Number(item.price).toFixed(2)}</span>
          </div>
        ))}
        <hr className="my-2"/>
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span> 
          <span>₹{total.toFixed(2)}</span>
        </div>
      </div>

      <button 
        onClick={placeOrder}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold"
      >
        Pay & Place Order
      </button>
    </div>
  );
};

export default CheckoutPage;
