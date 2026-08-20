import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore'
import {db} from '../config/firebase'
const collectionString = 'users'

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
export const createUser = async document => await addDoc(collectionRef,document)

//UPDATE
export const updateUser = async (id, documento) => {
    const docRef = doc(db,collectionString,id)

    if (docRef.exists) 
        return await updateDoc(docRef,documento)
}

//DELETE
export const deleteUser = async id => {
    const docRef = doc(db,collectionString,id)

    if (docRef.exists) 
        return await deleteDoc(docRef)
}

// GET PROFILE BY ID (devuelve los datos planos del perfil, no el snapshot)
export const getProfileById = async (id) => {
    if (!id) return null

    const snap = await getDoc(doc(db, collectionString, id))

    if (!snap.exists()) return null

    return { id: snap.id, ...snap.data() }
}

// GET PROFILE BY ID CON CACHÉ EN MEMORIA (evita relecturas repetidas de Firestore)
const perfilesCache = new Map()

export const getProfileByIdCached = async (id) => {
    if (!id) return null

    if (perfilesCache.has(id)) {
        return perfilesCache.get(id)
    }

    const perfil = await getProfileById(id)

    if (perfil) {
        perfilesCache.set(id, perfil)
    }

    return perfil
}