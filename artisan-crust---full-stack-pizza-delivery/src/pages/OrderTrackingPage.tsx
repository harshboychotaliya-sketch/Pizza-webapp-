import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Clock, ChefHat, Bike, ShieldCheck, RefreshCw, AlertCircle, ArrowLeft, PackageCheck, Banknote, CreditCard } from 'lucide-react';
import { orderApi } from '../services/api';
import { Order, OrderStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { RazorpayModal } from '../components/RazorpayModal';

export const OrderTrackingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlOrderId = searchParams.get('orderId');
  const isNew = searchParams.get('new') === '1';
  const isCodParam = searchParams.get('cod') === '1';

  const [orderIdInput, setOrderIdInput] = useState(urlOrderId || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const { user } = useAuth();

  // Razorpay payment state for paying pending orders
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
  const [razorpayOrderData, setRazorpayOrderData] = useState<any | null>(null);
  const [payingOnline, setPayingOnline] = useState(false);

  const fetchOrder = async (idToFetch: string) => {
    if (!idToFetch) return;
    setLoading(true);
    setError(null);
    try {
      const data = await orderApi.trackOrder(idToFetch);
      setOrder(data);
      setLastRefreshed(new Date());
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not find order. Please verify the ID.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlOrderId) {
      fetchOrder(urlOrderId);
    } else {
      // If user is logged in, try loading their most recent order
      orderApi.getMyOrders().then(orders => {
        if (orders.length > 0) {
          setOrder(orders[0]);
          setOrderIdInput(orders[0].id || orders[0]._id!);
        }
      }).catch(() => {});
    }
  }, [urlOrderId]);

  // Live polling every 6 seconds to capture admin status updates
  useEffect(() => {
    if (!order) return;
    const interval = setInterval(() => {
      const currentId = order.id || order._id!;
      orderApi.trackOrder(currentId).then(updated => {
        setOrder(updated);
        setLastRefreshed(new Date());
      }).catch(console.warn);
    }, 6000);

    return () => clearInterval(interval);
  }, [order?.id, order?._id]);

  const handleInitiateOnlinePayment = async () => {
    if (!order) return;
    setPayingOnline(true);
    try {
      const res = await orderApi.payOnline(order.id || order._id!);
      if (res.success && res.razorpay) {
        setRazorpayOrderData(res.razorpay);
        setIsRazorpayModalOpen(true);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Could not initiate online payment.');
    } finally {
      setPayingOnline(false);
    }
  };

  const handleOnlinePaymentSuccess = async (result: any) => {
    setIsRazorpayModalOpen(false);
    if (!order) return;
    try {
      await orderApi.verifyPayment({
        razorpay_order_id: result.razorpay_order_id,
        razorpay_payment_id: result.razorpay_payment_id,
        razorpay_signature: result.razorpay_signature,
        orderId: order.id || order._id
      });
      fetchOrder(order.id || order._id!);
    } catch (err) {
      console.error('Error verifying online payment:', err);
    }
  };

  const stages: { status: OrderStatus; label: string; icon: any; desc: string }[] = [
    {
      status: 'Order Received',
      label: '1. Order Received',
      icon: Clock,
      desc: 'Ticket confirmed, stone hearth preheating'
    },
    {
      status: 'In Kitchen',
      label: '2. In Kitchen',
      icon: ChefHat,
      desc: 'Dough hand-stretched, artisanal sauce & toppings applied'
    },
    {
      status: 'Sent to Delivery',
      label: '3. Sent to Delivery',
      icon: Bike,
      desc: 'Boxed hot in insulated thermal pouch en route to you'
    },
    {
      status: 'Delivered',
      label: 'Delivered',
      icon: PackageCheck,
      desc: 'Bon appétit! Hearth-baked goodness arrived'
    }
  ];

  const getStageIndex = (status: OrderStatus) => {
    if (status === 'Order Received') return 0;
    if (status === 'In Kitchen') return 1;
    if (status === 'Sent to Delivery') return 2;
    if (status === 'Delivered') return 3;
    return -1;
  };

  const currentStageIndex = order ? getStageIndex(order.orderStatus) : -1;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EFEAE4]">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-[#E23722]">Live Kitchen Telemetry</span>
          <h1 className="text-3xl font-display font-bold text-[#242424] mt-0.5">Order Tracker</h1>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchOrder(orderIdInput.trim());
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={orderIdInput}
            onChange={(e) => setOrderIdInput(e.target.value)}
            placeholder="Enter Order ID / Number..."
            className="px-3.5 py-2 bg-white border border-[#EFEAE4] rounded-lg text-xs text-[#242424] focus:outline-none focus:ring-1 focus:ring-[#E23722] w-56 font-mono-data"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#242424] hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            Track
          </button>
        </form>
      </div>

      {isNew && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <strong className="font-semibold">
                {isCodParam ? 'Cash on Delivery Hearth Order Confirmed!' : 'Hearth Order Placed & Payment Verified!'}
              </strong>
              <div className="text-emerald-700 mt-0.5">
                {isCodParam
                  ? 'Your order has been sent to our stone hearth! Please have exact cash or UPI ready upon delivery.'
                  : 'Your payment was confirmed via Razorpay test mode. Real-time kitchen tracking is live below.'}
              </div>
            </div>
          </div>
          <span className="font-mono-data font-semibold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
            Auto-Polling Active
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && !order && (
        <div className="p-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#E23722] animate-spin mx-auto" />
          <p className="text-xs text-stone-500">Retrieving order status from hearth database...</p>
        </div>
      )}

      {order && (
        <div className="space-y-8">
          {/* Main Status Stepper Card */}
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#EFEAE4] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EFEAE4]">
              <div>
                <div className="text-xs text-stone-500 font-mono-data">Order #{order.orderNumber}</div>
                <div className="text-xl font-display font-bold text-[#242424] mt-0.5">
                  Status: <span className="text-[#E23722]">{order.orderStatus}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="text-stone-400 font-mono-data">
                  Updated: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <button
                  onClick={() => fetchOrder(order.id || order._id!)}
                  className="p-1.5 hover:bg-stone-100 rounded text-stone-600 transition-colors"
                  title="Refresh now"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Dynamic Visual Status Atmosphere Banner */}
            <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  order.orderStatus === 'In Kitchen' ? 'bg-[#E23722] text-white animate-pulse' :
                  order.orderStatus === 'Sent to Delivery' ? 'bg-[#E06A26] text-white' :
                  order.orderStatus === 'Delivered' ? 'bg-emerald-600 text-white' :
                  'bg-stone-700 text-stone-200'
                }`}>
                  {order.orderStatus === 'In Kitchen' ? <ChefHat className="w-6 h-6" /> :
                   order.orderStatus === 'Sent to Delivery' ? <Bike className="w-6 h-6" /> :
                   order.orderStatus === 'Delivered' ? <PackageCheck className="w-6 h-6" /> :
                   <Clock className="w-6 h-6" />}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-amber-300 font-semibold">Live Preparation Telemetry</div>
                  <div className="text-base font-bold font-display">
                    {order.orderStatus === 'Order Received' && 'Hearth Ticket Confirmed · Stone Preheating'}
                    {order.orderStatus === 'In Kitchen' && 'Baking at 900°F · Blistering Cornicione'}
                    {order.orderStatus === 'Sent to Delivery' && 'Insulated Thermal Dispatch · En Route to You'}
                    {order.orderStatus === 'Delivered' && 'Delivered to Doorstep · Enjoy Your Hearth Pie!'}
                    {order.orderStatus === 'Cancelled' && 'Order Cancelled'}
                  </div>
                  <div className="text-[11px] text-stone-300 mt-0.5">
                    Live estimated dispatch: ~18-24 mins · Handcrafted fresh
                  </div>
                </div>
              </div>
              <div className="text-right sm:border-l sm:border-stone-700 sm:pl-5 shrink-0 space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-stone-400">
                  {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                </div>
                <div className={`text-lg font-bold font-mono-data ${order.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  ₹{order.totalAmount}
                </div>
                <div className="text-[10px]">
                  {order.paymentStatus === 'paid' ? (
                    <span className="text-emerald-400 font-semibold flex items-center justify-end gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Payment Verified</span>
                    </span>
                  ) : order.paymentMethod === 'cod' ? (
                    <span className="text-amber-300 font-medium">Pay at Doorstep (Cash/UPI)</span>
                  ) : (
                    <span className="text-amber-300 font-medium">Payment Pending</span>
                  )}
                </div>
                {order.paymentStatus !== 'paid' && (
                  <button
                    onClick={handleInitiateOnlinePayment}
                    disabled={payingOnline}
                    className="mt-1 px-3 py-1 bg-[#E23722] hover:bg-[#C02613] text-white text-[10px] font-semibold rounded-lg transition-colors flex items-center justify-end gap-1 ml-auto cursor-pointer"
                  >
                    <CreditCard className="w-3 h-3" />
                    <span>Pay Online (Razorpay)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Stepper (3 Required Statuses: Order Received, In Kitchen, Sent to Delivery) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              {stages.map((stage, idx) => {
                const Icon = stage.icon;
                const isCompleted = currentStageIndex >= idx;
                const isCurrent = currentStageIndex === idx;

                return (
                  <div
                    key={stage.status}
                    className={`p-4 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-[#FAF7F2] border-[#E23722] shadow-xs ring-1 ring-[#E23722]'
                        : isCompleted
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-stone-50/50 border-stone-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isCurrent
                            ? 'bg-[#E23722] text-white'
                            : isCompleted
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-200 text-stone-500'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      {isCompleted && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <div className="font-semibold text-xs text-[#242424]">{stage.label}</div>
                    <p className="text-[11px] text-stone-500 mt-1 leading-snug">{stage.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Historical Items & Ingredients Snapshot */}
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#EFEAE4] shadow-xs space-y-5">
            <h3 className="font-display font-bold text-lg text-[#242424] pb-3 border-b border-[#EFEAE4]">
              Order Snapshot & Selected Ingredients
            </h3>

            <div className="divide-y divide-stone-100">
              {order.items.map((item, i) => (
                <div key={i} className="py-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-sm text-[#242424]">{item.name}</span>
                      <span className="text-xs text-stone-500 ml-2 font-mono-data">x {item.quantity}</span>
                    </div>
                    <span className="font-mono-data font-bold text-sm text-[#242424]">
                      ₹{item.unitPrice * item.quantity}
                    </span>
                  </div>

                  {item.ingredientsSnapshot && (
                    <div className="text-xs text-stone-600 bg-[#FAF7F2] p-3 rounded-lg border border-[#EFEAE4] space-y-1">
                      <div>
                        <strong>Crust:</strong> {item.ingredientsSnapshot.base?.name || 'Hand-Tossed'} (₹{item.ingredientsSnapshot.base?.price || 0})
                      </div>
                      <div>
                        <strong>Sauce:</strong> {item.ingredientsSnapshot.sauce?.name || 'San Marzano'} (₹{item.ingredientsSnapshot.sauce?.price || 0})
                      </div>
                      <div>
                        <strong>Cheese:</strong> {item.ingredientsSnapshot.cheese?.name || 'Mozzarella'} (₹{item.ingredientsSnapshot.cheese?.price || 0})
                      </div>
                      {item.ingredientsSnapshot.veggies && item.ingredientsSnapshot.veggies.length > 0 && (
                        <div>
                          <strong>Toppings:</strong>{' '}
                          {item.ingredientsSnapshot.veggies.map(v => `${v.name} (₹${v.price})`).join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Total breakdown */}
            <div className="pt-4 border-t border-[#EFEAE4] space-y-1.5 text-xs font-mono-data text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (GST 5%)</span>
                <span>₹{order.tax}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>{order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}</span>
              </div>
              <div className="pt-2 border-t border-stone-200 flex justify-between text-base font-bold text-[#242424]">
                <span>Total Paid</span>
                <span>₹{order.totalAmount}</span>
              </div>
            </div>

            {/* Delivery address info */}
            <div className="pt-4 border-t border-[#EFEAE4] text-xs text-stone-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <strong>Delivering to:</strong> {order.customerDetails.name} · {order.customerDetails.address}, {order.customerDetails.city}
              </div>
              <div>
                <strong>Phone:</strong> {order.customerDetails.phone}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Razorpay Test Modal if paying online */}
      {isRazorpayModalOpen && razorpayOrderData && order && (
        <RazorpayModal
          isOpen={isRazorpayModalOpen}
          onClose={() => setIsRazorpayModalOpen(false)}
          orderData={{
            orderId: order.id || order._id!,
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            subtotal: order.subtotal,
            tax: order.tax,
            deliveryFee: order.deliveryFee
          }}
          razorpayData={razorpayOrderData}
          onSuccess={handleOnlinePaymentSuccess}
          onFailure={(reason) => {
            setIsRazorpayModalOpen(false);
            alert(`Payment cancelled: ${reason}`);
          }}
        />
      )}
    </div>
  );
};
