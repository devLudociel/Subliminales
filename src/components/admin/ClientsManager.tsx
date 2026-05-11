import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';

interface Order {
  customerEmail: string;
  customer: { name: string; email: string };
  amountTotal: number;
  createdAt: any;
  status?: string;
}

interface ClientRow {
  email: string;
  name: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: Date | null;
}

function formatDate(d: Date | null): string {
  if (!d) return '—';
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ClientsManager() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
        const orders: Order[] = snap.docs.map(d => d.data() as Order);

        // Group by email
        const map = new Map<string, ClientRow>();
        for (const o of orders) {
          const email = (o.customerEmail ?? o.customer?.email ?? '').toLowerCase();
          if (!email) continue;
          if (!map.has(email)) {
            map.set(email, {
              email,
              name: o.customer?.name ?? email,
              totalOrders: 0,
              totalSpent: 0,
              lastOrderDate: null,
            });
          }
          const row = map.get(email)!;
          row.totalOrders++;
          row.totalSpent += o.amountTotal ?? 0;
          const d = o.createdAt?.toDate?.() ?? null;
          if (d && (!row.lastOrderDate || d > row.lastOrderDate)) {
            row.lastOrderDate = d;
          }
        }

        setClients([...map.values()].sort((a, b) => b.totalSpent - a.totalSpent));
      } catch (err) {
        console.error('Clients error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = search.trim()
    ? clients.filter(c =>
        c.email.includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : clients;

  return (
    <div>
      {/* Search */}
      <div className="mb-6 flex gap-4 items-center">
        <input
          type="search"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 max-w-md px-4 py-3 font-hand text-xl border-2 border-dark bg-white text-dark outline-none focus:shadow-hard transition-all rounded-lg"
        />
        <span className="font-hand text-lg text-mid">{filtered.length} cliente{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <p className="font-hand text-xl text-mid animate-pulse">Cargando clientes...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border-2 border-dark rounded-xl shadow-hard">
          <p className="text-5xl mb-4">👥</p>
          <p className="font-hand text-2xl text-mid">No hay clientes aún.</p>
        </div>
      ) : (
        <div className="bg-white border-2 border-dark rounded-xl overflow-hidden shadow-hard">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-dark bg-bg">
                <th className="text-left px-6 py-4 font-hand text-lg text-dark font-bold">Cliente</th>
                <th className="text-right px-6 py-4 font-hand text-lg text-dark font-bold">Pedidos</th>
                <th className="text-right px-6 py-4 font-hand text-lg text-dark font-bold">Total gastado</th>
                <th className="text-right px-6 py-4 font-hand text-lg text-dark font-bold hidden md:table-cell">Último pedido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark/5">
              {filtered.map(c => (
                <tr key={c.email} className="hover:bg-bg transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-hand text-xl text-dark font-bold leading-tight">{c.name}</p>
                    <p className="font-hand text-base text-mid">{c.email}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-hand text-xl text-dark">{c.totalOrders}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-marker text-xl text-pink">{c.totalSpent.toFixed(2)}€</span>
                  </td>
                  <td className="px-6 py-4 text-right hidden md:table-cell">
                    <span className="font-hand text-lg text-mid">{formatDate(c.lastOrderDate)}</span>
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
