import { useState, useEffect } from 'react';
import {
  doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase/client';

interface Props {
  productId: string;
  productName: string;
  productSlug: string;
  productImage?: string;
  productPrice: number;
  size?: 'sm' | 'lg';
}

export default function WishlistButton({ productId, productName, productSlug, productImage, productPrice, size = 'lg' }: Props) {
  const [uid, setUid]           = useState<string | null>(null);
  const [inWishlist, setInWishlist] = useState(false);
  const [loading, setLoading]   = useState(false);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => setUid(user?.uid ?? null));
    return unsub;
  }, []);

  // Check if product is in wishlist
  useEffect(() => {
    if (!uid) { setInWishlist(false); return; }
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'wishlists', uid));
        if (snap.exists()) {
          const ids: string[] = snap.data().productIds ?? [];
          setInWishlist(ids.includes(productId));
        }
      } catch {}
    })();
  }, [uid, productId]);

  async function toggle() {
    if (!uid) {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    setLoading(true);
    try {
      const ref = doc(db, 'wishlists', uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          productIds: [productId],
          items: [{ productId, productName, productSlug, productImage: productImage ?? '', productPrice, addedAt: new Date().toISOString() }],
        });
        setInWishlist(true);
      } else if (inWishlist) {
        const items: any[] = snap.data().items ?? [];
        await updateDoc(ref, {
          productIds: arrayRemove(productId),
          items: items.filter((i: any) => i.productId !== productId),
        });
        setInWishlist(false);
      } else {
        await updateDoc(ref, {
          productIds: arrayUnion(productId),
          items: arrayUnion({ productId, productName, productSlug, productImage: productImage ?? '', productPrice, addedAt: new Date().toISOString() }),
        });
        setInWishlist(true);
      }
    } finally {
      setLoading(false);
    }
  }

  const btnBase = size === 'lg'
    ? 'flex items-center gap-2 font-hand text-xs uppercase tracking-[0.14em] border border-dark px-5 py-3 cursor-pointer shadow-hard hover:-translate-y-1 transition-all bg-white'
    : 'w-8 h-8 flex items-center justify-center cursor-pointer border border-dark bg-white shadow-hard hover:scale-110 transition-all';

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      title={inWishlist ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      className={`${btnBase} ${loading ? 'opacity-60' : ''}`}
    >
      <span className="text-pink leading-none">{inWishlist ? 'X' : '+'}</span>
      {size === 'lg' && <span>{inWishlist ? 'En favoritos' : 'Añadir a favoritos'}</span>}
    </button>
  );
}
