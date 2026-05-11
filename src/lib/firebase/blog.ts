import { db } from './client';
import {
  collection, getDocs, getDoc, doc, query, orderBy, where, limit,
} from 'firebase/firestore';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image?: string;
  tags: string[];
  publishedAt: any;
  published: boolean;
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const q = query(
    collection(db, 'blog'),
    where('published', '==', true),
    orderBy('publishedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as BlogPost));
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const q = query(collection(db, 'blog'), where('slug', '==', slug), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as BlogPost;
}

export async function getRecentBlogPosts(n = 3): Promise<BlogPost[]> {
  const q = query(
    collection(db, 'blog'),
    where('published', '==', true),
    orderBy('publishedAt', 'desc'),
    limit(n)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as BlogPost));
}
