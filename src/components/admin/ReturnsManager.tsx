import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';

interface Return {
  id: string;
  orderId: string;
  reasonLabel: string;
  details?: string;
  userEmail?: string;
  status: 'pendiente' | 'aprobada' | 'rechazada' | 'completada';
  createdAt: any;
}

const STATUS_COLORS: Record<string, string> = {
  pendiente:  'bg-yellow-50 border-yellow-300 text-yellow-700',
  aprobada:   'bg-green-50 border-green-300 text-green-700',
  rechazada:  'bg-red-50 border-red-200 text-red-700',
  completada: 'bg-blue-50 border-blue-200 text-blue-700',
};

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function shortId(id: string) {
  return id.replace('cs_', '').replace('test_', '').slice(0, 10).toUpperCase();
}

export default function ReturnsManager() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'returns'), orderBy('createdAt', 'desc')));
      setReturns(snap.docs.map(d => ({ id: d.id, ...d.data() } as Return)));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: string) {
    await updateDoc(doc(db, 'returns', id), { status });
    await load();
  }

  return (
    <div>
      {loading ? (
        <p className="font-hand text-xl text-mid animate-pulse">Cargando devoluciones...</p>
      ) : returns.length === 0 ? (
        <div className="text-center py-16 bg-white border-2 border-dark rounded-xl shadow-hard">
          <p className="text-5xl mb-4">↩️</p>
          <p className="font-hand text-2xl text-mid">No hay solicitudes de devolución.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {returns.map(r => (
            <div key={r.id} className="bg-white border-2 border-dark rounded-xl p-5 shadow-hard">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div>
                  <p className="font-hand text-xl text-dark font-bold">#{shortId(r.orderId)}</p>
                  <p className="font-hand text-lg text-mid">{r.userEmail ?? 'Usuario no autenticado'}</p>
                  <p className="font-hand text-lg text-dark mt-1"><strong>Motivo:</strong> {r.reasonLabel}</p>
                  {r.details && <p className="font-hand text-base text-mid mt-1 italic">"{r.details}"</p>}
                  <p className="font-hand text-base text-mid mt-1">{formatDate(r.createdAt)}</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <span className={`font-hand text-base px-3 py-1 border rounded-full text-center ${STATUS_COLORS[r.status] ?? 'bg-bg border-dark text-dark'}`}>
                    {r.status}
                  </span>
                  <select
                    value={r.status}
                    onChange={e => updateStatus(r.id, e.target.value)}
                    className="font-hand text-base border-2 border-dark px-3 py-1 rounded-lg cursor-pointer bg-white"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="aprobada">Aprobada</option>
                    <option value="rechazada">Rechazada</option>
                    <option value="completada">Completada</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
