
export const handleGoogleSignIn = async (setIsLoading) => {
  try {
    setIsLoading(true);

    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const googleLoginUrl = `${backendUrl}/auth/google/login`;

    // Redirect to backend which will redirect to Google
    window.location.href = googleLoginUrl;

  } catch (error) {
    console.error("Google login initialization error:", error);
    setIsLoading(false);
    alert("Failed to initialize Google login. Please try again.");
  }
};


/**
 * Handle Google Callback - Step 2: Process the redirect from backend
 * Backend redirects to: /auth/signin?login=success&token=xxx OR /auth/signin?login=error&error=xxx
 * 
 * @param {Function} setAuth - Set authentication state
 * @param {Function} navigate - React Router navigate function
 * @param {Function} showToast - Toast notification function
 * @param {Function} setIsLoading - Loading state setter
 * @returns {Promise<boolean>} - Returns true if callback was handled
 */
export const handleGoogleCallback = async (setAuth, navigate, showToast, setIsLoading) => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const loginStatus = urlParams.get('login');
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    // Handle error from backend redirect
    if (loginStatus === 'error' && error) {
      console.error('❌ Google authentication failed:', error);
      showToast({
        title: "Login Failed",
        description: decodeURIComponent(error),
        status: "error"
      });
      
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return true;
    }

    // Handle success from backend redirect
    if (loginStatus === 'success' && token) {
      console.log('🔄 Processing Google login success...');
      setIsLoading(true);

      try {
        // Decode the JWT token to get user info (basic decode, not verification)
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          throw new Error('Invalid token format');
        }

        const payload = JSON.parse(atob(tokenParts[1]));
        
        console.log('✅ Google login successful!');

        // Set authentication state
        setAuth({
          accessToken: token,
          role: payload.role || 'user',
          uuid: payload.uuid,
          firstName: payload.firstName || 'User'
        });

        // Persist login
        localStorage.setItem("persist", true);

        // Clean URL before redirect
        window.history.replaceState({}, document.title, window.location.pathname);

        // Show success message
        showToast({
          title: "Success",
          description: `Welcome back!`,
          status: "success"
        });

        // Navigate to dashboard
        setTimeout(() => {
          navigate('/ai/dashboard', { replace: true });
        }, 500);

        return true;

      } catch (decodeError) {
        console.error('Failed to decode token:', decodeError);
        throw new Error('Invalid authentication token');
      }
    }

    // Not a callback
    return false;

  } catch (error) {
    console.error('❌ Google callback error:', error);
    
    showToast({
      title: "Login Failed",
      description: error.message || "An unexpected error occurred",
      status: "error"
    });

    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    return true;
  } finally {
    setIsLoading(false);
  }
};


/**
 * Map error codes to user-friendly messages
 */