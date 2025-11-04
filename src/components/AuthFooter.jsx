import React from 'react'

export default function AuthFooter({ isSignUp, onToggleMode }) {
  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-700/50 border-t dark:border-gray-600 text-center">
      <p className="text-gray-600 dark:text-gray-300">
        {isSignUp ? 'Already have an account?' : 'Need an account?'}
        <button
          onClick={onToggleMode}
          className="ml-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium focus:outline-none transition-colors"
        >
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </button>
      </p>
    </div>
  )
}