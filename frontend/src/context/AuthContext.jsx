import { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { auth, googleProvider } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth';

const AuthContext = createContext(null);

const getApiBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const trimmedUrl = configuredUrl.replace(/\/+$/, '');

  return trimmedUrl.endsWith('/api') ? trimmedUrl : `${trimmedUrl}/api`;
};

// Setup base URL for API requests
export const API = axios.create({
  baseURL: getApiBaseUrl(),
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
  const tokenRef = useRef(token);

  // Keep tokenRef in sync with token state (avoids stale closures in interceptor)
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const setSession = (userToken, userData) => {
    localStorage.setItem('token', userToken);
    tokenRef.current = userToken;
    setToken(userToken);
    setUser(userData);
  };

  const clearSession = () => {
    localStorage.removeItem('token');
    tokenRef.current = null;
    setToken(null);
    setUser(null);
  };

  const loadProfileWithToken = async (userToken) => {
    const res = await API.get('/auth/profile', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    setSession(userToken, res.data);
    return res.data;
  };

  // Setup Axios token interceptor (only once)
  useEffect(() => {
    const interceptor = API.interceptors.request.use(
      (config) => {
        const currentToken = tokenRef.current;
        if (currentToken) {
          config.headers.Authorization = `Bearer ${currentToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    return () => API.interceptors.request.eject(interceptor);
  }, []); // Only once on mount

  // --- Firebase Auth State Listener (runs ONCE on mount) ---
  useEffect(() => {
    if (!isFirebaseConfigured) {
      // JWT fallback mode: load profile from stored token
      const loadLocalProfile = async () => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          try {
            await loadProfileWithToken(storedToken);
          } catch (error) {
            console.error('Failed to load local profile:', error.message);
            clearSession();
          }
        }
        setLoading(false);
      };
      loadLocalProfile();
      return;
    }

    // Firebase mode: listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken(true);
          // Update token in state AND ref AND localStorage
          setToken(idToken);
          tokenRef.current = idToken;
          localStorage.setItem('token', idToken);

          // Fetch full profile from backend
          const res = await API.get('/auth/profile', {
            headers: { Authorization: `Bearer ${idToken}` }
          });
          setUser(res.data);
        } catch (error) {
          console.error('Failed to load profile via Firebase:', error.message);
          if (error.response?.status === 401 || error.code === 'auth/invalid-user-token') {
            // True auth failure — sign out
            await signOut(auth);
            setUser(null);
            setToken(null);
            tokenRef.current = null;
            localStorage.removeItem('token');
          } else {
            // Network/server error (e.g. Render cold start) — show dashboard with Firebase info
            const fbUser = auth.currentUser;
            setUser({
              _id: fbUser?.uid,
              name: fbUser?.displayName || fbUser?.email?.split('@')[0],
              email: fbUser?.email,
              role: 'Admin',
            });
          }
        }
      } else {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          try {
            await loadProfileWithToken(storedToken);
          } catch (error) {
            console.error('Failed to load local profile:', error.message);
            clearSession();
          }
        } else {
          clearSession();
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // Empty deps — runs ONCE on mount, no infinite loop

  const login = async (email, password) => {
    try {
      const res = await API.post('/auth/login', { email, password });
      const { token: userToken, ...userData } = res.data;
      setSession(userToken, userData);
      return { success: true };
    } catch (apiError) {
      if (!isFirebaseConfigured) {
        return {
          success: false,
          message: apiError.response?.data?.message || 'Login failed. Please check credentials.',
        };
      }
    }

    if (isFirebaseConfigured) {
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
    }
  };

  const register = async (name, email, password) => {
    if (!name?.trim()) {
      return { success: false, message: 'Please enter your name.' };
    }

    if (password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters.' };
    }

    if (isFirebaseConfigured) {
      try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name.trim() });
        const idToken = await result.user.getIdToken(true);
        await loadProfileWithToken(idToken);
        return { success: true };
      } catch (error) {
        let message = error.message;
        if (error.code === 'auth/email-already-in-use') {
          message = 'An account already exists with this email.';
        } else if (error.code === 'auth/weak-password') {
          message = 'Password must be at least 6 characters.';
        } else if (error.code === 'auth/invalid-email') {
          message = 'Please enter a valid email address.';
        }
        return { success: false, message };
      }
    }

    try {
      const res = await API.post('/auth/register', {
        name: name.trim(),
        email,
        password,
      });
      const { token: userToken, ...userData } = res.data;
      setSession(userToken, userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Could not create account. Please try again.',
      };
    }
  };

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured) {
      return { success: false, message: 'Google Sign-In is only available when Firebase is configured.' };
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken(true);
      await loadProfileWithToken(idToken);
      return { success: true };
    } catch (error) {
      console.error('Google Sign-In error:', error.message);
      const message = error.response?.status === 401
        ? 'Google Sign-In worked, but the backend could not verify Firebase. Add FIREBASE_SERVICE_ACCOUNT_JSON to the backend environment and redeploy.'
        : error.response?.data?.message || error.message || 'Google Sign-In failed.';

      return { success: false, message };
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error('Logout error:', error.message);
      }
    }
    clearSession();
  };

  const forgotPassword = async (email) => {
    try {
      const res = await API.post('/auth/forgot-password', { email });
      return { success: true, token: res.data.token, message: res.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to submit forgot password request.' };
    }
  };

  const resetPassword = async (tokenString, password) => {
    try {
      const res = await API.post('/auth/reset-password', { token: tokenString, password });
      return { success: true, message: res.data.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to reset password.' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, loginWithGoogle, logout, forgotPassword, resetPassword, isFirebaseConfigured }}>
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
