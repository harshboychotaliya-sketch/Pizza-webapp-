import React from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, Pizza } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    itemCount,
    subtotal,
    tax,
    deliveryFee,
    total,
    isCartDrawerOpen,
    setIsCartDrawerOpen
  } = useCart();
  const navigate = useNavigate();

  if (!isCartDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartDrawerOpen(false)}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-[#FAF7F2] h-full shadow-2xl flex flex-col z-10 border-l border-[#EFEAE4]">
        {/* Header */}
        <div className="p-5 border-b border-[#EFEAE4] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <Pizza className="w-5 h-5 text-[#E23722]" />
            <h3 className="font-display font-bold text-lg text-[#242424]">Your Pizza Bag</h3>
            <span className="text-xs font-mono-data text-stone-500">({itemCount} items)</span>
          </div>
          <button
            onClick={() => setIsCartDrawerOpen(false)}
            className="p-1 text-stone-400 hover:text-stone-800 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <Pizza className="w-12 h-12 text-stone-300 stroke-[1.5]" />
              <p className="text-sm text-stone-600 font-medium">Your pizza bag is currently empty.</p>
              <p className="text-xs text-stone-400 max-w-xs">
                Explore our wood-fired classics or design your own custom crust with 25+ artisanal toppings!
              </p>
              <button
                onClick={() => {
                  setIsCartDrawerOpen(false);
                  navigate('/menu');
                }}
                className="mt-2 px-4 py-2 bg-[#E23722] hover:bg-[#C02613] text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.cartItemId}
                className="bg-white rounded-lg p-3.5 border border-[#EFEAE4] shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-md object-cover border border-[#EFEAE4] shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-md bg-[#FAF7F2] border border-[#EFEAE4] flex items-center justify-center text-[#E23722] shrink-0 font-display font-bold text-xs">
                        Custom
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-sm text-[#242424] leading-snug">{item.name}</h4>
                      <div className="text-xs font-mono-data text-stone-600 mt-0.5">₹{item.unitPrice} each</div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.cartItemId)}
                    className="text-stone-400 hover:text-[#E23722] p-1 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Custom ingredients snapshot preview */}
                {item.isCustom && item.ingredients && (
                  <div className="text-[11px] text-stone-500 bg-[#FAF7F2] p-2 rounded border border-[#EFEAE4]/60 space-y-0.5">
                    <div><strong>Base:</strong> {item.ingredients.base.name}</div>
                    <div><strong>Sauce:</strong> {item.ingredients.sauce.name}</div>
                    <div><strong>Cheese:</strong> {item.ingredients.cheese.name}</div>
                    {item.ingredients.veggies.length > 0 && (
                      <div>
                        <strong>Toppings:</strong> {item.ingredients.veggies.map(v => v.name).join(', ')}
                      </div>
                    )}
                  </div>
                )}

                {/* Quantity and Line Total */}
                <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                  <div className="flex items-center gap-2 border border-[#EFEAE4] rounded-md px-2 py-0.5 bg-[#FAF7F2]">
                    <button
                      onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                      className="text-stone-600 hover:text-black p-0.5"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono-data text-xs font-semibold px-1 min-w-[16px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                      className="text-stone-600 hover:text-black p-0.5"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="font-mono-data font-bold text-sm text-[#242424]">
                    ₹{item.unitPrice * item.quantity}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary */}
        {cart.length > 0 && (
          <div className="p-5 bg-white border-t border-[#EFEAE4] space-y-3.5">
            {/* Free Delivery Animated Progress Bar */}
            <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#EFEAE4] space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-stone-700 text-[11px]">
                  {subtotal >= 500 ? '🎉 Free Hearth Delivery Unlocked!' : `Add ₹${500 - subtotal} more for Free Delivery`}
                </span>
                <span className="font-mono-data text-[11px] text-[#E23722]">
                  {Math.min(100, Math.round((subtotal / 500) * 100))}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#E06A26] to-[#E23722] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (subtotal / 500) * 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-stone-600 font-mono-data">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span>₹{tax}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
              </div>
              <div className="pt-2 border-t border-stone-200 flex justify-between text-sm font-bold text-[#242424]">
                <span>Total Amount</span>
                <span>₹{total}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsCartDrawerOpen(false);
                navigate('/checkout');
              }}
              className="w-full py-3 bg-[#E23722] hover:bg-[#C02613] text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
