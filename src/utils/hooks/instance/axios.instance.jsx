import axios from 'axios';

export const axiosPrivate = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { 'Content-Type': 'application/json','X-Requested-With': 'XMLHttpRequest',Accept:"*/*" },
    withCredentials: true, // Ensure cookies are sent with requests
    withXSRFToken:true
});
