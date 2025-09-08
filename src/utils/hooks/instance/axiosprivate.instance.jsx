import { useEffect, useRef, useCallback } from "react";
import { axiosPrivate } from "./axios.instance";
import useRefreshToken from "./refreshtoken.instance";
import { tokenManager } from "../../functions/tokenManagement.functions";
import useAuth from "../contexts/useAth.contexts";

const useAxiosPrivate = () => {
    const { refresh } = useRefreshToken();
    const { auth, setAuth } = useAuth();
    const interceptorsRef = useRef({ request: null, response: null });
    const isInitializedRef = useRef(false);

    // Request interceptor
    const requestInterceptor = useCallback(async (config) => {
        try {
            config.headers = config.headers || {};

            // Add auth token if available
            if (auth?.accessToken && !config.headers.Authorization) {
                config.headers.Authorization = `Bearer ${auth.accessToken}`;
            }

            // Handle FormData
            if (config.data instanceof FormData) {
                delete config.headers['Content-Type'];
            } else if (!config.headers['Content-Type']) {
                config.headers['Content-Type'] = 'application/json';
            }

            // Add CSRF token
            if (!config.headers['x-csrf-token']) {
                try {
                    const csrfToken = await tokenManager.getCsrfToken();
                    if (csrfToken) {
                        config.headers['x-csrf-token'] = csrfToken;
                    }
                } catch (csrfError) {
                    console.warn('Failed to get CSRF token:', csrfError);
                }
            }

            console.log('Request config:', {
                url: config.url,
                method: config.method,
                hasAuth: !!config.headers.Authorization,
                headers: Object.keys(config.headers)
            });

            return config;
        } catch (error) {
            console.error('Request interceptor error:', error);
            return Promise.reject(error);
        }
    }, [auth?.accessToken]);

    // Response error interceptor
    const responseErrorInterceptor = useCallback(async (error) => {
        console.log('Response error:', {
            status: error?.response?.status,
            url: error?.config?.url,
            message: error?.message
        });

        const originalRequest = error?.config;

        if (error?.response?.status === 401 && originalRequest && !originalRequest._retry) {
            console.log('401 error - attempting token refresh');

            // Handle concurrent refresh attempts
            if (tokenManager.isRefreshing) {
                console.log('Token refresh already in progress, queuing request');
                return new Promise((resolve, reject) => {
                    tokenManager.failedQueue.push({ resolve, reject });
                }).then(token => {
                    if (token) {
                        originalRequest.headers = originalRequest.headers || {};
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return axiosPrivate(originalRequest);
                    }
                    throw new Error('No token received from queue');
                }).catch(err => {
                    console.error('Queued request failed:', err);
                    throw err;
                });
            }

            originalRequest._retry = true;
            tokenManager.isRefreshing = true;

            try {
                console.log('Calling refresh token');
                const newAccessToken = await refresh();

                if (newAccessToken) {
                    console.log('Token refresh successful');
                    tokenManager.processQueue(null, newAccessToken);

                    // Retry original request with new token
                    originalRequest.headers = originalRequest.headers || {};
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return axiosPrivate(originalRequest);
                } else {
                    console.error('Token refresh returned no token');
                    throw new Error('Token refresh failed - no token returned');
                }

            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                tokenManager.processQueue(refreshError);

                // Clear auth state and redirect on refresh failure
                if (refreshError?.response?.status === 401 || refreshError?.response?.status === 403) {
                    setAuth(null);
                    // Use navigate from context instead of window.location
                    // This should be handled by the component using this hook
                }

                throw refreshError;
            } finally {
                tokenManager.isRefreshing = false;
            }
        }

        throw error;
    }, [refresh, setAuth]);

    // Setup interceptors
    useEffect(() => {
        // Skip if already initialized and dependencies haven't changed
        if (isInitializedRef.current) {
            return;
        }

        console.log('Setting up axios interceptors');

        const { request: reqId, response: resId } = interceptorsRef.current;

        // Clean up existing interceptors
        if (reqId !== null) {
            axiosPrivate.interceptors.request.eject(reqId);
        }
        if (resId !== null) {
            axiosPrivate.interceptors.response.eject(resId);
        }

        // Add new interceptors
        const requestId = axiosPrivate.interceptors.request.use(
            requestInterceptor,
            error => {
                console.error('Request interceptor error:', error);
                return Promise.reject(error);
            }
        );

        const responseId = axiosPrivate.interceptors.response.use(
            response => {
                console.log('Response success:', {
                    status: response.status,
                    url: response.config?.url
                });
                return response;
            },
            responseErrorInterceptor
        );

        interceptorsRef.current.request = requestId;
        interceptorsRef.current.response = responseId;
        isInitializedRef.current = true;

        return () => {
            console.log('Cleaning up axios interceptors');
            if (requestId !== null) {
                axiosPrivate.interceptors.request.eject(requestId);
            }
            if (responseId !== null) {
                axiosPrivate.interceptors.response.eject(responseId);
            }
            isInitializedRef.current = false;
        };
    }, [requestInterceptor, responseErrorInterceptor]);

    return axiosPrivate;
};

export default useAxiosPrivate;