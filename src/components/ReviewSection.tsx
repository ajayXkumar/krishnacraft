import { useEffect, useState } from 'react';
import {
  getProductReviews,
  hasUserReviewedProduct,
  submitReview,
  type Review,
} from '../firebase/reviews';
import { getUserOrders } from '../firebase/orders';
import { useAuth } from '../store/AuthContext';
import { StarIcon } from './Icons';

interface Props {
  productId: string;
}

function Stars({ rating, interactive, onChange }: { rating: number; interactive?: boolean; onChange?: (r: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type={interactive ? 'button' : undefined}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => interactive && setHover(n)}
          onMouseLeave={() => interactive && setHover(0)}
          className={`transition-colors ${interactive ? 'cursor-pointer' : 'cursor-default'} ${
            n <= (interactive ? hover || rating : rating) ? 'text-gold' : 'text-line'
          }`}
          disabled={!interactive}
        >
          <StarIcon size={interactive ? 22 : 14} />
        </button>
      ))}
    </div>
  );
}

export default function ReviewSection({ productId }: Props) {
  const { user, profile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    setLoading(true);
    getProductReviews(productId)
      .then(setReviews)
      .finally(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    if (!user) { setCanReview(false); return; }
    Promise.all([
      getUserOrders(user.uid),
      hasUserReviewedProduct(user.uid, productId),
    ]).then(([orders, reviewed]) => {
      const hasDelivered = orders.some(
        o => o.status === 'delivered' && o.items.some(it => it.productId === productId),
      );
      setCanReview(hasDelivered && !reviewed);
      setAlreadyReviewed(reviewed);
    });
  }, [user, productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    if (!title.trim() || !body.trim()) return setSubmitError('Please fill in all fields.');
    setSubmitting(true); setSubmitError('');
    try {
      const id = await submitReview({
        productId,
        userId: user.uid,
        userName: profile.displayName || 'Customer',
        rating,
        title: title.trim(),
        body: body.trim(),
        createdAt: Date.now(),
      });
      setReviews(prev => [{
        id,
        productId,
        userId: user.uid,
        userName: profile.displayName || 'Customer',
        rating,
        title: title.trim(),
        body: body.trim(),
        createdAt: Date.now(),
      }, ...prev]);
      setCanReview(false);
      setAlreadyReviewed(true);
      setShowForm(false);
      setTitle(''); setBody(''); setRating(5);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length
    ? Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length * 10) / 10
    : 0;

  return (
    <section className="py-16 border-t border-line">
      <div className="max-w-[1280px] mx-auto px-5 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="text-2xl font-display mb-2">Customer Reviews</h2>
            {reviews.length > 0 && (
              <div className="flex items-center gap-3">
                <Stars rating={Math.round(avgRating)} />
                <span className="text-sm text-muted">{avgRating} · {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span>
              </div>
            )}
          </div>
          {canReview && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 text-xs tracking-widest uppercase border border-walnut text-walnut rounded-sm hover:bg-walnut hover:text-cream transition-all"
            >
              Write a Review
            </button>
          )}
          {alreadyReviewed && (
            <span className="text-xs text-muted">You've reviewed this product.</span>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-cream-2 rounded-xl p-7 mb-10 space-y-4 max-w-xl">
            <h3 className="text-lg font-medium">Your Review</h3>
            <div>
              <label className="block text-[11px] tracking-[0.2em] uppercase text-muted mb-2">Rating</label>
              <Stars rating={rating} interactive onChange={setRating} />
            </div>
            <div>
              <label className="block text-[11px] tracking-[0.2em] uppercase text-muted mb-2">Title</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Summarise your experience"
                className="w-full px-4 py-2.5 border border-line rounded-sm text-sm outline-none focus:border-gold bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] tracking-[0.2em] uppercase text-muted mb-2">Review</label>
              <textarea
                rows={4}
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Tell others about your experience with this piece"
                className="w-full px-4 py-2.5 border border-line rounded-sm text-sm resize-none outline-none focus:border-gold bg-white"
              />
            </div>
            {submitError && <p className="text-xs text-maroon">{submitError}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={submitting}
                className="px-6 py-2.5 text-xs tracking-widest uppercase bg-walnut text-cream rounded-sm hover:bg-ink disabled:opacity-60">
                {submitting ? 'Submitting…' : 'Submit Review'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-6 py-2.5 text-xs tracking-widest uppercase border border-line text-muted rounded-sm hover:text-walnut">
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-sm text-muted">Loading reviews…</div>
        ) : reviews.length === 0 ? (
          <div className="text-sm text-muted py-8">
            No reviews yet.{' '}
            {!user && <span>Sign in after receiving your order to leave the first review.</span>}
          </div>
        ) : (
          <div className="space-y-6 max-w-2xl">
            {reviews.map(r => (
              <div key={r.id} className="bg-white rounded-xl p-6 border border-line">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <Stars rating={r.rating} />
                    <div className="font-medium text-walnut mt-2">{r.title}</div>
                  </div>
                  <div className="text-xs text-muted shrink-0">
                    {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <p className="text-sm text-walnut-soft leading-relaxed mb-3">{r.body}</p>
                <div className="text-xs text-muted">— {r.userName}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
