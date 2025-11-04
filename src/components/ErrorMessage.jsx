import React from 'react'

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="p-4 m-4 bg-red-50 border border-red-100 rounded-md">
      <p className="text-red-600 mb-2">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-red-600 hover:text-red-700 underline"
        >
          Try again
        </button>
      )}
    </div>
  )
}