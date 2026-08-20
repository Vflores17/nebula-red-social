import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

const collectionString = "reposts";
const collectionRef = collection(db, collectionString);

/**
 * Crea una retransmisión: guarda quién retransmitió y de qué post original.
 */
export const createRepost = async (documento) => {
  return await addDoc(collectionRef, {
    ...documento,
    createdAt: serverTimestamp(),
  });
};

/**
 * Trae todas las retransmisiones hechas por un usuario específico
 * (para mostrarlas en su perfil).
 */
export const getRepostsByUser = async (userId) => {
  const q = query(
    collectionRef,
    where("repostedBy", "==", userId),
    orderBy("createdAt", "desc")
  );
  return await getDocs(q);
};

/**
 * Busca la retransmisión MÁS RECIENTE que este usuario haya hecho de este post específico.
 * La usamos para calcular el cooldown (cuánto falta para poder retransmitir de nuevo).
 */
export const getUltimoRepost = async (postId, userId) => {
  const q = query(
    collectionRef,
    where("originalPostId", "==", postId),
    where("repostedBy", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data();
};