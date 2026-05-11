import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase/client';

interface OrderItem {
  productId: string;
  name?: string;
  quantity: number;
  size?: string;
  color?: string;
}

interface Order {
  id: string;
  stripeSessionId: string;
  amountTotal: number;
  currency: string;
  createdAt: any;
  shippingMethod: string;
  taxNote: string;
  paymentStatus: string;
  customer: {
    name: string;
    email: string;
    address: string;
    city: string;
    province?: string;
    zip: string;
  };
  items: OrderItem[];
}

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
}

function shippingLabel(method: string) {
  if (method === 'express') return 'Envío urgente 24/48h';
  if (method === 'free') return 'Envío gratuito';
  return 'Envío estándar 3-5 días';
}

export default function InvoiceView({ orderId }: { orderId: string }) {
  const [order, setOrder]     = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    let active = true;
    auth.authStateReady().then(async () => {
      if (!active) return;
      const user = auth.currentUser;
      if (!user) { window.location.href = '/login'; return; }

      try {
        const snap = await getDoc(doc(db, 'orders', orderId));
        if (!snap.exists()) {
          // Try querying by stripeSessionId
          const q = query(collection(db, 'orders'), where('stripeSessionId', '==', orderId));
          const qs = await getDocs(q);
          if (qs.empty) { setError('Pedido no encontrado'); setLoading(false); return; }
          const d = qs.docs[0];
          const orderData = { id: d.id, ...d.data() } as Order;
          // Auth check: only owner can view
          if (orderData.customer.email !== user.email?.toLowerCase() && user.email !== 'rubenjruiz1441@gmail.com') {
            setError('No tienes permiso para ver este pedido'); setLoading(false); return;
          }
          if (active) setOrder(orderData);
        } else {
          const orderData = { id: snap.id, ...snap.data() } as Order;
          if (orderData.customer.email !== user.email?.toLowerCase() && user.email !== 'rubenjruiz1441@gmail.com') {
            setError('No tienes permiso para ver este pedido'); setLoading(false); return;
          }
          if (active) setOrder(orderData);
        }
      } catch (e) {
        if (active) setError('Error al cargar el pedido');
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => { active = false; };
  }, [orderId]);

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <p className="font-hand text-2xl text-mid animate-pulse">Cargando factura...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <p className="font-hand text-2xl text-pink">⚠️ {error}</p>
    </div>
  );

  if (!order) return null;

  const shortId = order.stripeSessionId.replace('cs_', '').replace('test_', '').slice(0, 10).toUpperCase();
  const address = [order.customer.address, order.customer.zip, order.customer.city, order.customer.province].filter(Boolean).join(', ');

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">

      {/* Print / back actions */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <a href="/perfil" className="font-hand text-xl text-mid hover:text-dark no-underline transition-colors">
          ← Volver a mis pedidos
        </a>
        <button
          type="button"
          onClick={() => window.print()}
          className="bg-dark text-mint border-2 border-dark font-hand text-xl px-6 py-3 cursor-pointer shadow-hard hover:-translate-y-1 transition-all rounded-lg"
        >
          🖨️ Imprimir / Guardar PDF
        </button>
      </div>

      {/* Invoice card */}
      <div className="bg-white border-2 border-dark shadow-hard rounded-xl overflow-hidden print:border-0 print:shadow-none">

        {/* Header */}
        <div className="bg-pink p-8 flex justify-between items-start">
          <div>
            <h1 className="font-marker text-4xl text-white mb-1">SUBLIMINAL.ES</h1>
            <p className="font-hand text-lg text-white/80">Ropa con chiste desde 2025</p>
          </div>
          <div className="text-right">
            <p className="font-hand text-lg text-white/80 uppercase tracking-wide">Recibo</p>
            <p className="font-marker text-2xl text-white">#{shortId}</p>
            <p className="font-hand text-lg text-white/80">{formatDate(order.createdAt)}</p>
          </div>
        </div>

        <div className="p-8 space-y-8">

          {/* Customer + Payment info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="font-hand text-base text-mid uppercase tracking-widest font-bold mb-2">Facturar a</p>
              <p className="font-hand text-xl text-dark font-bold">{order.customer.name}</p>
              <p className="font-hand text-lg text-mid">{order.customer.email}</p>
              <p className="font-hand text-lg text-mid">{address}</p>
            </div>
            <div>
              <p className="font-hand text-base text-mid uppercase tracking-widest font-bold mb-2">Pago</p>
              <p className="font-hand text-xl text-dark">
                {order.paymentStatus === 'paid' ? '✅ Pagado' : '⏳ Pendiente'}
              </p>
              <p className="font-hand text-lg text-mid">{shippingLabel(order.shippingMethod)}</p>
              <p className="font-hand text-lg text-mid">{order.taxNote}</p>
            </div>
          </div>

          {/* Items table */}
          <div>
            <p className="font-hand text-base text-mid uppercase tracking-widest font-bold mb-3">Artículos</p>
            <div className="border-2 border-dark rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-bg border-b-2 border-dark">
                    <th className="text-left px-5 py-3 font-hand text-lg text-dark font-bold">Producto</th>
                    <th className="text-right px-5 py-3 font-hand text-lg text-dark font-bold">Cant.</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, i) => {
                    const variant = [item.size, item.color].filter(Boolean).join(' / ');
                    return (
                      <tr key={i} className="border-b border-dark/10 last:border-0">
                        <td className="px-5 py-3 font-hand text-lg text-dark">
                          {item.name || item.productId}
                          {variant && <span className="text-mid"> — {variant}</span>}
                        </td>
                        <td className="px-5 py-3 font-hand text-lg text-mid text-right">×{item.quantity}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-end">
            <div className="min-w-48">
              <div className="flex justify-between font-hand text-lg py-2 border-b border-dark/10">
                <span className="text-mid">IVA</span>
                <span className="text-dark">{order.taxNote}</span>
              </div>
              <div className="flex justify-between items-baseline py-3">
                <span className="font-marker text-2xl text-dark">Total</span>
                <span className="font-marker text-3xl text-pink">{order.amountTotal.toFixed(2)}€</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t-2 border-dark/20 pt-6 text-center">
            <p className="font-hand text-lg text-mid">
              ¿Dudas? Escríbenos a <strong className="text-dark">hola@subliminal.es</strong>
            </p>
            <p className="font-hand text-base text-mid mt-1">subliminal.es — CIF: B-XXXXXXXX — Madrid, España</p>
          </div>
        </div>
      </div>
    </div>
  );
}
