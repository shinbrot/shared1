import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  increment,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { FileRecord, UploadRateLimit } from '../types';

// Files collection operations
export const filesCollection = collection(db, 'files');
export const rateLimitsCollection = collection(db, 'upload_rate_limits');

export const getFileById = async (id: string): Promise<FileRecord | null> => {
  try {
    const fileDoc = await getDoc(doc(filesCollection, id));
    if (!fileDoc.exists()) return null;
    
    const data = fileDoc.data();
    return {
      id: fileDoc.id,
      ...data,
      created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
      expires_at: data.expires_at?.toDate?.()?.toISOString() || data.expires_at,
    } as FileRecord;
  } catch (error) {
    console.error('Error getting file:', error);
    throw error;
  }
};

export const getAllFiles = async (): Promise<FileRecord[]> => {
  try {
    const q = query(filesCollection, orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
        expires_at: data.expires_at?.toDate?.()?.toISOString() || data.expires_at,
      } as FileRecord;
    });
  } catch (error) {
    console.error('Error getting files:', error);
    throw error;
  }
};

export const createFile = async (fileData: Omit<FileRecord, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(filesCollection, {
      ...fileData,
      created_at: serverTimestamp(),
      expires_at: Timestamp.fromDate(new Date(fileData.expires_at)),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating file:', error);
    throw error;
  }
};

export const updateFileDownloadCount = async (fileId: string): Promise<void> => {
  try {
    const fileRef = doc(filesCollection, fileId);
    await updateDoc(fileRef, {
      download_count: increment(1)
    });
  } catch (error) {
    console.error('Error updating download count:', error);
    throw error;
  }
};

export const deleteFile = async (fileId: string): Promise<void> => {
  try {
    await deleteDoc(doc(filesCollection, fileId));
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// Rate limiting operations
export const getRateLimit = async (ipAddress: string): Promise<UploadRateLimit | null> => {
  try {
    const q = query(rateLimitsCollection, where('ip_address', '==', ipAddress));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return null;
    
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
    } as UploadRateLimit;
  } catch (error) {
    console.error('Error getting rate limit:', error);
    throw error;
  }
};

export const createRateLimit = async (ipAddress: string): Promise<void> => {
  try {
    await addDoc(rateLimitsCollection, {
      ip_address: ipAddress,
      upload_count: 1,
      last_upload_date: new Date().toISOString().split('T')[0],
      created_at: serverTimestamp()
    });
  } catch (error) {
    console.error('Error creating rate limit:', error);
    throw error;
  }
};

export const updateRateLimit = async (rateLimitId: string, uploadCount: number, date?: string): Promise<void> => {
  try {
    const updateData: any = { upload_count: uploadCount };
    if (date) {
      updateData.last_upload_date = date;
    }
    
    await updateDoc(doc(rateLimitsCollection, rateLimitId), updateData);
  } catch (error) {
    console.error('Error updating rate limit:', error);
    throw error;
  }
};