import React from 'react'

export default function Avatar({ url, name, size = 'md', showOnlineStatus, isOnline }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const fallbackInitial = name?.charAt(0)?.toUpperCase() || '?'

  return (
    <div className="relative">
      <div 
        className={`${sizeClasses[size]} bg-green-500 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden`}
      >
        {url ? (
          <img 
            src={url} 
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.parentElement.textContent = fallbackInitial
            }}
          />
        ) : (
          fallbackInitial
        )}
      </div>
      {showOnlineStatus && isOnline && (
        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
      )}
    </div>
  )
}