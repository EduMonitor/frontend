import { useEffect, useRef } from "react";
import useAuth from "../contexts/useAth.contexts";
import useRefreshToken from "./refreshtoken.instance";
import { axiosPrivate } from "./axios.instance";
import { fetchCsrfToken } from "../token/csrf.token";

const useAxiosPrivate = () => {
    const refresh = useRefreshToken();
    const { auth } = useAuth();
    const csrfTokenRef = useRef(null);
    const isRefreshingRef = useRef(false);
    const failedRequestsQueueRef = useRef([]);

    useEffect(() => {
        // Store interceptor IDs in local variables for cleanup
        let requestInterceptor = null;
        let responseInterceptor = null;

        const setupInterceptors = async () => {
            try {
                // Fetch CSRF token once during setup
                csrfTokenRef.current = await fetchCsrfToken();

                // ============== REQUEST INTERCEPTOR ==============
                requestInterceptor = axiosPrivate.interceptors.request.use(
                    (config) => {
                        // Ensure headers object exists
                        config.headers = config.headers || {};

                        // Add Authorization header
                        if (auth?.accessToken && !config.headers.Authorization) {
                            config.headers.Authorization = `Bearer ${auth.accessToken}`;
                        }
                        // Handle Content-Type for FormData
                        if (config.data instanceof FormData) {
                            // Let browser set Content-Type with boundary
                            delete config.headers['Content-Type'];
                        } else if (!config.headers['Content-Type']) {
                            config.headers['Content-Type'] = 'application/json';
                        }
                        // Add CSRF token
                        if (csrfTokenRef.current && !config.headers['x-csrf-token']) {
                            config.headers['x-csrf-token'] = csrfTokenRef.current;
                        }

                        return config;
                    },
                    (error) => {
                        return Promise.reject(error);
                    }
                );

                // ============== RESPONSE INTERCEPTOR ==============
                responseInterceptor = axiosPrivate.interceptors.response.use(
                    (response) => {
                        return response;
                    },
                    async (error) => {
                        const originalRequest = error?.config;
                        // Only handle 401 errors with token refresh
                        if (error?.response?.status === 401 && originalRequest && !originalRequest._retry) {
                            
                            // If already refreshing, queue this request
                            if (isRefreshingRef.current) {
                                
                                return new Promise((resolve, reject) => {
                                    failedRequestsQueueRef.current.push({ resolve, reject, config: originalRequest });
                                });
                            }

                            // Mark as retrying to prevent infinite loops
                            originalRequest._retry = true;
                            isRefreshingRef.current = true;

                            try {
                                // Refresh the access token
                                const newAccessToken = await refresh();

                                if (newAccessToken) {
                                    // Update CSRF token after refresh
                                    csrfTokenRef.current = await fetchCsrfToken();
                                    // Process queued requests with new token
                                    failedRequestsQueueRef.current.forEach(({ resolve, config }) => {
                                        config.headers = config.headers || {};
                                        config.headers.Authorization = `Bearer ${newAccessToken}`;
                                        resolve(axiosPrivate(config));
                                    });
                                    failedRequestsQueueRef.current = [];

                                    // Retry original request with new token
                                    originalRequest.headers = originalRequest.headers || {};
                                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                                    return axiosPrivate(originalRequest);
                                } else {                                    
                                    // Reject all queued requests
                                    failedRequestsQueueRef.current.forEach(({ reject }) => {
                                        reject(new Error('Token refresh failed'));
                                    });
                                    failedRequestsQueueRef.current = [];

                                    throw error;
                                }

                            } catch (refreshError) {
                                console.error('❌ Token refresh failed:', refreshError);

                                // Reject all queued requests
                                failedRequestsQueueRef.current.forEach(({ reject }) => {
                                    reject(refreshError);
                                });
                                failedRequestsQueueRef.current = [];

                                throw error;

                            } finally {
                                isRefreshingRef.current = false;
                            }
                        }

                        // For all other errors, just reject
                        return Promise.reject(error);
                    }
                );

            } catch (error) {
                console.error('❌ Failed to setup axios interceptors:', error);
            }
        };

        // Execute setup
        setupInterceptors();

        // Cleanup function
        return () => {            
            if (requestInterceptor !== null) {
                axiosPrivate.interceptors.request.eject(requestInterceptor);
            }
            if (responseInterceptor !== null) {
                axiosPrivate.interceptors.response.eject(responseInterceptor);
            }

            // Clear refs
            csrfTokenRef.current = null;
            failedRequestsQueueRef.current = [];
        };
    }, [auth?.accessToken, refresh]);

    return axiosPrivate;
};

export default useAxiosPrivate;