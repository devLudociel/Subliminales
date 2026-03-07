export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  longDescription: string;
  price: number;
  originalPrice?: number;
  category: string;
  tags: string[];
  duration: string;
  format: string[];
  benefits: string[];
  featured: boolean;
  bestseller: boolean;
  image: string;
  audioPreview?: string;
}

export const categories = [
  { id: 'all', name: 'Todos', icon: '✨' },
  { id: 'autoestima', name: 'Autoestima', icon: '💪' },
  { id: 'abundancia', name: 'Abundancia', icon: '💰' },
  { id: 'amor', name: 'Amor', icon: '❤️' },
  { id: 'salud', name: 'Salud', icon: '🌿' },
  { id: 'exito', name: 'Éxito', icon: '🏆' },
  { id: 'paz', name: 'Paz Mental', icon: '🧘' },
  { id: 'sueno', name: 'Sueño', icon: '🌙' },
];

export const products: Product[] = [
  {
    id: '1',
    slug: 'autoestima-inquebrantable',
    name: 'Autoestima Inquebrantable',
    description: 'Reprograma tu mente subconsciente para desarrollar una autoestima sólida y confianza absoluta en ti mismo.',
    longDescription: 'Este poderoso audio subliminal ha sido diseñado para transformar profundamente tu relación contigo mismo. A través de afirmaciones positivas cuidadosamente formuladas, mezcladas con frecuencias binaural y música de alta vibración, este programa trabaja directamente en tu subconsciente para eliminar creencias limitantes y construir una autoestima genuina e inquebrantable.',
    price: 19.99,
    originalPrice: 39.99,
    category: 'autoestima',
    tags: ['autoestima', 'confianza', 'autoamor', 'seguridad'],
    duration: '60 min',
    format: ['MP3 320kbps', 'FLAC'],
    benefits: [
      'Aumento de la confianza en uno mismo',
      'Eliminación de creencias limitantes',
      'Mayor amor propio',
      'Mejor imagen corporal',
      'Reducción de la autocrítica',
    ],
    featured: true,
    bestseller: true,
    image: '/images/autoestima.jpg',
  },
  {
    id: '2',
    slug: 'imán-de-abundancia',
    name: 'Imán de Abundancia',
    description: 'Atrae riqueza, prosperidad y abundancia ilimitada a tu vida con este poderoso programa subliminal.',
    longDescription: 'Desbloquea tu potencial de abundancia con afirmaciones diseñadas para reprogramar tu mentalidad financiera. Este audio trabaja en tu subconsciente para eliminar bloqueos energéticos y creencias sobre el dinero, abriendo tu mente a nuevas oportunidades de prosperidad.',
    price: 24.99,
    originalPrice: 49.99,
    category: 'abundancia',
    tags: ['dinero', 'prosperidad', 'abundancia', 'riqueza'],
    duration: '60 min',
    format: ['MP3 320kbps', 'FLAC'],
    benefits: [
      'Atrae oportunidades financieras',
      'Elimina bloqueos con el dinero',
      'Desarrolla mentalidad de abundancia',
      'Aumenta la motivación para el éxito',
      'Sintoniza con la frecuencia de la prosperidad',
    ],
    featured: true,
    bestseller: true,
    image: '/images/abundancia.jpg',
  },
  {
    id: '3',
    slug: 'amor-propio-radical',
    name: 'Amor Propio Radical',
    description: 'Cultiva un amor profundo e incondicional hacia ti mismo que transforme todas tus relaciones.',
    longDescription: 'El amor propio es la base de toda felicidad. Este programa subliminal te guía para desarrollar una relación amorosa y compasiva contigo mismo, que se reflejará positivamente en todas las áreas de tu vida.',
    price: 19.99,
    category: 'amor',
    tags: ['amor propio', 'autocompasión', 'relaciones', 'felicidad'],
    duration: '45 min',
    format: ['MP3 320kbps', 'FLAC'],
    benefits: [
      'Desarrolla amor incondicional hacia ti mismo',
      'Mejora tus relaciones personales',
      'Aumenta la compasión y empatía',
      'Reduce la autocrítica destructiva',
      'Atrae relaciones más saludables',
    ],
    featured: false,
    bestseller: false,
    image: '/images/amor.jpg',
  },
  {
    id: '4',
    slug: 'cuerpo-saludable',
    name: 'Cuerpo Saludable y Vital',
    description: 'Programa tu mente para apoyar naturalmente un cuerpo sano, lleno de energía y vitalidad.',
    longDescription: 'Tu mente tiene un poder increíble sobre tu cuerpo. Este subliminal trabaja en la conexión mente-cuerpo para apoyar hábitos saludables, motivarte para el ejercicio y ayudarte a mantener un peso ideal de manera natural.',
    price: 22.99,
    originalPrice: 34.99,
    category: 'salud',
    tags: ['salud', 'bienestar', 'energía', 'cuerpo'],
    duration: '55 min',
    format: ['MP3 320kbps', 'FLAC'],
    benefits: [
      'Motiva hábitos de vida saludable',
      'Apoya la pérdida de peso natural',
      'Aumenta la energía y vitalidad',
      'Mejora la relación con la comida',
      'Fortalece el sistema inmune',
    ],
    featured: true,
    bestseller: false,
    image: '/images/salud.jpg',
  },
  {
    id: '5',
    slug: 'exito-total',
    name: 'Éxito Total',
    description: 'Desarrolla la mentalidad ganadora que necesitas para alcanzar el éxito en cada área de tu vida.',
    longDescription: 'El éxito comienza en la mente. Este programa subliminal instala patrones de pensamiento de los más exitosos, ayudándote a desarrollar determinación, resiliencia y una visión clara de tus metas.',
    price: 27.99,
    originalPrice: 54.99,
    category: 'exito',
    tags: ['éxito', 'motivación', 'metas', 'liderazgo'],
    duration: '60 min',
    format: ['MP3 320kbps', 'FLAC'],
    benefits: [
      'Desarrolla mentalidad ganadora',
      'Aumenta la determinación y perseverancia',
      'Mejora el enfoque y productividad',
      'Supera el miedo al fracaso',
      'Atrae oportunidades de éxito',
    ],
    featured: true,
    bestseller: true,
    image: '/images/exito.jpg',
  },
  {
    id: '6',
    slug: 'paz-interior',
    name: 'Paz Interior Profunda',
    description: 'Encuentra serenidad, calma y equilibrio mental en el caos del mundo moderno.',
    longDescription: 'En un mundo lleno de ruido y estrés, este subliminal te lleva a un estado de paz interior profunda. Combinando técnicas de mindfulness con afirmaciones subliminales, este audio transforma tu relación con el estrés y la ansiedad.',
    price: 17.99,
    category: 'paz',
    tags: ['paz', 'meditación', 'estrés', 'ansiedad', 'mindfulness'],
    duration: '60 min',
    format: ['MP3 320kbps', 'FLAC'],
    benefits: [
      'Reduce el estrés y la ansiedad',
      'Desarrolla ecuanimidad mental',
      'Mejora la gestión emocional',
      'Aumenta la resiliencia',
      'Promueve el bienestar general',
    ],
    featured: false,
    bestseller: false,
    image: '/images/paz.jpg',
  },
  {
    id: '7',
    slug: 'sueno-reparador',
    name: 'Sueño Reparador',
    description: 'Programa tu mente para conciliar el sueño fácilmente y despertar lleno de energía cada mañana.',
    longDescription: 'Un sueño de calidad es fundamental para tu bienestar. Este subliminal nocturno trabaja mientras duermes para mejorar la calidad de tu descanso, reducir el insomnio y despertar cada día renovado y lleno de energía.',
    price: 16.99,
    originalPrice: 29.99,
    category: 'sueno',
    tags: ['sueño', 'descanso', 'insomnio', 'relajación'],
    duration: '8 horas',
    format: ['MP3 320kbps', 'FLAC'],
    benefits: [
      'Concilia el sueño más fácilmente',
      'Mejora la calidad del sueño profundo',
      'Reduce el insomnio',
      'Despierta descansado y con energía',
      'Procesa el estrés del día mientras duermes',
    ],
    featured: false,
    bestseller: true,
    image: '/images/sueno.jpg',
  },
  {
    id: '8',
    slug: 'pack-transformacion-total',
    name: 'Pack Transformación Total',
    description: 'La colección completa de 7 subliminals para transformar cada área de tu vida. ¡El mejor valor!',
    longDescription: 'Este pack incluye todos nuestros programas subliminals más populares en una colección completa. Obtén acceso a Autoestima Inquebrantable, Imán de Abundancia, Amor Propio Radical, Cuerpo Saludable, Éxito Total, Paz Interior y Sueño Reparador, todo a un precio excepcional.',
    price: 89.99,
    originalPrice: 149.93,
    category: 'exito',
    tags: ['pack', 'colección', 'transformación', 'oferta'],
    duration: '7 audios completos',
    format: ['MP3 320kbps', 'FLAC'],
    benefits: [
      'Los 7 programas más populares',
      'Transformación integral de tu vida',
      'Ahorra más del 40%',
      'Acceso inmediato tras la compra',
      'Actualizaciones gratuitas de por vida',
    ],
    featured: true,
    bestseller: true,
    image: '/images/pack.jpg',
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find(p => p.slug === slug);
}

export function getProductsByCategory(category: string): Product[] {
  if (category === 'all') return products;
  return products.filter(p => p.category === category);
}

export function getFeaturedProducts(): Product[] {
  return products.filter(p => p.featured);
}

export function getBestsellers(): Product[] {
  return products.filter(p => p.bestseller);
}
