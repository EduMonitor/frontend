// src/utils/facebook-sdk.util.js
export const loadFacebookSDK = () => {
  return new Promise((resolve, reject) => {
    // Check if SDK is already loaded
    if (window.FB) {
      resolve();
      return;
    }

    // Check if script tag already exists
    if (document.getElementById('facebook-jssdk')) {
      // Wait for existing script to load
      window.fbAsyncInit = function() {
        window.FB.init({
          appId: import.meta.env.VITE_FACEBOOK_APP_ID,
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
        resolve();
      };
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';

    // Setup initialization callback
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: import.meta.env.VITE_FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
      resolve();
    };

    // Handle script loading errors
    script.onerror = () => {
      reject(new Error('Failed to load Facebook SDK'));
    };

    // Append script to document
    document.body.appendChild(script);
  });
};