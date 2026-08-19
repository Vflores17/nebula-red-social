import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'

const collectionString = 'blocks'

const collectionRef = collection(db, collectionString)

// METODOS DEL CRUD

// GETALL
export const getAll = async () => {
    const data = await getDocs(collectionRef)

    return data
}

//GETBYID
export const getById = async id => {
    const document = await getDoc(doc(db, collectionString, id))

    if (document.exists) return document

    return null
}

//DELETE
export const deleteBlock = async id => {
    const docRef = doc(db, collectionString, id)

    if (docRef.exists)
        return await deleteDoc(docRef)
}

// ============================================================
// FUNCIONES ESPECÍFICAS DE BLOQUEO
// ============================================================
// El bloqueo es unidireccional: "bloqueadorId" bloquea a "bloqueadoId".
// No requiere consentimiento de la otra persona (a diferencia de la amistad).

// Bloquear a un usuario. Si ya estaba bloqueado, no crea un duplicado.
export const bloquearUsuario = async (bloqueadorId, bloqueadoId) => {
    if (bloqueadorId === bloqueadoId) {
        throw new Error('No puedes bloquearte a ti mismo')
    }

    const yaBloqueado = await obtenerBloqueo(bloqueadorId, bloqueadoId)
    if (yaBloqueado) return yaBloqueado

    return await addDoc(collectionRef, {
        bloqueadorId,
        bloqueadoId,
        createdAt: serverTimestamp(),
    })
}

// Desbloquear a un usuario
export const desbloquearUsuario = async (bloqueadorId, bloqueadoId) => {
    const bloqueo = await obtenerBloqueo(bloqueadorId, bloqueadoId)
    if (!bloqueo) return

    const docRef = doc(db, collectionString, bloqueo.id)
    await deleteDoc(docRef)
}

// Devuelve el documento de bloqueo de "bloqueadorId" hacia "bloqueadoId", o null
export const obtenerBloqueo = async (bloqueadorId, bloqueadoId) => {
    const q = query(
        collectionRef,
        where('bloqueadorId', '==', bloqueadorId),
        where('bloqueadoId', '==', bloqueadoId)
    )
    const snapshot = await getDocs(q)

    if (snapshot.empty) return null

    const docSnap = snapshot.docs[0]
    return { id: docSnap.id, ...docSnap.data() }
}

// Estado de bloqueo entre dos usuarios en ambas direcciones.
// Útil para la UI de perfil: saber si YO lo bloqueé y/o si ÉL me bloqueó a mí.
export const obtenerRelacionBloqueo = async (uidA, uidB) => {
    const [bloqueoAaB, bloqueoBaA] = await Promise.all([
        obtenerBloqueo(uidA, uidB),
        obtenerBloqueo(uidB, uidA),
    ])

    return {
        yoLoBloqueo: !!bloqueoAaB,
        meBloqueo: !!bloqueoBaA,
    }
}

// Lista de uids que un usuario ha bloqueado
export const obtenerBloqueados = async usuarioId => {
    const q = query(collectionRef, where('bloqueadorId', '==', usuarioId))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(d => d.data().bloqueadoId)
}

// Lista de uids que han bloqueado a un usuario
export const obtenerQuienesMeBloquearon = async usuarioId => {
    const q = query(collectionRef, where('bloqueadoId', '==', usuarioId))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(d => d.data().bloqueadorId)
}

// Unión de "a quién bloqueé" + "quién me bloqueó a mí", para filtrar feeds:
// contenido de cualquiera de esas dos listas no debería aparecer.
export const obtenerUidsOcultos = async usuarioId => {
    const [bloqueados, meBloquearon] = await Promise.all([
        obtenerBloqueados(usuarioId),
        obtenerQuienesMeBloquearon(usuarioId),
    ])
    return new Set([...bloqueados, ...meBloquearon])
}
