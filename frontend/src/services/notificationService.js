import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import {db} from '../config/firebase'
const collectionString = 'notification'

const collectionRef = collection(db, collectionString)

// METODOS DEL CRUD

export const getAll = async ()=>{
    const data = await getDocs(collectionRef)
    return data
}

export const getById = async id =>{
    const document = await getDoc(doc(db,collectionString,id))
    if (document.exists) return document
    return null
}

export const createNotification = async document => await addDoc(collectionRef,document)

export const updateNotification = async (id, documento) => {
    const docRef = doc(db,collectionString,id)
    if (docRef.exists)
        return await updateDoc(docRef,documento)
}

export const deleteNotification = async id => {
    const docRef = doc(db,collectionString,id)
    if (docRef.exists)
        return await deleteDoc(docRef)
}

// ============================================================
// FUNCIONES DE CONVENIENCIA
// ============================================================

// Crea una notificación con timestamp automático
export const crearNotificacion = async ({ usuarioId, tipo, origenId, solicitudId, leida = false }) => {
    return await addDoc(collectionRef, {
        usuarioId,
        tipo,
        origenId,
        solicitudId: solicitudId ?? null,
        leida,
        createdAt: serverTimestamp(),
    })
}

// Notificaciones de un usuario, más recientes primero
export const obtenerPorUsuario = async (usuarioId) => {
    const q = query(
        collectionRef,
        where('usuarioId', '==', usuarioId),
        orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
}

// Marcar una notificación como leída
export const marcarLeida = async (id) => {
    const docRef = doc(db, collectionString, id)
    return await updateDoc(docRef, { leida: true })
}