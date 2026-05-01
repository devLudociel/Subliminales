import { useStore } from '@nanostores/react';
import { userStore, isAuthLoaded } from '../store/user';
import { auth } from '../lib/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect } from 'react';

export default function AuthButtons() {
  const user = useStore(userStore);
  const loaded = useStore(isAuthLoaded);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      userStore.set(currentUser);
      isAuthLoaded.set(true);
    });
    return () => unsubscribe();
  }, []);

  if (!loaded) {
    return <div className="w-6 h-6 animate-pulse bg-white/10 rounded-full"></div>;
  }

  return (
    <a 
      href={user ? "/perfil" : "/login"} 
      className="p-2 text-ink-muted hover:text-neon transition-colors" 
      aria-label="Cuenta"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
      </svg>
    </a>
  );
}
