import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type UserRole = 'customer' | 'provider';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  phone?: string;
  profilePicture?: string; // base64 string
  // Provider Specific Fields
  category?: string; // e.g., "Electrician"
  hourlyRate?: number;
  experience?: number; // in years
  skills?: string[];
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  rating?: number;
  completedJobs?: number;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    name: string, 
    email: string, 
    password: string, 
    role: UserRole, 
    additionalData?: Partial<UserProfile>
  ) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInMock: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Sample Islamabad provider seed data
const SEED_PROVIDERS: Partial<UserProfile>[] = [
  {
    name: 'Muhammad Asif',
    email: 'asif.elec@kaamconnect.com',
    role: 'provider',
    category: 'Electrician',
    hourlyRate: 1500,
    experience: 7,
    phone: '+923001234567',
    rating: 4.8,
    completedJobs: 42,
    location: {
      latitude: 33.640,
      longitude: 72.985,
      address: 'G-13, Islamabad'
    }
  },
  {
    name: 'Waseem Akram',
    email: 'waseem.plumb@kaamconnect.com',
    role: 'provider',
    category: 'Plumber',
    hourlyRate: 1200,
    experience: 12,
    phone: '+923129876543',
    rating: 4.9,
    completedJobs: 89,
    location: {
      latitude: 33.643,
      longitude: 72.995,
      address: 'G-13 Sector, Islamabad'
    }
  },
  {
    name: 'Sajid Mehmood',
    email: 'sajid.elec@kaamconnect.com',
    role: 'provider',
    category: 'Electrician',
    hourlyRate: 1000,
    experience: 4,
    phone: '+923335556677',
    rating: 4.5,
    completedJobs: 19,
    location: {
      latitude: 33.695,
      longitude: 73.008,
      address: 'F-10 Markaz, Islamabad'
    }
  },
  {
    name: 'Noreen Bibi',
    email: 'noreen.beauty@kaamconnect.com',
    role: 'provider',
    category: 'Beautician',
    hourlyRate: 3000,
    experience: 5,
    phone: '+923458889900',
    rating: 4.7,
    completedJobs: 31,
    location: {
      latitude: 33.691,
      longitude: 73.012,
      address: 'F-10 Sector, Islamabad'
    }
  },
  {
    name: 'Professor Kamran',
    email: 'kamran.tutor@kaamconnect.com',
    role: 'provider',
    category: 'Tutor',
    hourlyRate: 2500,
    experience: 15,
    phone: '+923214445566',
    rating: 4.9,
    completedJobs: 110,
    location: {
      latitude: 33.668,
      longitude: 73.020,
      address: 'G-11 Markaz, Islamabad'
    }
  }
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const signupInProgress = useRef(false);

  // Dynamic seeding function to populate providers if Firestore is empty
  const seedDefaultProvidersIfEmpty = async () => {
    try {
      const q = query(collection(db, 'providers'));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log("Firestore providers collection has no providers. Seeding default providers...");
        for (let i = 0; i < SEED_PROVIDERS.length; i++) {
          const providerData = SEED_PROVIDERS[i];
          const mockUid = `seed-provider-uid-${i + 1}`;
          
          const profile: UserProfile = {
            uid: mockUid,
            name: providerData.name!,
            email: providerData.email!,
            role: 'provider',
            createdAt: new Date().toISOString(),
            phone: providerData.phone,
            category: providerData.category,
            hourlyRate: providerData.hourlyRate,
            experience: providerData.experience,
            location: providerData.location,
            rating: providerData.rating,
            completedJobs: providerData.completedJobs,
            skills: [providerData.category!]
          };
          
          await setDoc(doc(db, 'providers', mockUid), profile);
        }
        console.log("Seeding completed successfully.");
      }
    } catch (e) {
      console.warn("Seeding failed: ", e);
    }
  };

  useEffect(() => {
    // Real Firebase Auth listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch profile from Firestore, checking users first, then providers
          let docRef = doc(db, 'users', firebaseUser.uid);
          let docSnap = await getDoc(docRef);
          
          if (!docSnap.exists()) {
            docRef = doc(db, 'providers', firebaseUser.uid);
            docSnap = await getDoc(docRef);
          }

          if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            setUser(profile);
            await AsyncStorage.setItem('kaamconnect_user', JSON.stringify(profile));
          } else {
            if (signupInProgress.current) {
              return;
            }
            // Fallback profile if auth exists but Firestore profile is missing
            const profile: UserProfile = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              role: 'customer',
              createdAt: new Date().toISOString()
            };
            setUser(profile);
            await AsyncStorage.setItem('kaamconnect_user', JSON.stringify(profile));
          }
        } catch (error) {
          console.error("Error fetching user profile", error);
        }
      } else {
        // Double check local storage if we were using simulated session
        const savedUser = await AsyncStorage.getItem('kaamconnect_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    // Seed database
    seedDefaultProvidersIfEmpty();

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      let docRef = doc(db, 'users', userCredential.user.uid);
      let docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        docRef = doc(db, 'providers', userCredential.user.uid);
        docSnap = await getDoc(docRef);
      }
      
      if (docSnap.exists()) {
        const profile = docSnap.data() as UserProfile;
        setUser(profile);
        await AsyncStorage.setItem('kaamconnect_user', JSON.stringify(profile));
      } else {
        throw new Error("User profile not found in database.");
      }
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    name: string, 
    email: string, 
    password: string, 
    role: UserRole,
    additionalData?: Partial<UserProfile>
  ) => {
    setLoading(true);
    signupInProgress.current = true;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const profile: UserProfile = {
        uid: userCredential.user.uid,
        name,
        email,
        role,
        createdAt: new Date().toISOString(),
        ...additionalData
      };
      
      // Save to appropriate Firestore collection
      if (role === 'provider') {
        await setDoc(doc(db, 'providers', userCredential.user.uid), profile);
      } else {
        await setDoc(doc(db, 'users', userCredential.user.uid), profile);
      }
      
      setUser(profile);
      await AsyncStorage.setItem('kaamconnect_user', JSON.stringify(profile));
    } finally {
      signupInProgress.current = false;
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const firebaseUser = result.user;

        // Fetch or create profile in Firestore
        let docRef = doc(db, 'users', firebaseUser.uid);
        let docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          const providerDocRef = doc(db, 'providers', firebaseUser.uid);
          const providerDocSnap = await getDoc(providerDocRef);
          if (providerDocSnap.exists()) {
             docRef = providerDocRef;
             docSnap = providerDocSnap;
          }
        }

        let profile: UserProfile;

        if (docSnap.exists()) {
          profile = docSnap.data() as UserProfile;
        } else {
          profile = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'Google User',
            email: firebaseUser.email || '',
            role: 'customer',
            createdAt: new Date().toISOString(),
            profilePicture: firebaseUser.photoURL || undefined
          };
          await setDoc(docRef, profile);
        }

        setUser(profile);
        await AsyncStorage.setItem('kaamconnect_user', JSON.stringify(profile));
      } else {
        // Native Google Authentication Simulation
        const simulatedGoogleUid = 'google-simulated-uid-1001';
        let docRef = doc(db, 'users', simulatedGoogleUid);
        let docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          const providerDocRef = doc(db, 'providers', simulatedGoogleUid);
          const providerDocSnap = await getDoc(providerDocRef);
          if (providerDocSnap.exists()) {
             docRef = providerDocRef;
             docSnap = providerDocSnap;
          }
        }

        let profile: UserProfile;

        if (docSnap.exists()) {
          profile = docSnap.data() as UserProfile;
        } else {
          profile = {
            uid: simulatedGoogleUid,
            name: 'Tahoor (Google Account)',
            email: 'tahoor.google@gmail.com',
            role: 'customer',
            createdAt: new Date().toISOString()
          };
          await setDoc(docRef, profile);
        }

        setUser(profile);
        await AsyncStorage.setItem('kaamconnect_user', JSON.stringify(profile));
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        // Ignore if signed out of a simulated user session
      }
      setUser(null);
      await AsyncStorage.removeItem('kaamconnect_user');
    } finally {
      setLoading(false);
    }
  };

  const signInMock = async (role: UserRole) => {
    setLoading(true);
    let mockUser: UserProfile;
    if (role === 'provider') {
      mockUser = {
        uid: 'seed-provider-uid-1', // maps to Muhammad Asif
        name: 'Muhammad Asif',
        email: 'asif.elec@kaamconnect.com',
        role: 'provider',
        category: 'Electrician',
        hourlyRate: 1500,
        experience: 7,
        phone: '+923001234567',
        rating: 4.8,
        completedJobs: 42,
        location: {
          latitude: 33.640,
          longitude: 72.985,
          address: 'G-13, Islamabad'
        },
        createdAt: new Date().toISOString()
      };
    } else {
      mockUser = {
        uid: 'mock-customer-uid-999',
        name: 'Tahoor (Customer)',
        email: 'customer@kaamconnect.com',
        role: 'customer',
        createdAt: new Date().toISOString()
      };
    }

    if (role === 'provider') {
      await setDoc(doc(db, 'providers', mockUser.uid), mockUser);
    } else {
      await setDoc(doc(db, 'users', mockUser.uid), mockUser);
    }
    
    setUser(mockUser);
    await AsyncStorage.setItem('kaamconnect_user', JSON.stringify(mockUser));
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signUp, 
      signOut, 
      signInWithGoogle, 
      signInMock 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
