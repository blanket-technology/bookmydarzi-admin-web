import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, ArrowLeft, Smartphone } from "lucide-react";

export default function AddOrderPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate("/ordersdetails", { replace: true }), 4000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-5">
          <ShoppingCart size={26} className="text-amber-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">Orders are customer-initiated</h2>
        <p className="text-sm text-gray-500 mb-4">
          Orders can only be placed by customers through the mobile app.
          Admin accounts cannot create orders on behalf of customers.
        </p>
        <div className="flex items-center gap-2 justify-center text-xs text-gray-400 mb-6">
          <Smartphone size={14} />
          <span>Customer → BookMyDarzi App → Place Order</span>
        </div>
        <p className="text-xs text-gray-400 mb-5">Redirecting to Order Management in 4 seconds…</p>
        <button
          onClick={() => navigate("/ordersdetails", { replace: true })}
          className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl transition-all"
        >
          <ArrowLeft size={15} /> Go to Orders
        </button>
      </div>
    </div>
  );
}
