import React from 'react'
import { BsSearch } from 'react-icons/bs'

export default function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <BsSearch className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-none rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent dark:text-gray-200"
        placeholder={placeholder}
      />
    </div>
  )
}