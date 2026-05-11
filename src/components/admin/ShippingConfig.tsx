import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';

interface ShippingSettings {
  standardCents: number;
  expressCents: number;
  freeThresholdCents: number;
  standardLabel: string;
  expressLabel: string;
  standardDaysMin: number;
  standardDaysMax: number;
  expressDaysMin: number;
  expressDaysMax: number;
}

const DEFAULTS: ShippingSettings = {
  standardCents: 699,
  expressCents: 1499,
  freeThresholdCents: 6000,
  standardLabel: 'Envío estándar 📦',
  expressLabel: 'Envío urgente ⚡',
  standardDaysMin: 3,
  standardDaysMax: 5,
  expressDaysMin: 1,
  expressDaysMax: 2,
};

const inp = 'w-full px-4 py-3 font-hand text-xl border-2 border-dark bg-white text-dark outline-none focus:shadow-hard transition-all rounded-lg';

export default function ShippingConfig() {
  const [cfg, setCfg]     = useState<ShippingSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'config', 'shipping'));
        if (snap.exists()) setCfg({ ...DEFAULTS, ...(snap.data() as ShippingSettings) });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'config', 'shipping'), {
        ...cfg,
        updatedAt: serverTimestamp(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  function num(key: keyof ShippingSettings, label: string, helper?: string) {
    return (
      <div>
        <label className="block font-hand text-lg text-dark font-bold mb-1">{label}</label>
        {helper && <p className="font-hand text-base text-mid mb-1">{helper}</p>}
        <input
          type="number"
          min={0}
          value={(cfg[key] as number)}
          onChange={e => setCfg(p => ({ ...p, [key]: Number(e.target.value) }))}
          className={inp}
          required
        />
      </div>
    );
  }

  function txt(key: keyof ShippingSettings, label: string) {
    return (
      <div>
        <label className="block font-hand text-lg text-dark font-bold mb-1">{label}</label>
        <input
          type="text"
          value={cfg[key] as string}
          onChange={e => setCfg(p => ({ ...p, [key]: e.target.value }))}
          className={inp}
          required
        />
      </div>
    );
  }

  if (loading) return <p className="font-hand text-xl text-mid animate-pulse">Cargando configuración...</p>;

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-2xl">

      <div className="bg-white border-2 border-dark rounded-xl p-6 shadow-hard space-y-4">
        <h2 className="font-marker text-2xl text-dark mb-4">Envío gratuito</h2>
        {num('freeThresholdCents', 'Umbral envío gratis (céntimos)', 'Ej: 6000 = 60€. Introduce el valor en céntimos.')}
        <p className="font-hand text-lg text-mid">
          Actual: <strong className="text-dark">{(cfg.freeThresholdCents / 100).toFixed(2)}€</strong>
        </p>
      </div>

      <div className="bg-white border-2 border-dark rounded-xl p-6 shadow-hard space-y-4">
        <h2 className="font-marker text-2xl text-dark mb-4">Envío estándar</h2>
        {txt('standardLabel', 'Nombre visible en checkout')}
        {num('standardCents', 'Precio (céntimos)', 'Ej: 699 = 6,99€')}
        <p className="font-hand text-lg text-mid">Actual: <strong className="text-dark">{(cfg.standardCents / 100).toFixed(2)}€</strong></p>
        <div className="grid grid-cols-2 gap-4">
          {num('standardDaysMin', 'Días mínimo')}
          {num('standardDaysMax', 'Días máximo')}
        </div>
      </div>

      <div className="bg-white border-2 border-dark rounded-xl p-6 shadow-hard space-y-4">
        <h2 className="font-marker text-2xl text-dark mb-4">Envío urgente</h2>
        {txt('expressLabel', 'Nombre visible en checkout')}
        {num('expressCents', 'Precio (céntimos)', 'Ej: 1499 = 14,99€')}
        <p className="font-hand text-lg text-mid">Actual: <strong className="text-dark">{(cfg.expressCents / 100).toFixed(2)}€</strong></p>
        <div className="grid grid-cols-2 gap-4">
          {num('expressDaysMin', 'Días mínimo')}
          {num('expressDaysMax', 'Días máximo')}
        </div>
      </div>

      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
        <p className="font-hand text-lg text-yellow-800">
          ⚠️ <strong>Nota:</strong> Los cambios aquí se guardan en Firestore. El checkout usará estos valores en el próximo deploy o si lees desde Firestore en tiempo real.
          Para que el checkout los use automáticamente, el API de checkout debe leer de la colección <code className="font-mono">config/shipping</code>.
        </p>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="bg-dark text-mint border-2 border-dark font-hand text-xl px-10 py-4 cursor-pointer shadow-hard hover:-translate-y-1 transition-all rounded-lg disabled:opacity-60"
      >
        {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar configuración'}
      </button>
    </form>
  );
}
