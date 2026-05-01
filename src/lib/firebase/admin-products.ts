import { db, storage } from './client';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import type { Product } from '../../data/products';

const PRODUCTS_COLLECTION = 'products';

// ── READ ──

export async function getAllProducts(): Promise<Product[]> {
  const q = query(collection(db, PRODUCTS_COLLECTION), orderBy('name'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));
}

export async function getProductById(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, PRODUCTS_COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Product;
}

// ── CREATE ──

export async function createProduct(data: Omit<Product, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), data);
  return docRef.id;
}

// ── UPDATE ──

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  const { id: _, ...rest } = data as any;
  await updateDoc(doc(db, PRODUCTS_COLLECTION, id), rest);
}

// ── DELETE ──

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
}

// ── IMAGE UPLOAD ──

export async function uploadProductImage(file: File): Promise<string> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storageRef = ref(storage, `products/${timestamp}_${safeName}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function deleteProductImage(imageUrl: string): Promise<void> {
  try {
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);
  } catch (e) {
    console.warn('Could not delete image from storage:', e);
  }
}

// ── SLUG HELPER ──

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
