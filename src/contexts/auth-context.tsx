"use client";

import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { firebaseAuth } from "@/lib/firebase";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      firebaseAuth,
      (nextUser) => {
        setUser(nextUser);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Auth state error", err);
        setError(err.message);
        setLoading(false);
        setUser(null);
        // Redirect to login on auth errors
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      },
    );

    return () => unsubscribe();
  }, []);

  const signInHandler = useCallback(async () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(firebaseAuth, provider);
    } catch (err) {
      console.error("Sign-in failed", err);
      setError(
        err instanceof Error ? err.message : "Unable to sign in right now.",
      );
    }
  }, []);

  const signOutHandler = useCallback(async () => {
    setError(null);
    try {
      await signOut(firebaseAuth);
      // Redirect to login page after successful sign out
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("Sign-out failed", err);
      setError(
        err instanceof Error ? err.message : "Unable to sign out right now.",
      );
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      signIn: signInHandler,
      signOut: signOutHandler,
    }),
    [user, loading, error, signInHandler, signOutHandler],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}


