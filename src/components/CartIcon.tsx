import { useStore } from '@nanostores/react';
import { cartCount, cartItems } from '../store/cart';
import { useState } from 'react';

export default function CartIcon() {
  const count = useStore(cartCount);
  const items = useStore(cartItems);
  const [open, setOpen] = useState(false);

  return (
    <div class="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        aria-label="Carrito"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-xs font-bold rounded-full flex items-center justify-center">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-dark-card border border-dark-border rounded-2xl shadow-2xl shadow-black/50 z-50">
          <div className="p-4 border-b border-dark-border">
            <h3 className="font-semibold text-white">Tu carrito ({count})</h3>
          </div>

          {items.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p>Tu carrito está vacío</p>
              <a href="/tienda" className="text-primary-400 hover:text-primary-300 text-sm mt-2 inline-block">
                Ver tienda →
              </a>
            </div>
          ) : (
            <>
              <div className="max-h-64 overflow-y-auto p-2 space-y-2 scrollbar-hide">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-primary-900/50 flex items-center justify-center shrink-0">
                      <span className="text-lg">📦</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.price.toFixed(2)}€ × {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-dark-border space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total</span>
                  <span className="font-bold text-white">
                    {items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}€
                  </span>
                </div>
                <a
                  href="/checkout"
                  className="block w-full text-center btn-primary text-sm py-2.5"
                  onClick={() => setOpen(false)}
                >
                  Finalizar compra
                </a>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
