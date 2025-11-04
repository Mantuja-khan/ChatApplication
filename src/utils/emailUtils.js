import { supabase } from '../lib/supabase'

export const sendOTP = async (email) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-otp', {
      body: { email }
    })
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error sending OTP:', error)
    return { otp: null, error: 'Failed to send OTP. Please try again.' }
  }
}