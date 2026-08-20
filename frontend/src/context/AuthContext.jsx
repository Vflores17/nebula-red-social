import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase";
import { getById as getUserById } from "../services/userService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setUserProfile(null);

      try {
        if (firebaseUser) {
          const profileDocument = await getUserById(firebaseUser.uid);
          const profileData = profileDocument?.data();

          // Compatibilidad con usuarios existentes, creados cuando el campo se llamaba `rol`.
          setUserProfile(profileData ? {
            ...profileData,
            role: profileData.role ?? profileData.rol ?? "user",
          } : null);
        }
      } catch (error) {
        console.error("Error al cargar el perfil autenticado:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
