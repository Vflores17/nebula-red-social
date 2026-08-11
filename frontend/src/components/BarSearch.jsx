import React from 'react'
import './BarSearch.css'
 
const BarSearch = ({valor,onChange}) => {
  return (
    <div className='search-bar-card'>
        <span>🔍</span>
        <input type='text' 
        placeholder='Buscar planetas o #Hashtags'
        value={valor}
        onChange={(e)=>onChange(e.target.value)}></input>  
        <button onClick={()=>onChange("")}>✕</button>    
    </div>
  )
}

export default BarSearch
