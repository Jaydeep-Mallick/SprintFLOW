import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { auth, googleProvider } from '../config/firebase';
import { signInWithEmailAndPassword, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext(null);

// Setup base URL for API requests
export const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
});

// Check if Firebase is actually configured with live credentials
export const isFirebaseConfigured = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_API_KEY !== 'mock-api-key' &&
  import.meta.env.VITE_FIREBASE_API_KEY !== ''
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Setup Axios token interceptor
  useEffect(() => {
    const interceptor = API.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    return () => {
      API.interceptors.request.eject(interceptor);
    };
  }, [token]);

  // Monitor Authentication State (Firebase vs Custom JWT Fallback)
  useEffect(() => {
    if (!isFirebaseConfigured) {
      // --- Fallback Local Custom JWT Mode ---
      const loadLocalProfile = async () => {
        if (token) {
          try {
            const res = await API.get('/auth/profile');
            setUser(res.data);
          } catch (error) {
            console.error('Failed to load local profile:', error.message);
            // Clear bad/expired token
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          }
        }
        setLoading(false);
      };
      loadLocalProfile();
      return;
    }

    // --- Active Firebase Auth Mode ---
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken(true);
          setToken(idToken);
          localStorage.setItem('token', idToken);
          
          // Request user profile from backend using the Firebase ID token
          const res = await API.get('/auth/profile', {
            headers: { Authorization: `Bearer ${idToken}` }
          });
          setUser(res.data);
        } catch (error) {
          console.error('Failed to load profile via Firebase:', error.message);
          signOut(auth);
          setUser(null);
          setToken(null);
          localStorage.removeItem('token');
        }
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [token]);

  const login = async (email, password) => {
    if (isFirebaseConfigured) {
      // Firebase Sign-In
      try {
        await signInWithEmailAndPassword(auth, email, password);
        return { success: true };
      } catch (error) {
        let message = error.message;
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          message = 'Login failed. Please check credentials.';
        }
        return { success: false, message };
      }
    } else {
      // Fallback Custom JWT Sign-In
      try {
        const res = await API.post('/auth/login', { email, password });
        const { token: userToken, ...userData } = res.data;
        
        localStorage.setItem('token', userToken);
        setToken(userToken);
        setUser(userData);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Login failed. Please check credentials.',
        };
      }
    }
  };

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured) {
      return { success: false, message: 'Google Sign-In is only available when Firebase is configured.' };
    }

    try {
      await signInWithPopup(auth, googleProvider);
      return { success: true };
    } catch (error) {
      console.error('Google Sign-In error:', error.message);
      return {
        success: false,
        message: error.message || 'Google Sign-In failed.',
      };
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error('Logout error:', error.message);
      }
    } else {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  };

  const forgotPassword = async (email) => {
    try {
      const res = await API.post('/auth/forgot-password', { email });
      return { success: true, token: res.data.token, message: res.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to submit forgot password request.',
      };
    }
  };

  const resetPassword = async (tokenString, password) => {
    try {
      const res = await API.post('/auth/reset-password', { token: tokenString, password });
      return { success: true, message: res.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to reset password.',
      };
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, loginWithGoogle, logout, forgotPassword, resetPassword, isFirebaseConfigured }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
