import { useState, useRef } from 'react';
import { uploadProductImage } from '../../lib/firebase/admin-products';

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
}

export default function GalleryUploader({ images, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList) {
    const valid = Array.from(files).filter(f => {
      if (!f.type.startsWith('image/')) { alert(`${f.name}: solo imágenes`); return false; }
      if (f.size > 5 * 1024 * 1024) { alert(`${f.name}: máximo 5MB`); return false; }
      return true;
    });
    if (!valid.length) return;

    setUploading(true);
    const urls: string[] = [];
    for (const file of valid) {
      try {
        const url = await uploadProductImage(file);
        urls.push(url);
      } catch (e) {
        alert(`Error subiendo ${file.name}`);
      }
    }
    onChange([...images, ...urls]);
    setUploading(false);
  }

  function remove(idx: number) {
    onChange(images.filter((_, i) => i !== idx));
  }

  function moveLeft(idx: number) {
    if (idx === 0) return;
    const next = [...images];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChange(next);
  }

  function moveRight(idx: number) {
    if (idx === images.length - 1) return;
    const next = [...images];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onChange(next);
  }

  return (
    <div className="space-y-4">

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {images.map((url, idx) => (
            <div key={url + idx} className="relative group">
              <img
                src={url}
                alt={`Imagen ${idx + 1}`}
                className={`w-28 h-28 md:w-36 md:h-36 object-cover border-2 rounded-lg ${idx === 0 ? 'border-pink shadow-hard' : 'border-dark'}`}
              />
              {idx === 0 && (
                <span className="absolute -top-2 -left-2 bg-pink text-white font-hand text-sm px-2 py-0.5 border border-dark rounded shadow-hard">
                  principal
                </span>
              )}
              {/* Controls */}
              <div className="absolute inset-0 bg-dark/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-2">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveLeft(idx)}
                    disabled={idx === 0}
                    className="bg-white text-dark font-hand text-lg w-8 h-8 border border-dark rounded cursor-pointer disabled:opacity-30 hover:bg-mint transition-colors"
                    title="Mover izquierda"
                  >←</button>
                  <button
                    type="button"
                    onClick={() => moveRight(idx)}
                    disabled={idx === images.length - 1}
                    className="bg-white text-dark font-hand text-lg w-8 h-8 border border-dark rounded cursor-pointer disabled:opacity-30 hover:bg-mint transition-colors"
                    title="Mover derecha"
                  >→</button>
                </div>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="bg-pink text-white font-hand text-lg px-3 py-1 border border-dark rounded cursor-pointer hover:scale-105 transition-transform"
                >
                  ✕ Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-xl cursor-pointer transition-all p-8 text-center ${
          dragOver ? 'border-pink bg-pink/5 scale-[1.01]' : 'border-dark/40 hover:border-pink hover:bg-bg'
        } ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileRef.current?.click()}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <span className="text-4xl animate-bounce">📤</span>
            <p className="font-hand text-2xl text-dark">Subiendo imágenes...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="text-4xl">🖼️</span>
            <p className="font-hand text-2xl text-dark">Arrastra imágenes o haz clic</p>
            <p className="font-hand text-xl text-mid">Puedes subir varias a la vez · JPG, PNG, WebP · Máx 5MB c/u</p>
            {images.length === 0 && <p className="font-hand text-lg text-pink mt-2">La primera imagen será la principal</p>}
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => e.target.files && handleFiles(e.target.files)}
      />
    </div>
  );
}
