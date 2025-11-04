// Sound utility functions for message notifications

let audioContext = null;
let isAudioEnabled = true;
let customMessageSound = null;

// Initialize audio context
const initAudioContext = () => {
  if (!audioContext && (window.AudioContext || window.webkitAudioContext)) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

// Create a simple beep sound using Web Audio API
const createBeepSound = (frequency = 800, duration = 200, volume = 0.1) => {
  const context = initAudioContext();
  if (!context) return;

  try {
    // Resume audio context if suspended (required for mobile browsers)
    if (context.state === 'suspended') {
      context.resume();
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, context.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, context.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration / 1000);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + duration / 1000);
  } catch (error) {
    console.warn('Could not play sound:', error);
  }
};

// Play message sent sound
export const playMessageSound = () => {
  if (!isAudioEnabled) return;

  // Check if user prefers reduced motion (accessibility)
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  // Play custom sound if available
  if (customMessageSound?.url) {
    try {
      const audio = new Audio(customMessageSound.url);
      audio.volume = 0.3; // Slightly lower volume for custom sounds
      audio.play().catch(error => {
        console.warn('Could not play custom sound:', error);
        // Fallback to default sound
        playDefaultSound();
      });
      return;
    } catch (error) {
      console.warn('Could not play custom sound:', error);
      // Fallback to default sound
      playDefaultSound();
    }
  } else {
    // Play default sound if no custom sound is set
    playDefaultSound();
  }
};

// Play default beep sound
const playDefaultSound = () => {
  // Different sound for mobile vs desktop
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Shorter, higher pitch for mobile
    createBeepSound(1000, 150, 0.08);
  } else {
    // Slightly longer, lower pitch for desktop
    createBeepSound(800, 200, 0.1);
  }
}

// Play message received sound
export const playReceiveSound = () => {
  if (!isAudioEnabled) return;

  // Check if user prefers reduced motion (accessibility)
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  // Different tone for received messages
  createBeepSound(600, 300, 0.08);
};

// Play notification sound
export const playNotificationSound = () => {
  if (!isAudioEnabled) return;

  // Check if user prefers reduced motion (accessibility)
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  // Two-tone notification
  createBeepSound(800, 150, 0.08);
  setTimeout(() => {
    createBeepSound(1000, 150, 0.08);
  }, 200);
};

// Toggle audio on/off
export const toggleAudio = () => {
  isAudioEnabled = !isAudioEnabled;
  localStorage.setItem('audioEnabled', isAudioEnabled.toString());
  return isAudioEnabled;
};

// Set custom message sound
export const setCustomMessageSound = async (audioUrl, fileName = 'Custom Sound') => {
  try {
    if (audioUrl) {
      // Test if the audio can be played before setting it
      const testAudio = new Audio(audioUrl);
      await new Promise((resolve, reject) => {
        testAudio.addEventListener('canplaythrough', resolve, { once: true });
        testAudio.addEventListener('error', reject, { once: true });
        testAudio.load();
      });
      
      customMessageSound = {
        url: audioUrl,
        name: fileName
      };
      localStorage.setItem('customMessageSound', JSON.stringify(customMessageSound));
      console.log('Custom sound set successfully:', fileName);
    } else {
      customMessageSound = null;
      localStorage.removeItem('customMessageSound');
      console.log('Custom sound removed');
    }
    return true;
  } catch (error) {
    console.error('Error setting custom sound:', error);
    return false;
  }
};

// Get custom message sound
export const getCustomMessageSound = () => {
  return customMessageSound;
};

// Get audio status
export const isAudioOn = () => {
  return isAudioEnabled;
};

// Initialize audio settings from localStorage
export const initAudioSettings = () => {
  const savedSetting = localStorage.getItem('audioEnabled');
  if (savedSetting !== null) {
    isAudioEnabled = savedSetting === 'true';
  }
  
  // Load custom sound from localStorage
  try {
    const savedSound = localStorage.getItem('customMessageSound');
    if (savedSound) {
      customMessageSound = JSON.parse(savedSound);
    }
  } catch (error) {
    console.warn('Could not load custom sound from storage:', error);
  }
  
  // Initialize audio context on first user interaction
  const initOnInteraction = () => {
    initAudioContext();
    document.removeEventListener('click', initOnInteraction);
    document.removeEventListener('touchstart', initOnInteraction);
  };
  
  document.addEventListener('click', initOnInteraction);
  document.addEventListener('touchstart', initOnInteraction);
};

// Call this when the app starts
initAudioSettings();