import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pizza, Clock, CheckCircle2, AlertOctagon, ChevronRight, RefreshCw } from 'lucide-react';
import { orderApi } from '../services/api';
import { Order } from '../types';
import { useAuth } from '../context/AuthContext';

export const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await orderApi.getMyOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load user orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EFEAE4]">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-[#E23722]">Customer Account</span>
          <h1 className="text-3xl font-display font-bold text-[#242424] mt-0.5">My Order History</h1>
          <p className="text-xs text-stone-500 mt-1">Review your past wood-fired crusts, custom toppings snapshot, and payment statuses.</p>
        </div>

        <button
          onClick={fetchOrders}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-[#EFEAE4] hover:bg-stone-50 rounded-lg transition-colors text-stone-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-xl p-6 border border-[#EFEAE4] animate-pulse space-y-3">
              <div className="h-4 bg-stone-200 rounded w-1/4" />
              <div className="h-6 bg-stone-200 rounded w-1/2" />
              <div className="h-4 bg-stone-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#EFEAE4] p-12 text-center space-y-3">
          <Pizza className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="text-base font-semibold text-stone-800">No previous orders found</h3>
          <p className="text-xs text-stone-500">You haven't placed an order yet. Treat yourself to our wood-fired sourdough pies!</p>
          <div className="pt-2">
            <Link
              to="/menu"
              className="inline-block px-5 py-2.5 bg-[#E23722] hover:bg-[#C02613] text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Order Now
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id || order._id}
              className="bg-white rounded-xl border border-[#EFEAE4] p-6 shadow-xs hover:border-stone-400 transition-colors space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-data font-bold text-sm text-[#242424]">#{order.orderNumber}</span>
                    <span className="text-stone-300">·</span>
                    <span className="text-xs text-stone-500 font-mono-data">
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="text-xs text-stone-600 mt-0.5">
                    {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-mono-data font-bold text-base text-[#242424]">₹{order.totalAmount}</div>
                    <div className="flex items-center gap-1.5 justify-end">
                      {order.paymentMethod === 'cod' ? (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          COD
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                          Online
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider ${
                          order.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/track?orderId=${order.id || order._id}`}
                    className="p-2 hover:bg-[#FAF7F2] rounded-lg text-stone-600 hover:text-[#E23722] transition-colors"
                    title="Live Tracking"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>

              {/* Status pill & snapshot items */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-800">Current Progress:</span>
                  <span className="font-mono-data font-bold text-[#E23722]">{order.orderStatus}</span>
                </div>

                <Link
                  to={`/track?orderId=${order.id || order._id}`}
                  className="text-xs font-semibold text-[#E23722] hover:underline"
                >
                  View Ingredients Snapshot & Live Stepper →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
