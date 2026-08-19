import { useEffect, useState } from 'react'
import SuggestedPlanet from './SuggestedPlanet'
import { auth } from '../config/firebase'
import { getAll } from '../services/userService'
import { obtenerAmigos } from '../services/friendshipService'
import { obtenerUidsOcultos } from '../services/blockService'
import './SuggestedPlanets.css'

const SuggestedPlanets = () => {
    const [planetas, setPlanetas] = useState([])
    const [cargando, setCargando] = useState(true)
    const currentUserId = auth.currentUser?.uid

    useEffect(() => {
        if (!currentUserId) return

        const cargarUsuarios = async () => {
            const [snapshot, uidsOcultos] = await Promise.all([
                getAll(),
                obtenerUidsOcultos(currentUserId),
            ])

            const usuarios = snapshot.docs
                .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
                .filter(u => u.uid && u.uid !== currentUserId && !uidsOcultos.has(u.uid))
                .slice(0, 3) // mismo límite de 3 sugerencias que tenía el mock

            // No hay un sistema de "seguidores" separado: usamos el número
            // de amistades aceptadas como estadística de la tarjeta.
            const conAmigos = await Promise.all(
                usuarios.map(async (u) => {
                    const amigos = await obtenerAmigos(u.uid)
                    return { ...u, amigosCount: amigos.length }
                })
            )

            setPlanetas(conAmigos)
            setCargando(false)
        }

        cargarUsuarios()
    }, [currentUserId])

    return (
        <aside className='card-planets'>
            <h2>Planetas Sugeridos </h2>
            {cargando && <p className="empty-state">Cargando planetas...</p>}
            {!cargando && planetas.length === 0 && (
                <p className="empty-state">No hay más planetas para sugerir</p>
            )}
            {planetas.map((planeta) => (
                <SuggestedPlanet
                    key={planeta.uid}
                    uid={planeta.uid}
                    avatar={planeta.avatar || '#9ca3af'}
                    nombre={planeta.nombrePlaneta || 'Sin nombre'}
                    handle={(planeta.nombrePlaneta || '').toLowerCase().replace(/\s+/g, '')}
                    bio={planeta.biografia || ''}
                    satelites={planeta.amigosCount}
                    orbitando={planeta.amigosCount}
                />
            ))}
        </aside>
    )
}

export default SuggestedPlanets
