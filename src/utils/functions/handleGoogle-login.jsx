// utils/auth/google.auth.js
import { fetchCsrfToken } from '../hooks/token/csrf.token';

/**
 * Handle Google Sign-In with Authlib (Simplified)
 * 
 * Flow:
 * 1. User clicks "Sign in with Google"
 * 2. Redirect directly to backend /auth/google/login
 * 3. Backend (Authlib) redirects to Google
 * 4. User authorizes on Google
 * 5. Google redirects to backend /auth/google/callback
 * 6. Backend processes and redirects to frontend with success/error
 * 7. Frontend handles the redirect parameters
 */
export const handleGoogleSignIn = async (setIsLoading) => {
  try {
    setIsLoading(true);

    // With Authlib, we simply redirect to the backend endpoint
    // The backend will handle the OAuth flow and redirect to Google
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const googleLoginUrl = `${backendUrl}/auth/google/login`;

    // Direct redirect - no CSRF needed for GET redirect
    window.location.href = googleLoginUrl;

  } catch (error) {
    console.error("Google login initialization error:", error);
    setIsLoading(false);
    alert("Failed to initialize Google login. Please try again.");
  }
};


/**
 * Alternative: With CSRF protection (if your backend requires it)
 * Use this if you want to verify CSRF before redirecting
 */
export const handleGoogleSignInWithCSRF = async (setIsLoading) => {
  try {
    setIsLoading(true);

    // Fetch CSRF token (if needed for your backend)
    const csrfToken = await fetchCsrfToken();
    console.log('CSRF Token obtained:', csrfToken);

    // Build URL
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const googleLoginUrl = `${backendUrl}/auth/google/login`;

    // Redirect (browser will include cookies automatically)
    window.location.href = googleLoginUrl;

  } catch (error) {
    console.error("Google login error:", error);
    handleGoogleLoginError(error, setIsLoading);
  }
};


/**
 * Handle OAuth callback redirect
 * Call this in your login page component on mount
 */
export const handleGoogleCallback = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const loginStatus = urlParams.get('login');
  const error = urlParams.get('error');

  if (loginStatus === 'success') {
    // Success! JWT is already set in HTTP-only cookie by backend
    console.log('✅ Google login successful!');
    
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Redirect to dashboard or fetch user data
    return { success: true, message: 'Login successful' };
  }

  if (error) {
    console.error('❌ Google login failed:', error);
    
    // Map error codes to user-friendly messages
    const errorMessages = {
      'invalid_state': 'Security validation failed. Please try again.',
      'state_reused': 'This login link has already been used. Please try again.',
      'authentication_failed': 'Authentication failed. Please try again.',
      'unexpected_error': 'An unexpected error occurred. Please try again.',
      'Email permission is required': 'Email permission is required to sign in.',
      'Please use a verified Google email': 'Please use a verified Google email address.',
    };

    const errorMessage = errorMessages[error] || 'Login failed. Please try again.';
    
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    return { success: false, message: errorMessage };
  }

  return null; // No callback parameters
};


/**
 * Detailed error handler
 */
const handleGoogleLoginError = (error, setIsLoading) => {
  setIsLoading(false);

  if (error.code === 'ERR_NETWORK') {
    console.error('❌ Network Error:');
    console.error('   → Backend server not running?');
    console.error('   → Check API URL:', import.meta.env.VITE_API_BASE_URL);
    console.error('   → CORS misconfigured?');
    alert('Cannot connect to server. Please check your connection.');
    return;
  }

  if (error.response) {
    // Server responded with error
    console.error('❌ Server Error:', error.response.status);
    console.error('   → Response:', error.response.data);
    
    const message = error.response.data?.message || 'Server error';
    alert(`Login failed: ${message}`);
    return;
  }

  if (error.request) {
    // Request made but no response
    console.error('❌ No Response:');
    console.error('   → Request sent but server did not respond');
    console.error('   → Check if backend is running on correct port');
    alert('Server not responding. Please try again later.');
    return;
  }

  // Other errors
  console.error('❌ Error:', error.message);
  alert('An unexpected error occurred. Please try again.');
};


/**
 * Example usage in React component:
 * 
 * import { handleGoogleSignIn, handleGoogleCallback } from '@/utils/auth/google.auth';
 * 
 * function LoginPage() {
 *   const [isLoading, setIsLoading] = useState(false);
 * 
 *   // Handle callback on page load
 *   useEffect(() => {
 *     const result = handleGoogleCallback();
 *     if (result?.success) {
 *       // Redirect to dashboard
 *       navigate('/dashboard');
 *     } else if (result?.message) {
 *       // Show error
 *       toast.error(result.message);
 *     }
 *   }, []);
 * 
 *   return (
 *     <button 
 *       onClick={() => handleGoogleSignIn(setIsLoading)}
 *       disabled={isLoading}
 *     >
 *       {isLoading ? 'Redirecting...' : 'Sign in with Google'}
 *     </button>
 *   );
 * }
 */