import { db } from './client';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';

export interface Collection {
  id: string;
  name: string;   // display: "PATOCHAR"
  slug: string;   // URL/ID: "patochar"
  desc: string;
  color: string;  // hex: "#f72585"
  order: number;
}

const COL = 'collections';

export async function getAllCollections(): Promise<Collection[]> {
  const q = query(collection(db, COL), orderBy('order'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Collection));
}

export async function createCollection(data: Omit<Collection, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, COL), data);
  return ref.id;
}

export async function updateCollection(id: string, data: Partial<Omit<Collection, 'id'>>): Promise<void> {
  await updateDoc(doc(db, COL, id), data);
}

export async function deleteCollection(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
