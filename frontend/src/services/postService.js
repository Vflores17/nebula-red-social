import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc , serverTimestamp, increment} from 'firebase/firestore'
import {db} from '../config/firebase'
const collectionString = 'post'

const collectionRef = collection(db, collectionString)

// METODOS DEL CRUD

// GETALL
export const getAll = async ()=>{
    const data = await getDocs(collectionRef)

    return data
}

//GETBYID
export const getById = async id =>{
    const document = await getDoc(doc(db,collectionString,id))

    if (document.exists()) return document

    return null

}

// CREATE
export const createPost = async documento => await addDoc(collectionRef, {
    ...documento,
    destellosNum: 0,
    commentsNum: 0,
    sharesNum: 0,
    createdAt: serverTimestamp(),
})

//UPDATE
export const updatePost = async (id, documento) => {
    const docRef = doc(db,collectionString,id)
    return await updateDoc(docRef, documento)
}

//DELETE
export const deletePost = async id => {
    const docRef = doc(db,collectionString,id)
    return await deleteDoc(docRef)
}

export const incrementarComentarios = async (postId) => {
  const docRef = doc(db, collectionString, postId);
  return await updateDoc(docRef, {
    commentsNum: increment(1), // ← operación atómica: suma 1 sin importar el valor actual
  });
};

export const incrementarShares = async (postId) => {
  const docRef = doc(db, collectionString, postId);
  return await updateDoc(docRef, {
    sharesNum: increment(1),
  });
};
