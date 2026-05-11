import { useState, useEffect } from 'react';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy,
} from 'firebase/firestore';
import { db } from '../../lib/firebase/client';

interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrder?: number;
  maxUses?: number;
  uses: number;
  active: boolean;
  expiresAt?: string;
  createdAt: any;
}

const inp = 'w-full px-4 py-3 font-hand text-xl border-2 border-dark bg-white text-dark outline-none focus:shadow-hard transition-all rounded-lg';
const sel = 'w-full px-4 py-3 font-hand text-xl border-2 border-dark bg-white text-dark outline-none focus:shadow-hard transition-all rounded-lg cursor-pointer';

const EMPTY = {
  code: '', type: 'percent' as const, value: 10,
  minOrder: undefined as number | undefined,
  maxUses: undefined as number | undefined,
  expiresAt: '',
};

export default function CouponsManager() {
  const [coupons, setCoupons]     = useState<Coupon[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState(EMPTY);
  const [error, setError]         = useState('');

  async function load() {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'coupons'), orderBy('createdAt', 'desc')));
      setCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() } as Coupon)));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const code = form.code.trim().toUpperCase();
    if (!code) { setError('Código requerido'); return; }
    if (form.value <= 0) { setError('Valor debe ser mayor que 0'); return; }
    if (form.type === 'percent' && form.value > 100) { setError('Porcentaje máximo 100%'); return; }

    // Duplicate check
    if (coupons.some(c => c.code === code)) {
      setError('Ya existe un cupón con ese código');
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, 'coupons'), {
        code,
        type: form.type,
        value: Number(form.value),
        minOrder: form.minOrder ? Number(form.minOrder) : null,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        uses: 0,
        active: true,
        expiresAt: form.expiresAt || null,
        createdAt: serverTimestamp(),
      });
      setForm(EMPTY);
      setShowForm(false);
      await load();
    } catch (err) {
      setError('Error al crear cupón');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(coupon: Coupon) {
    await updateDoc(doc(db, 'coupons', coupon.id), { active: !coupon.active });
    await load();
  }

  async function deleteCoupon(id: string) {
    if (!confirm('¿Eliminar este cupón?')) return;
    await deleteDoc(doc(db, 'coupons', id));
    await load();
  }

  return (
    <div>
      {/* Header actions */}
      <div className="flex items-center justify-between mb-8">
        <p className="font-hand text-xl text-mid">{coupons.length} cupón{coupons.length !== 1 ? 'es' : ''}</p>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="bg-pink text-white border-2 border-dark font-hand text-xl px-6 py-3 cursor-pointer shadow-hard hover:-translate-y-1 transition-all rounded-lg"
        >
          {showForm ? '✕ cancelar' : '+ nuevo cupón'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border-2 border-dark rounded-xl p-6 shadow-hard mb-8 space-y-4">
          <h3 className="font-marker text-2xl text-dark mb-2">Nuevo cupón</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-hand text-lg text-dark font-bold mb-1">Código</label>
              <input type="text" value={form.code} placeholder="VERANO20"
                onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                className={inp} required />
            </div>
            <div>
              <label className="block font-hand text-lg text-dark font-bold mb-1">Tipo</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as any }))} className={sel}>
                <option value="percent">Porcentaje (%)</option>
                <option value="fixed">Importe fijo (€)</option>
              </select>
            </div>
            <div>
              <label className="block font-hand text-lg text-dark font-bold mb-1">
                Valor {form.type === 'percent' ? '(%)' : '(€)'}
              </label>
              <input type="number" value={form.value} min={1} max={form.type === 'percent' ? 100 : undefined}
                onChange={e => setForm(p => ({ ...p, value: Number(e.target.value) }))}
                className={inp} required />
            </div>
            <div>
              <label className="block font-hand text-lg text-dark font-bold mb-1">Pedido mínimo (€, opcional)</label>
              <input type="number" value={form.minOrder ?? ''} min={0}
                onChange={e => setForm(p => ({ ...p, minOrder: e.target.value ? Number(e.target.value) : undefined }))}
                className={inp} placeholder="Ej: 30" />
            </div>
            <div>
              <label className="block font-hand text-lg text-dark font-bold mb-1">Usos máximos (opcional)</label>
              <input type="number" value={form.maxUses ?? ''} min={1}
                onChange={e => setForm(p => ({ ...p, maxUses: e.target.value ? Number(e.target.value) : undefined }))}
                className={inp} placeholder="Ej: 100" />
            </div>
            <div>
              <label className="block font-hand text-lg text-dark font-bold mb-1">Fecha de expiración (opcional)</label>
              <input type="date" value={form.expiresAt}
                onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                className={inp} />
            </div>
          </div>
          {error && <p className="font-hand text-lg text-pink">⚠️ {error}</p>}
          <button type="submit" disabled={saving}
            className="bg-dark text-mint border-2 border-dark font-hand text-xl px-8 py-3 cursor-pointer shadow-hard hover:-translate-y-1 transition-all rounded-lg disabled:opacity-60">
            {saving ? 'Creando...' : 'Crear cupón'}
          </button>
        </form>
      )}

      {/* List */}
      {loading ? (
        <p className="font-hand text-xl text-mid animate-pulse">Cargando cupones...</p>
      ) : coupons.length === 0 ? (
        <div className="text-center py-16 bg-white border-2 border-dark rounded-xl shadow-hard">
          <p className="text-5xl mb-4">🎟️</p>
          <p className="font-hand text-2xl text-mid">No hay cupones aún. Crea el primero.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map(c => {
            const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
            const exhausted = c.maxUses && c.uses >= c.maxUses;
            const effectively_active = c.active && !expired && !exhausted;
            return (
              <div key={c.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border-2 border-dark p-5 rounded-xl shadow-hard ${!effectively_active ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="font-marker text-2xl text-dark bg-mint/20 px-3 py-1 border-2 border-dark rounded-lg">
                    {c.code}
                  </span>
                  <span className="font-hand text-xl text-dark font-bold">
                    {c.type === 'percent' ? `-${c.value}%` : `-${c.value.toFixed(2)}€`}
                  </span>
                  {c.minOrder && <span className="font-hand text-base text-mid">mín. {c.minOrder}€</span>}
                  <span className={`font-hand text-base px-2 py-0.5 border rounded-full ${effectively_active ? 'bg-green-50 border-green-300 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
                    {expired ? '⏰ Expirado' : exhausted ? '🚫 Agotado' : c.active ? '✓ Activo' : '✗ Inactivo'}
                  </span>
                  <span className="font-hand text-base text-mid">{c.uses} uso{c.uses !== 1 ? 's' : ''}{c.maxUses ? ` / ${c.maxUses}` : ''}</span>
                  {c.expiresAt && <span className="font-hand text-base text-mid">hasta {c.expiresAt}</span>}
                </div>
                <div className="flex gap-3 shrink-0">
                  <button type="button" onClick={() => toggleActive(c)}
                    className="font-hand text-lg border-2 border-dark px-4 py-2 rounded-lg cursor-pointer hover:bg-bg transition-colors">
                    {c.active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button type="button" onClick={() => deleteCoupon(c.id)}
                    className="font-hand text-lg border-2 border-pink text-pink px-4 py-2 rounded-lg cursor-pointer hover:bg-pink hover:text-white transition-colors">
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
