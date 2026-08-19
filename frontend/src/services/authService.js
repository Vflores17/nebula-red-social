import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth, db } from "../config/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

export const registerUser = async (nombrePlaneta, email, password) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = userCredential.user;

  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    nombrePlaneta: nombrePlaneta.trim(),
    correo: user.email,
    biografia: "",
    ubicacion: "",
    avatar: "",
    portada: "",
    role: "user",
    activo: true,
    createdAt: serverTimestamp(),
  });

  return user;
};

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  const perfilRef = doc(db, "users", user.uid);
  const perfil = await getDoc(perfilRef);

  if (!perfil.exists()) {
    await setDoc(perfilRef, {
      uid: user.uid,
      nombrePlaneta: user.displayName || "Explorador",
      correo: user.email,
      biografia: "",
      ubicacion: "",
      avatar: user.photoURL || "",
      portada: "",
      role: "user",
      activo: true,
      createdAt: serverTimestamp(),
    });
  } else if (perfil.data().activo === false) {
    await updateDoc(perfilRef, { activo: true, desactivadoEn: null });
  }

  return user;
};
