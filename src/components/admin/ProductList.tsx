import { useState, useEffect } from 'react';
import { getAllProducts, deleteProduct } from '../../lib/firebase/admin-products';
import type { Product } from '../../data/products';

const categoryEmoji: Record<string, string> = {
  camisetas: '👕', sudaderas: '🧥', tazas: '☕',
  termos: '🧃', posters: '🖼️', accesorios: '🎁',
};

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const data = await getAllProducts();
      setProducts(data);
    } catch (e) {
      console.error('Error loading products:', e);
    }
    setLoading(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Seguro que quieres eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    setDeleting(id);
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      alert('Error al eliminar el producto');
    }
    setDeleting(null);
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-center py-24">
        <p className="text-6xl mb-6 animate-bounce">📦</p>
        <p className="font-hand text-3xl text-mid">Cargando productos...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Stats bar */}
      <div className="flex flex-wrap gap-4 mb-8">
        {[
          { label: 'Total', value: products.length, bg: 'bg-dark', color: 'text-mint' },
          { label: 'Destacados', value: products.filter(p => p.featured).length, bg: 'bg-pink', color: 'text-white' },
          { label: 'Nuevos', value: products.filter(p => p.isNew).length, bg: 'bg-mint', color: 'text-dark' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} ${stat.color} border-2 border-dark px-6 py-4 shadow-hard rounded-xl`}>
            <p className="font-marker text-3xl">{stat.value}</p>
            <p className="font-hand text-xl opacity-80">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search & Add */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <input
          type="text"
          placeholder="🔍 Buscar producto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-6 py-4 font-hand text-xl border-2 border-dark bg-white text-dark outline-none focus:shadow-hard transition-all rounded-lg"
        />
        <a
          href="/admin/producto-nuevo"
          className="bg-pink text-white border-2 border-dark font-hand text-xl px-8 py-4 no-underline text-center shadow-hard hover:-translate-y-1 transition-all rounded-lg whitespace-nowrap"
        >
          + Nuevo Producto
        </a>
      </div>

      {/* Product list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border-2 border-dark rounded-xl shadow-hard">
          <p className="text-6xl mb-4">🤷</p>
          <p className="font-marker text-3xl text-dark mb-2">Sin productos</p>
          <p className="font-hand text-2xl text-mid">
            {products.length === 0 ? 'Aún no has creado ningún producto.' : 'No hay resultados para tu búsqueda.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(product => (
            <div
              key={product.id}
              className="bg-white border-2 border-dark p-4 md:p-6 flex flex-col sm:flex-row items-center gap-4 md:gap-6 shadow-hard rounded-xl hover:shadow-hard-lg transition-shadow"
            >
              {/* Image */}
              <div className="w-20 h-20 md:w-24 md:h-24 border-2 border-dark bg-bg flex items-center justify-center shrink-0 rounded-lg overflow-hidden">
                {product.image && product.image.startsWith('http') ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">{categoryEmoji[product.category] ?? '📦'}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <div className="flex flex-wrap gap-2 mb-1 justify-center sm:justify-start">
                  {product.isNew && <span className="bg-mint text-dark font-hand text-sm px-2 py-0.5 border border-dark rounded">NEW</span>}
                  {product.featured && <span className="bg-pink text-white font-hand text-sm px-2 py-0.5 border border-dark rounded">DESTACADO</span>}
                  {product.bestseller && <span className="bg-dark text-mint font-hand text-sm px-2 py-0.5 border border-dark rounded">TOP</span>}
                </div>
                <p className="font-hand text-2xl font-bold text-dark truncate">{product.name}</p>
                <p className="font-hand text-lg text-mid">
                  {categoryEmoji[product.category] ?? '📦'} {product.category}
                  {product.collection && <span className="text-pink ml-2">· {product.collection}</span>}
                </p>
              </div>

              {/* Price */}
              <div className="text-center shrink-0">
                <p className="font-marker text-2xl text-dark">{product.price.toFixed(2)}€</p>
                {product.originalPrice && (
                  <p className="font-hand text-lg text-mid line-through">{product.originalPrice.toFixed(2)}€</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 shrink-0">
                <a
                  href={`/admin/producto-editar/${product.id}`}
                  className="bg-mint text-dark border-2 border-dark font-hand text-xl px-5 py-2 no-underline shadow-hard hover:-translate-y-1 transition-all rounded-lg"
                >
                  ✏️ Editar
                </a>
                <button
                  onClick={() => handleDelete(product.id, product.name)}
                  disabled={deleting === product.id}
                  className="bg-white text-pink border-2 border-dark font-hand text-xl px-5 py-2 cursor-pointer shadow-hard hover:-translate-y-1 transition-all rounded-lg disabled:opacity-50"
                >
                  {deleting === product.id ? '...' : '🗑️ Borrar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
