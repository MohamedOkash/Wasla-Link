import { db } from '../../services/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  DocumentData,
  QueryConstraint,
  onSnapshot
} from 'firebase/firestore';

export class BaseRepository<T extends DocumentData> {
  constructor(protected collectionName: string) {}

  protected get col() {
    return collection(db, this.collectionName);
  }

  async findById(id: string): Promise<T | null> {
    const snap = await getDoc(doc(this.col, id));
    return snap.exists() ? (snap.data() as T) : null;
  }

  async findAll(constraints: QueryConstraint[] = []): Promise<T[]> {
    const q = query(this.col, ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as unknown as T));
  }

  async create(id: string | null, data: Partial<T>): Promise<string> {
    const ref = id ? doc(this.col, id) : doc(this.col);
    await setDoc(ref, data as any);
    return ref.id;
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    await updateDoc(doc(this.col, id), data as any);
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.col, id));
  }

  subscribeToAll(constraints: QueryConstraint[], callback: (data: T[]) => void) {
    const q = query(this.col, ...constraints);
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as unknown as T)));
    });
  }

  subscribeToDocument(id: string, callback: (data: T | null) => void) {
    return onSnapshot(doc(this.col, id), (snap) => {
      callback(snap.exists() ? (snap.data() as T) : null);
    });
  }
}
