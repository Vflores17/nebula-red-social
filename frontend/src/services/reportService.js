import { 
  addDoc, 
  collection, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '../config/firebase'

const collectionString = 'report'
const collectionRef = collection(db, collectionString)

// ============================================================
// MÉTODOS GENERALES DEL CRUD
// ============================================================

// GETALL
export const getAll = async () => {
    const data = await getDocs(collectionRef)
    return data
}

// GETBYID
export const getById = async (id) => {
    const document = await getDoc(doc(db, collectionString, id))
    if (document.exists()) return document
    return null
}

// CREATE
export const createReport = async (document) => await addDoc(collectionRef, document)

// UPDATE
export const updateReport = async (id, documento) => {
    const docRef = doc(db, collectionString, id)
    return await updateDoc(docRef, documento)
}

// DELETE
export const deleteReport = async (id) => {
    const docRef = doc(db, collectionString, id)
    return await deleteDoc(docRef)
}

// ============================================================
// FUNCIONES ESPECÍFICAS DE REPORTES
// ============================================================

// Motivos disponibles al reportar un perfil (usados por la UI)
export const MOTIVOS_REPORTE_USUARIO = [
    { value: 'spam', label: 'Spam o contenido engañoso' },
    { value: 'acoso', label: 'Acoso u hostigamiento' },
    { value: 'contenido_inapropiado', label: 'Contenido inapropiado' },
    { value: 'suplantacion', label: 'Suplantación de identidad' },
    { value: 'otro', label: 'Otro' },
]

// Reportar una publicación
export const reportPost = async (reporterId, postId, reason) => {
    return await createReport({
        reporterId,
        targetType: 'post',
        targetId: postId,
        reason: typeof reason === 'string' ? reason.trim() : reason,
        status: 'pending',
        estado: 'pendiente',
        createdAt: serverTimestamp(),
    })
}

// Reportar un usuario (incluye validación contra duplicados y autorreporte)
export const reportarUsuario = async ({ reporterId, reportedUserId, motivo, detalle }) => {
    if (reporterId === reportedUserId) {
        throw new Error('No puedes reportarte a ti mismo')
    }

    const q = query(
        collectionRef,
        where('reporterId', '==', reporterId),
        where('reportedUserId', '==', reportedUserId),
        where('estado', '==', 'pendiente')
    )
    const existentes = await getDocs(q)
    if (!existentes.empty) {
        throw new Error('Ya reportaste a este planeta, tu reporte está en revisión')
    }

    return await createReport({
        tipo: 'usuario',
        targetType: 'user',
        reporterId,
        reportedUserId,
        targetId: reportedUserId,
        motivo,
        reason: motivo,
        detalle: detalle || '',
        estado: 'pendiente',
        status: 'pending',
        createdAt: serverTimestamp(),
    })
}

// Alias simplificado para compatibilidad con código existente que use reportUser
export const reportUser = async (reporterId, targetUid, reason) => {
    return await reportarUsuario({
        reporterId,
        reportedUserId: targetUid,
        motivo: reason,
    })
}

// Obtener reportes que ha recibido un usuario (para moderación)
export const obtenerReportesDeUsuario = async (reportedUserId) => {
    const q = query(collectionRef, where('reportedUserId', '==', reportedUserId))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}