import { useState, useRef } from 'react';
import { uploadProductImage } from '../../lib/firebase/admin-products';

interface Props {
  currentImage?: string;
  onImageUploaded: (url: string) => void;
}

export default function ImageUploader({ currentImage, onImageUploaded }: Props) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten imágenes');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no puede superar 5MB');
      return;
    }

    // Local preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    setProgress(30);
    try {
      setProgress(60);
      const url = await uploadProductImage(file);
      setProgress(100);
      onImageUploaded(url);
    } catch (e) {
      alert('Error al subir la imagen. Verifica que Firebase Storage esté activado.');
      console.error(e);
      setPreview(currentImage || null);
    }
    setTimeout(() => {
      setUploading(false);
      setProgress(0);
    }, 500);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      <div
        className={`relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-all ${
          dragOver ? 'border-pink bg-pink/5 scale-[1.02]' : 'border-dark/40 hover:border-pink'
        } ${preview ? 'aspect-square' : 'aspect-[4/3]'}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <span className="text-6xl mb-4">📷</span>
            <p className="font-hand text-2xl text-dark mb-2">Arrastra una imagen aquí</p>
            <p className="font-hand text-xl text-mid">o haz clic para seleccionar</p>
            <p className="font-hand text-lg text-mid mt-4">JPG, PNG o WebP · Máx 5MB</p>
          </div>
        )}

        {/* Upload overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-dark/80 flex flex-col items-center justify-center">
            <p className="font-hand text-2xl text-white mb-4">Subiendo imagen...</p>
            <div className="w-48 h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-mint rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />

      {preview && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setPreview(null);
            onImageUploaded('');
          }}
          className="mt-3 font-hand text-lg text-pink cursor-pointer bg-transparent border-none hover:underline"
        >
          ✕ Quitar imagen
        </button>
      )}
    </div>
  );
}
