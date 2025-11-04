import React, { useState, useRef } from 'react'
import { BsX, BsVolumeUp, BsVolumeMute, BsUpload, BsPlay, BsStop } from 'react-icons/bs'
import { setCustomMessageSound, getCustomMessageSound, isAudioOn, toggleAudio, playMessageSound } from '../utils/soundUtils'

export default function SoundSettingsModal({ onClose }) {
  const [audioEnabled, setAudioEnabled] = useState(isAudioOn())
  const [customSound, setCustomSound] = useState(getCustomMessageSound())
  const [isPlaying, setIsPlaying] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const audioRef = useRef(null)

  const handleToggleAudio = () => {
    const newState = toggleAudio()
    setAudioEnabled(newState)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      alert('Please select an audio file (MP3, WAV, etc.)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Audio file size must be less than 5MB')
      return
    }

    setUploading(true)
    try {
      const audioUrl = URL.createObjectURL(file)
      const success = await setCustomMessageSound(audioUrl, file.name)
      if (success) {
        setCustomSound({ url: audioUrl, name: file.name })
        // Test play the uploaded sound
        const testAudio = new Audio(audioUrl)
        testAudio.volume = 0.3
        testAudio.play().catch(console.warn)
      } else {
        alert('Failed to set custom sound. Please try a different audio file.')
      }
    } catch (error) {
      console.error('Error uploading sound:', error)
      alert('Failed to upload sound. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handlePlaySound = () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      setIsPlaying(false)
    } else {
      if (customSound?.url) {
        if (audioRef.current) {
          audioRef.current.src = customSound.url
          audioRef.current.volume = 0.3
          audioRef.current.play()
          setIsPlaying(true)
        }
      } else {
        playMessageSound()
      }
    }
  }

  const handleRemoveCustomSound = () => {
    if (window.confirm('Are you sure you want to remove your custom sound?')) {
      setCustomMessageSound(null)
      setCustomSound(null)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      setIsPlaying(false)
    }
  }

  const handleTestCurrentSound = () => {
    setCustomSound(null)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
    // Play the current sound (custom or default)
    playMessageSound()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Sound Settings</h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <BsX size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Audio Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {audioEnabled ? (
                <BsVolumeUp className="h-5 w-5 text-green-500 mr-3" />
              ) : (
                <BsVolumeMute className="h-5 w-5 text-gray-400 mr-3" />
              )}
              <div>
                <div className="font-medium dark:text-gray-200">Message Sounds</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Play sound when sending messages
                </div>
              </div>
            </div>
            <button
              onClick={handleToggleAudio}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                audioEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  audioEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Custom Sound Upload */}
          <div className="space-y-4">
            <div>
              <div className="font-medium dark:text-gray-200 mb-2">Custom Message Sound</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Upload your own sound for message notifications (MP3, WAV, etc.)
              </div>
            </div>

            {/* Current Sound Display */}
            {customSound ? (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BsVolumeUp className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm font-medium dark:text-gray-200">
                      {customSound.name || 'Custom Sound'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePlaySound}
                      className="p-2 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-full transition-colors"
                      title={isPlaying ? 'Stop' : 'Play'}
                    >
                      {isPlaying ? <BsStop size={16} /> : <BsPlay size={16} />}
                    </button>
                    <button
                      onClick={handleRemoveCustomSound}
                      className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full transition-colors"
                      title="Remove"
                    >
                      <BsX size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  No custom sound selected
                </div>
                <button
                  onClick={handlePlaySound}
                  className="text-green-500 hover:text-green-600 text-sm font-medium"
                >
                  Play Default Sound
                </button>
              </div>
            )}

            {/* Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="audio/*"
              className="hidden"
              disabled={uploading}
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              <BsUpload size={16} />
              {uploading ? 'Uploading...' : 'Upload Custom Sound'}
            </button>

            <div className="text-xs text-gray-500 dark:text-gray-400">
              Supported formats: MP3, WAV, OGG, M4A (Max size: 5MB)
            </div>
          </div>

          {/* Test Sound */}
          <div className="pt-4 border-t dark:border-gray-600">
            <button
              onClick={handleTestCurrentSound}
              disabled={!audioEnabled}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {customSound ? 'Test Custom Sound' : 'Test Default Sound'}
            </button>
          </div>
        </div>

        {/* Hidden audio element for playing custom sounds */}
        <audio
          ref={audioRef}
          onEnded={() => setIsPlaying(false)}
          onError={() => setIsPlaying(false)}
        />
      </div>
    </div>
  )
}