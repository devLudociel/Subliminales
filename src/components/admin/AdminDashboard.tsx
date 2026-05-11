import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';

interface Order {
  id: string;
  amountTotal: number;
  status?: string;
  createdAt: any;
  customer: { name: string; email: string };
  items: Array<{ productId: string; quantity: number }>;
}

interface Product {
  id: string;
  name: string;
  variants?: Array<{ stock: number }>;
  stock?: number;
}

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  ordersThisMonth: number;
  revenueThisMonth: number;
  pendingOrders: number;
  lowStockProducts: Array<{ id: string; name: string; stock: number }>;
  recentOrders: Order[];
}

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function shortId(id: string) {
  return id.replace('cs_', '').replace('test_', '').slice(0, 10).toUpperCase();
}

function getProductStock(p: Product): number {
  if (p.variants?.length) {
    return p.variants.reduce((s, v) => s + (v.stock ?? 0), 0);
  }
  return p.stock ?? 0;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ordersSnap, productsSnap] = await Promise.all([
          getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'))),
          getDocs(collection(db, 'products')),
        ]);

        const orders: Order[] = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
        const products: Product[] = productsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product));

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const totalRevenue = orders.reduce((s, o) => s + (o.amountTotal ?? 0), 0);
        const ordersThisMonth = orders.filter(o => {
          const d = o.createdAt?.toDate?.() ?? new Date(0);
          return d >= startOfMonth;
        });
        const revenueThisMonth = ordersThisMonth.reduce((s, o) => s + (o.amountTotal ?? 0), 0);
        const pendingOrders = orders.filter(o => !o.status || o.status === 'nuevo').length;

        const lowStockProducts = products
          .map(p => ({ id: p.id, name: p.name, stock: getProductStock(p) }))
          .filter(p => p.stock <= 3)
          .sort((a, b) => a.stock - b.stock)
          .slice(0, 5);

        setStats({
          totalRevenue,
          totalOrders: orders.length,
          ordersThisMonth: ordersThisMonth.length,
          revenueThisMonth,
          pendingOrders,
          lowStockProducts,
          recentOrders: orders.slice(0, 8),
        });
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <p className="font-hand text-2xl text-white/60 animate-pulse">Cargando métricas...</p>;
  }

  if (!stats) {
    return <p className="font-hand text-2xl text-pink">Error cargando datos.</p>;
  }

  const cards = [
    { label: 'Ingresos totales',    value: `${stats.totalRevenue.toFixed(2)}€`,    icon: '💰', sub: `${stats.revenueThisMonth.toFixed(2)}€ este mes` },
    { label: 'Pedidos totales',     value: String(stats.totalOrders),              icon: '🧾', sub: `${stats.ordersThisMonth} este mes` },
    { label: 'Pendientes de envío', value: String(stats.pendingOrders),            icon: '📦', sub: 'Sin estado "enviado"' },
    { label: 'Stock bajo (≤3)',     value: String(stats.lowStockProducts.length),  icon: '⚠️', sub: 'Productos a reponer' },
  ];

  return (
    <div className="space-y-10">

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {cards.map(c => (
          <div key={c.label} className="bg-white border-2 border-white/20 rounded-xl p-6 shadow-hard">
            <div className="flex items-start justify-between mb-3">
              <span className="text-3xl">{c.icon}</span>
            </div>
            <p className="font-marker text-4xl text-dark mb-1">{c.value}</p>
            <p className="font-hand text-lg text-dark font-bold">{c.label}</p>
            <p className="font-hand text-base text-mid mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Recent orders */}
        <div className="bg-white border-2 border-white/20 rounded-xl overflow-hidden shadow-hard">
          <div className="px-6 py-4 border-b border-dark/10 flex items-center justify-between">
            <h2 className="font-marker text-2xl text-dark">Pedidos recientes</h2>
            <a href="/admin/pedidos" className="font-hand text-lg text-pink no-underline hover:opacity-80">ver todos →</a>
          </div>
          <div className="divide-y divide-dark/5">
            {stats.recentOrders.length === 0 && (
              <p className="font-hand text-xl text-mid p-6">No hay pedidos aún.</p>
            )}
            {stats.recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between px-6 py-4 hover:bg-bg transition-colors">
                <div>
                  <p className="font-hand text-lg text-dark font-bold">#{shortId(order.id)}</p>
                  <p className="font-hand text-base text-mid">{order.customer.name} · {formatDate(order.createdAt)}</p>
                </div>
                <span className="font-marker text-xl text-pink">{order.amountTotal.toFixed(2)}€</span>
              </div>
            ))}
          </div>
        </div>

        {/* Low stock */}
        <div className="bg-white border-2 border-white/20 rounded-xl overflow-hidden shadow-hard">
          <div className="px-6 py-4 border-b border-dark/10 flex items-center justify-between">
            <h2 className="font-marker text-2xl text-dark">Stock bajo</h2>
            <a href="/admin" className="font-hand text-lg text-pink no-underline hover:opacity-80">gestionar →</a>
          </div>
          {stats.lowStockProducts.length === 0 ? (
            <p className="font-hand text-xl text-mid p-6">✅ Todos los productos tienen stock suficiente.</p>
          ) : (
            <div className="divide-y divide-dark/5">
              {stats.lowStockProducts.map(p => (
                <div key={p.id} className="flex items-center justify-between px-6 py-4">
                  <p className="font-hand text-lg text-dark">{p.name}</p>
                  <span className={`font-hand text-lg font-bold px-3 py-1 rounded-full border-2 ${
                    p.stock === 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                  }`}>
                    {p.stock === 0 ? '❌ Agotado' : `⚠️ ${p.stock} ud.`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
