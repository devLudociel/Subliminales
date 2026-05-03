import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from '../lib/firebase/client';

export default function UserMenu() {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);
  const containerRef          = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // authStateReady waits until Firebase restores session from IndexedDB/localStorage
    // before subscribing — prevents false-null during init
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

  // Close on outside click
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

  // Loading — placeholder same size so layout doesn't shift
  if (loading) {
    return <div className="w-8 h-8" aria-hidden="true" />;
  }

  // Not logged in — simple icon link
  if (!user) {
    return (
      <a
        href="/login"
        className="text-white hover:text-mint transition-colors hover:scale-110"
        aria-label="Iniciar sesión"
        title="Iniciar sesión"
      >
        <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      </a>
    );
  }

  const avatar = (user.displayName || user.email || '?').charAt(0).toUpperCase();

  return (
    <div ref={containerRef} className="relative">
      {/* Avatar button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-9 h-9 bg-mint border-2 border-white/40 rounded-full flex items-center justify-center font-marker text-base text-dark hover:scale-110 hover:border-white transition-all cursor-pointer shadow-sm"
        aria-label="Mi cuenta"
        aria-expanded={open}
      >
        {avatar}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-3 w-60 bg-white border-2 border-dark rounded-xl shadow-hard z-[100] overflow-hidden">

          {/* User info header */}
          <div className="px-4 py-4 bg-bg border-b-2 border-dark/10 flex items-center gap-3">
            <div className="w-10 h-10 bg-mint border-2 border-dark rounded-full flex items-center justify-center font-marker text-lg text-dark shrink-0">
              {avatar}
            </div>
            <div className="min-w-0">
              <p className="font-hand text-lg font-bold text-dark leading-tight truncate">
                {user.displayName || 'Mi cuenta'}
              </p>
              <p className="font-hand text-sm text-mid truncate">{user.email}</p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="py-1">
            <a
              href="/perfil"
              className="flex items-center gap-3 px-4 py-3 font-hand text-xl text-dark hover:bg-bg no-underline transition-colors border-b border-dark/5"
              onClick={() => setOpen(false)}
            >
              <span className="text-2xl">📦</span>
              <span>Mis pedidos</span>
            </a>
            <a
              href="/perfil?tab=cuenta"
              className="flex items-center gap-3 px-4 py-3 font-hand text-xl text-dark hover:bg-bg no-underline transition-colors border-b border-dark/5"
              onClick={() => setOpen(false)}
            >
              <span className="text-2xl">👤</span>
              <span>Mi cuenta</span>
            </a>
            <a
              href="/perfil?tab=seguridad"
              className="flex items-center gap-3 px-4 py-3 font-hand text-xl text-dark hover:bg-bg no-underline transition-colors"
              onClick={() => setOpen(false)}
            >
              <span className="text-2xl">🔒</span>
              <span>Seguridad</span>
            </a>
          </nav>

          {/* Logout */}
          <div className="border-t-2 border-dark/10 py-1">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 font-hand text-xl text-mid hover:text-pink hover:bg-bg transition-colors cursor-pointer text-left bg-transparent border-none"
            >
              <span className="text-2xl">👋</span>
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
