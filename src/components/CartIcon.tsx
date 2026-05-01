import { useStore } from '@nanostores/react';
import { cartCount } from '../store/cart';

export default function CartIcon() {
  const count = useStore(cartCount);

  return (
    <a
      href="/carrito"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: '#111111',
        color: '#4cc9a0',
        padding: '4px 10px',
        fontFamily: 'Caveat, cursive',
        fontSize: '14px',
        textDecoration: 'none',
        border: '1.5px solid #111111',
        lineHeight: 1.3,
      }}
    >
      🛒 {count}
    </a>
  );
}
