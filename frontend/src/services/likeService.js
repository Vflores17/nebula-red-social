import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc, query, where } from 'firebase/firestore'
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

    if (document.exists) return document

    return null

}

//CREATE
export const createLike = async document => await addDoc(collectionRef,document)

//UPDATE
export const updateLike = async (id, documento) => {
    const docRef = doc(db,collectionString,id)

    if (docRef.exists) 
        return await updateDoc(docRef,documento)
}

//DELETE
export const deleteLike = async id => {
    const docRef = doc(db,collectionString,id)

    if (docRef.exists) 
        return await deleteDoc(docRef)
}

// Busca si ya existe un "like" de este usuario a este post
export const getLikeByPostAndUser = async (postId, userId) => {
    if (!postId || !userId) return null

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

// Crea el like (destello) de un usuario sobre un post
export const likePost = async (postId, userId) => {
    return await addDoc(collectionRef, { postId, userId })
}

// Elimina el like (destello) por su id de documento
export const unlikePost = async (likeDocId) => {
    if (!likeDocId) return
    return await deleteDoc(doc(db, collectionString, likeDocId))
}