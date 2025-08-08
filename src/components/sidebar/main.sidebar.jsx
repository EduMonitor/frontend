import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';

import { NavLink } from 'react-router-dom';
import { lazy, Suspense, useCallback, useState } from 'react';
import { CircularProgress } from '@mui/material';
import { useFooterHeaders } from '../../../constant/strings/text.strings';
import { useLogout } from '../../../utiles/config/logout.config/logout.config';
import useCurrentUser from '../../../utiles/config/currentuser.config/current.user.config';
import TextLoading from '../../spinners/spinners.spinners';
import { useQuery } from '@tanstack/react-query';
import useAxiosPrivate from '../../../utiles/config/hooks.config/axiosprivate.hooks';


const UsersSidebarContent = lazy(() => import('./users.content.sidebar'));
const UsersMobileNav = lazy(() => import('./users.mobile.sidebar'));

const UsersSidebar = ({ children, title }) => {
    const copyrightText = useFooterHeaders();
    const [mobileOpen, setMobileOpen] = useState(false);
    const theme = useTheme()
    const currentYear = new Date().getFullYear();
    const logout = useLogout();
    const { currentUser } = useCurrentUser()
    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };
    const axiosPrivate = useAxiosPrivate()

    const handleLogout = () => {
        logout();
    };
    const fetchNotifications = async () => {
        const response = await axiosPrivate.get('/api/v2/notifications');
        const result = response?.data?.data.filter(notification => !notification.read)
        return result;
    }
    // Use React Query for fetching user data
    const { data: notifications, refetch } = useQuery({
        queryKey: ['notificationsUers'],
        queryFn: fetchNotifications,
        staleTime: 5 * 60 * 1000, // ✅ Keep data fresh for 5 mi
        retry: 3,  // ✅ Retry 3 times if API fails
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000), // ✅ Exponential backoff
        refetchOnWindowFocus: false, // Disable refetching on window focus
        refetchInterval: 60 * 1000, // Refetch every 60 seconds

    });
     const markAsRead = useCallback(async (notifId) => {
            try {
              const response = await axiosPrivate.put(`/api/v2/notifications/${notifId}`);
              if (response.status === 200) {
                refetch();
              }
            } catch (error) {
              console.error('Failed to mark notification as read:', error);
            }
          }, [axiosPrivate, refetch]);
          


    const drawer = (
        <Suspense fallback={<TextLoading />}>
            <UsersSidebarContent onClose={handleDrawerToggle} onClick={handleLogout} />
        </Suspense>
    );

    return (
        <Box minHeight={"100vh"}>
            {/* UsersSidebar for desktop view */}
            <Suspense fallback={<TextLoading />}>
                <UsersSidebarContent
                    sx={{
                        display: { xs: 'none', md: 'block' }
                    }}
                    onClick={handleLogout}
                    onClose={handleDrawerToggle}
                />
            </Suspense>
            <Drawer
                anchor="left"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
                }}
            >
                {drawer}
            </Drawer>
            <Suspense fallback={<CircularProgress />}>
                <UsersMobileNav onOpen={handleDrawerToggle}
                    title={title}
                    notifications={notifications}
                    markAsRead={markAsRead}
                    profileImage={currentUser?.profileImage}
                    name={`${currentUser?.firstName} ${currentUser?.lastName}`}
                    onLogout={handleLogout}
                />
            </Suspense>
            <Box sx={{
                ml: { sm: "0", md: "250px" },
                p: { md: 4, sm: 0, xs: 0 },
                mt: 5,
                mb: 3,
                minHeight: "100vh",
                overflow: "hidden",
                overflowY: "auto",
                position: 'relative',
                backgroundImage: `
            radial-gradient(ellipse 80% 50% at 50% -20%, hsl(211, 42.90%, 12.40%), transparent),
            radial-gradient(ellipse 80% 50% at 50% 120%, hsl(210, 43.80%, 12.50%), transparent)
          `, backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
            }}
            >
                {children}

                <Box
                    position="fixed"
                    display="flex"
                    sx={{
                        bottom: "0", left: "0",
                        width: { sm: "100vw", md: "calc(100% - 250px)", xs: "100vw", },
                        ml: { sm: "0", md: "250px" },
                        p: 2,
                        justifyContent: "center",
                        bgcolor: theme.palette.primary.main,
                        borderTopWidth: "1px",
                        borderTopColor: theme.palette.primary.main,
                        zIndex: "1000",

                        backgroundColor: theme.palette.grey[800],
                        boxShadow: '0px -4px 8px rgba(0, 0, 0, 0.2)',
                     backdropFilter: 'blur(8px)', // Blur effect
                        mt: "40"
                    }}
                >
                    <Typography variant="body2">
                        &copy; {currentYear} {copyrightText.copyright}{' '}
                        <NavLink to="https://self-sec.com" target="_blank" style={{ color: 'red' }}>
                            self-sec
                        </NavLink>
                    </Typography>
                </Box>
            </Box>

        </Box>
    );
};

UsersSidebar.propTypes = {
    children: PropTypes.node,
    title: PropTypes.string,
};

export default UsersSidebar;
