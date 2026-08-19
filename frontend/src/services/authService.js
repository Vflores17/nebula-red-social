import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../config/firebase.js";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export const registerUser = async (
  nombrePlaneta,
  email,
  password
) => {
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
    rol: "user",
    createdAt: serverTimestamp(),
  });

  return user;
};