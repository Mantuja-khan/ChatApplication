import { supabase } from '../lib/supabase'

// Store OTPs in memory (in production, use Redis or similar)
const otpStore = new Map()

export async function handleAuth({ email, password, name, otp }, isSignUp) {
  try {
    if (isSignUp) {
      if (!otp) {
        // Send OTP for verification
        const response = await fetch('http://localhost:3000/api/email/send-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email })
        });

        const { otp: generatedOTP, error: otpError } = await response.json();
        if (otpError) throw new Error(otpError);
        
        otpStore.set(email, {
          otp: generatedOTP,
          expires: Date.now() + 10 * 60 * 1000
        });
        
        return { 
          requireOTP: true,
          message: "Please check your email for the verification code."
        };
      } else {
        // Verify OTP
        const storedOTP = otpStore.get(email);
        if (!storedOTP || storedOTP.expires < Date.now()) {
          throw new Error("OTP has expired. Please request a new one.");
        }
        
        if (otp !== storedOTP.otp) {
          throw new Error("Invalid OTP. Please try again.");
        }
        
        // Create account
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { 
              name,
              deleted: false
            }
          }
        });
        
        if (error) throw error;
        
        otpStore.delete(email);
        
        return { data };
      }
    } else {
      const { data: { user }, error: userError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (userError) throw userError;

      // Check if account is deleted
      if (user?.user_metadata?.deleted) {
        throw new Error("This account has been deleted. Please create a new account to continue.");
      }

      return { data: { user } };
    }
  } catch (error) {
    console.error('Auth error:', error);
    throw error;
  }
}

export async function resetPassword(email) {
  try {
    // Send OTP for password reset
    const response = await fetch('http://localhost:3000/api/email/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const { otp: generatedOTP, error: otpError } = await response.json();
    if (otpError) throw new Error(otpError);
    
    // Store OTP with expiration
    otpStore.set(`reset_${email}`, {
      otp: generatedOTP,
      expires: Date.now() + 10 * 60 * 1000
    });
    
    return { 
      message: "Please check your email for the verification code.",
      error: null
    };
  } catch (error) {
    console.error('Error sending reset OTP:', error);
    return { 
      error: new Error(error.message || 'Failed to send verification code. Please try again.')
    };
  }
}

export async function verifyResetOTP(email, otp) {
  try {
    const storedOTP = otpStore.get(`reset_${email}`);
    if (!storedOTP || storedOTP.expires < Date.now()) {
      throw new Error("Verification code has expired. Please request a new one.");
    }
    
    if (otp !== storedOTP.otp) {
      throw new Error("Invalid verification code. Please try again.");
    }
    
    return { verified: true, error: null };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { verified: false, error };
  }
}

export async function updatePassword(email, newPassword) {
  try {
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) throw updateError;

    // Clear stored OTP
    otpStore.delete(`reset_${email}`);

    return { 
      error: null,
      message: "Password has been successfully reset. Please sign in with your new password."
    };
  } catch (error) {
    console.error('Error updating password:', error);
    return { 
      error: new Error(error.message || 'Failed to update password. Please try again.')
    };
  }
}

export async function handleLogout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error logging out:', error.message);
    return { error };
  }
}

export async function deleteAccount() {
  try {
    // Update user metadata to mark account as deleted
    const { error: updateError } = await supabase.auth.updateUser({
      data: { 
        deleted: true,
        deletedAt: new Date().toISOString()
      }
    });

    if (updateError) throw updateError;

    // Sign out after marking account as deleted
    await supabase.auth.signOut();

    return { error: null };
  } catch (error) {
    console.error('Error deleting account:', error);
    return { error };
  }
}