import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../lib/firebase/client';

interface Review {
  id: string;
  rating: number;
  body: string;
  authorName: string;
  createdAt: any;
}

function Stars({ rating, interactive = false, onSelect }: {
  rating: number;
  interactive?: boolean;
  onSelect?: (r: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type={interactive ? 'button' : undefined}
          onClick={interactive ? () => onSelect?.(n) : undefined}
          onMouseEnter={interactive ? () => setHovered(n) : undefined}
          onMouseLeave={interactive ? () => setHovered(0) : undefined}
          className={`text-2xl leading-none transition-transform ${interactive ? 'cursor-pointer hover:scale-125' : 'cursor-default'}`}
          style={{ background: 'none', border: 'none', padding: 0 }}
        >
          {n <= (hovered || rating) ? '⭐' : '☆'}
        </button>
      ))}
    </div>
  );
}

function formatDate(ts: any): string {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews]   = useState<Review[]>([]);
  const [loading, setLoading]   = useState(true);
  const [user, setUser]         = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm]         = useState({ rating: 5, body: '', authorName: '' });
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      if (u?.displayName) setForm(p => ({ ...p, authorName: p.authorName || u.displayName! }));
    });
    return unsub;
  }, []);

  async function loadReviews() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      const data = await res.json();
      setReviews(data.reviews ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadReviews(); }, [productId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.body.trim() || !form.authorName.trim()) {
      setFormError('Nombre y reseña son obligatorios');
      return;
    }
    if (!user) {
      setFormError('Inicia sesión para dejar una reseña');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          rating: form.rating,
          body: form.body,
          authorName: form.authorName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? 'Error al enviar reseña');
      } else {
        setSubmitted(true);
        setShowForm(false);
        await loadReviews();
      }
    } finally {
      setSaving(false);
    }
  }

  const avg = reviews.length
    ? Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length * 10) / 10
    : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-marker text-4xl md:text-5xl text-dark m-0">
            valoraciones
          </h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-3 mt-2">
              <Stars rating={Math.round(avg)} />
              <span className="font-hand text-xl text-dark font-bold">{avg}/5</span>
              <span className="font-hand text-lg text-mid">({reviews.length} reseña{reviews.length !== 1 ? 's' : ''})</span>
            </div>
          )}
        </div>
        {!submitted && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="bg-pink text-white border-2 border-dark font-hand text-xl px-6 py-3 cursor-pointer shadow-hard hover:-translate-y-1 transition-all rounded-lg shrink-0"
          >
            + Escribir reseña
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border-2 border-dark rounded-xl p-6 shadow-hard mb-8 space-y-4">
          <h3 className="font-marker text-2xl text-dark">Tu reseña</h3>
          <div>
            <label className="block font-hand text-lg text-dark font-bold mb-2">Puntuación</label>
            <Stars rating={form.rating} interactive onSelect={r => setForm(p => ({ ...p, rating: r }))} />
          </div>
          <div>
            <label className="block font-hand text-lg text-dark font-bold mb-1">Tu nombre *</label>
            <input
              type="text"
              value={form.authorName}
              onChange={e => setForm(p => ({ ...p, authorName: e.target.value }))}
              placeholder="Juan García"
              className="w-full px-4 py-3 font-hand text-xl border-2 border-dark bg-bg text-dark outline-none focus:shadow-hard rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block font-hand text-lg text-dark font-bold mb-1">Reseña *</label>
            <textarea
              value={form.body}
              onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
              placeholder="¿Qué te pareció el producto?"
              rows={4}
              className="w-full px-4 py-3 font-hand text-xl border-2 border-dark bg-bg text-dark outline-none focus:shadow-hard transition-all rounded-lg resize-none"
              required
            />
          </div>
          {formError && <p className="font-hand text-lg text-pink">⚠️ {formError}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="bg-dark text-mint border-2 border-dark font-hand text-xl px-8 py-3 cursor-pointer shadow-hard hover:-translate-y-1 transition-all rounded-lg disabled:opacity-60">
              {saving ? 'Enviando...' : 'Publicar reseña'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="border-2 border-dark font-hand text-xl px-8 py-3 cursor-pointer hover:bg-bg transition-colors rounded-lg">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {submitted && (
        <div className="bg-mint/15 border-2 border-mint rounded-xl p-4 mb-8">
          <p className="font-hand text-xl text-dark">✅ ¡Gracias por tu reseña!</p>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <p className="font-hand text-xl text-mid animate-pulse">Cargando reseñas...</p>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 border-2 border-dark/20 rounded-xl">
          <p className="text-4xl mb-3">💬</p>
          <p className="font-hand text-xl text-mid">Sé el primero en valorar este producto.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="bg-white border-2 border-dark rounded-xl p-5 shadow-hard">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-hand text-xl text-dark font-bold">{r.authorName}</p>
                  <Stars rating={r.rating} />
                </div>
                <p className="font-hand text-base text-mid shrink-0">{formatDate(r.createdAt)}</p>
              </div>
              <p className="font-hand text-xl text-mid leading-relaxed">{r.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
