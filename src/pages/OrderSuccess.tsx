import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrder } from '../firebase/orders';
import type { Order } from '../firebase/orders';
import { formatPrice } from '../data/products';
import { CheckIcon, ArrowRightIcon } from '../components/Icons';
import ProfileGate from '../components/ProfileGate';

export default function OrderSuccess() {
  return (
    <ProfileGate allowMissing>
      <OrderSuccessInner />
    </ProfileGate>
  );
}

function OrderSuccessInner() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!id) return;
    getOrder(id).then(setOrder);
  }, [id]);

  return (
    <section className="pt-32 pb-20 min-h-screen">
      <div className="max-w-2xl mx-auto px-5 lg:px-8 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gold flex items-center justify-center text-white">
          <CheckIcon size={36} strokeWidth={2.5} />
        </div>
        <span className="section-tag">Payment Confirmed</span>
        <h1 className="mb-4" style={{ fontSize: 'clamp(32px, 4.5vw, 56px)' }}>
          Thank you for your order
        </h1>
        <p className="text-muted mb-8 leading-relaxed">
          Your order has been received and our master artisans will begin work shortly.
          A confirmation has been sent to your email.
        </p>

        {order && (
          <div className="bg-white border border-line rounded-xl p-7 text-left mb-8">
            <div className="flex justify-between items-start mb-4 pb-4 border-b border-line">
              <div>
                <div className="text-[11px] tracking-[0.2em] uppercase text-muted mb-1">
                  Order Number
                </div>
                <div className="font-display text-walnut text-lg">
                  #{order.id.slice(0, 10).toUpperCase()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] tracking-[0.2em] uppercase text-muted mb-1">
                  Total Paid
                </div>
                <div className="font-display text-walnut text-lg">
                  {formatPrice(order.total)}
                </div>
              </div>
            </div>
            <div className="text-sm text-walnut-soft">
              <div className="text-[11px] tracking-[0.15em] uppercase text-muted mb-1">
                Shipping to
              </div>
              <div className="leading-relaxed">
                <span className="text-walnut font-medium">{order.shippingAddress.name}</span><br />
                {order.shippingAddress.line1}, {order.shippingAddress.city},<br />
                {order.shippingAddress.state} — {order.shippingAddress.pincode}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            to={`/order/${id}`}
            className="inline-flex items-center gap-2 px-7 py-3.5 text-xs font-medium uppercase tracking-[0.2em] rounded-sm bg-walnut text-cream hover:bg-ink transition-all"
          >
            View Order Details <ArrowRightIcon />
          </Link>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-7 py-3.5 text-xs font-medium uppercase tracking-[0.2em] rounded-sm border border-walnut text-walnut hover:bg-walnut hover:text-cream transition-all"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </section>
  );
}
