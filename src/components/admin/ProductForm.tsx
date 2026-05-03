import { useState, useEffect } from 'react';
import { createProduct, updateProduct, getProductById, generateSlug } from '../../lib/firebase/admin-products';
import { getAllCollections, type Collection } from '../../lib/firebase/admin-collections';
import GalleryUploader from './GalleryUploader';
import VariantManager from './VariantManager';
import type { Product, ProductVariant } from '../../data/products';

const ALL_SIZES      = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const ALL_CATEGORIES = ['camisetas', 'sudaderas', 'tazas', 'termos', 'posters', 'accesorios'];
const ALL_COLORS     = ['Negro', 'Blanco', 'Gris oscuro', 'Rojo', 'Azul', 'Verde', 'Beige'];

interface Props {
  productId?: string;
}

const emptyProduct = {
  name:            '',
  slug:            '',
  description:     '',
  longDescription: '',
  price:           0,
  originalPrice:   undefined as number | undefined,
  category:        'camisetas',
  collection:      '',
  tags:            [] as string[],
  sizes:           [] as string[],
  colors:          [] as string[],
  variants:        [] as ProductVariant[],
  images:          [] as string[],
  featured:        false,
  bestseller:      false,
  isNew:           false,
  image:           '',
};

export default function ProductForm({ productId }: Props) {
  const [form, setForm]               = useState(emptyProduct);
  const [tagInput, setTagInput]       = useState('');
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [loading, setLoading]         = useState(!!productId);
  const [activeTab, setActiveTab]     = useState<'basic' | 'variants' | 'images' | 'status'>('basic');
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    getAllCollections().then(setCollections).catch(console.error);
  }, []);

  useEffect(() => {
    if (productId) {
      getProductById(productId).then(p => {
        if (p) {
          setForm({
            name:            p.name,
            slug:            p.slug,
            description:     p.description,
            longDescription: p.longDescription,
            price:           p.price,
            originalPrice:   p.originalPrice,
            category:        p.category,
            collection:      p.collection || '',
            tags:            p.tags || [],
            sizes:           p.sizes || [],
            colors:          p.colors || [],
            variants:        p.variants || [],
            images:          p.images || (p.image ? [p.image] : []),
            featured:        p.featured,
            bestseller:      p.bestseller,
            isNew:           p.isNew || false,
            image:           p.image || '',
          });
        }
        setLoading(false);
      });
    }
  }, [productId]);

  function set(field: string, value: any) {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'name' && !productId) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
  }

  function toggleArray(field: 'sizes' | 'colors', item: string) {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item],
    }));
  }

  function addTag() {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      set('tags', [...form.tags, tag]);
    }
    setTagInput('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.price) {
      alert('Nombre y precio son obligatorios');
      return;
    }
    setSaving(true);
    try {
      const mainImage = form.images[0] || form.image || '';
      const data = {
        ...form,
        price:         Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        image:         mainImage,
        images:        form.images,
      };
      if (productId) {
        await updateProduct(productId, data);
      } else {
        await createProduct(data as Omit<Product, 'id'>);
      }
      setSaved(true);
      setTimeout(() => { window.location.href = '/admin'; }, 1200);
    } catch (e) {
      alert('Error al guardar el producto');
      console.error(e);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="text-center py-24">
        <p className="text-6xl mb-6 animate-bounce">📦</p>
        <p className="font-hand text-3xl text-mid">Cargando producto...</p>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="text-center py-24">
        <p className="text-7xl mb-6">✅</p>
        <p className="font-marker text-4xl text-dark mb-4">
          {productId ? '¡Producto actualizado!' : '¡Producto creado!'}
        </p>
        <p className="font-hand text-2xl text-mid">Redirigiendo al panel...</p>
      </div>
    );
  }

  const inputCls = "w-full px-5 py-4 font-hand text-xl border-2 border-dark bg-white text-dark outline-none focus:shadow-hard transition-all rounded-lg";
  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="block font-hand text-2xl text-dark mb-2 font-bold">{children}</label>
  );

  const tabs = [
    { id: 'basic',    label: '📝 Básico' },
    { id: 'variants', label: `🎨 Variantes ${form.variants.length > 0 ? `(${form.variants.length})` : ''}` },
    { id: 'images',   label: `🖼️ Imágenes ${form.images.length > 0 ? `(${form.images.length})` : ''}` },
    { id: 'status',   label: '⚙️ Estado' },
  ] as const;

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 border-b-2 border-dark pb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`font-hand text-xl px-6 py-2 border-2 border-dark cursor-pointer transition-all rounded-lg ${
              activeTab === tab.id
                ? 'bg-dark text-mint shadow-hard'
                : 'bg-white text-dark hover:bg-bg'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: BÁSICO ── */}
      {activeTab === 'basic' && (
        <div className="space-y-6">

          {/* Basic info */}
          <div className="bg-white border-2 border-dark p-6 md:p-8 shadow-hard rounded-xl space-y-6">
            <h3 className="font-marker text-3xl text-dark">Información básica</h3>

            <div>
              <Label>Nombre del producto *</Label>
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Ej: Camiseta See Me" className={inputCls} required />
            </div>

            <div>
              <Label>Slug (URL)</Label>
              <input type="text" value={form.slug} onChange={e => set('slug', e.target.value)}
                placeholder="camiseta-see-me" className={`${inputCls} bg-bg`} />
              <p className="font-hand text-lg text-mid mt-1">Se genera automáticamente</p>
            </div>

            <div>
              <Label>Descripción corta</Label>
              <input type="text" value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="Una frase que enganche" className={inputCls} />
            </div>

            <div>
              <Label>Descripción larga (el chiste)</Label>
              <textarea value={form.longDescription} onChange={e => set('longDescription', e.target.value)}
                placeholder="Explica el diseño, el humor, el doble sentido..." rows={4}
                className={`${inputCls} resize-y`} />
            </div>
          </div>

          {/* Price */}
          <div className="bg-white border-2 border-dark p-6 md:p-8 shadow-hard rounded-xl space-y-6">
            <h3 className="font-marker text-3xl text-dark">Precio</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label>Precio actual (€) *</Label>
                <input type="number" step="0.01" min="0" value={form.price || ''}
                  onChange={e => set('price', e.target.value)} placeholder="34.99" className={inputCls} required />
              </div>
              <div>
                <Label>Precio original (€)</Label>
                <input type="number" step="0.01" min="0" value={form.originalPrice || ''}
                  onChange={e => set('originalPrice', e.target.value || undefined)}
                  placeholder="44.99 (aparece tachado)" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Category & Collection */}
          <div className="bg-white border-2 border-dark p-6 md:p-8 shadow-hard rounded-xl space-y-6">
            <h3 className="font-marker text-3xl text-dark">Organización</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label>Categoría</Label>
                <select value={form.category} onChange={e => set('category', e.target.value)}
                  className={`${inputCls} cursor-pointer`}>
                  {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label>Colección</Label>
                <select value={form.collection} onChange={e => set('collection', e.target.value)}
                  className={`${inputCls} cursor-pointer`}>
                  <option value="">Sin colección</option>
                  {collections.map(c => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white border-2 border-dark p-6 md:p-8 shadow-hard rounded-xl space-y-4">
            <h3 className="font-marker text-3xl text-dark">Etiquetas</h3>
            <div className="flex gap-3">
              <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Añadir etiqueta y pulsar Enter..." className={`${inputCls} flex-1`} />
              <button type="button" onClick={addTag}
                className="bg-mint text-dark border-2 border-dark font-hand text-xl px-6 py-2 cursor-pointer shadow-hard rounded-lg">+</button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.tags.map(tag => (
                  <span key={tag} className="bg-light-pink text-dark font-hand text-lg px-4 py-1 border border-dark rounded-lg flex items-center gap-2">
                    {tag}
                    <button type="button" onClick={() => set('tags', form.tags.filter(t => t !== tag))}
                      className="text-pink cursor-pointer bg-transparent border-none text-xl hover:scale-125 transition-transform">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: VARIANTES ── */}
      {activeTab === 'variants' && (
        <div className="space-y-6">

          {/* Sizes & Colors first (needed for generate button) */}
          <div className="bg-white border-2 border-dark p-6 md:p-8 shadow-hard rounded-xl space-y-6">
            <h3 className="font-marker text-3xl text-dark">Tallas y Colores disponibles</h3>
            <p className="font-hand text-xl text-mid">Selecciona los que existen para este producto, luego genera las variantes abajo.</p>

            <div>
              <Label>Tallas</Label>
              <div className="flex flex-wrap gap-3">
                {ALL_SIZES.map(size => (
                  <button key={size} type="button" onClick={() => toggleArray('sizes', size)}
                    className={`font-hand text-xl px-5 py-2 border-2 border-dark cursor-pointer transition-all rounded-lg ${
                      form.sizes.includes(size) ? 'bg-pink text-white shadow-hard' : 'bg-white text-dark hover:bg-bg'
                    }`}
                  >{size}</button>
                ))}
              </div>
            </div>

            <div>
              <Label>Colores</Label>
              <div className="flex flex-wrap gap-3">
                {ALL_COLORS.map(color => (
                  <button key={color} type="button" onClick={() => toggleArray('colors', color)}
                    className={`font-hand text-xl px-5 py-2 border-2 border-dark cursor-pointer transition-all rounded-lg ${
                      form.colors.includes(color) ? 'bg-dark text-mint shadow-hard' : 'bg-white text-dark hover:bg-bg'
                    }`}
                  >{color}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Variant manager */}
          <div className="bg-white border-2 border-dark p-6 md:p-8 shadow-hard rounded-xl">
            <h3 className="font-marker text-3xl text-dark mb-6">Stock por variante</h3>
            <VariantManager
              variants={form.variants}
              sizes={form.sizes}
              colors={form.colors}
              onChange={v => set('variants', v)}
            />
          </div>
        </div>
      )}

      {/* ── TAB: IMÁGENES ── */}
      {activeTab === 'images' && (
        <div className="bg-white border-2 border-dark p-6 md:p-8 shadow-hard rounded-xl space-y-4">
          <h3 className="font-marker text-3xl text-dark">Galería de imágenes</h3>
          <p className="font-hand text-xl text-mid">
            La primera imagen es la principal. Usa las flechas para reordenar.
          </p>
          <GalleryUploader
            images={form.images}
            onChange={imgs => set('images', imgs)}
          />
        </div>
      )}

      {/* ── TAB: ESTADO ── */}
      {activeTab === 'status' && (
        <div className="bg-white border-2 border-dark p-6 md:p-8 shadow-hard rounded-xl space-y-4">
          <h3 className="font-marker text-3xl text-dark">Estado y visibilidad</h3>
          <div className="flex flex-wrap gap-4">
            {[
              { field: 'featured',   label: '⭐ Destacado',  desc: 'Aparece en la home' },
              { field: 'bestseller', label: '🔥 Bestseller', desc: 'Etiqueta TOP en tienda' },
              { field: 'isNew',      label: '🆕 Nuevo',      desc: 'Etiqueta NEW en tienda' },
            ].map(flag => (
              <label key={flag.field} className={`flex items-center gap-4 p-5 border-2 border-dark cursor-pointer transition-all rounded-xl flex-1 min-w-[200px] ${
                (form as any)[flag.field] ? 'bg-mint/20 shadow-hard' : 'bg-white hover:bg-bg'
              }`}>
                <input type="checkbox" checked={(form as any)[flag.field]}
                  onChange={e => set(flag.field, e.target.checked)}
                  className="w-6 h-6 accent-pink cursor-pointer" />
                <div>
                  <p className="font-hand text-xl text-dark font-bold">{flag.label}</p>
                  <p className="font-hand text-lg text-mid">{flag.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Submit bar — always visible */}
      <div className="flex flex-col sm:flex-row gap-4 sticky bottom-0 bg-bg pt-4 pb-2 border-t-2 border-dark">
        <button type="submit" disabled={saving}
          className="flex-1 bg-pink text-white border-2 border-dark font-marker text-3xl py-5 cursor-pointer shadow-hard hover:-translate-y-1 hover:shadow-hard-lg transition-all rounded-lg disabled:opacity-50"
        >
          {saving ? 'Guardando...' : productId ? '💾 Guardar cambios' : '🚀 Publicar producto'}
        </button>
        <a href="/admin"
          className="bg-white text-dark border-2 border-dark font-hand text-2xl px-8 py-5 no-underline text-center shadow-hard hover:-translate-y-1 transition-all rounded-lg">
          Cancelar
        </a>
      </div>
    </form>
  );
}
