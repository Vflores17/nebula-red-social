import React from 'react'
import './SearchTabs.css'

const SearchTabs = ({activeTab,onChange}) => {
  const options = [
  { id: 'todo', label: 'Todo', icon: '✨' },
  { id: 'planetas', label: 'Planetas', icon: '🌍' },
  { id: 'transmisiones', label: 'Transmisiones', icon: '📡' },
];
  return (
    <aside>
        {options.map((option)=>(
            <button
            key={option.id}
            className={option.id === activeTab?"tabActive":"tab"}
            onClick={()=>onChange(option.id)}
            >{option.icon} {option.label} </button>
        ))}
    </aside>
  )
}

export default SearchTabs
