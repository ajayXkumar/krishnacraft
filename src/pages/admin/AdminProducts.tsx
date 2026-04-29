import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminGetProducts, adminDeleteProduct, adminSaveProduct, type AdminProduct } from '../../firebase/adminOps';
import { formatPrice } from '../../data/products';

export default function AdminProducts() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = () => {
    setLoading(true);
    adminGetProducts()
      .then(p => { setProducts(p); setSelected(new Set()); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const idOf = (p: AdminProduct) => p.firestoreId || p.id;

  const toggleSelect = (id: string) =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const allSelected = products.length > 0 && selected.size === products.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(products.map(idOf)));

  const imageUrlsOf = (p: AdminProduct) => [p.img, ...(p.images ?? [])].filter(Boolean);

  const handleDelete = async (p: AdminProduct) => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    setDeleting(idOf(p));
    try {
      await adminDeleteProduct(idOf(p), imageUrlsOf(p));
      setProducts(prev => prev.filter(x => idOf(x) !== idOf(p)));
      setSelected(prev => { const s = new Set(prev); s.delete(idOf(p)); return s; });
    } finally {
      setDeleting(null);
    }
  };

  const toggleStock = async (p: AdminProduct) => {
    await adminSaveProduct({ ...p, inStock: !p.inStock });
    setProducts(prev => prev.map(x => idOf(x) === idOf(p) ? { ...x, inStock: !x.inStock } : x));
  };

  const bulkSetStock = async (inStock: boolean) => {
    if (selected.size === 0) return;
    setBulkBusy(true);
    try {
      const targets = products.filter(p => selected.has(idOf(p)));
      await Promise.all(targets.map(p => adminSaveProduct({ ...p, inStock })));
      setProducts(prev => prev.map(p => selected.has(idOf(p)) ? { ...p, inStock } : p));
      setSelected(new Set());
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} product(s)? This cannot be undone.`)) return;
    setBulkBusy(true);
    try {
      const targets = products.filter(p => selected.has(idOf(p)));
      await Promise.all(targets.map(p => adminDeleteProduct(idOf(p), imageUrlsOf(p))));
      setProducts(prev => prev.filter(p => !selected.has(idOf(p))));
      setSelected(new Set());
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-walnut text-3xl">Products</h1>
          <p className="text-muted text-sm mt-1">{products.length} products</p>
        </div>
        <Link
          to="/admin/products/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium uppercase tracking-widest rounded-sm bg-walnut text-cream hover:bg-ink transition-all"
        >
          + Add Product
        </Link>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-gold/10 border border-gold/30 rounded-sm">
          <span className="text-sm text-walnut font-medium">{selected.size} selected</span>
          <button
            onClick={() => bulkSetStock(true)}
            disabled={bulkBusy}
            className="px-4 py-1.5 text-xs tracking-widest uppercase bg-walnut text-cream rounded-sm hover:bg-ink disabled:opacity-50"
          >
            Mark In Stock
          </button>
          <button
            onClick={() => bulkSetStock(false)}
            disabled={bulkBusy}
            className="px-4 py-1.5 text-xs tracking-widest uppercase border border-walnut text-walnut rounded-sm hover:bg-walnut hover:text-cream disabled:opacity-50"
          >
            Mark Out of Stock
          </button>
          <button
            onClick={bulkDelete}
            disabled={bulkBusy}
            className="px-4 py-1.5 text-xs tracking-widest uppercase border border-maroon/40 text-maroon rounded-sm hover:bg-maroon/5 disabled:opacity-50"
          >
            Delete Selected
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-muted hover:text-walnut">
            Clear
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-muted text-sm py-10 text-center">Loading products…</div>
      ) : (
        <div className="bg-white border border-line rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-2 border-b border-line">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-walnut cursor-pointer" />
                </th>
                {['Product', 'Category', 'Price', 'Stock', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] tracking-[0.2em] uppercase text-muted font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map(p => (
                <tr key={idOf(p)} className={`transition-colors ${selected.has(idOf(p)) ? 'bg-gold/5' : 'hover:bg-cream-2/40'}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(idOf(p))}
                      onChange={() => toggleSelect(idOf(p))}
                      className="accent-walnut cursor-pointer"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.img} alt={p.name} className="w-12 h-12 object-cover rounded-sm border border-line" />
                      <div>
                        <div className="font-medium text-walnut">{p.name}</div>
                        <div className="text-xs text-muted">{p.wood}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted">{p.category}</td>
                  <td className="px-5 py-3 font-medium text-walnut">{formatPrice(p.price)}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => toggleStock(p)}
                      className={`text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-sm transition-colors ${
                        p.inStock ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-500 hover:bg-red-100'
                      }`}
                    >
                      {p.inStock ? 'In Stock' : 'Out of Stock'}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-4">
                      <Link to={`/admin/products/${idOf(p)}`} className="text-[11px] tracking-widest uppercase text-gold hover:text-walnut">
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(p)}
                        disabled={deleting === idOf(p)}
                        className="text-[11px] tracking-widest uppercase text-maroon hover:underline disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
