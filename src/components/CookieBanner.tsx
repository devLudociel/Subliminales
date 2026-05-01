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
      <div className="max-w-4xl mx-auto bg-bg-card border border-white/10 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-black/80">
        <div>
          <h3 className="text-white font-bold mb-2">Uso de Cookies</h3>
          <p className="text-gray-400 text-sm">
            Utilizamos cookies propias y de terceros para entender cómo interactúas con nuestra tienda, para funciones de sesión y con fines analíticos. Al hacer clic en "Aceptar", consientes el uso de todas las cookies.
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <button onClick={declineCookies} className="text-sm px-4 py-2 text-gray-400 hover:text-white transition-colors">
            Rechazar
          </button>
          <button onClick={acceptCookies} className="text-sm px-6 py-2 bg-brand text-black font-semibold hover:bg-brand-light transition-colors">
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
