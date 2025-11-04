import React from 'react'
import { BsChatDots, BsDownload } from 'react-icons/bs'

export default function AuthHeader({ isSignUp }) {
  const handleDownload = () => {
    // Check if the browser supports the beforeinstallprompt event
    if ('BeforeInstallPromptEvent' in window) {
      // For PWA installation
      if (window.deferredPrompt) {
        window.deferredPrompt.prompt();
        window.deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
          }
          window.deferredPrompt = null;
        });
      } else {
        alert('App is already installed or installation is not available');
      }
    } else {
      // Fallback for browsers that don't support PWA installation
      const link = document.createElement('a');
      link.href = window.location.origin;
      link.download = 'v-chats.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  return (
    <div className="text-center p-8 bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-t-2xl">
      <div className="flex justify-center mb-4">
        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
          <BsChatDots className="w-10 h-10 text-white" />
        </div>
      </div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 flex items-center justify-center gap-2">
        V-Chats
        <button
          onClick={handleDownload}
          className="inline-flex items-center justify-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          title="Download App"
        >
          <BsDownload className="w-5 h-5 text-green-500" />
        </button>
      </h1>
      <p className="text-gray-600 dark:text-gray-300 text-lg">
        {isSignUp 
          ? 'Create an account to start chatting'
          : 'Sign in to continue chatting'}
      </p>
    </div>
  )
}