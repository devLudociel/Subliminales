import { atom, computed } from 'nanostores';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export const cartItems = atom<CartItem[]>([]);

export const cartCount = computed(cartItems, items =>
  items.reduce((sum, item) => sum + item.quantity, 0)
);

export const cartTotal = computed(cartItems, items =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

export function addToCart(item: Omit<CartItem, 'quantity'>) {
  const current = cartItems.get();
  const existing = current.find(i => i.id === item.id);
  if (existing) {
    cartItems.set(
      current.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
    );
  } else {
    cartItems.set([...current, { ...item, quantity: 1 }]);
  }
}

export function removeFromCart(id: string) {
  cartItems.set(cartItems.get().filter(i => i.id !== id));
}

export function updateQuantity(id: string, quantity: number) {
  if (quantity <= 0) {
    removeFromCart(id);
    return;
  }
  cartItems.set(
    cartItems.get().map(i => i.id === id ? { ...i, quantity } : i)
  );
}

export function clearCart() {
  cartItems.set([]);
}
