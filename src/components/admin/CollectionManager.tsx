import { useState, useEffect } from 'react';
import {
  getAllCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  slugify,
  type Collection,
} from '../../lib/firebase/admin-collections';

const PRESET_COLORS = [
  '#f72585', '#4cc9a0', '#111111', '#fde8f0',
  '#e0f7f0', '#ff9f1c', '#2ec4b6', '#e71d36',
];

const empty = {
  name: '', slug: '', desc: '', color: '#f72585', order: 0,
};

export default function CollectionManager() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading]         = useState(true);
  const [form, setForm]               = useState(empty);
  const [editing, setEditing]         = useState<string | null>(null);
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState<string | null>(null);
  const [showForm, setShowForm]       = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setCollections(await getAllCollections()); }
    catch (e) { console.error(e); }
    setLoading(false);
  }

  function set(field: string, value: any) {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'name' && !editing) next.slug = slugify(value);
      return next;
    });
  }

  function startEdit(col: Collection) {
    setForm({ name: col.name, slug: col.slug, desc: col.desc, color: col.color, order: col.order });
    setEditing(col.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelForm() {
    setForm(empty);
    setEditing(null);
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.slug) { alert('Nombre y slug obligatorios'); return; }
    setSaving(true);
    try {
      if (editing) {
        await updateCollection(editing, form);
      } else {
        await createCollection({ ...form, order: collections.length });
      }
      await load();
      cancelForm();
    } catch (e) {
      alert('Error al guardar');
      console.error(e);
    }
    setSaving(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar colección "${name}"? Los productos con esta colección NO se borran.`)) return;
    setDeleting(id);
    try { await deleteCollection(id); await load(); }
    catch (e) { alert('Error al eliminar'); }
    setDeleting(null);
  }

  const inputCls = "w-full px-5 py-3 font-hand text-xl border-2 border-dark bg-white text-dark outline-none focus:shadow-hard transition-all rounded-lg";

  if (loading) return (
    <div className="text-center py-20">
      <p className="text-6xl mb-4 animate-bounce">🗂️</p>
      <p className="font-hand text-2xl text-mid">Cargando colecciones...</p>
    </div>
  );

  return (
    <div className="space-y-8">

      {/* Add button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="bg-pink text-white border-2 border-dark font-hand text-xl px-8 py-4 cursor-pointer shadow-hard hover:-translate-y-1 transition-all rounded-lg"
        >
          + Nueva colección
        </button>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border-2 border-dark p-6 md:p-8 shadow-hard rounded-xl space-y-5">
          <h3 className="font-marker text-3xl text-dark">
            {editing ? 'Editar colección' : 'Nueva colección'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block font-hand text-xl text-dark mb-2 font-bold">Nombre *</label>
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="PATOCHAR" className={inputCls} required />
            </div>
            <div>
              <label className="block font-hand text-xl text-dark mb-2 font-bold">Slug (ID) *</label>
              <input type="text" value={form.slug} onChange={e => set('slug', e.target.value)}
                placeholder="patochar" className={`${inputCls} bg-bg`} required />
              <p className="font-hand text-base text-mid mt-1">Se usa en productos y URLs</p>
            </div>
          </div>

          <div>
            <label className="block font-hand text-xl text-dark mb-2 font-bold">Descripción</label>
            <input type="text" value={form.desc} onChange={e => set('desc', e.target.value)}
              placeholder="Cuando el clima es un chiste..." className={inputCls} />
          </div>

          <div>
            <label className="block font-hand text-xl text-dark mb-2 font-bold">Color</label>
            <div className="flex flex-wrap gap-3 items-center">
              {PRESET_COLORS.map(c => (
                <button key={c} type="button" onClick={() => set('color', c)}
                  className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${form.color === c ? 'border-dark shadow-hard scale-110' : 'border-dark/30'}`}
                  style={{ background: c }}
                />
              ))}
              <input type="color" value={form.color} onChange={e => set('color', e.target.value)}
                className="w-10 h-10 rounded-lg border-2 border-dark cursor-pointer"
                title="Color personalizado"
              />
              <span className="font-hand text-lg text-mid">{form.color}</span>
            </div>
            {/* Preview */}
            <div className="mt-3 flex items-center gap-3">
              <div className="px-4 py-2 border-2 border-dark font-hand text-xl rounded-lg"
                style={{ background: form.color, color: ['#fde8f0','#e0f7f0','#4cc9a0'].includes(form.color) ? '#111' : '#fff' }}>
                {form.name || 'PREVIEW'}
              </div>
              <span className="font-hand text-lg text-mid">vista previa</span>
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 bg-pink text-white border-2 border-dark font-marker text-2xl py-4 cursor-pointer shadow-hard hover:-translate-y-1 transition-all rounded-lg disabled:opacity-50">
              {saving ? 'Guardando...' : editing ? '💾 Guardar cambios' : '🚀 Crear colección'}
            </button>
            <button type="button" onClick={cancelForm}
              className="bg-white text-dark border-2 border-dark font-hand text-xl px-8 py-4 cursor-pointer shadow-hard hover:-translate-y-1 transition-all rounded-lg">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Collections list */}
      {collections.length === 0 ? (
        <div className="text-center py-16 bg-white border-2 border-dark rounded-xl shadow-hard">
          <p className="text-6xl mb-4">🗂️</p>
          <p className="font-marker text-3xl text-dark mb-2">Sin colecciones</p>
          <p className="font-hand text-2xl text-mid">Crea tu primera colección arriba.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {collections.map(col => (
            <div key={col.id}
              className="bg-white border-2 border-dark p-5 flex flex-col sm:flex-row items-center gap-5 shadow-hard rounded-xl hover:shadow-hard-lg transition-shadow">

              {/* Color band */}
              <div className="w-full sm:w-16 h-14 sm:h-16 rounded-xl border-2 border-dark shrink-0 flex items-center justify-center font-marker text-xl"
                style={{ background: col.color, color: ['#fde8f0','#e0f7f0','#4cc9a0'].includes(col.color) ? '#111' : '#fff' }}>
                {col.name.slice(0, 2)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p className="font-marker text-2xl text-dark">{col.name}</p>
                <p className="font-hand text-lg text-mid">
                  slug: <code className="bg-bg px-2 py-0.5 rounded text-dark">{col.slug}</code>
                </p>
                {col.desc && <p className="font-hand text-lg text-mid truncate">{col.desc}</p>}
              </div>

              {/* Actions */}
              <div className="flex gap-3 shrink-0">
                <button onClick={() => startEdit(col)}
                  className="bg-mint text-dark border-2 border-dark font-hand text-xl px-5 py-2 cursor-pointer shadow-hard hover:-translate-y-1 transition-all rounded-lg">
                  ✏️ Editar
                </button>
                <button onClick={() => handleDelete(col.id, col.name)}
                  disabled={deleting === col.id}
                  className="bg-white text-pink border-2 border-dark font-hand text-xl px-5 py-2 cursor-pointer shadow-hard hover:-translate-y-1 transition-all rounded-lg disabled:opacity-50">
                  {deleting === col.id ? '...' : '🗑️'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
