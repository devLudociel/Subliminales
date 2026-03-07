# Subliminal.es — Tienda de Audios Subliminales

Tienda online de audios subliminales construida con Astro, React y Tailwind CSS.

## Stack

- **Framework**: [Astro 4](https://astro.build) con SSG
- **UI**: [React](https://react.dev) para componentes interactivos
- **Estilos**: [Tailwind CSS](https://tailwindcss.com)
- **Estado**: [Nanostores](https://github.com/nanostores/nanostores) (carrito)

## Estructura

```
src/
├── components/
│   ├── Header.astro        # Navbar con carrito
│   ├── Footer.astro        # Footer con newsletter
│   ├── ProductCard.astro   # Tarjeta de producto
│   └── CartIcon.tsx        # Icono/dropdown del carrito (React)
├── data/
│   └── products.ts         # Catálogo de productos
├── layouts/
│   └── Layout.astro        # Layout base con SEO
├── pages/
│   ├── index.astro         # Página de inicio
│   ├── tienda.astro        # Catálogo filtrado por categoría
│   ├── como-funciona.astro # Explicación científica
│   ├── contacto.astro      # Formulario de contacto
│   ├── faq.astro           # Preguntas frecuentes
│   ├── checkout.astro      # Proceso de pago
│   └── producto/
│       └── [slug].astro    # Detalle de producto
├── store/
│   └── cart.ts             # Estado del carrito (nanostores)
└── styles/
    └── global.css          # Estilos globales + utilidades
```

## Comandos

```bash
npm install       # Instalar dependencias
npm run dev       # Servidor dev en localhost:4321
npm run build     # Build de producción en ./dist/
npm run preview   # Previsualizar build
```

## Categorías de Productos

- 💪 Autoestima
- 💰 Abundancia
- ❤️ Amor
- 🌿 Salud
- 🏆 Éxito
- 🧘 Paz Mental
- 🌙 Sueño

## Despliegue

Compatible con Vercel, Netlify, Cloudflare Pages y cualquier hosting estático.

```bash
npm run build
# Subir carpeta ./dist/
```
