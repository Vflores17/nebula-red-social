import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import {db} from '../config/firebase'
const collectionString = 'like'

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

//CREATE
export const createLike = async document => await addDoc(collectionRef,document)

//UPDATE
export const updateLike = async (id, documento) => {
    const docRef = doc(db,collectionString,id)
    return await updateDoc(docRef,documento)
}

//DELETE
export const deleteLike = async id => {
    const docRef = doc(db,collectionString,id)
    return await deleteDoc(docRef)
}

// Busca el like directamente en Firestore sin descargar toda la colección.
export const getLikeByPostAndUser = async (postId, userId) => {
    const q = query(
        collectionRef,
        where('postId', '==', postId),
        where('userId', '==', userId)
    )
    const snapshot = await getDocs(q)

    if (snapshot.empty) return null

    const docSnap = snapshot.docs[0]
    return { id: docSnap.id, ...docSnap.data() }
}

export const likePost = async (postId, userId) => {
    return await createLike({ postId, userId, createdAt: serverTimestamp() })
}

export const unlikePost = async likeDocId => {
    return await deleteLike(likeDocId)
}
