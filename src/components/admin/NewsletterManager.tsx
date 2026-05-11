import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';

interface Subscriber {
  id: string;
  email: string;
  createdAt: any;
  source?: string;
}

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function NewsletterManager() {
  const [subs, setSubs]     = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'newsletter'), orderBy('createdAt', 'desc')));
      setSubs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Subscriber)));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function remove(id: string, email: string) {
    if (!confirm(`¿Eliminar ${email} de la lista?`)) return;
    await deleteDoc(doc(db, 'newsletter', id));
    await load();
  }

  function exportCSV() {
    const rows = ['Email,Fecha,Fuente', ...subs.map(s => `${s.email},${formatDate(s.createdAt)},${s.source ?? 'homepage'}`)];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'newsletter-subs.csv'; a.click();
  }

  const filtered = search.trim()
    ? subs.filter(s => s.email.includes(search.toLowerCase()))
    : subs;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex gap-4 items-center">
          <input
            type="search"
            placeholder="Buscar email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-4 py-3 font-hand text-xl border-2 border-dark bg-white text-dark outline-none focus:shadow-hard rounded-lg w-64"
          />
          <span className="font-hand text-lg text-mid">{filtered.length} suscriptor{filtered.length !== 1 ? 'es' : ''}</span>
        </div>
        <button
          type="button"
          onClick={exportCSV}
          className="bg-mint text-dark border-2 border-dark font-hand text-xl px-6 py-3 cursor-pointer shadow-hard hover:-translate-y-1 transition-all rounded-lg"
        >
          ⬇️ Exportar CSV
        </button>
      </div>

      {loading ? (
        <p className="font-hand text-xl text-mid animate-pulse">Cargando suscriptores...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border-2 border-dark rounded-xl shadow-hard">
          <p className="text-5xl mb-4">📧</p>
          <p className="font-hand text-2xl text-mid">No hay suscriptores aún.</p>
        </div>
      ) : (
        <div className="bg-white border-2 border-dark rounded-xl overflow-hidden shadow-hard">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-dark bg-bg">
                <th className="text-left px-6 py-4 font-hand text-lg text-dark font-bold">Email</th>
                <th className="text-right px-6 py-4 font-hand text-lg text-dark font-bold hidden md:table-cell">Fecha</th>
                <th className="text-right px-6 py-4 font-hand text-lg text-dark font-bold hidden sm:table-cell">Fuente</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark/5">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-bg transition-colors">
                  <td className="px-6 py-4 font-hand text-lg text-dark">{s.email}</td>
                  <td className="px-6 py-4 font-hand text-base text-mid text-right hidden md:table-cell">{formatDate(s.createdAt)}</td>
                  <td className="px-6 py-4 font-hand text-base text-mid text-right hidden sm:table-cell">{s.source ?? 'homepage'}</td>
                  <td className="px-6 py-4 text-right">
                    <button type="button" onClick={() => remove(s.id, s.email)}
                      className="font-hand text-base text-mid hover:text-pink cursor-pointer border-none bg-transparent transition-colors">
                      ✕
                    </button>
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
