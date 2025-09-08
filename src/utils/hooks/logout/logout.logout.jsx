import useAuth from "../contexts/useAth.contexts";
import { ErrorHandler } from "../error/handler.error";
import { axiosPrivate } from "../instance/axios.instance";

export const useLogout = () => {
    const { setAuth } = useAuth();
  
    const logout = async () => {
      try {
        const response = await axiosPrivate.get("/api/v2/logout");
  
        if (response.status === 204) {
          setAuth({}); // Clear auth state after logout
  
         
        } else {
          console.warn("Unexpected logout response:", response);
        }
      } catch (error) {
        ErrorHandler(error, import.meta.env.VITE_APP_ENV);
      }
    };
  
    return logout;
  };