// src/components/ServiceStatus.js
import {
    Box,
    Paper,
    Typography,
    Chip,
    LinearProgress,
    Tooltip,
    Skeleton
} from '@mui/material';
import { FaCircleCheck } from 'react-icons/fa6';
import { FaDesktop, FaTimes } from 'react-icons/fa';
import useAxiosPrivate from '../../utils/hooks/instance/axiosprivate.instance';
import { useQuery } from '@tanstack/react-query';


function ServiceStatus() {
    const axiosPrivate = useAxiosPrivate();
    const fetchSeachStatus = async () => {
        try {
            const response = await axiosPrivate.get('api/v2/osint/status');
            return response.data // Return the user data if successful
        } catch (error) {
            throw new Error(`An unknown error occurred while fetching user data.:${error}`);
        }
    };

    // Use React Query for fetching user data
    const { data: status, isLoading } = useQuery({
        queryKey: ['currentUser'],
        queryFn: fetchSeachStatus,
        staleTime: 5 * 60 * 1000, // ✅ Keep data fresh for 5 mi
        retry: 3,  // ✅ Retry 3 times if API fails
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000), // ✅ Exponential backoff
        refetchOnWindowFocus: false, // Disable refetching on window focus
    });
    
    if (isLoading) {
        return (
            <Paper sx={{ p: 2, mb: 3, backgroundColor: 'background.paper' }}>
                <Skeleton variant="text" width={200} height={30} />
                <Skeleton variant="rectangular" height={20} sx={{ mt: 1 }} />
            </Paper>
        );
    }

    if (!status) {
        return null;
    }

    const getStatusChip = (isOk, label, icon) => (
        <Tooltip title={isOk ? 'Configured correctly' : 'Not configured'}>
            <Chip
                icon={icon}
                label={label}
                color={isOk ? 'success' : 'error'}
                variant="outlined"
                size="small"
                sx={{ mr: 1, mb: 0.5 }}
            />
        </Tooltip>
    );

    return (
        <Paper sx={{ p: 2, mb: 3, backgroundColor: 'background.paper' }}>
            <Typography variant="subtitle1" gutterBottom>
                System Status
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
                {getStatusChip(
                    status.google_api_configured,
                    'Google API',
                    status.google_api_configured ? <FaCircleCheck /> : <FaTimes />
                )}

                {getStatusChip(
                    status.browser,
                    `Browser: ${status.browser}`,
                    <FaDesktop />
                )}

                <Chip
                    label={status.headless_mode ? 'Headless' : 'Visible'}
                    size="small"
                    variant="outlined"
                    sx={{ mr: 1, mb: 0.5 }}
                />

                <Chip
                    label={status.environment}
                    size="small"
                    color={status.environment === 'production' ? 'warning' : 'info'}
                    variant="outlined"
                />
            </Box>

            {!status.google_api_configured && (
                <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
                    ⚠️ Google API keys not configured. Search functionality may be limited.
                </Typography>
            )}
        </Paper>
    );
}

export default ServiceStatus;