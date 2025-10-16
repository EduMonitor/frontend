import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import useAxiosPrivate from '../instance/axiosprivate.instance';
import { AuthRoutes } from '../../../constants/routes.constant';


const useCurrentUser = () => {
    const axiosPrivate = useAxiosPrivate();
    const navigate = useNavigate();

    // Fetch function for current user with try-catch block
    const fetchCurrentUser = async () => {
        try {
            const response = await axiosPrivate.get('/api/v2/user/me');
            return response.data // Return the user data if successful
        } catch (error) {
            // Handle error explicitly
            if (error.response) {
                if (error.message === "Unauthorized") {
                    navigate(AuthRoutes.signIn); // Navigate on specific error
                } else {
                    console.error("Error fetching current user:", error.message); // Log unexpected errors
                }// Rethrow the error for React Query's onError handler
            } else {
                // Handle network or other errors
                throw new Error("An unknown error occurred while fetching user data.");
            }
        }
    };

    // Use React Query for fetching user data
    const { data: user, isError, isLoading , refetch, error} = useQuery({
        queryKey: ['currentUser'],
        queryFn: fetchCurrentUser,
        staleTime: 5 * 60 * 1000, // ✅ Keep data fresh for 5 mi
        retry: 3,  // ✅ Retry 3 times if API fails
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000), // ✅ Exponential backoff
        refetchOnWindowFocus: false, // Disable refetching on window focus

    });
    return { currentUser:user?.user, isAuthenticated:user?.isAuthenticated, isError, isLoading, refetch, error };
};

export default useCurrentUser;
