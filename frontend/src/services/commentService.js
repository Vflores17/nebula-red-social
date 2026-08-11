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
  const data = await getDocs(q);
  return data;
};

// CREATE
export const createComment = async (documento) => {
  return await addDoc(collectionRef, {
    ...documento,
    createdAt: serverTimestamp(),
  });
};

// DELETE
export const deleteComment = async (id) => {
  const docRef = doc(db, collectionString, id);
  return await deleteDoc(docRef);
};