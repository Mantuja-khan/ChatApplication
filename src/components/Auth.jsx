import React, { useState } from 'react'
import AuthForm from './AuthForm'
import AuthHeader from './AuthHeader'
import AuthFooter from './AuthFooter'
import ForgotPassword from './ForgotPassword'
import { handleAuth } from '../utils/authUtils'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [formData, setFormData] = useState(null)
  const [showOTP, setShowOTP] = useState(false)

  const onSubmit = async (data) => {
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const { data: authData, error, message, requireOTP } = await handleAuth(data, isSignUp)
      if (error) throw error
      if (message) {
        setMessage(message)
      }
      if (requireOTP) {
        setFormData(data) // Save form data for OTP verification
        setShowOTP(true)
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (!formData) return
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const { message, error } = await handleAuth(formData, isSignUp)
      if (error) throw error
      if (message) {
        setMessage(message)
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (showForgotPassword) {
    return (
      <ForgotPassword 
        onBack={() => setShowForgotPassword(false)}
        onSuccess={(message) => {
          setMessage(message)
          setShowForgotPassword(false)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform hover:scale-[1.02] transition-transform duration-300">
        <AuthHeader isSignUp={isSignUp} />
        
        <div className="p-8">
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg text-sm animate-fade-in">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-600 dark:text-green-400 rounded-lg text-sm animate-fade-in">
              {message}
            </div>
          )}
          
          <AuthForm 
            onSubmit={onSubmit}
            loading={loading}
            isSignUp={isSignUp}
            onForgotPassword={() => setShowForgotPassword(true)}
            showOTP={showOTP}
            savedEmail={formData?.email}
            onResendOTP={handleResendOTP}
            onBackFromOTP={() => {
              setShowOTP(false)
              setFormData(null)
            }}
          />
        </div>

        {!showOTP && (
          <AuthFooter 
            isSignUp={isSignUp} 
            onToggleMode={() => {
              setIsSignUp(!isSignUp)
              setError(null)
              setMessage(null)
              setShowOTP(false)
              setFormData(null)
            }} 
          />
        )}
      </div>
    </div>
  )
}