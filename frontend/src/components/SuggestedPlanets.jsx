import React from 'react'
import SuggestedPlanet from './SuggestedPlanet'
import './SuggestedPlanets.css'

const SuggestedPlanets = () => {
    const planetas = [
        {nombre:'Mercurio',
        handle:'mercurio',
        bio:'El planeta mas veloz del sistema solar orbitando'
        ,avatar: '#9ca3af',
        satelites:1247,
        orbitando:892
    },{nombre:'Venus',
        handle:'venus',
        bio:'La estrella mas brillante del cielo nocturno'
        ,avatar: '#9ca3af',
        satelites:2891,
        orbitando:1234},
        {nombre:'Marte',
        handle:'marte',
        bio:'El planeta rojo. Hogar del Olimpo Mons'
        ,avatar: '#9ca3af',
        satelites:5643,
        orbitando:2103}
    ]

  return (
    <aside className='card-planets'><h2>Planetas Sugeridos </h2>
        {planetas.map((planeta)=>(<SuggestedPlanet 
        key={planeta.handle}
        avatar={planeta.avatar}
        nombre={planeta.nombre}
        handle={planeta.handle}
        bio={planeta.bio}
        satelites={planeta.satelites}
        orbitando={planeta.orbitando}
        />))}
        
    </aside>
  )
}

export default SuggestedPlanets
