import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth, ADMIN_EMAIL } from '../lib/firebase/client';

export default function UserMenu() {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);
  const containerRef          = useRef<HTMLDivElement>(null);

  useEffect(() => {
    auth.authStateReady().then(() => {
      setUser(auth.currentUser);
      setLoading(false);
    });
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleLogout() {
    setOpen(false);
    await signOut(auth);
    window.location.href = '/';
  }

  if (loading) return <div className="w-8 h-8" aria-hidden="true" />;

  if (!user) {
    return (
      <a href="/login" className="text-dark hover:text-mint transition-colors hover:scale-110" aria-label="Iniciar sesión" title="Iniciar sesión">
        <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      </a>
    );
  }

  const isAdmin = user.email === ADMIN_EMAIL;
  const avatar  = (user.displayName || user.email || '?').charAt(0).toUpperCase();

  return (
    <div ref={containerRef} className="relative z-[1000]">
      {/* Avatar button — pink ring for admin */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-9 h-9 border border-dark flex items-center justify-center font-marker text-base hover:scale-110 transition-all cursor-pointer shadow-hard ${
          isAdmin
            ? 'bg-pink text-white hover:border-white'
            : 'bg-mint text-dark hover:border-white'
        }`}
        aria-label="Mi cuenta"
        aria-expanded={open}
      >
        {avatar}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-4 w-72 max-w-[calc(100vw-1rem)] bg-bg border border-dark shadow-hard z-[1000] overflow-hidden">

          {/* User info */}
          <div className={`px-4 py-4 border-b border-dark flex items-center gap-3 ${isAdmin ? 'bg-pink/10' : 'bg-white'}`}>
            <div className={`w-10 h-10 border border-dark flex items-center justify-center font-marker text-lg shrink-0 ${isAdmin ? 'bg-pink text-white' : 'bg-mint text-dark'}`}>
              {avatar}
            </div>
            <div className="min-w-0">
              <p className="font-hand text-sm uppercase tracking-[0.12em] font-bold text-dark leading-tight truncate">
                {user.displayName || (isAdmin ? 'Admin' : 'Mi cuenta')}
              </p>
              <p className="font-hand text-xs text-mid truncate">{user.email}</p>
              {isAdmin && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-pink text-white font-hand text-[10px] uppercase tracking-[0.12em] border border-pink/50">
                  Admin
                </span>
              )}
            </div>
          </div>

          {/* ── ADMIN SECTION ── only visible to admin */}
          {isAdmin && (
            <div className="border-b border-dark/20">
              <p className="px-4 pt-3 pb-1 font-hand text-[10px] text-mint uppercase tracking-[0.18em] font-bold">Panel admin</p>
              <nav className="pb-1">
                <a href="/admin" className="flex items-center gap-3 px-4 py-2.5 font-hand text-xs uppercase tracking-[0.12em] text-dark hover:bg-pink/10 no-underline transition-colors" onClick={() => setOpen(false)}>
                  <span className="text-pink">01</span><span>Dashboard</span>
                </a>
                <a href="/admin/producto-nuevo" className="flex items-center gap-3 px-4 py-2.5 font-hand text-xs uppercase tracking-[0.12em] text-dark hover:bg-pink/10 no-underline transition-colors" onClick={() => setOpen(false)}>
                  <span className="text-pink">02</span><span>Nuevo producto</span>
                </a>
                <a href="/admin/colecciones" className="flex items-center gap-3 px-4 py-2.5 font-hand text-xs uppercase tracking-[0.12em] text-dark hover:bg-pink/10 no-underline transition-colors" onClick={() => setOpen(false)}>
                  <span className="text-pink">03</span><span>Colecciones</span>
                </a>
              </nav>
            </div>
          )}

          {/* ── CLIENT SECTION ── */}
          <nav className="py-1">
            <a href="/perfil" className="flex items-center gap-3 px-4 py-3 font-hand text-xs uppercase tracking-[0.12em] text-dark hover:bg-light-pink no-underline transition-colors border-b border-dark/10" onClick={() => setOpen(false)}>
              <span className="text-mint">01</span><span>Mis pedidos</span>
            </a>
            <a href="/perfil?tab=cuenta" className="flex items-center gap-3 px-4 py-3 font-hand text-xs uppercase tracking-[0.12em] text-dark hover:bg-light-pink no-underline transition-colors border-b border-dark/10" onClick={() => setOpen(false)}>
              <span className="text-mint">02</span><span>Mi cuenta</span>
            </a>
            <a href="/perfil?tab=seguridad" className="flex items-center gap-3 px-4 py-3 font-hand text-xs uppercase tracking-[0.12em] text-dark hover:bg-light-pink no-underline transition-colors" onClick={() => setOpen(false)}>
              <span className="text-mint">03</span><span>Seguridad</span>
            </a>
          </nav>

          {/* Logout */}
          <div className="border-t border-dark/20 py-1">
            <button type="button" onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 font-hand text-xs uppercase tracking-[0.12em] text-mid hover:text-pink hover:bg-light-pink transition-colors cursor-pointer text-left bg-transparent border-none">
              <span className="text-pink">x</span><span>Cerrar sesión</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
