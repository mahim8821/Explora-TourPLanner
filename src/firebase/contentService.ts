import { collection, addDoc, getDocs, onSnapshot, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from './firestore';

export interface AppContent {
  id: string;
  type: string;
  title: string;
  description: string;
  coverImageUrl: string;
  mediaUrl: string;
  galleryUrls: string[];
  caption?: string;
  howToReach?: string;
  createdAt: number;
}

const CONTENT_COLLECTION = 'content';

export const subscribeToContent = (onUpdate: (content: AppContent[]) => void) => {
  const q = query(collection(db, CONTENT_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const content = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AppContent[];
    onUpdate(content);
  });
};

export const addContent = async (content: Omit<AppContent, 'id' | 'createdAt'>) => {
  return await addDoc(collection(db, CONTENT_COLLECTION), {
    ...content,
    createdAt: Date.now()
  });
};

export const deleteContent = async (id: string) => {
  await deleteDoc(doc(db, CONTENT_COLLECTION, id));
};

export const updateContent = async (id: string, content: Partial<Omit<AppContent, 'id' | 'createdAt'>>) => {
  await updateDoc(doc(db, CONTENT_COLLECTION, id), content);
};
