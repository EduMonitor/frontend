import axios from 'axios';

export const axiosPrivate = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
   headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache', // Prevent unwanted caching issues
    },
    withCredentials: true, // Ensure cookies are sent with requests
    
});
