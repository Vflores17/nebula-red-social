import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore'
import {db} from '../config/firebase'
const collectionString = 'friendship'

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
export const createFriendship = async document => await addDoc(collectionRef,document)

//UPDATE
export const updateFriendship = async (id, documento) => {
    const docRef = doc(db,collectionString,id)
    return await updateDoc(docRef,documento)
}

//DELETE
export const deleteFriendship = async id => {
    const docRef = doc(db,collectionString,id)
    return await deleteDoc(docRef)
}
