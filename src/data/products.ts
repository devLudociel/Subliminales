export interface ProductVariant {
  id: string;        // e.g. "S-Negro"
  size?: string;
  color?: string;
  stock: number;
  sku?: string;
  priceOverride?: number; // if different from base price
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  longDescription: string;
  price: number;
  originalPrice?: number;
  category: string;
  collection?: string;
  tags: string[];
  sizes?: string[];
  colors?: string[];
  variants?: ProductVariant[];  // real stock per size×color combo
  images?: string[];            // gallery (first = main)
  featured: boolean;
  bestseller: boolean;
  isNew?: boolean;
  image: string;                // kept for backwards compat (= images[0])
}

export const categories = [
  { id: 'all',       name: 'Todo',       slug: '' },
  { id: 'camisetas', name: 'Camisetas',  slug: 'camisetas' },
  { id: 'sudaderas', name: 'Sudaderas',  slug: 'sudaderas' },
  { id: 'tazas',     name: 'Tazas',      slug: 'tazas' },
  { id: 'termos',    name: 'Termos',     slug: 'termos' },
  { id: 'posters',   name: 'Posters',    slug: 'posters' },
  { id: 'accesorios',name: 'Accesorios', slug: 'accesorios' },
];

export const collections = [
  { id: 'drunk-thoughts',   name: 'Drunk Thoughts Club', desc: 'Humor visual, cerveza y graffiti premium.' },
  { id: 'visual-noise',     name: 'Visual Noise',         desc: 'Sobrecarga mental, señal e interferencia.' },
  { id: 'cmyk-disorder',    name: 'CMYK Disorder',        desc: 'El error de impresion convertido en diseno.' },
  { id: 'hidden-message',   name: 'Hidden Message',       desc: 'Lo que ves no es todo.' },
  { id: 'subliminal-signal',name: 'Subliminal Signal',    desc: 'La S hipnotica como sistema visual.' },
];

// ── MOCK/FALLBACK DATA ──
export const products: Product[] = [
  {
    id: '1',
    slug: 'camiseta-drunk-thoughts-club',
    name: 'Drunk Thoughts Club',
    description: 'Oversized negra con espalda gigante, smiley derretido y humor de barra.',
    longDescription: 'Drop 01 de Drunk Thoughts Club. Grafica grande en espalda, logo pequeno delante, tinta neón y textura sticker. Una pieza de streetwear visual para cuando las ideas malas tambien tienen buen diseno.',
    price: 39.99,
    originalPrice: 49.99,
    category: 'camisetas',
    collection: 'drunk-thoughts',
    tags: ['oversized', 'dripping', 'sticker style', 'drop 01'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Negro', 'Gris oscuro'],
    featured: true,
    bestseller: true,
    isNew: false,
    images: ['/brand/3.png', '/brand/6.png'],
    image: '/brand/3.png',
  },
  {
    id: '2',
    slug: 'camiseta-visual-noise',
    name: 'Visual Noise',
    description: 'Demasiado ruido para pensar. Senal perdida, mente saturada.',
    longDescription: 'Grafica cyberpunk con glitch, barras de senal, capas de ruido y contraste neón. Diseñada para sentirse como una pantalla mental al 99% de saturacion.',
    price: 39.99,
    category: 'camisetas',
    collection: 'visual-noise',
    tags: ['glitch', 'cyberpunk', 'overload', 'signal lost'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Negro'],
    featured: true,
    bestseller: false,
    isNew: true,
    images: ['/brand/2.png'],
    image: '/brand/2.png',
  },
  {
    id: '3',
    slug: 'camiseta-cmyk-disorder',
    name: 'CMYK Disorder',
    description: 'Error de impresion, registro desalineado y caos controlado.',
    longDescription: 'La coleccion donde el fallo grafico se vuelve identidad. Separaciones cyan, magenta y amarillo, textura offset, estatua clasica intervenida y energia underground premium.',
    price: 39.99,
    originalPrice: 49.99,
    category: 'camisetas',
    collection: 'cmyk-disorder',
    tags: ['cmyk', 'offset', 'ink overflow', 'print culture'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Negro'],
    featured: true,
    bestseller: true,
    isNew: false,
    images: ['/brand/4.png'],
    image: '/brand/4.png',
  },
  {
    id: '4',
    slug: 'camiseta-hidden-message',
    name: 'Hidden Message',
    description: 'Lo que ves no es todo. Estatua, ojo y patron hipnotico.',
    longDescription: 'Una pieza mas oscura y premium: estatua clasica, ojo central, interferencias violetas y mensajes escondidos. Minimalismo tenso sin perder el caos visual.',
    price: 39.99,
    category: 'camisetas',
    collection: 'hidden-message',
    tags: ['hidden', 'hypnosis', 'violet', 'premium dark'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Negro'],
    featured: false,
    bestseller: true,
    isNew: true,
    images: ['/brand/5.png'],
    image: '/brand/5.png',
  },
  {
    id: '5',
    slug: 'poster-subliminal-signal',
    name: 'Subliminal Signal Poster',
    description: 'La S hipnotica en formato poster de laboratorio visual.',
    longDescription: 'Poster de alto impacto con sistema de iconos, warning labels, barcode, ojos, ondas y micro glitch CMYK. Pensado para pared, estudio o packaging de drop.',
    price: 29.99,
    originalPrice: 39.99,
    category: 'posters',
    collection: 'subliminal-signal',
    tags: ['poster', 'visual mind lab', 's signal', 'barcode'],
    featured: true,
    bestseller: true,
    isNew: false,
    images: ['/brand/1.png'],
    image: '/brand/1.png',
  },
  {
    id: '6',
    slug: 'poster-system-error-404',
    name: 'System Error 404',
    description: 'Motivacion no encontrada. Energia baja. Reintentar mas tarde.',
    longDescription: 'Una pieza de System Error con interfaz rota, rojos criticos y glitch horizontal. Humor oscuro para dias con bateria mental al 7%.',
    price: 29.99,
    category: 'posters',
    collection: 'visual-noise',
    tags: ['system error', '404', 'glitch', 'poster'],
    featured: false,
    bestseller: false,
    isNew: true,
    images: ['/brand/7.png'],
    image: '/brand/7.png',
  },
  {
    id: '7',
    slug: 'poster-ctrl-z',
    name: 'CTRL + Z',
    description: 'Deshacer decision. Ojala existiera en la vida real.',
    longDescription: 'Sistema Error aplicado a decisiones eliminadas, ventanas falsas y textura de teclado. Una grafica para quien piensa antes de ejecutar... o despues.',
    price: 29.99,
    originalPrice: 34.99,
    category: 'posters',
    collection: 'cmyk-disorder',
    tags: ['ctrl z', 'system error', 'decision', 'poster'],
    featured: true,
    bestseller: false,
    isNew: false,
    images: ['/brand/8.png'],
    image: '/brand/8.png',
  },
  {
    id: '8',
    slug: 'poster-loading-69',
    name: 'Loading 69%',
    description: 'Siempre atascado en el mismo punto. Desde hace demasiado.',
    longDescription: 'Poster System Error con barras de progreso, terminal emocional y una energia de loading infinito. Ruido visual para gente que funciona a medias pero con estilo.',
    price: 29.99,
    category: 'posters',
    collection: 'visual-noise',
    tags: ['loading', 'overthinking', 'terminal', 'poster'],
    featured: true,
    bestseller: true,
    isNew: false,
    images: ['/brand/9.png'],
    image: '/brand/9.png',
  },
];

// ── FIRESTORE LOADER ──
// Tries Firestore first, falls back to mock data

let _cachedProducts: Product[] | null = null;
let _cacheTime = 0;
const CACHE_TTL = 30_000; // 30 seconds cache

export async function getAllProducts(): Promise<Product[]> {
  // Simple in-memory cache to avoid hammering Firestore
  if (_cachedProducts && Date.now() - _cacheTime < CACHE_TTL) {
    return _cachedProducts;
  }

  try {
    const { db } = await import('../lib/firebase/client');
    const { collection, getDocs, query, orderBy } = await import('firebase/firestore');

    const q = query(collection(db, 'products'), orderBy('name'));
    const snapshot = await getDocs(q);
    const fbProducts: Product[] = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));

    if (fbProducts.length > 0) {
      _cachedProducts = fbProducts;
      _cacheTime = Date.now();
      return fbProducts;
    }
  } catch (error) {
    console.warn('Firestore not available, using mock data:', error);
  }

  return products; // Fallback
}

// ── HELPER FUNCTIONS (now async, reading from Firestore) ──

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const all = await getAllProducts();
  return all.find(p => p.slug === slug);
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const all = await getAllProducts();
  if (category === 'all') return all;
  return all.filter(p => p.category === category);
}

export async function getProductsByCollection(collectionId: string): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter(p => p.collection === collectionId);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter(p => p.featured);
}

export async function getBestsellers(): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter(p => p.bestseller);
}

export async function getNewProducts(): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter(p => p.isNew);
}
