import { useEffect } from "react";
import useRefreshToken from "./refreshtoken.hooks";
import { axiosPrivate } from "./axios.instance";
import useAuth from "../contexts/useAth.contexts";

const useAxiosPrivate = () => {
    const refresh = useRefreshToken(); // Pass CSRF token here
    const { auth, crsfToken } = useAuth();

    useEffect(() => {
        const requestIntercept = axiosPrivate.interceptors.request.use(
            config => {
                // Set Authorization header
                if (!config.headers['Authorization']) {
                    config.headers['Authorization'] = `Bearer ${auth?.accessToken}`;
                }
                // Conditionally set Content-Type header
                if (config.data && config.data instanceof FormData) {
                    config.headers['Content-Type'] = 'multipart/form-data';
                } else {
                    config.headers['Content-Type'] = 'application/json';
                }
                if (crsfToken) {
                    config.headers['x-csrf-token'] = crsfToken;
                }
                return config;

            },
            (error) => Promise.reject(error)
        );

        const responseIntercept = axiosPrivate.interceptors.response.use(
            response => response,
            async (error) => {
                const prevRequest = error?.config;
                if (error?.response?.status === 401 && !prevRequest?.sent) {
                    prevRequest.sent = true;
                    const newAccessToken = await refresh(); // Attempt to refresh token
                    prevRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                    return axiosPrivate(prevRequest); // Retry original request with new token
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axiosPrivate.interceptors.request.eject(requestIntercept);
            axiosPrivate.interceptors.response.eject(responseIntercept);
        };
    }, [auth, crsfToken, refresh]);

    return axiosPrivate; // Return the configured axios instance
};

export default useAxiosPrivate;
