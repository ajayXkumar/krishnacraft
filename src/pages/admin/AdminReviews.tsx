import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, deleteDoc, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase/config';
import type { Review } from '../../firebase/reviews';

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getDocs(query(collection(db, 'reviews'), orderBy('createdAt', 'desc')))
      .then(snap => setReviews(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Review, 'id'>) }))))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleFeatured = async (r: Review) => {
    await updateDoc(doc(db, 'reviews', r.id), { featured: !r.featured });
    setReviews(prev => prev.map(x => x.id === r.id ? { ...x, featured: !x.featured } : x));
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    await deleteDoc(doc(db, 'reviews', id));
    setReviews(prev => prev.filter(x => x.id !== id));
  };

  const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

  return (
    <div className="p-4 lg:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-walnut text-3xl">Reviews</h1>
        <p className="text-xs text-muted">Feature reviews to show them on the homepage testimonials section.</p>
      </div>

      {loading ? (
        <div className="text-sm text-muted">Loading…</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 text-muted text-sm">No reviews yet.</div>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className={`bg-white border rounded-xl p-6 transition-colors ${r.featured ? 'border-gold' : 'border-line'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="text-gold text-sm tracking-widest">{stars(r.rating)}</span>
                    <span className="font-medium text-walnut text-sm">{r.title}</span>
                    {r.featured && (
                      <span className="text-[10px] tracking-[0.2em] uppercase bg-gold text-white px-2 py-0.5 rounded-sm">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-walnut-soft leading-relaxed mb-2">{r.body}</p>
                  <div className="text-xs text-muted">
                    — {r.userName} · Product: <span className="font-mono text-walnut">{r.productId}</span> ·{' '}
                    {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => toggleFeatured(r)}
                    className={`px-4 py-1.5 text-[11px] tracking-widest uppercase rounded-sm transition-all ${
                      r.featured
                        ? 'bg-gold text-white hover:bg-gold/80'
                        : 'border border-line text-muted hover:border-gold hover:text-gold'
                    }`}
                  >
                    {r.featured ? 'Unfeature' : 'Feature'}
                  </button>
                  <button
                    onClick={() => deleteReview(r.id)}
                    className="px-4 py-1.5 text-[11px] tracking-widest uppercase rounded-sm border border-maroon/30 text-maroon/60 hover:text-maroon hover:border-maroon transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
