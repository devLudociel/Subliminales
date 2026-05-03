import { useState, useEffect } from 'react';
import {
  collection, query, orderBy, getDocs,
  doc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../lib/firebase/client';

// ── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = 'nuevo' | 'preparando' | 'enviado' | 'entregado' | 'cancelado';

interface StatusEvent {
  status: OrderStatus;
  date: any;
  note?: string;
}

interface AdminOrder {
  id: string;
  stripeSessionId: string;
  paymentStatus: string;
  amountTotal: number;
  currency: string;
  createdAt: any;
  shippingMethod: string;
  taxNote: string;
  status?: OrderStatus;
  trackingNumber?: string;
  carrier?: string;
  statusHistory?: StatusEvent[];
  customer: {
    name: string;
    email: string;
    address: string;
    city: string;
    province?: string;
    zip: string;
  };
  items: Array<{
    productId: string;
    variantId?: string;
    size?: string;
    color?: string;
    quantity: number;
    name?: string;
  }>;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUSES: { value: OrderStatus; label: string; color: string; bg: string }[] = [
  { value: 'nuevo',      label: '🆕 Nuevo',      color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200'   },
  { value: 'preparando', label: '🔧 Preparando', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  { value: 'enviado',    label: '🚚 Enviado',    color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  { value: 'entregado',  label: '✅ Entregado',  color: 'text-green-700',  bg: 'bg-green-50 border-green-200'  },
  { value: 'cancelado',  label: '❌ Cancelado',  color: 'text-red-700',    bg: 'bg-red-50 border-red-200'      },
];

const CARRIERS = ['Correos', 'SEUR', 'MRW', 'GLS', 'DHL', 'UPS', 'FedEx', 'Nacex', 'Otro'];

const CARRIER_TRACKING: Record<string, string> = {
  'Correos': 'https://www.correos.es/es/es/herramientas/localizador/envios/detalle?tracking=',
  'SEUR':    'https://www.seur.com/livetracking/?segOnlineIdentificador=',
  'MRW':     'https://www.mrw.es/seguimiento_envios/buscador_dhl.asp?Num_Alb=',
  'GLS':     'https://gls-group.com/track/',
  'DHL':     'https://www.dhl.com/es-es/home/tracking/tracking-express.html?submit=1&tracking-id=',
  'UPS':     'https://www.ups.com/track?tracknum=',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusInfo(status?: OrderStatus) {
  return STATUSES.find(s => s.value === status) ?? STATUSES[0];
}

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function shortId(id: string) {
  return id.replace('cs_', '').replace('test_', '').slice(0, 10).toUpperCase();
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OrdersManager() {
  const [orders, setOrders]         = useState<AdminOrder[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState<OrderStatus | 'all'>('all');
  const [search, setSearch]         = useState('');
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [saving, setSaving]         = useState<string | null>(null);

  // Editing state per order
  const [editStatus, setEditStatus]     = useState<Record<string, OrderStatus>>({});
  const [editTracking, setEditTracking] = useState<Record<string, string>>({});
  const [editCarrier, setEditCarrier]   = useState<Record<string, string>>({});
  const [emailSent, setEmailSent]       = useState<Record<string, boolean>>({});

  useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
      );
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        status: d.data().status ?? 'nuevo',
      })) as AdminOrder[];
      setOrders(data);
      // Initialize edit state
      const es: Record<string, OrderStatus>  = {};
      const et: Record<string, string>        = {};
      const ec: Record<string, string>        = {};
      data.forEach(o => {
        es[o.id] = o.status ?? 'nuevo';
        et[o.id] = o.trackingNumber ?? '';
        ec[o.id] = o.carrier ?? '';
      });
      setEditStatus(es);
      setEditTracking(et);
      setEditCarrier(ec);
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  }

  async function saveOrder(orderId: string) {
    setSaving(orderId);
    try {
      const newStatus  = editStatus[orderId];
      const prevOrder  = orders.find(o => o.id === orderId);
      const prevStatus = prevOrder?.status ?? 'nuevo';

      const historyEntry: StatusEvent = {
        status: newStatus,
        date: serverTimestamp(),
      };

      await updateDoc(doc(db, 'orders', orderId), {
        status:         newStatus,
        trackingNumber: editTracking[orderId] || '',
        carrier:        editCarrier[orderId]  || '',
        updatedAt:      serverTimestamp(),
        ...(newStatus !== prevStatus
          ? { statusHistory: [...(prevOrder?.statusHistory ?? []), historyEntry] }
          : {}),
      });

      setOrders(prev => prev.map(o =>
        o.id === orderId
          ? { ...o, status: newStatus, trackingNumber: editTracking[orderId], carrier: editCarrier[orderId] }
          : o
      ));
    } catch (err) {
      console.error('Error saving order:', err);
      alert('Error al guardar. Revisa las reglas de Firestore.');
    } finally {
      setSaving(null);
    }
  }

  // ── Filtered list ────────────────────────────────────────────────────────
  const filtered = orders.filter(o => {
    const matchStatus = filter === 'all' || o.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      o.customer.name.toLowerCase().includes(q)  ||
      o.customer.email.toLowerCase().includes(q) ||
      shortId(o.stripeSessionId).includes(q.toUpperCase()) ||
      (o.trackingNumber ?? '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = {
    total:      orders.length,
    nuevo:      orders.filter(o => o.status === 'nuevo').length,
    preparando: orders.filter(o => o.status === 'preparando').length,
    enviado:    orders.filter(o => o.status === 'enviado').length,
    revenue:    orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.amountTotal, 0),
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return <p className="font-hand text-2xl text-mid animate-pulse">Cargando pedidos...</p>;
  }

  return (
    <div className="space-y-6">

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total pedidos', value: stats.total,      icon: '🧾', color: 'bg-white' },
          { label: 'Nuevos',        value: stats.nuevo,      icon: '🆕', color: 'bg-blue-50' },
          { label: 'En preparación',value: stats.preparando, icon: '🔧', color: 'bg-yellow-50' },
          { label: 'Ingresos',      value: `${stats.revenue.toFixed(2)}€`, icon: '💰', color: 'bg-mint/10' },
        ].map(s => (
          <div key={s.label} className={`${s.color} border-2 border-dark rounded-xl p-4 shadow-hard`}>
            <p className="text-3xl mb-1">{s.icon}</p>
            <p className="font-marker text-3xl text-dark">{s.value}</p>
            <p className="font-hand text-lg text-mid">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Buscar cliente, email, #ID, tracking..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-4 py-2 font-hand text-lg border-2 border-dark rounded-lg bg-white flex-1 min-w-[200px] outline-none focus:shadow-hard"
        />
        <div className="flex flex-wrap gap-2">
          {(['all', ...STATUSES.map(s => s.value)] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 font-hand text-lg border-2 rounded-lg cursor-pointer transition-all ${
                filter === s
                  ? 'bg-dark text-mint border-dark'
                  : 'bg-white text-dark border-dark/30 hover:border-dark'
              }`}
            >
              {s === 'all' ? 'Todos' : STATUSES.find(st => st.value === s)?.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Order count ── */}
      <p className="font-hand text-lg text-mid">
        {filtered.length} pedido{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* ── Orders list ── */}
      {filtered.length === 0 ? (
        <div className="bg-white border-2 border-dark rounded-xl p-12 text-center shadow-hard">
          <p className="text-5xl mb-4">📭</p>
          <p className="font-hand text-2xl text-mid">No hay pedidos con ese filtro.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(order => {
            const st = statusInfo(order.status);
            const isExpanded = expanded === order.id;
            const isSaving = saving === order.id;
            const trackingUrl = editCarrier[order.id] && editTracking[order.id]
              ? (CARRIER_TRACKING[editCarrier[order.id]] ?? '') + editTracking[order.id]
              : null;

            return (
              <div key={order.id} className="bg-white border-2 border-dark rounded-xl shadow-hard overflow-hidden">

                {/* Header row */}
                <div className="flex flex-wrap items-center gap-3 p-4 cursor-pointer hover:bg-bg transition-colors" onClick={() => setExpanded(isExpanded ? null : order.id)}>
                  <span className="font-marker text-xl text-dark">#{shortId(order.stripeSessionId)}</span>
                  <span className={`px-2 py-0.5 border rounded-full font-hand text-base ${st.bg} ${st.color}`}>{st.label}</span>
                  <span className="font-hand text-lg text-mid">{formatDate(order.createdAt)}</span>
                  <span className="font-hand text-lg text-dark font-bold">{order.customer.name}</span>
                  <span className="font-hand text-base text-mid">{order.customer.email}</span>
                  <span className="font-marker text-xl text-pink ml-auto">{order.amountTotal.toFixed(2)}€</span>
                  <span className="text-mid font-hand text-lg">{isExpanded ? '▲' : '▼'}</span>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t-2 border-dark/10 p-5 space-y-6 bg-bg">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      {/* Items */}
                      <div>
                        <p className="font-hand text-lg text-mid font-bold uppercase tracking-wide mb-3">Artículos</p>
                        <div className="space-y-2">
                          {order.items.map((item, i) => {
                            const parts = [item.size, item.color].filter(Boolean);
                            return (
                              <div key={i} className="flex items-center gap-2 bg-white border border-dark/10 rounded-lg px-3 py-2">
                                <span>👕</span>
                                <span className="font-hand text-lg text-dark flex-1">
                                  {item.name || item.productId}
                                  {parts.length > 0 && <span className="text-mid"> — {parts.join(' / ')}</span>}
                                </span>
                                <span className="font-hand text-base text-mid">×{item.quantity}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Customer & address */}
                      <div>
                        <p className="font-hand text-lg text-mid font-bold uppercase tracking-wide mb-3">Cliente</p>
                        <div className="bg-white border border-dark/10 rounded-lg p-3 font-hand text-lg space-y-1">
                          <p className="font-bold text-dark">{order.customer.name}</p>
                          <p className="text-mid">{order.customer.email}</p>
                          <p className="text-dark">{order.customer.address}</p>
                          <p className="text-mid">{[order.customer.zip, order.customer.city, order.customer.province].filter(Boolean).join(', ')}</p>
                          <p className="text-mid text-sm">{order.taxNote} · {order.shippingMethod}</p>
                        </div>
                      </div>
                    </div>

                    {/* ── Admin controls ── */}
                    <div className="bg-white border-2 border-dark/20 rounded-xl p-4 space-y-4">
                      <p className="font-hand text-lg text-mid font-bold uppercase tracking-wide">Actualizar pedido</p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Status selector */}
                        <div>
                          <label className="block font-hand text-base text-mid mb-1 font-bold">Estado</label>
                          <select
                            value={editStatus[order.id]}
                            onChange={e => setEditStatus(p => ({ ...p, [order.id]: e.target.value as OrderStatus }))}
                            className="w-full px-3 py-2 font-hand text-lg border-2 border-dark rounded-lg bg-white outline-none focus:shadow-hard cursor-pointer"
                          >
                            {STATUSES.map(s => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Carrier */}
                        <div>
                          <label className="block font-hand text-base text-mid mb-1 font-bold">Transportista</label>
                          <select
                            value={editCarrier[order.id]}
                            onChange={e => setEditCarrier(p => ({ ...p, [order.id]: e.target.value }))}
                            className="w-full px-3 py-2 font-hand text-lg border-2 border-dark rounded-lg bg-white outline-none focus:shadow-hard cursor-pointer"
                          >
                            <option value="">— Seleccionar —</option>
                            {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>

                        {/* Tracking number */}
                        <div>
                          <label className="block font-hand text-base text-mid mb-1 font-bold">Nº Tracking</label>
                          <input
                            type="text"
                            value={editTracking[order.id]}
                            onChange={e => setEditTracking(p => ({ ...p, [order.id]: e.target.value }))}
                            placeholder="ABC123456789"
                            className="w-full px-3 py-2 font-hand text-lg border-2 border-dark rounded-lg bg-white outline-none focus:shadow-hard"
                          />
                        </div>
                      </div>

                      {/* Tracking link preview */}
                      {trackingUrl && (
                        <a
                          href={trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 font-hand text-lg text-pink hover:text-dark transition-colors no-underline"
                        >
                          🔗 Ver tracking en {editCarrier[order.id]}
                        </a>
                      )}

                                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => saveOrder(order.id)}
                          disabled={isSaving}
                          className="bg-dark text-mint border-2 border-dark font-hand text-xl px-6 py-2.5 rounded-lg cursor-pointer shadow-hard hover:-translate-y-0.5 transition-all disabled:opacity-60"
                        >
                          {isSaving ? 'Guardando...' : '💾 Guardar cambios'}
                        </button>

                        {/* Send shipping email — only when status=enviado and tracking filled */}
                        {editStatus[order.id] === 'enviado' && editTracking[order.id] && editCarrier[order.id] && (
                          <button
                            type="button"
                            disabled={emailSent[order.id]}
                            onClick={async () => {
                              const secret = import.meta.env.PUBLIC_RESEND_GUARD ?? '';
                              try {
                                const res = await fetch('/api/admin/send-shipping-email', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    stripeSessionId: order.stripeSessionId,
                                    trackingNumber:  editTracking[order.id],
                                    carrier:         editCarrier[order.id],
                                    customerName:    order.customer.name,
                                    customerEmail:   order.customer.email,
                                    adminSecret:     secret,
                                  }),
                                });
                                if (res.ok) setEmailSent(p => ({ ...p, [order.id]: true }));
                                else alert('Error al enviar email. Revisa los logs.');
                              } catch {
                                alert('Error al enviar email.');
                              }
                            }}
                            className="bg-purple-600 text-white border-2 border-dark font-hand text-xl px-6 py-2.5 rounded-lg cursor-pointer shadow-hard hover:-translate-y-0.5 transition-all disabled:opacity-60"
                          >
                            {emailSent[order.id] ? '✅ Email enviado' : '📧 Avisar al cliente'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Status history */}
                    {order.statusHistory && order.statusHistory.length > 0 && (
                      <div>
                        <p className="font-hand text-lg text-mid font-bold uppercase tracking-wide mb-2">Historial</p>
                        <div className="space-y-1">
                          {[...order.statusHistory].reverse().map((e, i) => {
                            const si = statusInfo(e.status);
                            return (
                              <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${si.bg}`}>
                                <span className={`font-hand text-base font-bold ${si.color}`}>{si.label}</span>
                                <span className="font-hand text-base text-mid">{formatDate(e.date)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
