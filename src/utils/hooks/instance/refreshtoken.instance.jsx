import { useCallback, useRef } from 'react';
import { axiosPrivate } from './axios.instance';
import { ErrorHandler } from '../error/handler.error';
import { tokenManager } from '../../functions/tokenManagement.functions';
import useAuth from '../contexts/useAth.contexts';



// Singleton instance


const useRefreshToken = () => {
    const { setAuth } = useAuth();
    const abortControllerRef = useRef(null);

    const refresh = useCallback(async () => {
        // Return existing refresh promise if already in progress
        if (tokenManager.refreshPromise) {
            return tokenManager.refreshPromise;
        }

        // Cancel any existing request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new abort controller for this refresh attempt
        abortControllerRef.current = new AbortController();

        tokenManager.refreshPromise = (async () => {
            let csrfToken = null;

            try {
                // Get CSRF token (cached or fresh)
                csrfToken = await tokenManager.getCachedCsrfToken();

                const response = await axiosPrivate.get('/api/v2/refresh', {
                    headers: {
                        'x-csrf-token': csrfToken,
                    },
                    signal: abortControllerRef.current?.signal,
                    // Add timeout to prevent hanging requests
                    timeout: 10000, // 10 seconds
                });

                const { role, accessToken, refreshToken } = response.data;

                // Validate response data
                if (!accessToken) {
                    throw new Error('No access token received from refresh endpoint');
                }

                // Update auth state with new tokens
                setAuth(prev => ({
                    ...prev,
                    role,
                    accessToken,
                    // Update refresh token if provided
                    ...(refreshToken && { refreshToken })
                }));

                return accessToken;

            } catch (error) {
                let backendErrorMessage = "An unknown error occurred";

                // Check if backend sent structured error
                if (error.response?.data?.error) {
                    backendErrorMessage = error.response.data.error.message;
                }
                // Check if backend sent simple message/status
                else if (error.response?.data?.message) {
                    backendErrorMessage = error.response.data.message;
                }
                // Fallback to Axios error message
                else if (error.message) {
                    backendErrorMessage = error.message;
                }

                // Handle Abort
                if (error.name === "AbortError") {
                    console.log("Refresh request was cancelled");
                    return null;
                }

                // Clear cached CSRF token
                tokenManager.clearCsrfToken();

                // Handle 401 → refresh token expired
                if (error.response?.status === 401) {
                    console.warn("401 Unauthorized:", backendErrorMessage);

                    setAuth(null);

                    if (typeof window !== "undefined") {
                        window.location.href = "/auth/signin";
                    }
                    return null;
                }

                // Handle 403 → CSRF or forbidden
                if (error.response?.status === 403) {
                    console.warn("403 Forbidden:", backendErrorMessage);
                    throw new Error(backendErrorMessage);
                }

                // Network or unknown error
                if (!error.response) {
                    console.warn("Network error during token refresh, keeping current auth state");
                }

                // Pass detailed error to central handler (with backend message)
                ErrorHandler(
                    { ...error, message: backendErrorMessage },
                    import.meta.env.VITE_APP_ENV
                );

                return null;
            }
            finally {
                // Clear refresh promise when done
                tokenManager.clearRefreshPromise();

                // Clear abort controller
                if (abortControllerRef.current) {
                    abortControllerRef.current = null;
                }
            }
        })();

        return tokenManager.refreshPromise;
    }, [setAuth]);

    // Cleanup function to cancel any pending requests
    const cancelRefresh = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        tokenManager.clearRefreshPromise();
    }, []);

    // Check if refresh is currently in progress
    const isRefreshing = useCallback(() => {
        return tokenManager.isRefreshing();
    }, []);

    // Manual CSRF token refresh utility
    const refreshCsrfToken = useCallback(async () => {
        tokenManager.clearCsrfToken();
        return await tokenManager.getCachedCsrfToken();
    }, []);

    return {
        refresh,
        cancelRefresh,
        isRefreshing,
        refreshCsrfToken
    };
};

export default useRefreshToken;