// src/utils/hooks/auth/useFacebookAuth.js
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useToast from '../../components/toast/toast.toast';
import useAuth from '../hooks/contexts/useAth.contexts';
import { loadFacebookSDK } from './facebook-sdk';
import { fetchCsrfToken } from '../hooks/token/csrf.token';
import { axiosPrivate } from '../hooks/instance/axios.instance';

/**
 * Custom hook for Facebook authentication
 * Handles the complete Facebook login flow using client-side OAuth
 */
const useFacebookAuth = () => {
    const [isFacebookLoading, setIsFacebookLoading] = useState(false);
    const { showToast, ToastComponent } = useToast();
    const { setAuth } = useAuth();
    const navigate = useNavigate();

    /**
     * Completes login after getting access token from Facebook
     * @param {string} accessToken - Facebook access token
     */
    const completeFacebookLogin = useCallback(async (accessToken) => {
        setIsFacebookLoading(true);
        
        try {
            console.log('Facebook token received:', accessToken?.substring(0, 20) + '...');
            
            // Get CSRF token for security
            const csrfToken = await fetchCsrfToken();
            console.log('CSRF Token fetched:', csrfToken?.substring(0, 10) + '...');
            
            if (!csrfToken) {
                throw new Error('Failed to fetch CSRF token');
            }

            // Send access token to backend for verification
            const response = await axiosPrivate.post('/api/v2/auth/facebook/login', {
                access_token: accessToken
            }, {
                headers: { "x-csrf-token": csrfToken }
            });

            if (response.data.status === "success") {
                // Set auth context with user data
                setAuth({
                    accessToken: response.data.accessToken,
                    role: response.data.data.role,
                    uuid: response.data.data.uuid,
                    firstName: response.data.data.firstName
                });

                // Navigate to dashboard
                navigate(response.data.redirectUrl, { replace: true });

                // Show success toast
                showToast({
                    title: "Success",
                    description: response.data.message,
                    status: "success"
                });
            } else {
                throw new Error(response.data.message || "Login failed");
            }
        } catch (error) {
            console.error("Facebook login error:", error);
            console.error("Response data:", error.response?.data);
            
            showToast({
                title: "Facebook Login Failed",
                description: error.response?.data?.detail?.message ||
                    error.response?.data?.message ||
                    error.message ||
                    "Unable to login with Facebook",
                status: "error"
            });
        } finally {
            setIsFacebookLoading(false);
        }
    }, [navigate, setAuth, showToast]);

    /**
     * Initiates Facebook login flow using Facebook SDK
     */
    const handleFacebookLogin = useCallback(async () => {
        setIsFacebookLoading(true);
        
        try {
            // Load Facebook SDK if not already loaded
            await loadFacebookSDK();

            // Check if FB is available
            if (!window.FB) {
                throw new Error('Facebook SDK not loaded');
            }

            // Trigger Facebook login with required permissions
            window.FB.login((response) => {
                if (response.authResponse) {
                    // Successfully authenticated - proceed with backend verification
                    completeFacebookLogin(response.authResponse.accessToken);
                } else {
                    // User cancelled login or didn't fully authorize
                    showToast({
                        title: "Facebook Login Cancelled",
                        description: "Please try again and grant permissions",
                        status: "warning"
                    });
                    setIsFacebookLoading(false);
                }
            }, {
                scope: 'public_profile,email',
                return_scopes: true
            });
        } catch (error) {
            console.error("Facebook SDK error:", error);
            showToast({
                title: "Facebook Login Failed",
                description: error.message || "Unable to initialize Facebook login",
                status: "error"
            });
            setIsFacebookLoading(false);
        }
    }, [completeFacebookLogin, showToast]);

    // Return both the loading state, handler, and ToastComponent
    return {
        isFacebookLoading,
        handleFacebookLogin,
        FacebookToastComponent: ToastComponent
    };
};

export default useFacebookAuth;