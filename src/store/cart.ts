import { atom, computed } from 'nanostores';

export interface CartItem {
  id: string;         // product ID
  cartKey: string;    // unique dedup key: "productId:size:color"
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
  variantId?: string;
}

const STORAGE_KEY = 'subliminal_cart';

function loadCart(): CartItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const items: CartItem[] = raw ? JSON.parse(raw) : [];
    // Migrate old items that don't have cartKey
    return items.map(i => ({
      ...i,
      cartKey: i.cartKey ?? makeCartKey(i.id, i.size, i.color),
    }));
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function makeCartKey(id: string, size?: string, color?: string): string {
  return [id, size ?? '', color ?? ''].join(':');
}

export const cartItems = atom<CartItem[]>(loadCart());

cartItems.subscribe(saveCart);

export const cartCount = computed(cartItems, items =>
  items.reduce((sum, item) => sum + item.quantity, 0)
);

export const cartTotal = computed(cartItems, items =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

export function addToCart(
  item: Omit<CartItem, 'quantity' | 'cartKey'>
) {
  const cartKey = makeCartKey(item.id, item.size, item.color);
  const current = cartItems.get();
  const existing = current.find(i => i.cartKey === cartKey);
  if (existing) {
    cartItems.set(
      current.map(i => i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i)
    );
  } else {
    cartItems.set([...current, { ...item, cartKey, quantity: 1 }]);
  }
}

export function removeFromCart(cartKey: string) {
  cartItems.set(cartItems.get().filter(i => i.cartKey !== cartKey));
}

export function updateQuantity(cartKey: string, quantity: number) {
  if (quantity <= 0) {
    removeFromCart(cartKey);
    return;
  }
  cartItems.set(
    cartItems.get().map(i => i.cartKey === cartKey ? { ...i, quantity } : i)
  );
}

export function clearCart() {
  cartItems.set([]);
}
