import { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-[100]">
      <div className="max-w-4xl mx-auto surface-panel p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-hard">
        <div>
          <h3 className="font-hand text-mint uppercase tracking-[0.16em] font-bold mb-2">cookies / signal tracking</h3>
          <p className="text-mid text-sm">
            Utilizamos cookies propias y de terceros para funciones de sesión y analítica básica. Al aceptar, consientes su uso.
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <button onClick={declineCookies} className="font-hand text-xs uppercase tracking-[0.12em] px-4 py-2 text-mid hover:text-white transition-colors border border-dark">
            Rechazar
          </button>
          <button onClick={acceptCookies} className="font-hand text-xs uppercase tracking-[0.12em] px-6 py-2 bg-pink text-white font-semibold hover:bg-mint hover:text-black transition-colors border border-dark">
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
