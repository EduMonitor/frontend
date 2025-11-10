import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import { NavLink } from 'react-router-dom';
import { lazy, Suspense, useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { footerText } from '../../constants/string.constants';
import { useLogout } from '../../utils/hooks/logout/logout.logout';
import useAxiosPrivate from '../../utils/hooks/instance/axiosprivate.instance';
import useCurrentUser from '../../utils/hooks/current/user.currents';
import { sidebarMenuItems } from '../../constants/items.constants';
import Spinner from '../spinner/spinners.spinners';
import { AnimatedGrid, FloatingElements } from '../animations/background.animations';
import { aiFeatures } from '../../auth/sections/aifeature.sections';
import useAuthTheme from '../../auth/sections/themeHook.sections';

// Lazy load components
const SideBarContent = lazy(() => import('./content.sidebar'));
const MobileNav = lazy(() => import('./mobile.sidebar'));

const MainSideBar = ({ children, title }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const theme = useTheme();
    const themes = useAuthTheme();
    const currentYear = new Date().getFullYear();
    const logout = useLogout();
    const axiosPrivate = useAxiosPrivate();

    const { currentUser, isLoading: userLoading } = useCurrentUser();

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleLogout = () => {
        logout();
    };

    // Fetch notifications
    const fetchNotifications = async () => {
        const response = await axiosPrivate.get('/api/v2/notifications');
        const result = response?.data?.data.filter(notification => !notification.read);
        return result;
    };

    const { data: notifications, refetch } = useQuery({
        queryKey: ['notificationsUsers'],
        queryFn: fetchNotifications,
        staleTime: 5 * 60 * 1000,
        retry: 3,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
        refetchOnWindowFocus: false,
        refetchInterval: 60 * 1000,
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

    // Generate menu items based on user role
    const menuItems = currentUser
        ? sidebarMenuItems([currentUser?.role])
        : [];

    // Show spinner for user data loading (separate from component loading)
    if (userLoading) {
        return <Spinner isLoading={userLoading} />;
    }

    // Common props for sidebar components
    const sidebarProps = {
        onClick: handleLogout,
        onClose: handleDrawerToggle,
        menuItems,
    };

    const mobileNavProps = {
        onOpen: handleDrawerToggle,
        title,
        notifications,
        markAsRead,
        profileImage: currentUser?.profileImage,
        name: `${currentUser?.firstName} ${currentUser?.lastName}`,
        onLogout: handleLogout,
        userRole: currentUser?.role,
    };

    return (
        <Box>
            {/* Single Suspense boundary for all sidebar components */}
            <Suspense fallback={<Spinner isLoading={userLoading} />}>
                {/* Desktop Sidebar */}
                <SideBarContent
                    sx={{ display: { xs: 'none', md: 'block' } }}
                    {...sidebarProps}
                />

                {/* Mobile Drawer */}
                <Drawer
                    anchor="left"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': { 
                            boxSizing: 'border-box', 
                            width: 250,
                            backgroundColor: theme.palette.sidebar || theme.palette.background.paper,
                            backgroundImage: 'none',
                        },
                    }}
                >
                    <SideBarContent {...sidebarProps} />
                </Drawer>

                {/* Mobile Navigation */}
                <MobileNav {...mobileNavProps} />
            </Suspense>

            {/* Main Content Area */}
            <Box sx={{
                ml: { sm: "0", md: "250px" },
                p: { md: 4, sm: 0, xs: 0 },
                mt: 5,
                mb: 3,
              
               
                
                background: themes.background || theme.palette.background.default,
                backgroundRepeat: 'no-repeat',
                color: theme.palette.text.primary,
            }}>
                {/* Background Components */}
                <FloatingElements aiFeatures={aiFeatures} />
                <AnimatedGrid />
                {children}

                {/* Footer */}
                <Box
                    position="fixed"
                    display="flex"
                    sx={{
                        bottom: "0",
                        left: "0",
                        width: { sm: "100vw", md: "calc(100% - 250px)", xs: "100vw" },
                        ml: { sm: "0", md: "250px" },
                        p: 2,
                        justifyContent: "center",
                        bgcolor: theme.palette.background.paper,
                        borderTop: `1px solid ${theme.palette.divider}`,
                        zIndex: "1000",
                        boxShadow: theme.shadows[4],
                        backdropFilter: 'blur(8px)',
                        mt: "40"
                    }}
                >
                    <Typography 
                        variant="body2"
                        sx={{
                            color: theme.palette.text.secondary,
                            '& a': {
                                color: theme.palette.error.main,
                                textDecoration: 'none',
                                '&:hover': {
                                    textDecoration: 'underline',
                                    color: theme.palette.error.dark,
                                }
                            }
                        }}
                    >
                        &copy; {currentYear} {footerText.copyRigth}{' '}
                        <NavLink to={footerText.link} target="_blank">
                            {footerText.developedBy}
                        </NavLink>
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

MainSideBar.propTypes = {
    children: PropTypes.node,
    title: PropTypes.string,
};

export default MainSideBar;