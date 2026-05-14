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
        background: '#050505',
        color: '#00D9FF',
        padding: '7px 11px',
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: '12px',
        fontWeight: 700,
        letterSpacing: '.08em',
        textTransform: 'uppercase',
        textDecoration: 'none',
        border: '1.5px solid rgba(245,245,245,.72)',
        lineHeight: 1.3,
        boxShadow: '2px 2px 0 #FF008C',
      }}
    >
      cart/{count}
    </a>
  );
}
