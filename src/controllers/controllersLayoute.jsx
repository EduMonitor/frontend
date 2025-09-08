import { Outlet, useLocation } from "react-router-dom";
import { useMemo } from "react";
import { Box, CircularProgress, Typography, Alert } from "@mui/material";
import MainSideBar from "../components/sidebar/main.sidebar";
import useCurrentUser from "../utils/hooks/current/user.currents";

const ControllerLayout = () => {
    const location = useLocation();
    const { 
        currentUser, 
        isLoading, 
        isAuthenticated,
        isError, 
        refetch 
    } = useCurrentUser();
    // Extract page title from current route
    const pageTitle = useMemo(() => {
        const pathSegments = location.pathname.split('/').filter(Boolean);
       
        // Get the last segment and format it as title
        if (pathSegments.length >= 2) {
            const lastSegment = pathSegments[pathSegments.length - 1];
            const secondLastSegment = pathSegments[pathSegments.length - 2];
           
            // Format titles based on route structure
            const titleMap = {
                'dashboard': 'Dashboard',
                'new': 'New Analysis',
                'results': secondLastSegment === 'analysis' ? 'Analysis Results' : 'Results',
                'filters': 'Advanced Filters',
                'trends': 'Trends & Patterns',
                'alerts': 'Alerts & Flags',
                'list': 'Notifications',
                'generate': 'Generate Report',
                'download': 'Download Reports',
                'users': 'User Management',
                'ai-config': 'AI Model Settings',
                'theme': 'Theme Settings'
            };
           
            return titleMap[lastSegment] || lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
        }
       
        return 'Dashboard';
    }, [location.pathname]);

    // Loading state - show while fetching user data
    if (isLoading) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                minHeight="100vh"
                gap={2}
            >
                <CircularProgress size={48} />
                <Typography variant="h6" color="text.secondary">
                    Loading user data...
                </Typography>
            </Box>
        );
    }

    // Error state - show if user data fetch failed
    if (isError) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                minHeight="100vh"
                gap={2}
                p={3}
            >
                <Alert 
                    severity="error" 
                    sx={{ maxWidth: 400 }}
                    action={
                        <button onClick={() => refetch()}>
                            Retry
                        </button>
                    }
                >
                    <Typography variant="h6" gutterBottom>
                        Failed to load user data
                    </Typography>
                    <Typography variant="body2">
                        { 'Unable to fetch user information. Please try again.'}
                    </Typography>
                </Alert>
            </Box>
        );
    }

    // User not authenticated or no user data
    if (!isAuthenticated || !currentUser) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                minHeight="100vh"
                gap={2}
            >
                <Typography variant="h6" color="text.secondary">
                    Authentication required
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Redirecting to login...
                </Typography>
            </Box>
        );
    }

    // User data confirmed - render the main layout
    return (
        <MainSideBar title={pageTitle}>
            <Outlet context={{ currentUser }} />
        </MainSideBar>
    );
};

export default ControllerLayout;