import { useState, useEffect } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../utils/firebase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { data: userCredential, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      // First check if any admin exists
      const adminExists = await checkAdminExists();
      if (adminExists) {
        return { 
          data: null, 
          error: { message: 'An admin user is already registered' } 
        };
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Save this user as the admin in Firestore
      await setDoc(doc(db, 'app_settings', 'admin_config'), {
        adminUserId: userCredential.user.uid,
        adminEmail: email,
        createdAt: new Date().toISOString()
      });

      return { data: userCredential, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const checkAdminExists = async (): Promise<boolean> => {
    try {
      const adminDoc = await getDoc(doc(db, 'app_settings', 'admin_config'));
      return adminDoc.exists();
    } catch (error) {
      console.error('Error checking admin existence:', error);
      return false; // Allow signup on error
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    checkAdminExists,
  };
};