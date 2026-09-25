// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Signup (returns userCredential)
  const signup = async (email, password, role = "user") => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Store role in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email,
      role,
    });

    setRole(role);
    return userCredential;
  };

  // ✅ Login (returns userCredential)
  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Fetch role from Firestore
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setRole(docSnap.data().role);
    } else {
      console.warn("No role found in Firestore for user.");
    }

    return userCredential;
  };

  // ✅ Logout
  const logout = async () => {
    await signOut(auth);
    setRole(null);
  };

  // ✅ Track auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setCurrentUser(user);
        if (user) {
          const docSnap = await getDoc(doc(db, "users", user.uid));
          if (docSnap.exists()) setRole(docSnap.data().role);
        } else {
          setRole(null);
        }
      } catch (err) {
        console.error("Error loading user profile from Firestore:", err);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    role,
    signup,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
