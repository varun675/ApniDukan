// PWA Service Worker Registration and Update Check
export function registerPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const swUrl = '/ApniDukan/sw.js';
        const registration = await navigator.serviceWorker.register(swUrl, {
          scope: '/ApniDukan/',
        });

        console.log('Service Worker registered:', registration);

        // Check for updates periodically
        setInterval(async () => {
          try {
            await registration.update();
          } catch (error) {
            console.warn('Error checking for Service Worker updates:', error);
          }
        }, 60000); // Check every 60 seconds

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // New service worker available
                console.log('New Service Worker available - update ready');
                // Optionally notify user about update
                if (window.confirm('New version available! Reload to update?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          }
        });

        // Handle controller change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('Service Worker controller changed');
        });
      } catch (error) {
        console.warn('Service Worker registration failed:', error);
      }
    });

    // Handle offline notification
    window.addEventListener('offline', () => {
      console.warn('App is now offline - using cached content');
    });

    window.addEventListener('online', () => {
      console.log('App is back online');
    });
  }
}

// Check if app is installable
export function checkInstallability() {
  let deferredPrompt: any;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('App is installable');
  });

  return {
    canInstall: () => !!deferredPrompt,
    install: async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
        deferredPrompt = null;
      }
    },
  };
}
