import { useCart } from '../store/CartContext';
import { CheckIcon } from './Icons';

export default function Toast() {
  const { toast } = useCart();
  return (
    <div
      className={`fixed bottom-7 right-5 left-5 sm:left-auto sm:right-7 z-[90] bg-walnut text-cream px-6 py-4 rounded-sm flex items-center gap-3 text-sm shadow-deep transition-all duration-400 ${
        toast ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'
      }`}
    >
      <span className="text-gold-soft">
        <CheckIcon size={16} strokeWidth={2.5} />
      </span>
      <span>{toast || 'Added to cart'}</span>
    </div>
  );
}
