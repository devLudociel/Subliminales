import { useStore } from '@nanostores/react';
import { cartItems, cartTotal, cartCount, updateQuantity, removeFromCart } from '../store/cart';

const FREE_THRESHOLD = 60;

export default function CartPage() {
  const items = useStore(cartItems);
  const total = useStore(cartTotal);
  const count = useStore(cartCount);

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-24 md:py-32">
        <p className="text-8xl mb-6">🛒</p>
        <h2 className="font-marker text-4xl md:text-5xl text-dark mb-4">
          carrito vacío
        </h2>
        <p className="font-hand text-2xl md:text-3xl text-mid mb-10">
          todavía no has añadido nada. ¡Hora de explorar!
        </p>
        <a
          href="/tienda"
          className="bg-pink text-white border-2 border-dark font-hand text-2xl px-10 py-4 no-underline inline-block shadow-hard hover:-translate-y-1 transition-all rounded-lg"
        >
          ir a la tienda →
        </a>
      </div>
    );
  }

  const freeShipping = total >= FREE_THRESHOLD;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex flex-col gap-8">

      {/* Items */}
      <div className="flex flex-col gap-6">
        {items.map((item) => (
          <div
            key={item.cartKey}
            className="border-2 border-dark bg-white p-5 md:p-6 flex flex-col sm:flex-row gap-5 items-center shadow-hard rounded-xl"
          >
            {/* Thumbnail */}
            <div className="w-20 h-20 md:w-24 md:h-24 border-2 border-dark bg-bg flex items-center justify-center shrink-0 rounded-lg overflow-hidden">
              {item.image
                ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                : <span className="text-4xl md:text-5xl">📦</span>
              }
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <p className="font-hand text-2xl md:text-3xl font-bold text-dark mb-1 leading-tight">
                {item.name}
              </p>
              {/* Variant badges */}
              {(item.size || item.color) && (
                <div className="flex gap-2 flex-wrap justify-center sm:justify-start mb-1">
                  {item.size && (
                    <span className="font-hand text-lg px-3 py-0.5 border-2 border-dark bg-bg rounded-full text-dark font-bold">
                      {item.size}
                    </span>
                  )}
                  {item.color && (
                    <span className="font-hand text-lg px-3 py-0.5 border-2 border-dark bg-bg rounded-full text-dark">
                      {item.color}
                    </span>
                  )}
                </div>
              )}
              <p className="font-hand text-xl md:text-2xl text-mid">
                {item.price.toFixed(2)}€ c/u
              </p>
            </div>

            {/* Quantity controls */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                className="w-10 h-10 md:w-12 md:h-12 border-2 border-dark bg-white font-hand text-2xl cursor-pointer flex items-center justify-center p-0 shadow-hard hover:bg-bg transition-colors rounded-lg"
              >−</button>
              <span className="font-hand text-2xl md:text-3xl text-dark min-w-[30px] text-center font-bold">
                {item.quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                className="w-10 h-10 md:w-12 md:h-12 border-2 border-dark bg-white font-hand text-2xl cursor-pointer flex items-center justify-center p-0 shadow-hard hover:bg-bg transition-colors rounded-lg"
              >+</button>
            </div>

            {/* Price */}
            <span className="font-marker text-2xl md:text-3xl text-dark min-w-[80px] text-right shrink-0">
              {(item.price * item.quantity).toFixed(2)}€
            </span>

            {/* Remove */}
            <button
              onClick={() => removeFromCart(item.cartKey)}
              className="bg-none border-2 border-dark/20 font-hand text-2xl text-mid cursor-pointer shrink-0 hover:text-pink hover:border-pink transition-colors w-10 h-10 rounded-full flex items-center justify-center"
              aria-label="Eliminar"
            >×</button>
          </div>
        ))}
      </div>

      {/* Order summary */}
      <div className="border-2 border-dark bg-white p-6 md:p-8 shadow-hard rounded-xl">
        <div className="flex justify-between mb-4">
          <span className="font-hand text-2xl text-mid">subtotal ({count} artículos)</span>
          <span className="font-hand text-2xl text-dark font-bold">{total.toFixed(2)}€</span>
        </div>
        <div className="flex justify-between mb-4">
          <span className="font-hand text-2xl text-mid">envío</span>
          <span className={`font-hand text-2xl ${freeShipping ? 'text-mint font-bold' : 'text-dark'}`}>
            {freeShipping ? 'gratis 🎉' : 'desde 6.99€'}
          </span>
        </div>
        {!freeShipping && (
          <p className="font-hand text-xl text-mid mb-4">
            añade {(FREE_THRESHOLD - total).toFixed(2)}€ más para envío gratis
          </p>
        )}

        <div className="border-t-2 border-dashed border-dark pt-5 mt-2 flex justify-between items-baseline">
          <span className="font-marker text-3xl text-dark">total</span>
          <span className="font-marker text-4xl text-pink">
            {total.toFixed(2)}€
          </span>
        </div>
        <p className="font-hand text-lg text-mid mt-1 text-right">+ envío (se calcula al pagar)</p>
      </div>

      {/* CTA */}
      <a
        href="/checkout"
        className="bg-pink text-white border-2 border-dark font-hand text-3xl py-5 no-underline block text-center shadow-hard hover:-translate-y-1 hover:shadow-hard-lg transition-all rounded-lg"
      >
        finalizar compra →
      </a>
      <p className="font-hand text-xl text-mid text-center m-0">
        Stripe · Bizum · PayPal · transferencia
      </p>
    </div>
  );
}
