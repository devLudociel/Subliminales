import { useStore } from '@nanostores/react';
import { cartItems, cartTotal, cartCount, updateQuantity, removeFromCart } from '../store/cart';

export default function CartPage() {
  const items = useStore(cartItems);
  const total = useStore(cartTotal);
  const count = useStore(cartCount);

  const rotations = ['rotate(-1deg)', 'rotate(0.5deg)', 'rotate(-0.5deg)', 'rotate(1deg)'];

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ fontSize: '48px', margin: '0 0 8px' }}>🛒</p>
        <h2 style={{ fontFamily: '"Permanent Marker", cursive', fontSize: '22px', color: '#111', margin: '0 0 8px' }}>
          carrito vacío
        </h2>
        <p style={{ fontFamily: 'Caveat, cursive', fontSize: '15px', color: '#666', margin: '0 0 16px' }}>
          todavía no has añadido nada
        </p>
        <a
          href="/tienda"
          style={{ background: '#f72585', color: '#fff', border: '1.5px solid #111', fontFamily: 'Caveat, cursive', fontSize: '15px', padding: '8px 20px', textDecoration: 'none', display: 'inline-block' }}
        >
          ir a la tienda →
        </a>
      </div>
    );
  }

  const freeShipping = total >= 50;

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.map((item, i) => (
          <div
            key={item.id}
            style={{ transform: rotations[i % rotations.length], border: '1.5px solid #111', background: '#fff', padding: '10px', display: 'flex', gap: '12px', alignItems: 'center' }}
          >
            {/* Thumbnail */}
            <div style={{ width: '70px', height: '70px', border: '1.5px solid #111', background: 'repeating-linear-gradient(45deg,rgba(0,0,0,0.05) 0px,rgba(0,0,0,0.05) 1px,transparent 1px,transparent 8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '28px' }}>
              📦
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: 'Caveat, cursive', fontSize: '14px', fontWeight: 700, color: '#111', margin: '0 0 2px', lineHeight: 1.2 }}>
                {item.name}
              </p>
              <p style={{ fontFamily: 'Caveat, cursive', fontSize: '12px', color: '#666', margin: 0 }}>
                {item.price.toFixed(2)}€ c/u
              </p>
            </div>

            {/* Quantity controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                style={{ width: '24px', height: '24px', border: '1.5px solid #111', background: '#fff', fontFamily: 'Caveat, cursive', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
              >−</button>
              <span style={{ fontFamily: 'Caveat, cursive', fontSize: '14px', color: '#111', minWidth: '20px', textAlign: 'center' }}>
                {item.quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                style={{ width: '24px', height: '24px', border: '1.5px solid #111', background: '#fff', fontFamily: 'Caveat, cursive', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
              >+</button>
            </div>

            {/* Price */}
            <span style={{ fontFamily: 'Caveat, cursive', fontSize: '14px', fontWeight: 700, color: '#111', minWidth: '55px', textAlign: 'right', flexShrink: 0 }}>
              {(item.price * item.quantity).toFixed(2)}€
            </span>

            {/* Remove */}
            <button
              onClick={() => removeFromCart(item.id)}
              style={{ background: 'none', border: 'none', fontFamily: 'Caveat, cursive', fontSize: '16px', color: '#999', cursor: 'pointer', flexShrink: 0 }}
              aria-label="Eliminar"
            >×</button>
          </div>
        ))}
      </div>

      {/* Order summary */}
      <div style={{ border: '2px solid #111', background: '#fff', padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontFamily: 'Caveat, cursive', fontSize: '14px', color: '#666' }}>subtotal ({count} artículos)</span>
          <span style={{ fontFamily: 'Caveat, cursive', fontSize: '14px', color: '#111' }}>{total.toFixed(2)}€</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontFamily: 'Caveat, cursive', fontSize: '14px', color: '#666' }}>envío</span>
          <span style={{ fontFamily: 'Caveat, cursive', fontSize: '14px', color: freeShipping ? '#4cc9a0' : '#111', fontWeight: freeShipping ? 700 : 400 }}>
            {freeShipping ? 'gratis 🎉' : '4.95€'}
          </span>
        </div>
        {!freeShipping && (
          <p style={{ fontFamily: 'Caveat, cursive', fontSize: '12px', color: '#999', margin: '0 0 8px' }}>
            añade {(50 - total).toFixed(2)}€ más para envío gratis
          </p>
        )}

        <div style={{ borderTop: '1.5px dashed #111', paddingTop: '10px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontFamily: '"Permanent Marker", cursive', fontSize: '16px', color: '#111' }}>total</span>
          <span style={{ fontFamily: '"Permanent Marker", cursive', fontSize: '20px', color: '#f72585' }}>
            {(total + (freeShipping ? 0 : 4.95)).toFixed(2)}€
          </span>
        </div>
      </div>

      {/* Discount code */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          placeholder="código descuento"
          style={{ flex: 1, padding: '8px 12px', fontFamily: 'Caveat, cursive', fontSize: '14px', border: '1.5px solid #111', background: '#fff', color: '#111', outline: 'none' }}
        />
        <button style={{ background: '#111', color: '#4cc9a0', border: '1.5px solid #111', fontFamily: 'Caveat, cursive', fontSize: '14px', padding: '8px 16px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          aplicar
        </button>
      </div>

      {/* CTA */}
      <a
        href="/checkout"
        style={{ background: '#f72585', color: '#fff', border: '1.5px solid #111', fontFamily: 'Caveat, cursive', fontSize: '17px', padding: '13px 20px', textDecoration: 'none', display: 'block', textAlign: 'center' }}
      >
        finalizar compra →
      </a>
      <p style={{ fontFamily: 'Caveat, cursive', fontSize: '12px', color: '#999', textAlign: 'center', margin: 0 }}>
        Stripe · Bizum · PayPal · transferencia
      </p>
    </div>
  );
}
