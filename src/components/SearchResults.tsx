import { useState, useEffect, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase/client';

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  isNew?: boolean;
  bestseller?: boolean;
  tags: string[];
}

const CATEGORY_EMOJI: Record<string, string> = {
  camisetas: '👕', sudaderas: '🧥', tazas: '☕',
  termos: '🧃', posters: '🖼️', accesorios: '🎁',
};

function match(product: Product, q: string): boolean {
  const lower = q.toLowerCase();
  return (
    product.name.toLowerCase().includes(lower) ||
    product.description.toLowerCase().includes(lower) ||
    product.category.toLowerCase().includes(lower) ||
    (product.tags ?? []).some(t => t.toLowerCase().includes(lower))
  );
}

export default function SearchResults() {
  const [query, setQuery]       = useState('');
  const [allProducts, setAll]   = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const inputRef                = useRef<HTMLInputElement>(null);

  // Read initial query from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') ?? '';
    setQuery(q);
    inputRef.current && (inputRef.current.value = q);
  }, []);

  // Load all products once
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'products'));
        setAll(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
      } catch {
        // fallback: empty
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const results = query.trim().length >= 2
    ? allProducts.filter(p => match(p, query.trim()))
    : [];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = inputRef.current?.value ?? '';
    setQuery(q);
    const url = new URL(window.location.href);
    url.searchParams.set('q', q);
    window.history.replaceState({}, '', url.toString());
  }

  return (
    <div>
      {/* Search input */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-10">
        <input
          ref={inputRef}
          type="search"
          defaultValue={query}
          placeholder="buscar productos..."
          autoFocus
          className="flex-1 px-6 py-4 font-hand text-2xl border-2 border-dark bg-white text-dark outline-none shadow-hard focus:shadow-hard-lg transition-shadow rounded-lg"
          onChange={e => {
            const v = e.target.value;
            setQuery(v);
            const url = new URL(window.location.href);
            url.searchParams.set('q', v);
            window.history.replaceState({}, '', url.toString());
          }}
        />
        <button
          type="submit"
          className="bg-dark text-mint border-2 border-dark font-hand text-xl px-8 py-4 cursor-pointer shadow-hard hover:-translate-y-1 transition-all rounded-lg"
        >
          buscar
        </button>
      </form>

      {/* Loading */}
      {loading && (
        <p className="font-hand text-2xl text-mid animate-pulse">Cargando productos...</p>
      )}

      {/* Prompt */}
      {!loading && query.trim().length < 2 && (
        <div className="text-center py-16">
          <p className="text-7xl mb-4">🔍</p>
          <p className="font-hand text-2xl text-mid">escribe al menos 2 caracteres para buscar</p>
        </div>
      )}

      {/* No results */}
      {!loading && query.trim().length >= 2 && results.length === 0 && (
        <div className="text-center py-16">
          <p className="text-7xl mb-4">😶</p>
          <p className="font-hand text-2xl text-mid mb-2">
            Sin resultados para <strong className="text-dark">"{query}"</strong>
          </p>
          <p className="font-hand text-xl text-mid">Prueba con otra palabra o <a href="/tienda" className="text-pink">mira toda la tienda</a>.</p>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <>
          <p className="font-hand text-xl text-mid mb-6">
            {results.length} resultado{results.length !== 1 ? 's' : ''} para <strong className="text-dark">"{query}"</strong>
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {results.map(product => {
              const discount = product.originalPrice
                ? Math.round((1 - product.price / product.originalPrice) * 100)
                : null;
              return (
                <a
                  key={product.id}
                  href={`/producto/${product.slug}`}
                  className="block no-underline group"
                >
                  <div className="border-2 border-dark bg-white shadow-hard hover:-translate-y-1 hover:shadow-hard-lg transition-all rounded-xl overflow-hidden">
                    <div className="relative aspect-square bg-bg flex items-center justify-center overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-6xl">{CATEGORY_EMOJI[product.category] ?? '📦'}</span>
                      )}
                      {discount && (
                        <span className="absolute top-2 left-2 bg-pink text-white font-hand text-base px-2 py-0.5 border-2 border-dark">
                          -{discount}%
                        </span>
                      )}
                      {product.isNew && (
                        <span className="absolute top-2 right-2 bg-mint text-dark font-hand text-base px-2 py-0.5 border-2 border-dark">
                          NEW
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-marker text-xl text-dark leading-tight mb-1">{product.name}</p>
                      <p className="font-hand text-base text-mid mb-2 line-clamp-2">{product.description}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="font-marker text-xl text-dark">{product.price.toFixed(2)}€</span>
                        {product.originalPrice && (
                          <span className="font-hand text-base text-mid line-through">{product.originalPrice.toFixed(2)}€</span>
                        )}
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
