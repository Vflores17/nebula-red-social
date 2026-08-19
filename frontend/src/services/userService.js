import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore'
import {db} from '../config/firebase'
const collectionString = 'users'

const collectionRef = collection(db, collectionString)
const profileCache = new Map()

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
export const createUser = async document => await addDoc(collectionRef,document)

//UPDATE
export const updateUser = async (id, documento) => {
    const docRef = doc(db,collectionString,id)
    return await updateDoc(docRef,documento)
}

//DELETE
export const deleteUser = async id => {
    const docRef = doc(db,collectionString,id)
    return await deleteDoc(docRef)
}

// Evita repetir la consulta cuando varias publicaciones pertenecen al mismo autor.
export const getProfileByIdCached = async id => {
    if (!id) return null

    if (!profileCache.has(id)) {
        profileCache.set(id, getById(id).then(document => (
            document ? { id: document.id, ...document.data() } : null
        )).catch(error => {
            profileCache.delete(id)
            throw error
        }))
    }

    return await profileCache.get(id)
}
