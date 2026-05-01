import { useState } from 'react';
import type { ProductVariant } from '../../data/products';

interface Props {
  variants: ProductVariant[];
  sizes: string[];
  colors: string[];
  onChange: (variants: ProductVariant[]) => void;
}

function makeId(size?: string, color?: string): string {
  return [size, color].filter(Boolean).join('-') || `v-${Date.now()}`;
}

export default function VariantManager({ variants, sizes, colors, onChange }: Props) {
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');
  const [newStock, setNewStock] = useState(0);
  const [newSku, setNewSku] = useState('');
  const [newPrice, setNewPrice] = useState('');

  const hasSizes = sizes.length > 0;
  const hasColors = colors.length > 0;

  function addVariant() {
    if (!newSize && !newColor) return;
    const id = makeId(newSize || undefined, newColor || undefined);
    if (variants.find(v => v.id === id)) {
      alert(`Variante "${id}" ya existe`);
      return;
    }
    onChange([
      ...variants,
      {
        id,
        size: newSize || undefined,
        color: newColor || undefined,
        stock: newStock,
        sku: newSku || undefined,
        priceOverride: newPrice ? Number(newPrice) : undefined,
      },
    ]);
    setNewSize('');
    setNewColor('');
    setNewStock(0);
    setNewSku('');
    setNewPrice('');
  }

  function removeVariant(id: string) {
    onChange(variants.filter(v => v.id !== id));
  }

  function updateVariant(id: string, field: keyof ProductVariant, value: any) {
    onChange(variants.map(v =>
      v.id === id ? { ...v, [field]: value } : v
    ));
  }

  function generateAll() {
    if (!hasSizes && !hasColors) return;
    const generated: ProductVariant[] = [];
    const sizeList = hasSizes ? sizes : [''];
    const colorList = hasColors ? colors : [''];
    for (const s of sizeList) {
      for (const c of colorList) {
        const id = makeId(s || undefined, c || undefined);
        if (!variants.find(v => v.id === id)) {
          generated.push({
            id,
            size: s || undefined,
            color: c || undefined,
            stock: 0,
          });
        }
      }
    }
    if (generated.length === 0) {
      alert('Todas las combinaciones ya existen');
      return;
    }
    onChange([...variants, ...generated]);
  }

  const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);

  return (
    <div className="space-y-6">

      {/* Summary */}
      <div className="flex flex-wrap gap-4">
        <div className="bg-dark text-mint border-2 border-dark px-5 py-3 shadow-hard rounded-xl">
          <p className="font-marker text-2xl">{variants.length}</p>
          <p className="font-hand text-lg">variantes</p>
        </div>
        <div className="bg-mint text-dark border-2 border-dark px-5 py-3 shadow-hard rounded-xl">
          <p className="font-marker text-2xl">{totalStock}</p>
          <p className="font-hand text-lg">stock total</p>
        </div>
        <div className="bg-pink text-white border-2 border-dark px-5 py-3 shadow-hard rounded-xl">
          <p className="font-marker text-2xl">{variants.filter(v => v.stock === 0).length}</p>
          <p className="font-hand text-lg">sin stock</p>
        </div>
      </div>

      {/* Auto-generate button */}
      {(hasSizes || hasColors) && (
        <button
          type="button"
          onClick={generateAll}
          className="bg-mint-light text-dark border-2 border-dark font-hand text-xl px-6 py-3 cursor-pointer shadow-hard hover:-translate-y-1 transition-all rounded-lg"
        >
          ⚡ Generar todas las combinaciones ({(hasSizes ? sizes.length : 1) * (hasColors ? colors.length : 1)} variantes)
        </button>
      )}

      {/* Existing variants table */}
      {variants.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-dark text-mint">
                {hasSizes && <th className="font-hand text-lg px-4 py-3 text-left border border-white/10">Talla</th>}
                {hasColors && <th className="font-hand text-lg px-4 py-3 text-left border border-white/10">Color</th>}
                <th className="font-hand text-lg px-4 py-3 text-left border border-white/10">Stock</th>
                <th className="font-hand text-lg px-4 py-3 text-left border border-white/10">SKU</th>
                <th className="font-hand text-lg px-4 py-3 text-left border border-white/10">Precio extra (€)</th>
                <th className="font-hand text-lg px-4 py-3 text-center border border-white/10">✕</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v, i) => (
                <tr
                  key={v.id}
                  className={`border-b-2 border-dark ${i % 2 === 0 ? 'bg-white' : 'bg-bg'}`}
                >
                  {hasSizes && (
                    <td className="px-4 py-3">
                      <span className="font-hand text-xl text-dark font-bold">{v.size || '—'}</span>
                    </td>
                  )}
                  {hasColors && (
                    <td className="px-4 py-3">
                      <span className="font-hand text-xl text-dark">{v.color || '—'}</span>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      value={v.stock}
                      onChange={e => updateVariant(v.id, 'stock', Number(e.target.value))}
                      className={`w-20 px-3 py-2 font-hand text-xl border-2 border-dark outline-none rounded-lg text-center ${
                        v.stock === 0 ? 'bg-pink/10 text-pink' : 'bg-white text-dark'
                      }`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={v.sku || ''}
                      onChange={e => updateVariant(v.id, 'sku', e.target.value || undefined)}
                      placeholder="opcional"
                      className="w-28 px-3 py-2 font-hand text-lg border-2 border-dark outline-none rounded-lg bg-white text-dark"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={v.priceOverride || ''}
                      onChange={e => updateVariant(v.id, 'priceOverride', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="—"
                      className="w-24 px-3 py-2 font-hand text-lg border-2 border-dark outline-none rounded-lg bg-white text-dark"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => removeVariant(v.id)}
                      className="text-pink hover:scale-125 transition-transform font-hand text-2xl bg-transparent border-none cursor-pointer"
                    >×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add variant manually */}
      <div className="bg-bg border-2 border-dashed border-dark p-5 rounded-xl space-y-4">
        <p className="font-hand text-xl text-dark font-bold">+ Añadir variante manual</p>
        <div className="flex flex-wrap gap-3 items-end">
          {hasSizes && (
            <div>
              <label className="block font-hand text-lg text-mid mb-1">Talla</label>
              <select
                value={newSize}
                onChange={e => setNewSize(e.target.value)}
                className="px-4 py-3 font-hand text-xl border-2 border-dark bg-white text-dark outline-none rounded-lg"
              >
                <option value="">— talla —</option>
                {sizes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          {hasColors && (
            <div>
              <label className="block font-hand text-lg text-mid mb-1">Color</label>
              <select
                value={newColor}
                onChange={e => setNewColor(e.target.value)}
                className="px-4 py-3 font-hand text-xl border-2 border-dark bg-white text-dark outline-none rounded-lg"
              >
                <option value="">— color —</option>
                {colors.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block font-hand text-lg text-mid mb-1">Stock</label>
            <input
              type="number"
              min="0"
              value={newStock}
              onChange={e => setNewStock(Number(e.target.value))}
              className="w-24 px-4 py-3 font-hand text-xl border-2 border-dark bg-white text-dark outline-none rounded-lg"
            />
          </div>
          <div>
            <label className="block font-hand text-lg text-mid mb-1">SKU (opcional)</label>
            <input
              type="text"
              value={newSku}
              onChange={e => setNewSku(e.target.value)}
              placeholder="SUB-001"
              className="w-28 px-4 py-3 font-hand text-xl border-2 border-dark bg-white text-dark outline-none rounded-lg"
            />
          </div>
          <div>
            <label className="block font-hand text-lg text-mid mb-1">Precio (€)</label>
            <input
              type="number"
              step="0.01"
              value={newPrice}
              onChange={e => setNewPrice(e.target.value)}
              placeholder="base"
              className="w-24 px-4 py-3 font-hand text-xl border-2 border-dark bg-white text-dark outline-none rounded-lg"
            />
          </div>
          <button
            type="button"
            onClick={addVariant}
            disabled={!newSize && !newColor}
            className="bg-pink text-white border-2 border-dark font-hand text-xl px-6 py-3 cursor-pointer shadow-hard hover:-translate-y-1 transition-all rounded-lg disabled:opacity-40"
          >
            + Añadir
          </button>
        </div>
      </div>

      {variants.length === 0 && (
        <p className="font-hand text-xl text-mid text-center py-4">
          Sin variantes aún. Selecciona tallas/colores arriba y usa "Generar combinaciones".
        </p>
      )}
    </div>
  );
}
