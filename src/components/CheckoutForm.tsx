import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { cartItems, cartTotal, cartCount, clearCart } from '../store/cart';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  zip: string;
}

const empty: FormData = {
  firstName: '', lastName: '', email: '',
  address: '', city: '', zip: '',
};

export default function CheckoutForm() {
  const items   = useStore(cartItems);
  const total   = useStore(cartTotal);
  const count   = useStore(cartCount);
  const [form, setForm]       = useState<FormData>(empty);
  const [errors, setErrors]   = useState<Partial<FormData>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const freeShipping = total >= 50;
  const shipping     = freeShipping ? 0 : 4.95;
  const grandTotal   = total + shipping;

  function set(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<FormData> = {};
    if (!form.firstName.trim()) e.firstName = 'Obligatorio';
    if (!form.lastName.trim())  e.lastName  = 'Obligatorio';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Email inválido';
    if (!form.address.trim()) e.address = 'Obligatorio';
    if (!form.city.trim())    e.city    = 'Obligatorio';
    if (!form.zip.trim() || !/^\d{4,5}$/.test(form.zip.trim()))
      e.zip = 'CP inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    if (!validate()) return;

    setLoading(true);
    setApiError('');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({ id: i.id, quantity: i.quantity })),
          customer: {
            email:     form.email.trim(),
            firstName: form.firstName.trim(),
            lastName:  form.lastName.trim(),
            address:   form.address.trim(),
            city:      form.city.trim(),
            zip:       form.zip.trim(),
          },
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        setApiError(data.error ?? 'Error al procesar el pago. Inténtalo de nuevo.');
        setLoading(false);
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch {
      setApiError('Error de conexión. Inténtalo de nuevo.');
      setLoading(false);
    }
  }

  const inputCls = (field: keyof FormData) =>
    `w-full px-5 py-4 font-hand text-xl border-2 ${errors[field] ? 'border-pink bg-pink/5' : 'border-dark bg-bg'} text-dark outline-none focus:bg-white focus:shadow-hard transition-all rounded-lg`;

  const ErrorMsg = ({ field }: { field: keyof FormData }) =>
    errors[field] ? <p className="font-hand text-lg text-pink mt-1">{errors[field]}</p> : null;

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-24">
        <p className="text-8xl mb-6">🛒</p>
        <h2 className="font-marker text-4xl text-dark mb-4">Carrito vacío</h2>
        <p className="font-hand text-2xl text-mid mb-10">No hay nada que pagar.</p>
        <a href="/tienda" className="bg-pink text-white border-2 border-dark font-hand text-2xl px-10 py-4 no-underline inline-block shadow-hard hover:-translate-y-1 transition-all rounded-lg">
          ir a la tienda →
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">

          {/* ── LEFT: FORM ── */}
          <div className="lg:col-span-3 space-y-8">

            {/* Contact */}
            <div className="bg-white border-2 border-dark p-6 md:p-10 shadow-hard rounded-xl">
              <h2 className="font-marker text-3xl text-dark mb-6">Información de Contacto</h2>
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-hand text-xl text-dark mb-2 font-bold">Nombre *</label>
                    <input type="text" value={form.firstName} onChange={e => set('firstName', e.target.value)}
                      placeholder="Juan" className={inputCls('firstName')} autoComplete="given-name" />
                    <ErrorMsg field="firstName" />
                  </div>
                  <div>
                    <label className="block font-hand text-xl text-dark mb-2 font-bold">Apellidos *</label>
                    <input type="text" value={form.lastName} onChange={e => set('lastName', e.target.value)}
                      placeholder="García" className={inputCls('lastName')} autoComplete="family-name" />
                    <ErrorMsg field="lastName" />
                  </div>
                </div>
                <div>
                  <label className="block font-hand text-xl text-dark mb-2 font-bold">Email *</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="juan@email.com" className={inputCls('email')} autoComplete="email" />
                  <ErrorMsg field="email" />
                  <p className="font-hand text-lg text-mid mt-1">Aquí te enviaremos la confirmación</p>
                </div>
              </div>
            </div>

            {/* Shipping */}
            <div className="bg-white border-2 border-dark p-6 md:p-10 shadow-hard rounded-xl">
              <h2 className="font-marker text-3xl text-dark mb-6">Dirección de Envío</h2>
              <div className="space-y-5">
                <div>
                  <label className="block font-hand text-xl text-dark mb-2 font-bold">Dirección *</label>
                  <input type="text" value={form.address} onChange={e => set('address', e.target.value)}
                    placeholder="Calle Ejemplo 123, Piso 2" className={inputCls('address')} autoComplete="street-address" />
                  <ErrorMsg field="address" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-hand text-xl text-dark mb-2 font-bold">Ciudad *</label>
                    <input type="text" value={form.city} onChange={e => set('city', e.target.value)}
                      placeholder="Madrid" className={inputCls('city')} autoComplete="address-level2" />
                    <ErrorMsg field="city" />
                  </div>
                  <div>
                    <label className="block font-hand text-xl text-dark mb-2 font-bold">Código Postal *</label>
                    <input type="text" value={form.zip} onChange={e => set('zip', e.target.value)}
                      placeholder="28001" className={inputCls('zip')} autoComplete="postal-code" maxLength={5} />
                    <ErrorMsg field="zip" />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment method info */}
            <div className="bg-white border-2 border-dark p-6 md:p-10 shadow-hard rounded-xl">
              <h2 className="font-marker text-3xl text-dark mb-4">Método de Pago</h2>
              <div className="p-6 border-2 border-dark bg-mint-light text-center rounded-xl">
                <span className="text-5xl mb-4 block">🔒</span>
                <h3 className="font-marker text-2xl text-dark mb-2">Pago Seguro con Stripe</h3>
                <p className="font-hand text-xl text-mid">
                  Serás redirigido a la pasarela de Stripe. Aceptamos tarjeta, Bizum y PayPal.
                  Tus datos nunca pasan por nuestros servidores.
                </p>
              </div>
            </div>

            {/* API error */}
            {apiError && (
              <div className="bg-pink/10 border-2 border-pink p-4 rounded-xl">
                <p className="font-hand text-xl text-pink font-bold">⚠️ {apiError}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-dark text-mint border-2 border-dark font-hand text-3xl py-5 cursor-pointer shadow-hard hover:-translate-y-1 hover:shadow-hard-lg transition-all rounded-lg flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {loading ? (
                <>
                  <span className="animate-spin text-2xl">⏳</span> Conectando con Stripe...
                </>
              ) : (
                <>🔒 Pagar {grandTotal.toFixed(2)}€ de forma segura</>
              )}
            </button>

            <p className="text-center font-hand text-lg text-mid">
              Encriptación SSL · PCI DSS compliant · Datos nunca almacenados en nuestro servidor
            </p>
          </div>

          {/* ── RIGHT: ORDER SUMMARY ── */}
          <div className="lg:col-span-2">
            <div className="bg-white border-2 border-dark p-6 md:p-8 shadow-hard sticky top-24 rounded-xl">
              <h2 className="font-marker text-3xl text-dark mb-6">
                Resumen ({count} {count === 1 ? 'artículo' : 'artículos'})
              </h2>

              <div className="space-y-4 mb-6 max-h-72 overflow-y-auto pr-1">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-bg rounded-lg border border-dark/10">
                    <div className="w-12 h-12 rounded-lg border border-dark overflow-hidden shrink-0 bg-mint-light flex items-center justify-center">
                      {item.image
                        ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        : <span className="text-2xl">📦</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-hand text-xl text-dark font-bold truncate">{item.name}</p>
                      <p className="font-hand text-lg text-mid">×{item.quantity}</p>
                    </div>
                    <span className="font-hand text-xl font-bold text-dark shrink-0">
                      {(item.price * item.quantity).toFixed(2)}€
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-dark pt-4 space-y-3">
                <div className="flex justify-between font-hand text-xl">
                  <span className="text-mid">Subtotal</span>
                  <span className="text-dark font-bold">{total.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between font-hand text-xl">
                  <span className="text-mid">Envío</span>
                  <span className={freeShipping ? 'text-mint font-bold' : 'text-dark'}>
                    {freeShipping ? 'gratis 🎉' : '4.95€'}
                  </span>
                </div>
                {!freeShipping && (
                  <p className="font-hand text-lg text-mid">
                    Añade {(50 - total).toFixed(2)}€ más para envío gratis
                  </p>
                )}
                <div className="flex justify-between font-hand text-lg text-mid">
                  <span>IVA</span>
                  <span>incluido en el precio</span>
                </div>
                <div className="border-t-2 border-dark pt-3 flex justify-between items-baseline">
                  <span className="font-marker text-3xl text-dark">Total</span>
                  <span className="font-marker text-4xl text-pink">{grandTotal.toFixed(2)}€</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t-2 border-dark/20 flex flex-wrap gap-3 justify-center">
                <span className="font-hand text-lg text-mid flex items-center gap-1">📦 24/48h</span>
                <span className="font-hand text-lg text-mid flex items-center gap-1">✅ 30 días devolución</span>
                <span className="font-hand text-lg text-mid flex items-center gap-1">🔒 Pago seguro</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
