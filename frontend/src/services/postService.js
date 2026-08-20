import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc, query, where, serverTimestamp, increment} from 'firebase/firestore'
import {db} from '../config/firebase'
const collectionString = 'post'

// Lista básica de palabras prohibidas para el filtro automático.
// Se compara sin acentos y sin importar mayúsculas/minúsculas.
const PALABRAS_PROHIBIDAS = [
    'idiota', 'estupido', 'imbecil', 'basura', 'maldito',
    // agrega aquí las que el equipo decida
]

const normalizar = (texto) =>
    texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // quita acentos

const contienePalabraProhibida = (texto) => {
    if (!texto) return false
    const normalizado = normalizar(texto)
    return PALABRAS_PROHIBIDAS.some((palabra) =>
        normalizado.includes(normalizar(palabra))
    )
}

const collectionRef = collection(db, collectionString)
const postCache = new Map()

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

// Comparte la misma consulta cuando varios reportes apuntan al mismo post.
export const getPostByIdCached = async id => {
    if (!id) return null

    if (!postCache.has(id)) {
        postCache.set(id, getById(id).then(document => (
            document ? { id: document.id, ...document.data() } : null
        )).catch(error => {
            postCache.delete(id)
            throw error
        }))
    }

    return await postCache.get(id)
}

// CREATE
export const createPost = async documento => await addDoc(collectionRef, {
    ...documento,
    destellosNum: 0,
    commentsNum: 0,
    sharesNum: 0,
    estado: contienePalabraProhibida(documento.description) ? 'pendiente' : 'aprobado',
    createdAt: serverTimestamp(),
})

// Trae los posts marcados como pendientes de revisión por el filtro automático.
export const getPendientes = async () => {
    const q = query(collectionRef, where('estado', '==', 'pendiente'))
    const data = await getDocs(q)
    return data.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
}


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

export const incrementarDestellos = async (postId) => {
  const docRef = doc(db, collectionString, postId);
  return await updateDoc(docRef, {
    destellosNum: increment(1),
  });
};

export const decrementarDestellos = async (postId) => {
  const docRef = doc(db, collectionString, postId);
  return await updateDoc(docRef, {
    destellosNum: increment(-1),
  });
};