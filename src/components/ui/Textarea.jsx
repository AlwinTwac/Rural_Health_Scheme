import React from 'react'

export function Textarea({ 
  className = '', 
  placeholder = '', 
  value = '', 
  onChange,
  rows = 4,
  disabled = false,
  ...props 
}) {
  return (
    <textarea
      className={`w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg 
                 bg-white dark:bg-slate-800 text-gray-900 dark:text-white
                 placeholder-gray-500 dark:placeholder-gray-400
                 focus:outline-none focus:ring-2 focus:ring-primary-500 
                 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed
                 ${className}`}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      rows={rows}
      disabled={disabled}
      {...props}
    />
  )
}
