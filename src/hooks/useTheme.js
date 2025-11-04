import { useState, useEffect } from 'react'

export function useTheme() {
  const [darkMode, setDarkMode] = useState(() => {
    // Check if user has previously set a preference
    const savedPreference = localStorage.getItem('darkMode')
    
    // If no saved preference, check system preference
    if (savedPreference === null) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    
    return savedPreference === 'true'
  })

  useEffect(() => {
    // Apply dark mode class to html element
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev)
  }

  return { darkMode, toggleDarkMode }
}