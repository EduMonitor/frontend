import { useCallback, useRef } from 'react';
import useAuth from '../contexts/useAth.contexts';
import { axiosPrivate } from './axios.instance';
import { fetchCsrfToken } from '../token/csrf.token';

const useRefreshToken = () => {
    const { setAuth } = useAuth();
    const refreshPromiseRef = useRef(null);

    const refresh = useCallback(async () => {
        // Return existing refresh promise if already in progress
        if (refreshPromiseRef.current) {
            return refreshPromiseRef.current;
        }

        // Create and store the refresh promise
        refreshPromiseRef.current = (async () => {
            try {
                // Get fresh CSRF token
                const csrfToken = await fetchCsrfToken();
                
                if (!csrfToken) {
                    throw new Error('Failed to fetch CSRF token');
                }

                // Call refresh endpoint
                const response = await axiosPrivate.get('/api/v2/refresh', {
                    headers: {
                        'x-csrf-token': csrfToken,
                    },
                    timeout: 10000,
                });

                const { role, accessToken, refreshToken } = response.data;

                // Validate response
                if (!accessToken) {
                    throw new Error('No access token received from server');
                }
                // Update auth state
                setAuth(prev => ({
                    ...prev,
                    role,
                    accessToken,
                    ...(refreshToken && { refreshToken })
                }));

                return accessToken;

            } catch (error) {
                // Handle 401 - Refresh token expired
                if (error.response?.status === 401) {
                    setAuth(null);
                    
                    if (typeof window !== 'undefined') {
                        window.location.href = '/auth/signin';
                    }
                    return null;
                }

             // Don't throw on network errors - just return null
                if (!error.response) {
                    console.warn('Network error during refresh - keeping current session');
                    return null;
                }

                return null;

            } finally {
                // Clear the refresh promise when done
                refreshPromiseRef.current = null;
            }
        })();

        return refreshPromiseRef.current;
    }, [setAuth]);

    return refresh;
};

export default useRefreshToken;