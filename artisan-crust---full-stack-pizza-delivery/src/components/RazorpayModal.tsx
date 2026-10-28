import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, AlertOctagon, CreditCard, Lock } from 'lucide-react';

interface RazorpayModalProps {
  isOpen: boolean;
  orderData: {
    orderId: string;
    orderNumber: string;
    totalAmount: number;
    subtotal: number;
    tax: number;
    deliveryFee: number;
  };
  razorpayData: {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
    testSimulation: {
      paymentId: string;
      signature: string;
    };
  };
  onSuccess: (paymentResult: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  onFailure: (errorReason: string) => void;
  onClose: () => void;
}

export const RazorpayModal: React.FC<RazorpayModalProps> = ({
  isOpen,
  orderData,
  razorpayData,
  onSuccess,
  onFailure,
  onClose
}) => {
  const [processing, setProcessing] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'card' | 'upi' | 'netbanking'>('card');

  if (!isOpen) return null;

  const handleSimulateSuccess = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onSuccess({
        razorpay_order_id: razorpayData.orderId,
        razorpay_payment_id: razorpayData.testSimulation.paymentId,
        razorpay_signature: razorpayData.testSimulation.signature
      });
    }, 900);
  };

  const handleSimulateFailure = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onFailure('Payment declined by issuing bank (Simulated Test Failure)');
    }, 700);
  };

  const handleLaunchOfficialRazorpay = () => {
    if (typeof (window as any).Razorpay !== 'function') {
      handleSimulateSuccess();
      return;
    }

    try {
      const options = {
        key: razorpayData.keyId,
        amount: razorpayData.amount,
        currency: razorpayData.currency,
        name: 'Artisan Crust Pizzeria',
        description: `Order ${orderData.orderNumber}`,
        order_id: razorpayData.orderId,
        handler: function (response: any) {
          onSuccess({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
        },
        theme: {
          color: '#E23722'
        },
        modal: {
          ondismiss: function () {
            onFailure('Payment cancelled by user');
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        onFailure(response.error?.description || 'Payment transaction failed');
      });
      rzp.open();
    } catch (err) {
      console.warn('Could not launch standard Razorpay popup, falling back to simulated flow:', err);
      handleSimulateSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-[#EFEAE4]">
        {/* Razorpay Top Bar */}
        <div className="bg-[#0C2340] text-white p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-sky-300 font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Razorpay Secure · Test Mode</span>
            </div>
            <h3 className="text-xl font-bold font-display mt-0.5">Artisan Crust</h3>
            <p className="text-xs text-stone-300">Order #{orderData.orderNumber}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-stone-300">Total Payable</span>
            <div className="text-2xl font-bold font-mono-data">₹{orderData.totalAmount}</div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 bg-[#FAF7F2]">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-[#EFEAE4] p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setPaymentMode('card')}
              className={`flex-1 py-1.5 rounded-md transition-colors ${
                paymentMode === 'card' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Test Cards
            </button>
            <button
              onClick={() => setPaymentMode('upi')}
              className={`flex-1 py-1.5 rounded-md transition-colors ${
                paymentMode === 'upi' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              UPI Test
            </button>
            <button
              onClick={() => setPaymentMode('netbanking')}
              className={`flex-1 py-1.5 rounded-md transition-colors ${
                paymentMode === 'netbanking' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              NetBanking
            </button>
          </div>

          {/* Test Card preview box */}
          <div className="bg-white p-4 rounded-lg border border-[#EFEAE4] space-y-2 text-xs">
            <div className="flex items-center justify-between text-stone-500">
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#E23722]" />
                <span>Sandbox Test Instrument</span>
              </span>
              <span className="font-mono-data bg-stone-100 px-1.5 py-0.5 rounded text-[11px]">Valid Thru 12/28</span>
            </div>
            <div className="font-mono-data text-stone-800 text-sm font-semibold tracking-wider">
              4111 ···· ···· 1111 (Visa Test)
            </div>
            <div className="text-[11px] text-stone-500 flex items-center justify-between pt-1 border-t border-stone-100">
              <span>CVV: Any (999)</span>
              <span>OTP: 123456</span>
            </div>
          </div>

          <div className="text-[11px] text-stone-500 bg-amber-50/80 border border-amber-200/80 rounded p-2.5 flex items-start gap-2">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              This is an authenticated Razorpay test-mode transaction. No real funds will be charged. All signatures will be cryptographically verified on our backend.
            </span>
          </div>

          {/* Action buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={handleSimulateSuccess}
              disabled={processing}
              className="w-full py-3 bg-[#E23722] hover:bg-[#C02613] disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {processing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Authorize Payment (₹{orderData.totalAmount})</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleSimulateFailure}
                disabled={processing}
                className="py-2 px-3 border border-stone-300 hover:bg-stone-100 text-stone-700 font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                <span>Simulate Failure</span>
              </button>

              <button
                onClick={handleLaunchOfficialRazorpay}
                disabled={processing}
                className="py-2 px-3 border border-stone-300 hover:bg-stone-100 text-stone-700 font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Standard Gateway</span>
              </button>
            </div>

            <button
              onClick={onClose}
              disabled={processing}
              className="w-full py-1.5 text-center text-xs text-stone-500 hover:text-stone-800 transition-colors"
            >
              Cancel Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
