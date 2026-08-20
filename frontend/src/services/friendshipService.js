import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc, query, where, serverTimestamp } from 'firebase/firestore'
import {db} from '../config/firebase'
import { crearNotificacion } from './notificationService'
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

    if (document.exists) return document

    return null

}

//CREATE
export const createFriendship = async document => await addDoc(collectionRef,document)

//UPDATE
export const updateFriendship = async (id, documento) => {
    const docRef = doc(db,collectionString,id)

    if (docRef.exists) 
        return await updateDoc(docRef,documento)
}

//DELETE
export const deleteFriendship = async id => {
    const docRef = doc(db,collectionString,id)

    if (docRef.exists) 
        return await deleteDoc(docRef)
}

// ============================================================
// FUNCIONES ESPECÍFICAS DE SOLICITUDES DE AMISTAD
// ============================================================

// Enviar una solicitud de amistad de "solicitanteId" hacia "receptorId"
export const enviarSolicitud = async (solicitanteId, receptorId) => {
    if (solicitanteId === receptorId) {
        throw new Error('No puedes enviarte una solicitud a ti mismo')
    }

    // Verifica que no exista ya una relación (en cualquier dirección)
    const existente = await obtenerEstado(solicitanteId, receptorId)
    if (existente) {
        throw new Error(
            existente.estado === 'aceptada'
                ? 'Ya son amigos'
                : 'Ya existe una solicitud pendiente'
        )
    }

    const nuevaSolicitud = await addDoc(collectionRef, {
        solicitanteId,
        receptorId,
        estado: 'pendiente',
        createdAt: serverTimestamp(),
    })

    // Crea una notificación (una "Señal") para quien la recibe
    await crearNotificacion({
        usuarioId: receptorId,
        tipo: 'orbita',
        origenId: solicitanteId,
        solicitudId: nuevaSolicitud.id,
        leida: false,
    })

    return nuevaSolicitud
}

// Devuelve el estado de la relación entre dos usuarios (o null si no existe)
// { id, estado, solicitanteId, receptorId, esSolicitante }
export const obtenerEstado = async (uidA, uidB) => {
    const q1 = query(
        collectionRef,
        where('solicitanteId', '==', uidA),
        where('receptorId', '==', uidB)
    )
    const q2 = query(
        collectionRef,
        where('solicitanteId', '==', uidB),
        where('receptorId', '==', uidA)
    )

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)])

    if (!snap1.empty) {
        const docSnap = snap1.docs[0]
        return { id: docSnap.id, ...docSnap.data(), esSolicitante: true }
    }
    if (!snap2.empty) {
        const docSnap = snap2.docs[0]
        return { id: docSnap.id, ...docSnap.data(), esSolicitante: false }
    }
    return null
}

// Solicitudes pendientes que ha RECIBIDO un usuario
export const obtenerSolicitudesPendientes = async (usuarioId) => {
    const q = query(
        collectionRef,
        where('receptorId', '==', usuarioId),
        where('estado', '==', 'pendiente')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
}

// Aceptar una solicitud (recibe el documento completo, no solo el id,
// para poder notificar a quien la envió)
export const aceptarSolicitud = async (solicitud) => {
    const docRef = doc(db, collectionString, solicitud.id)
    await updateDoc(docRef, { estado: 'aceptada' })

    await crearNotificacion({
        usuarioId: solicitud.solicitanteId,
        tipo: 'orbita',
        origenId: solicitud.receptorId,
        leida: false,
    })
}

// Rechazar una solicitud
export const rechazarSolicitud = async (solicitudId) => {
    const docRef = doc(db, collectionString, solicitudId)
    await updateDoc(docRef, { estado: 'rechazada' })
}

// Amigos aceptados de un usuario (busca en ambas direcciones)
export const obtenerAmigos = async (usuarioId) => {
    const qComoSolicitante = query(
        collectionRef,
        where('solicitanteId', '==', usuarioId),
        where('estado', '==', 'aceptada')
    )
    const qComoReceptor = query(
        collectionRef,
        where('receptorId', '==', usuarioId),
        where('estado', '==', 'aceptada')
    )

    const [snapA, snapB] = await Promise.all([getDocs(qComoSolicitante), getDocs(qComoReceptor)])

    const amigosIds = [
        ...snapA.docs.map(d => d.data().receptorId),
        ...snapB.docs.map(d => d.data().solicitanteId),
    ]

    return amigosIds
}