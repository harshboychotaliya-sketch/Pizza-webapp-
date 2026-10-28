import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, ShieldCheck, MapPin, Phone, User, AlertCircle, Trash2, Plus, Minus, CreditCard, Banknote } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderApi } from '../services/api';
import { RazorpayModal } from '../components/RazorpayModal';
import { GoogleSignInButton } from '../components/GoogleSignInButton';

export const CartCheckoutPage: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, subtotal, tax, deliveryFee, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Delivery form state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '9876543210',
    address: '142 Olive Grove, 4th Cross, 100 Feet Rd',
    city: 'Bangalore',
    postalCode: '560038',
    notes: 'Please ring the brass bell at gate.'
  });

  // Sync form data when user signs in via Google or email
  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.name,
        email: prev.email || user.email
      }));
    }
  }, [user]);

  // Payment method selection: 'online' | 'cod'
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Razorpay payment state
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
  const [orderResponseData, setOrderResponseData] = useState<any | null>(null);
  const [razorpayOrderData, setRazorpayOrderData] = useState<any | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!user) {
      setErrorMessage('Please sign in or create an account to place an order.');
      return;
    }

    if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim()) {
      setErrorMessage('Please fill in your name, contact phone number, and delivery address.');
      return;
    }

    if (cart.length === 0) {
      setErrorMessage('Your pizza bag is empty. Please add items before checkout.');
      return;
    }

    setLoading(true);
    try {
      // Create order on backend (recalculates prices & validates stock)
      const res = await orderApi.createOrder({
        items: cart,
        paymentMethod,
        customerDetails: {
          name: formData.name,
          email: formData.email || user.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          notes: formData.notes
        }
      });

      if (res.success) {
        if (paymentMethod === 'cod' || res.isCod) {
          // Cash on delivery: instant order confirmation
          clearCart();
          navigate(`/track?orderId=${res.order.id}&new=1&cod=1`);
          return;
        }

        if (res.razorpay) {
          setOrderResponseData(res.order);
          setRazorpayOrderData(res.razorpay);
          setIsRazorpayModalOpen(true);
        } else {
          setErrorMessage('Payment credentials missing from server.');
        }
      } else {
        setErrorMessage(res.message || 'Failed to initiate order.');
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Server error creating order.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentResult: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    setIsRazorpayModalOpen(false);
    setLoading(true);

    try {
      // Step 2: Cryptographic signature verification on backend
      const verifyRes = await orderApi.verifyPayment({
        razorpay_order_id: paymentResult.razorpay_order_id,
        razorpay_payment_id: paymentResult.razorpay_payment_id,
        razorpay_signature: paymentResult.razorpay_signature,
        orderId: orderResponseData.id
      });

      if (verifyRes.success) {
        clearCart();
        navigate(`/track?orderId=${orderResponseData.id}&new=1`);
      } else {
        setErrorMessage(verifyRes.message || 'Payment signature could not be verified.');
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Payment verification failed on backend.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentFailure = (reason: string) => {
    setIsRazorpayModalOpen(false);
    setErrorMessage(`Payment incomplete: ${reason}. Your order remains in pending state.`);
  };

  if (cart.length === 0 && !orderResponseData) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-display font-bold text-[#242424]">Your Pizza Bag is Empty</h2>
        <p className="text-stone-500 text-sm max-w-sm mx-auto">
          Explore our wood-fired specialties or design your own custom crust with 25+ artisanal toppings!
        </p>
        <div className="pt-2">
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#E23722] hover:bg-[#C02613] text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            <span>Browse Pizza Menu</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-2 mb-8">
        <Link to="/menu" className="text-xs text-stone-500 hover:text-black flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Continue Ordering</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Delivery Details Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#EFEAE4] shadow-xs">
            <div className="flex items-center justify-between pb-6 border-b border-[#EFEAE4]">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-[#E23722]">Delivery Logistics</span>
                <h2 className="text-2xl font-display font-bold text-[#242424] mt-0.5">Contact & Hearth Drop Details</h2>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#FAF7F2] border border-[#EFEAE4] flex items-center justify-center text-stone-700">
                <MapPin className="w-5 h-5" />
              </div>
            </div>

            {!user && (
              <div className="mt-4 p-4 bg-[#FAF7F2] border border-[#EFEAE4] rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-700">
                  <span className="font-semibold text-[#242424]">Fast Checkout with Google:</span>
                  <span className="text-stone-500">Auto-fills your details and syncs live order tracking</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <GoogleSignInButton
                    text="Continue with Google"
                    onSuccess={() => {}}
                  />
                  <Link
                    to="/login"
                    className="py-2.5 px-4 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center text-center"
                  >
                    Email Sign In
                  </Link>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitOrder} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Harsh Chotaliya"
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#EFEAE4] rounded-lg text-xs text-[#242424] focus:ring-1 focus:ring-[#E23722] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. 9876543210"
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#EFEAE4] rounded-lg text-xs text-[#242424] focus:ring-1 focus:ring-[#E23722] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Street Address</label>
                <input
                  type="text"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Flat/House No., Building Name, Street"
                  className="w-full px-3 py-2.5 bg-white border border-[#EFEAE4] rounded-lg text-xs text-[#242424] focus:ring-1 focus:ring-[#E23722] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-white border border-[#EFEAE4] rounded-lg text-xs text-[#242424] focus:ring-1 focus:ring-[#E23722] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">PIN / Postal Code</label>
                  <input
                    type="text"
                    name="postalCode"
                    required
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 bg-white border border-[#EFEAE4] rounded-lg text-xs text-[#242424] focus:ring-1 focus:ring-[#E23722] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Delivery Instructions (Optional)</label>
                <textarea
                  name="notes"
                  rows={2}
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Gate passcode, landmark, or contactless preference..."
                  className="w-full px-3 py-2 bg-white border border-[#EFEAE4] rounded-lg text-xs text-[#242424] focus:ring-1 focus:ring-[#E23722] focus:outline-none"
                />
              </div>

              {/* Payment Method Selector */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-stone-700 mb-2">Choose Payment Option</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('online')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      paymentMethod === 'online'
                        ? 'bg-amber-50/60 border-[#E23722] text-stone-900 shadow-2xs'
                        : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      paymentMethod === 'online' ? 'bg-[#E23722] text-white' : 'bg-stone-100 text-stone-500'
                    }`}>
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-900">Razorpay Online</div>
                      <div className="text-[10px] text-stone-500 mt-0.5">UPI, Cards, NetBanking (Test Mode)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      paymentMethod === 'cod'
                        ? 'bg-amber-50/60 border-[#E23722] text-stone-900 shadow-2xs'
                        : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      paymentMethod === 'cod' ? 'bg-[#E23722] text-white' : 'bg-stone-100 text-stone-500'
                    }`}>
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-900">Cash on Delivery (COD)</div>
                      <div className="text-[10px] text-stone-500 mt-0.5">Pay at doorstep with cash or UPI</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-[#EFEAE4] flex items-center justify-between text-xs text-stone-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>
                    {paymentMethod === 'cod'
                      ? 'Pay ₹' + total + ' when delivery partner arrives at your door'
                      : 'Razorpay test gateway verification enabled'}
                  </span>
                </span>
                <span className="font-mono-data text-stone-800 font-bold text-sm">₹{total}</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#E23722] hover:bg-[#C02613] disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : paymentMethod === 'cod' ? (
                  <>
                    <Banknote className="w-4 h-4" />
                    <span>Place Cash on Delivery Order (₹{total})</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Proceed to Razorpay Payment (₹{total})</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Order Summary Right (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white p-6 rounded-xl border border-[#EFEAE4] shadow-xs space-y-4">
            <h3 className="font-display font-bold text-lg text-[#242424] pb-3 border-b border-[#EFEAE4]">
              Review Pizza Items ({cart.reduce((s, i) => s + i.quantity, 0)})
            </h3>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.cartItemId} className="p-3 bg-[#FAF7F2] rounded-lg border border-[#EFEAE4] space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-xs text-[#242424]">{item.name}</div>
                      <div className="text-[11px] font-mono-data text-stone-500">₹{item.unitPrice} each</div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.cartItemId)}
                      className="text-stone-400 hover:text-[#E23722] p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {item.isCustom && item.ingredients && (
                    <div className="text-[10px] text-stone-500 space-y-0.5">
                      <div>Base: {item.ingredients.base.name} · Sauce: {item.ingredients.sauce.name}</div>
                      <div>Cheese: {item.ingredients.cheese.name}</div>
                      {item.ingredients.veggies.length > 0 && (
                        <div>Toppings: {item.ingredients.veggies.map(v => v.name).join(', ')}</div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-stone-200">
                    <div className="flex items-center gap-1.5 bg-white border border-[#EFEAE4] rounded px-1.5 py-0.5 text-xs">
                      <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}>
                        <Minus className="w-3 h-3 text-stone-600" />
                      </button>
                      <span className="font-mono-data font-semibold px-1">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}>
                        <Plus className="w-3 h-3 text-stone-600" />
                      </button>
                    </div>
                    <span className="font-mono-data font-bold text-xs text-[#242424]">
                      ₹{item.unitPrice * item.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-3 border-t border-[#EFEAE4] space-y-1.5 text-xs font-mono-data text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span>₹{tax}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
              </div>
              <div className="pt-2 border-t border-stone-200 flex justify-between text-base font-bold text-[#242424]">
                <span>Total Amount</span>
                <span>₹{total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Razorpay Test Mode Payment Modal */}
      {isRazorpayModalOpen && orderResponseData && razorpayOrderData && (
        <RazorpayModal
          isOpen={isRazorpayModalOpen}
          orderData={{
            orderId: orderResponseData.id,
            orderNumber: orderResponseData.orderNumber,
            totalAmount: orderResponseData.totalAmount,
            subtotal: orderResponseData.subtotal,
            tax: orderResponseData.tax,
            deliveryFee: orderResponseData.deliveryFee
          }}
          razorpayData={razorpayOrderData}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
          onClose={() => setIsRazorpayModalOpen(false)}
        />
      )}
    </div>
  );
};
