import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { cartItems, cartTotal, cartCount, removeFromCart, updateQuantity } from '../store/cart';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  province: string;
  zip: string;
}

type ShippingMethod = 'free' | 'standard' | 'express';

const empty: FormData = {
  firstName: '', lastName: '', email: '',
  address: '', city: '', province: '', zip: '',
};

const FREE_THRESHOLD = 60;
const SHIPPING_STANDARD = 6.99;
const SHIPPING_EXPRESS = 14.99;

function isCanarias(zip: string) {
  return /^(35|38)\d{3}$/.test(zip.trim());
}

export default function CheckoutForm() {
  const items  = useStore(cartItems);
  const total  = useStore(cartTotal);
  const count  = useStore(cartCount);

  const [form, setForm]           = useState<FormData>(empty);
  const [errors, setErrors]       = useState<Partial<FormData>>({});
  const [shipping, setShipping]   = useState<ShippingMethod>('standard');
  const [loading, setLoading]     = useState(false);
  const [apiError, setApiError]   = useState('');

  const freeEligible = total >= FREE_THRESHOLD;
  const canarias     = isCanarias(form.zip);

  // shipping cost based on selected method
  const shippingCost =
    shipping === 'free'     ? 0 :
    shipping === 'standard' ? SHIPPING_STANDARD :
                              SHIPPING_EXPRESS;

  const grandTotal = total + shippingCost;

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
    if (!form.address.trim())  e.address  = 'Obligatorio';
    if (!form.city.trim())     e.city     = 'Obligatorio';
    if (!form.province.trim()) e.province = 'Obligatorio';
    if (!form.zip.trim() || !/^\d{4,5}$/.test(form.zip.trim()))
      e.zip = 'CP inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    if (!validate()) return;

    // guard: can't select free if not eligible
    const finalShipping: ShippingMethod =
      shipping === 'free' && !freeEligible ? 'standard' : shipping;

    setLoading(true);
    setApiError('');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({
              id:        i.id,
              quantity:  i.quantity,
              variantId: i.variantId,
              size:      i.size,
              color:     i.color,
            })),
          shippingMethod: finalShipping,
          customer: {
            email:     form.email.trim(),
            firstName: form.firstName.trim(),
            lastName:  form.lastName.trim(),
            address:   form.address.trim(),
            city:      form.city.trim(),
            province:  form.province.trim(),
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

            {/* Shipping address */}
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
                    <label className="block font-hand text-xl text-dark mb-2 font-bold">Provincia *</label>
                    <input type="text" value={form.province} onChange={e => set('province', e.target.value)}
                      placeholder="Madrid" className={inputCls('province')} autoComplete="address-level1" />
                    <ErrorMsg field="province" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-hand text-xl text-dark mb-2 font-bold">Código Postal *</label>
                    <input type="text" value={form.zip} onChange={e => set('zip', e.target.value)}
                      placeholder="28001" className={inputCls('zip')} autoComplete="postal-code" maxLength={5} />
                    <ErrorMsg field="zip" />
                    {canarias && (
                      <p className="font-hand text-lg text-mint mt-1">🏝️ Canarias — exento de IGIC</p>
                    )}
                  </div>
                  <div className="flex items-center">
                    <div className="w-full px-5 py-4 border-2 border-dark/30 bg-bg rounded-lg">
                      <p className="font-hand text-lg text-mid">País</p>
                      <p className="font-hand text-xl text-dark font-bold">🇪🇸 España</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping method */}
            <div className="bg-white border-2 border-dark p-6 md:p-10 shadow-hard rounded-xl">
              <h2 className="font-marker text-3xl text-dark mb-6">Método de Envío</h2>
              <div className="space-y-3">

                {freeEligible && (
                  <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${shipping === 'free' ? 'border-mint bg-mint/10' : 'border-dark/30 bg-bg hover:border-dark'}`}>
                    <input type="radio" name="shipping" value="free"
                      checked={shipping === 'free'} onChange={() => setShipping('free')}
                      className="accent-pink w-5 h-5" />
                    <div className="flex-1">
                      <p className="font-hand text-xl text-dark font-bold">Envío estándar 📦</p>
                      <p className="font-hand text-lg text-mid">3-5 días laborables</p>
                    </div>
                    <span className="font-marker text-2xl text-mint">GRATIS 🎉</span>
                  </label>
                )}

                {!freeEligible && (
                  <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${shipping === 'standard' ? 'border-pink bg-pink/5' : 'border-dark/30 bg-bg hover:border-dark'}`}>
                    <input type="radio" name="shipping" value="standard"
                      checked={shipping === 'standard'} onChange={() => setShipping('standard')}
                      className="accent-pink w-5 h-5" />
                    <div className="flex-1">
                      <p className="font-hand text-xl text-dark font-bold">Envío estándar 📦</p>
                      <p className="font-hand text-lg text-mid">3-5 días laborables</p>
                      {!freeEligible && (
                        <p className="font-hand text-lg text-mint">
                          Añade {(FREE_THRESHOLD - total).toFixed(2)}€ más para envío gratis
                        </p>
                      )}
                    </div>
                    <span className="font-marker text-2xl text-dark">{SHIPPING_STANDARD.toFixed(2)}€</span>
                  </label>
                )}

                <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${shipping === 'express' ? 'border-pink bg-pink/5' : 'border-dark/30 bg-bg hover:border-dark'}`}>
                  <input type="radio" name="shipping" value="express"
                    checked={shipping === 'express'} onChange={() => setShipping('express')}
                    className="accent-pink w-5 h-5" />
                  <div className="flex-1">
                    <p className="font-hand text-xl text-dark font-bold">Envío urgente ⚡</p>
                    <p className="font-hand text-lg text-mid">24/48h laborables</p>
                  </div>
                  <span className="font-marker text-2xl text-dark">{SHIPPING_EXPRESS.toFixed(2)}€</span>
                </label>

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
                  <div key={item.cartKey} className="flex items-center gap-4 p-3 bg-bg rounded-lg border border-dark/10">
                    <div className="w-12 h-12 rounded-lg border border-dark overflow-hidden shrink-0 bg-mint-light flex items-center justify-center">
                      {item.image
                        ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        : <span className="text-2xl">📦</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-hand text-xl text-dark font-bold truncate">{item.name}</p>
                      {(item.size || item.color) && (
                        <p className="font-hand text-base text-mid">
                          {[item.size, item.color].filter(Boolean).join(' · ')}
                        </p>
                      )}
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
                  <span className={shippingCost === 0 ? 'text-mint font-bold' : 'text-dark'}>
                    {shippingCost === 0 ? 'gratis 🎉' : `${shippingCost.toFixed(2)}€`}
                  </span>
                </div>
                <div className="flex justify-between font-hand text-lg text-mid">
                  <span>Impuestos</span>
                  <span>
                    {canarias && form.zip
                      ? 'Exento IGIC (Canarias)'
                      : 'IVA incluido en precio'}
                  </span>
                </div>
                <div className="border-t-2 border-dark pt-3 flex justify-between items-baseline">
                  <span className="font-marker text-3xl text-dark">Total</span>
                  <span className="font-marker text-4xl text-pink">{grandTotal.toFixed(2)}€</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t-2 border-dark/20 flex flex-wrap gap-3 justify-center">
                <span className="font-hand text-lg text-mid flex items-center gap-1">📦 Envío España</span>
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
