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
  featured: boolean;
  bestseller: boolean;
  isNew?: boolean;
  image: string;
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
  { id: 'mind-control', name: 'Mind Control',  desc: 'Quién controla lo que piensas.' },
  { id: 'hidden-truth', name: 'Hidden Truth',  desc: 'La verdad siempre estuvo ahí.' },
  { id: 'wake-up',      name: 'Wake Up',       desc: 'Abre los ojos. Mira de nuevo.' },
  { id: 'dual-meaning', name: 'Dual Meaning',  desc: 'Dos lecturas. Un solo diseño.' },
];

export const products: Product[] = [
  {
    id: '1',
    slug: 'camiseta-see-me',
    name: 'See Me',
    description: 'A simple vista es una mancha de tinta. Tu mente lee el mensaje.',
    longDescription: 'Este diseño utiliza la psicología de la Gestalt para ocultar una frase dentro de una figura abstracta. La mayoría de personas tarda entre 3 y 15 segundos en descubrirla. ¿Cuánto tardas tú?',
    price: 34.99,
    originalPrice: 44.99,
    category: 'camisetas',
    collection: 'hidden-truth',
    tags: ['gestalt', 'ilusión óptica', 'negro', 'mensaje oculto'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Negro', 'Blanco'],
    featured: true,
    bestseller: true,
    isNew: false,
    image: '/images/camiseta-see-me.jpg',
  },
  {
    id: '2',
    slug: 'camiseta-wake-up',
    name: 'Wake Up',
    description: 'El gráfico cambia de significado según desde donde lo mires.',
    longDescription: 'Una camiseta con un diseño dual que representa tanto libertad como control dependiendo del ángulo y la distancia. Filosofía visual en algodón 100%.',
    price: 34.99,
    category: 'camisetas',
    collection: 'wake-up',
    tags: ['doble significado', 'filosófico', 'streetwear'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Negro', 'Gris oscuro'],
    featured: true,
    bestseller: false,
    isNew: true,
    image: '/images/camiseta-wake-up.jpg',
  },
  {
    id: '3',
    slug: 'sudadera-mind-control',
    name: 'Mind Control',
    description: 'El logo de la marca contiene 3 mensajes. ¿Cuántos ves?',
    longDescription: 'Sudadera oversize con el diseño estrella de la colección Mind Control. Un símbolo que a primera vista parece decorativo, pero que esconde tres mensajes distintos entrelazados en su forma.',
    price: 64.99,
    originalPrice: 79.99,
    category: 'sudaderas',
    collection: 'mind-control',
    tags: ['oversize', 'premium', 'símbolo oculto'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Negro'],
    featured: true,
    bestseller: true,
    isNew: false,
    image: '/images/sudadera-mind-control.jpg',
  },
  {
    id: '4',
    slug: 'sudadera-dual',
    name: 'Dual',
    description: 'Lee el texto. Luego vuélvelo a leer al revés. Sorpréndete.',
    longDescription: 'Una tipografía ambigrama que tiene el mismo significado leída de izquierda a derecha y de derecha a izquierda. Arte tipográfico en forma de sudadera.',
    price: 59.99,
    category: 'sudaderas',
    collection: 'dual-meaning',
    tags: ['ambigrama', 'tipografía', 'minimalista'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Negro', 'Blanco'],
    featured: false,
    bestseller: true,
    isNew: true,
    image: '/images/sudadera-dual.jpg',
  },
  {
    id: '5',
    slug: 'taza-hidden',
    name: 'Hidden — Taza',
    description: 'Fría parece normal. Con calor aparece el mensaje.',
    longDescription: 'Taza mágica termosensible: a temperatura ambiente muestra solo el logo. Al verter líquido caliente, el mensaje oculto se revela progresivamente. 350ml. Apta para lavavajillas.',
    price: 22.99,
    originalPrice: 29.99,
    category: 'tazas',
    collection: 'hidden-truth',
    tags: ['termosensible', 'mágica', 'regalo'],
    featured: true,
    bestseller: true,
    isNew: false,
    image: '/images/taza-hidden.jpg',
  },
  {
    id: '6',
    slug: 'taza-signal',
    name: 'Signal — Taza',
    description: 'Diseño con código morse que ningún algoritmo puede leer.',
    longDescription: 'Taza con un mensaje en código morse integrado en el patrón decorativo. El mensaje solo lo conoce quien sabe leerlo. 350ml en cerámica premium.',
    price: 19.99,
    category: 'tazas',
    collection: 'mind-control',
    tags: ['código morse', 'minimalista', 'cerámica'],
    featured: false,
    bestseller: false,
    isNew: true,
    image: '/images/taza-signal.jpg',
  },
  {
    id: '7',
    slug: 'termo-subliminal',
    name: 'Subliminal — Termo',
    description: 'El frío y el calor revelan mensajes distintos.',
    longDescription: 'Termo de acero inoxidable con doble mensaje termosensible. Con bebida fría aparece un texto; con bebida caliente, otro diferente. 500ml, mantiene la temperatura 12h.',
    price: 44.99,
    originalPrice: 54.99,
    category: 'termos',
    collection: 'dual-meaning',
    tags: ['termosensible', 'acero inoxidable', 'doble mensaje'],
    featured: true,
    bestseller: false,
    isNew: false,
    image: '/images/termo-subliminal.jpg',
  },
  {
    id: '8',
    slug: 'poster-hidden-truth',
    name: 'Hidden Truth — Poster',
    description: 'Un poster que cambia bajo luz UV. Tu mente, desconcertada.',
    longDescription: 'Poster A2 con tinta UV. A la luz del día parece una ilustración minimalista. Bajo luz negra, revela el mensaje completo. Impresión de alta calidad en papel 200g.',
    price: 29.99,
    originalPrice: 39.99,
    category: 'posters',
    collection: 'hidden-truth',
    tags: ['UV', 'luz negra', 'arte', 'A2'],
    featured: true,
    bestseller: true,
    isNew: false,
    image: '/images/poster-hidden-truth.jpg',
  },
];

export async function getProductsFromFirebase(): Promise<Product[]> {
  try {
    const { db } = await import('../lib/firebase/client');
    const { collection, getDocs } = await import('firebase/firestore');
    
    // Si tenemos base de datos, extraemos la colección 'products'
    const querySnapshot = await getDocs(collection(db, "products"));
    const fbProducts: Product[] = [];
    querySnapshot.forEach((doc) => {
      fbProducts.push({ id: doc.id, ...doc.data() } as Product);
    });

    if(fbProducts.length > 0) return fbProducts;
    return products; // Fallback a mock data si está vacía
  } catch (error) {
    console.error("Error cargando productos, volcando a mock data.", error);
    return products;
  }
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find(p => p.slug === slug);
}

export function getProductsByCategory(category: string): Product[] {
  if (category === 'all') return products;
  return products.filter(p => p.category === category);
}

export function getProductsByCollection(collection: string): Product[] {
  return products.filter(p => p.collection === collection);
}

export function getFeaturedProducts(): Product[] {
  return products.filter(p => p.featured);
}

export function getBestsellers(): Product[] {
  return products.filter(p => p.bestseller);
}

export function getNewProducts(): Product[] {
  return products.filter(p => p.isNew);
}
