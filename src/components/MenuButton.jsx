import React, { useState, useRef, useEffect } from 'react'
import { BsThreeDotsVertical, BsArrowLeft, BsPeople, BsPersonPlus, BsPersonLinesFill, BsMoon, BsSun, BsBoxArrowRight, BsTrash, BsChatDots, BsShieldSlash, BsDownload, BsVolumeUp } from 'react-icons/bs'
import { handleLogout } from '../utils/authUtils'
import DeleteAccountModal from './DeleteAccountModal'
import SoundSettingsModal from './SoundSettingsModal'
import { useTheme } from '../hooks/useTheme'

export default function MenuButton({ 
  onEditProfile, 
  onToggleFriendRequests, 
  onToggleMyContacts, 
  onToggleMembers,
  onToggleBlockedUsers, 
  friendRequestCount = 0 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showSoundModal, setShowSoundModal] = useState(false)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const menuRef = useRef(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const { darkMode, toggleDarkMode } = useTheme()

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    // Check installation status
    const checkInstallStatus = () => {
      const isInstalled = localStorage.getItem('pwa-installed') === 'true' ||
                          window.matchMedia('(display-mode: standalone)').matches ||
                          window.navigator.standalone === true;
      
      if (isInstalled) {
        setShowInstallButton(false);
        return;
      }
      
      // Check if install prompt is available
      if (window.deferredPrompt) {
        setDeferredPrompt(window.deferredPrompt);
        setShowInstallButton(true);
      }
    };

    // Initial check
    checkInstallStatus();

    // Listen for PWA events
    const handleInstallable = () => {
      setDeferredPrompt(window.deferredPrompt);
      setShowInstallButton(true);
    };

    const handleInstalled = () => {
      setShowInstallButton(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('pwa-installed', handleInstalled);

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('pwa-installed', handleInstalled);
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleMenuClick = (callback) => {
    callback()
    setIsOpen(false)
  }

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        localStorage.setItem('pwa-installed', 'true')
        setShowInstallButton(false)
      }
      
      setDeferredPrompt(null)
    }
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full relative ${!isMobile ? 'fixed left-4 top-4 z-50' : ''}`}
      >
        <BsThreeDotsVertical className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        {friendRequestCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {friendRequestCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40" />
      )}

      <div
        className={`fixed md:absolute ${isMobile ? 'top-0' : 'top-16 left-4'} right-0 w-48 bg-white dark:bg-gray-800 md:rounded-md shadow-lg z-50 transition-all duration-300 ${
          isMobile 
            ? `transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`
            : isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        } h-full md:h-auto`}
      >
        <div className="flex flex-col h-full">
          {isMobile && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700 flex items-center">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full mr-2"
              >
                <BsArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
              <h3 className="text-lg font-semibold dark:text-gray-200">Menu</h3>
            </div>
          )}

          <div className="flex-1">
            {/* Show navigation items only on desktop */}
            {!isMobile && (
              <div className="border-b dark:border-gray-600 pb-2 mb-2">
                <button
                  onClick={() => handleMenuClick(() => onToggleMembers())}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <BsChatDots className="h-5 w-5 mr-2" />
                  Chats
                </button>

                <button
                  onClick={() => handleMenuClick(() => onToggleMyContacts())}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <BsPersonLinesFill className="h-5 w-5 mr-2" />
                  My Contacts
                </button>

                <button
                  onClick={() => handleMenuClick(() => onToggleMembers())}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <BsPeople className="h-5 w-5 mr-2" />
                  Members
                </button>

                <button
                  onClick={() => handleMenuClick(() => onToggleFriendRequests())}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <BsPersonPlus className="h-5 w-5 mr-2" />
                    Friend Requests
                  </div>
                  {friendRequestCount > 0 && (
                    <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1">
                      {friendRequestCount}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Install App Button - Show on both mobile and desktop */}
            <button
              onClick={() => handleMenuClick(() => onToggleBlockedUsers())}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            >
              <BsShieldSlash className="h-5 w-5 mr-2" />
              Blocked Users
            </button>

            <button
              onClick={() => handleMenuClick(toggleDarkMode)}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            >
              {darkMode ? (
                <>
                  <BsSun className="h-5 w-5 mr-2" />
                  Light Mode
                </>
              ) : (
                <>
                  <BsMoon className="h-5 w-5 mr-2" />
                  Dark Mode
                </>
              )}
            </button>

            {showInstallButton && (
              <button
                onClick={handleInstallApp}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                <BsDownload className="h-5 w-5 mr-2" />
                Install App
              </button>
            )}

            {/* Sound Settings Button - Show on both mobile and desktop */}
            <button
              onClick={() => handleMenuClick(() => setShowSoundModal(true))}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            >
              <BsVolumeUp className="h-5 w-5 mr-2" />
              Sound Settings
            </button>

            <button
              onClick={() => handleMenuClick(onEditProfile)}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            >
              <BsPersonLinesFill className="h-5 w-5 mr-2" />
              Edit profile
            </button>

            {/* Danger Zone - Separate section */}
            <div className="border-t dark:border-gray-600 mt-2 pt-2">
            <button
              onClick={() => handleMenuClick(() => setShowDeleteModal(true))}
              className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            >
              <BsTrash className="h-5 w-5 mr-2" />
              Delete account
            </button>

            <button
              onClick={() => handleMenuClick(handleLogout)}
              className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            >
              <BsBoxArrowRight className="h-5 w-5 mr-2" />
              Logout
            </button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteAccountModal onClose={() => setShowDeleteModal(false)} />
      )}

      {showSoundModal && (
        <SoundSettingsModal onClose={() => setShowSoundModal(false)} />
      )}
    </div>
  )
}