import useAuth from "../contexts/useAth.contexts";
import { axiosPrivate } from "./axios.instance";


const useRefreshToken = () => {
    const { setAuth } = useAuth();
    const refresh = async () => {
        try {
              // Get refresh token from localStorage or cookies
              const storedRefreshToken = localStorage.getItem('refresh_token'); // Persisted token

              if (!storedRefreshToken) {
                  return ('No refresh token available');
              }
            // Get refresh token from memory (auth context)
            // Send refresh token in the request body
            const response = await axiosPrivate.post('/api/refresh', {
                refresh_token: storedRefreshToken, // Pass as body parameter
            }); 
            const newToken = response.data.token;
            const refreshToken = response.data.refresh_token;
            localStorage.setItem('refresh_token', refreshToken); // Save the new refresh token
            setAuth(prev => ({
                ...prev,
                role: response.data.role, // Update user roles
                accessToken: newToken, // Update access token
                refreshToken: refreshToken
            }));
            return newToken; // Return the new access token
        } catch (error) {
            console.error('Failed to refresh token:', error);
            throw error; // Re-throw the error for further handling if needed
        }
    };
    return refresh;
};


export default useRefreshToken;
