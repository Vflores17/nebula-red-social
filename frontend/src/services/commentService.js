import { addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp, } from 'firebase/firestore'
import {db} from '../config/firebase'
const collectionString = 'comment'

const collectionRef = collection(db, collectionString)

/**
 * Trae todos los comentarios de UN post específico, ordenados del más viejo al más nuevo
 * (para que se lean como una conversación, de arriba hacia abajo).
 */
export const getCommentsByPost = async (postId) => {
  const q = query(
    collectionRef,
    where("postId", "==", postId), // filtra: solo documentos donde postId coincida
    orderBy("createdAt", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
};

// CREATE
export const createComment = async (postId, userId, text, autor = {}) => {
  const comentario = {
    postId,
    userId,
    text,
    nombre: autor.nombre || "Usuario",
    avatar: autor.avatar || "",
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collectionRef, comentario);
  return {
    id: docRef.id,
    ...comentario,
  };
};

// DELETE
export const deleteComment = async (id) => {
  const docRef = doc(db, collectionString, id);
  return await deleteDoc(docRef);
};
