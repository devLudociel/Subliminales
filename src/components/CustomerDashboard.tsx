import { useState, useEffect } from 'react';
import {
  onAuthStateChanged, signOut, updatePassword,
  EmailAuthProvider, reauthenticateWithCredential,
  type User,
} from 'firebase/auth';
import {
  collection, query, where, orderBy, getDocs,
  doc, getDoc, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase/client';

// ── Types ────────────────────────────────────────────────────────────────────

interface Order {
  id: string;
  stripeSessionId: string;
  paymentStatus: string;
  amountTotal: number;
  currency: string;
  createdAt: any;
  shippingMethod: string;
  taxNote: string;
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
  }>;
}

interface UserProfile {
  displayName: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  zip: string;
}

type Tab = 'pedidos' | 'cuenta' | 'seguridad';

// ── Helpers ──────────────────────────────────────────────────────────────────

function shortId(id: string) {
  return id.replace('cs_', '').replace('test_', '').slice(0, 10).toUpperCase();
}

function formatDate(ts: any): string {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function shippingLabel(method: string) {
  if (method === 'express') return '⚡ Urgente 24/48h';
  if (method === 'free')    return '🎉 Envío gratis';
  return '📦 Estándar 3-5 días';
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const paid = status === 'paid';
  return (
    <span className={`font-hand text-lg px-3 py-0.5 border-2 rounded-full ${
      paid ? 'border-mint bg-mint/10 text-dark' : 'border-pink bg-pink/10 text-pink'
    }`}>
      {paid ? '✓ Pagado' : '⏳ Pendiente'}
    </span>
  );
}

function OrderCard({ order, onExpand, expanded }: {
  order: Order; onExpand: () => void; expanded: boolean;
}) {
  return (
    <div className="border-2 border-dark bg-white rounded-xl shadow-hard overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={onExpand}
        className="w-full flex items-center justify-between p-5 hover:bg-bg transition-colors text-left"
      >
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-marker text-xl text-dark">#{shortId(order.stripeSessionId)}</span>
          <StatusBadge status={order.paymentStatus} />
          <span className="font-hand text-lg text-mid">{formatDate(order.createdAt)}</span>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className="font-marker text-2xl text-pink">{order.amountTotal.toFixed(2)}€</span>
          <span className="text-mid font-hand text-xl">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Detail */}
      {expanded && (
        <div className="border-t-2 border-dark/10 p-5 space-y-5 bg-bg">
          {/* Items */}
          <div>
            <p className="font-hand text-lg text-mid font-bold mb-2 uppercase tracking-wide">Artículos</p>
            <div className="space-y-2">
              {order.items.map((item, i) => {
                const variantParts = [item.size, item.color].filter(Boolean);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xl">📦</span>
                    <span className="font-hand text-xl text-dark">
                      {item.productId}
                      {variantParts.length > 0 && (
                        <span className="text-mid"> — {variantParts.join(' / ')}</span>
                      )}
                    </span>
                    <span className="font-hand text-lg text-mid ml-auto">×{item.quantity}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shipping */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="font-hand text-lg text-mid font-bold mb-1 uppercase tracking-wide">Envío</p>
              <p className="font-hand text-xl text-dark">{shippingLabel(order.shippingMethod)}</p>
              <p className="font-hand text-lg text-mid">{order.taxNote}</p>
            </div>
            <div>
              <p className="font-hand text-lg text-mid font-bold mb-1 uppercase tracking-wide">Dirección</p>
              <p className="font-hand text-xl text-dark">{order.customer.address}</p>
              <p className="font-hand text-lg text-mid">
                {[order.customer.zip, order.customer.city, order.customer.province]
                  .filter(Boolean).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CustomerDashboard() {
  const [user, setUser]           = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab]             = useState<Tab>('pedidos');

  // Orders state
  const [orders, setOrders]       = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Profile state
  const [profile, setProfile]     = useState<UserProfile>({
    displayName: '', phone: '', address: '', city: '', province: '', zip: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved]   = useState(false);

  // Security state
  const [pwForm, setPwForm]       = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError]     = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  // ── Auth listener ──────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      // ALWAYS set authLoading=false first — prevents redirect during session restore
      setAuthLoading(false);

      if (!u) {
        window.location.href = '/login';
        return;
      }
      setUser(u);

      // Load profile from Firestore
      try {
        const snap = await getDoc(doc(db, 'users', u.uid));
        if (snap.exists()) {
          const data = snap.data() as Partial<UserProfile>;
          setProfile(prev => ({ ...prev, ...data }));
        } else {
          setProfile(prev => ({ ...prev, displayName: u.displayName ?? '' }));
        }
      } catch {}
    });
    return unsub;
  }, []);

  // ── Load orders when tab changes ───────────────────────────────────────────
  useEffect(() => {
    if (tab !== 'pedidos' || !user) return;
    loadOrders();
  }, [tab, user]);

  async function loadOrders() {
    if (!user) return;
    setOrdersLoading(true);

    const sortDesc = (a: Order, b: Order) => {
      const ta = a.createdAt?.toDate?.() ?? new Date(0);
      const tb = b.createdAt?.toDate?.() ?? new Date(0);
      return tb.getTime() - ta.getTime();
    };

    // Merge results from both queries, dedupe by id
    const seen = new Set<string>();
    let allOrders: Order[] = [];

    const runQuery = async (field: string, value: string) => {
      try {
        const snap = await getDocs(
          query(collection(db, 'orders'), where(field, '==', value))
        );
        snap.docs.forEach(d => {
          if (!seen.has(d.id)) {
            seen.add(d.id);
            allOrders.push({ id: d.id, ...d.data() } as Order);
          }
        });
      } catch (err) {
        console.warn(`[Orders] query ${field} failed:`, err);
      }
    };

    // Query by UID (most reliable — linked at checkout)
    await runQuery('userUid', user.uid);
    // Query by email as fallback (catches guest checkouts with same email)
    if (user.email) await runQuery('customer.email', user.email.toLowerCase());

    setOrders(allOrders.sort(sortDesc));
    setOrdersLoading(false);
  }

  // ── Save profile ───────────────────────────────────────────────────────────
  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setProfileSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...profile,
        email: user.email,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setProfileSaving(false);
    }
  }

  // ── Change password ────────────────────────────────────────────────────────
  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);
    if (pwForm.next !== pwForm.confirm) {
      setPwError('Las contraseñas nuevas no coinciden');
      return;
    }
    if (pwForm.next.length < 6) {
      setPwError('Mínimo 6 caracteres');
      return;
    }
    if (!user?.email) return;
    setPwLoading(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, pwForm.current);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, pwForm.next);
      setPwSuccess(true);
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPwError('Contraseña actual incorrecta');
      } else {
        setPwError('Error al cambiar contraseña. Inténtalo de nuevo.');
      }
    } finally {
      setPwLoading(false);
    }
  }

  async function handleLogout() {
    await signOut(auth);
    window.location.href = '/';
  }

  // ── Render guards ──────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="font-hand text-2xl text-mid animate-pulse">Cargando...</p>
      </div>
    );
  }
  if (!user) return null;

  const avatar = (user.displayName || user.email || '?').charAt(0).toUpperCase();
  const isGoogleUser = user.providerData.some(p => p.providerId === 'google.com');

  // ── Input style helper ─────────────────────────────────────────────────────
  const inp = 'w-full px-4 py-3 font-hand text-xl border-2 border-dark bg-bg text-dark outline-none focus:bg-white focus:shadow-hard transition-all rounded-lg';

  // ── TABS ───────────────────────────────────────────────────────────────────
  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'pedidos',   label: 'Mis Pedidos',  icon: '📦' },
    { key: 'cuenta',    label: 'Mi Cuenta',    icon: '👤' },
    { key: 'seguridad', label: 'Seguridad',    icon: '🔒' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 mb-10 pb-8 border-b-2 border-dark">
        <div className="w-20 h-20 bg-mint border-2 border-dark rounded-full flex items-center justify-center font-marker text-4xl text-dark shadow-hard shrink-0">
          {avatar}
        </div>
        <div className="text-center sm:text-left">
          <h1 className="font-marker text-4xl md:text-5xl text-dark leading-none">
            {profile.displayName || user.displayName || 'Mi Cuenta'}
          </h1>
          <p className="font-hand text-xl text-mid mt-1">{user.email}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* ── Sidebar nav ── */}
        <nav className="lg:w-56 shrink-0 flex flex-row lg:flex-col gap-2">
          {tabs.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-3 px-5 py-3 font-hand text-xl border-2 rounded-xl transition-all cursor-pointer text-left ${
                tab === t.key
                  ? 'border-pink bg-pink text-white shadow-hard'
                  : 'border-dark bg-white text-dark hover:bg-bg shadow-hard'
              }`}
            >
              <span className="text-2xl">{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 px-5 py-3 font-hand text-xl border-2 border-dark/30 rounded-xl text-mid hover:border-pink hover:text-pink transition-all cursor-pointer mt-auto lg:mt-4 text-left"
          >
            <span className="text-2xl">👋</span>
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </nav>

        {/* ── Content ── */}
        <div className="flex-1 min-w-0">

          {/* ════ PEDIDOS ════ */}
          {tab === 'pedidos' && (
            <div>
              <h2 className="font-marker text-3xl text-dark mb-6">Mis Pedidos</h2>

              {ordersLoading && (
                <p className="font-hand text-xl text-mid animate-pulse">Cargando pedidos...</p>
              )}

              {!ordersLoading && orders.length === 0 && (
                <div className="bg-white border-2 border-dark p-8 rounded-xl shadow-hard text-center">
                  <p className="text-6xl mb-4">📭</p>
                  <p className="font-hand text-2xl text-mid mb-6">Aún no tienes pedidos.</p>
                  <a href="/tienda" className="bg-pink text-white border-2 border-dark font-hand text-xl px-8 py-3 no-underline inline-block shadow-hard hover:-translate-y-1 transition-all rounded-lg">
                    Ir a la tienda →
                  </a>
                </div>
              )}

              {!ordersLoading && orders.length > 0 && (
                <div className="space-y-4">
                  {orders.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      expanded={expandedOrder === order.id}
                      onExpand={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════ MI CUENTA ════ */}
          {tab === 'cuenta' && (
            <div>
              <h2 className="font-marker text-3xl text-dark mb-6">Mi Cuenta</h2>
              <form onSubmit={saveProfile} className="space-y-6">

                {/* Personal info */}
                <div className="bg-white border-2 border-dark p-6 rounded-xl shadow-hard">
                  <h3 className="font-marker text-2xl text-dark mb-5">Datos personales</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block font-hand text-xl text-dark mb-1 font-bold">Nombre completo</label>
                      <input type="text" value={profile.displayName}
                        onChange={e => setProfile(p => ({ ...p, displayName: e.target.value }))}
                        placeholder="Tu nombre" className={inp} />
                    </div>
                    <div>
                      <label className="block font-hand text-xl text-dark mb-1 font-bold">Email</label>
                      <input type="email" value={user.email ?? ''} disabled
                        className={`${inp} opacity-60 cursor-not-allowed`} />
                      <p className="font-hand text-base text-mid mt-1">El email no se puede cambiar</p>
                    </div>
                    <div>
                      <label className="block font-hand text-xl text-dark mb-1 font-bold">Teléfono</label>
                      <input type="tel" value={profile.phone}
                        onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                        placeholder="+34 600 000 000" className={inp} />
                    </div>
                  </div>
                </div>

                {/* Default shipping address */}
                <div className="bg-white border-2 border-dark p-6 rounded-xl shadow-hard">
                  <h3 className="font-marker text-2xl text-dark mb-2">Dirección de envío por defecto</h3>
                  <p className="font-hand text-lg text-mid mb-5">Se pre-rellena automáticamente en el checkout</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block font-hand text-xl text-dark mb-1 font-bold">Dirección</label>
                      <input type="text" value={profile.address}
                        onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
                        placeholder="Calle Ejemplo 123, Piso 2" className={inp} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-hand text-xl text-dark mb-1 font-bold">Ciudad</label>
                        <input type="text" value={profile.city}
                          onChange={e => setProfile(p => ({ ...p, city: e.target.value }))}
                          placeholder="Madrid" className={inp} />
                      </div>
                      <div>
                        <label className="block font-hand text-xl text-dark mb-1 font-bold">Provincia</label>
                        <input type="text" value={profile.province}
                          onChange={e => setProfile(p => ({ ...p, province: e.target.value }))}
                          placeholder="Madrid" className={inp} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-hand text-xl text-dark mb-1 font-bold">Código Postal</label>
                        <input type="text" value={profile.zip}
                          onChange={e => setProfile(p => ({ ...p, zip: e.target.value }))}
                          placeholder="28001" className={inp} maxLength={5} />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={profileSaving}
                  className="w-full bg-dark text-mint border-2 border-dark font-hand text-2xl py-4 cursor-pointer shadow-hard hover:-translate-y-1 transition-all rounded-lg disabled:opacity-60"
                >
                  {profileSaving ? 'Guardando...' : profileSaved ? '✓ Guardado' : 'Guardar cambios'}
                </button>
              </form>
            </div>
          )}

          {/* ════ SEGURIDAD ════ */}
          {tab === 'seguridad' && (
            <div className="space-y-6">
              <h2 className="font-marker text-3xl text-dark mb-6">Seguridad</h2>

              {isGoogleUser ? (
                <div className="bg-white border-2 border-dark p-6 rounded-xl shadow-hard">
                  <h3 className="font-marker text-2xl text-dark mb-3">Contraseña</h3>
                  <p className="font-hand text-xl text-mid">
                    Tu cuenta está vinculada con Google. La contraseña se gestiona desde tu cuenta de Google.
                  </p>
                </div>
              ) : (
                <div className="bg-white border-2 border-dark p-6 rounded-xl shadow-hard">
                  <h3 className="font-marker text-2xl text-dark mb-5">Cambiar contraseña</h3>
                  <form onSubmit={changePassword} className="space-y-4">
                    <div>
                      <label className="block font-hand text-xl text-dark mb-1 font-bold">Contraseña actual</label>
                      <input type="password" value={pwForm.current}
                        onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                        placeholder="••••••••" className={inp} required />
                    </div>
                    <div>
                      <label className="block font-hand text-xl text-dark mb-1 font-bold">Nueva contraseña</label>
                      <input type="password" value={pwForm.next}
                        onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))}
                        placeholder="Mínimo 6 caracteres" className={inp} required />
                    </div>
                    <div>
                      <label className="block font-hand text-xl text-dark mb-1 font-bold">Confirmar nueva contraseña</label>
                      <input type="password" value={pwForm.confirm}
                        onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                        placeholder="Repite la contraseña" className={inp} required />
                    </div>
                    {pwError && (
                      <p className="font-hand text-xl text-pink">⚠️ {pwError}</p>
                    )}
                    {pwSuccess && (
                      <p className="font-hand text-xl text-mint">✓ Contraseña cambiada correctamente</p>
                    )}
                    <button
                      type="submit"
                      disabled={pwLoading}
                      className="w-full bg-dark text-mint border-2 border-dark font-hand text-2xl py-4 cursor-pointer shadow-hard hover:-translate-y-1 transition-all rounded-lg disabled:opacity-60"
                    >
                      {pwLoading ? 'Cambiando...' : 'Cambiar contraseña'}
                    </button>
                  </form>
                </div>
              )}

              {/* Danger zone */}
              <div className="bg-white border-2 border-dark p-6 rounded-xl shadow-hard">
                <h3 className="font-marker text-2xl text-dark mb-3">Sesión</h3>
                <p className="font-hand text-xl text-mid mb-4">
                  Cerrar sesión en este dispositivo.
                </p>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="bg-pink text-white border-2 border-dark font-hand text-xl px-8 py-3 cursor-pointer shadow-hard hover:-translate-y-1 transition-all rounded-lg"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
