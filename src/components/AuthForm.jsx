import React, { useState, useRef, useEffect } from 'react'
import { BsEnvelope, BsLock, BsPerson, BsArrowLeft } from 'react-icons/bs'

export default function AuthForm({ 
  onSubmit, 
  loading, 
  isSignUp, 
  onForgotPassword,
  showOTP,
  savedEmail,
  onResendOTP,
  onBackFromOTP
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const otpRefs = useRef([...Array(6)].map(() => React.createRef()))

  useEffect(() => {
    if (showOTP) {
      otpRefs.current[0].current?.focus()
    }
  }, [showOTP])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (showOTP) {
      await onSubmit({ 
        email: savedEmail || email, 
        password, 
        name, 
        otp: otp.join('') 
      })
    } else {
      await onSubmit({ email, password, name })
    }
  }

  const handleOTPChange = (index, value) => {
    if (value.length > 1) {
      value = value.slice(-1)
    }
    
    if (/^\d*$/.test(value)) {
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)

      // Auto-focus next input
      if (value && index < 5) {
        otpRefs.current[index + 1].current?.focus()
      }
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1].current?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    if (pastedData.length === 6 && /^\d+$/.test(pastedData)) {
      const digits = pastedData.split('')
      setOtp(digits)
      otpRefs.current[5].current?.focus()
    }
  }

  if (showOTP) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-8">
          <div className="flex items-center mb-6">
            <button
              type="button"
              onClick={onBackFromOTP}
              className="text-gray-600 hover:text-gray-800 flex items-center"
            >
              <BsArrowLeft className="mr-2" />
              Back
            </button>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Enter Verification Code</h2>
            <p className="text-gray-600">
              We've sent a verification code to<br />
              <span className="font-medium">{savedEmail || email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={otpRefs.current[index]}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOTPChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-12 text-center text-2xl font-bold border-2 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.some(digit => !digit)}
              className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:from-green-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Verifying...
                </div>
              ) : (
                'Verify'
              )}
            </button>

            <div className="text-center text-sm text-gray-600">
              <p>Didn't receive the code?</p>
              <button
                type="button"
                onClick={onResendOTP}
                disabled={loading}
                className="text-green-600 hover:text-green-700 font-medium mt-1 disabled:opacity-50"
              >
                Send again
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isSignUp && (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <BsPerson className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pl-10 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Full Name"
            required={isSignUp}
          />
        </div>
      )}

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <BsEnvelope className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="pl-10 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Email address"
          required
        />
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <BsLock className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="pl-10 w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Password"
          required
        />
      </div>

      {!isSignUp && (
        <div className="text-right">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-green-600 hover:text-green-700"
          >
            Forgot password?
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:from-green-500 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            {isSignUp ? 'Creating account...' : 'Signing in...'}
          </div>
        ) : (
          isSignUp ? 'Create Account' : 'Sign In'
        )}
      </button>
    </form>
  )
}