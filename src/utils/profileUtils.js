import { supabase, waitForConnection } from '../lib/supabase'

export async function getUserProfile(userId) {
  if (!userId) return { data: null, error: new Error('User ID is required') }

  try {
    const connected = await waitForConnection()
    if (!connected) {
      throw new Error('Unable to connect to the server. Please check your internet connection.')
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST204') {
        // No profile found, create one
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({ id: userId, email: userId })
          .select()
          .single()

        if (createError) throw createError
        return { data: newProfile, error: null }
      }
      throw error
    }
    
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching profile:', error.message)
    return { 
      data: null, 
      error: new Error(
        error.message === 'Failed to fetch' 
          ? 'Network connection error. Please check your internet connection.'
          : error.message
      )
    }
  }
}

export async function updateProfile(updates) {
  if (!updates.id) return { error: new Error('User ID is required') }

  try {
    const connected = await waitForConnection()
    if (!connected) {
      throw new Error('Unable to connect to the server. Please check your internet connection.')
    }

    // Only include fields that are provided in the updates
    const validUpdates = {
      updated_at: new Date().toISOString()
    }
    
    // Only add fields that are explicitly provided
    if (updates.name !== undefined) validUpdates.name = updates.name
    if (updates.about !== undefined) validUpdates.about = updates.about
    if (updates.avatar_url !== undefined) validUpdates.avatar_url = updates.avatar_url

    const { data, error } = await supabase
      .from('profiles')
      .update(validUpdates)
      .eq('id', updates.id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error updating profile:', error.message)
    return { 
      error: new Error(
        error.message === 'Failed to fetch' 
          ? 'Network connection error. Please check your internet connection.'
          : error.message
      )
    }
  }
}