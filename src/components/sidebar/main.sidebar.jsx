import PropTypes from 'prop-types';
import { keyframes, styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { lazy, Suspense, useCallback, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { footerText } from '../../constants/string.constants';
import { useLogout } from '../../utils/hooks/logout/logout.logout';
import useAxiosPrivate from '../../utils/hooks/instance/axiosprivate.instance';
import useCurrentUser from '../../utils/hooks/current/user.currents';
import { sidebarMenuItems } from '../../constants/items.constants';
import Spinner from '../spinner/spinners.spinners';
// Lazy load components
const SideBarContent = lazy(() => import('./content.sidebar'));
const MobileNav = lazy(() => import('./mobile.sidebar'));

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// Main container that takes full viewport
const MainContainer = styled(Box)({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
});

// Scrollable content area
const ContentArea = styled(Box)(({ theme }) => ({
  flex: 1,
  marginLeft: 0,
  marginTop: '70px',
  marginBottom: '60px',
  overflowY: 'auto',
  overflowX: 'hidden',
  position: 'relative',
  animation: `${fadeIn} 0.6s ease-out`,
  backgroundColor: theme.palette.mode === 'dark' 
    ? theme.palette.background.default 
    : theme.palette.background.default,
  background: theme.palette.mode === 'dark'
    ? `${theme.palette.background.default} radial-gradient(ellipse 80% 50% at 50% -20%, hsla(142, 60%, 15%, 0.3), transparent), radial-gradient(ellipse 80% 50% at 50% 120%, hsla(142, 60%, 15%, 0.3), transparent)`
    : `${theme.palette.background.default} radial-gradient(ellipse 80% 50% at 50% -20%, hsla(142, 60%, 90%, 0.3), transparent), radial-gradient(ellipse 80% 50% at 50% 120%, hsla(142, 60%, 90%, 0.3), transparent)`,
  backgroundRepeat: 'no-repeat',
  backgroundAttachment: 'local',
  // Custom scrollbar
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.mode === 'dark' 
      ? 'rgba(66, 153, 66, 0.3)' 
      : 'rgba(66, 153, 66, 0.2)',
    borderRadius: '10px',
    '&:hover': {
      background: theme.palette.mode === 'dark' 
        ? 'rgba(66, 153, 66, 0.5)' 
        : 'rgba(66, 153, 66, 0.3)',
    },
  },
  '&::before': {
    content: '""',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.02,
    pointerEvents: 'none',
    zIndex: 0,
  },
  [theme.breakpoints.up('md')]: {
    marginLeft: '250px',
  },
}));

// Inner content wrapper with padding
const ContentWrapper = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  minHeight: '100%',
  position: 'relative',
  zIndex: 1,
  color: theme.palette.text.primary,
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(4),
  },
}));

const Footer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  width: '100vw',
  height: '60px',
  padding: theme.spacing(2),
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(15, 15, 35, 0.98) 100%)'
    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%)',
  backdropFilter: 'blur(20px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1001,
  borderTop: `1px solid ${theme.palette.mode === 'dark' 
    ? 'rgba(66, 153, 66, 0.2)' 
    : 'rgba(66, 153, 66, 0.1)'}`,
  boxShadow: theme.palette.mode === 'dark'
    ? '0 -4px 20px rgba(0, 0, 0, 0.5)'
    : '0 -4px 20px rgba(0, 0, 0, 0.08)',
  [theme.breakpoints.up('md')]: {
    left: '250px',
    width: 'calc(100% - 250px)',
  },
}));

const StyledLink = styled(NavLink)(({ theme }) => ({
  color: theme.palette.primary.main,
  textDecoration: 'none',
  fontWeight: 600,
  position: 'relative',
  transition: 'all 0.3s ease',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: -2,
    left: 0,
    width: 0,
    height: 2,
    background: theme.palette.primary.main,
    transition: 'width 0.3s ease',
  },
  '&:hover': {
    color: theme.palette.primary.dark,
    '&::after': {
      width: '100%',
    },
  },
}));

const MainSideBar = ({ children, title }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
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

  // Scroll to top on route change
  useEffect(() => {
    const contentArea = document.getElementById('content-scroll-area');
    if (contentArea) {
      contentArea.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await axiosPrivate.get('/api/v2/notifications');
      const result = response?.data?.data.filter(notification => !notification.read);
      return result;
    } catch (err) {
      console.error(
        import.meta.env.VITE_APP_ENV === 'development'
          ? 'Error fetching notifications: ' + err.message : 'An error occurred.'
      );
      return [];
    }
  };

  const { data: notifications = [], refetch } = useQuery({
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
      notifications.find(n => n._id === notifId);
      const response = await axiosPrivate.put(`/api/v2/notifications/${notifId}`);
      if (response.status === 200) {
        refetch();
        const { type, relatedId } = response.data.data;
        if (type === 'orders') navigate(`/user/ecommerce/commande/view/${relatedId}`);
        else if (type === 'appointment') navigate(`/user/orders/view/${relatedId}`);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [notifications, axiosPrivate, refetch, navigate]);

  // Generate menu items based on user role
  const menuItems = currentUser ? sidebarMenuItems([currentUser?.role]) : [];

  // Show spinner for user data loading
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
    <MainContainer>
      {/* Single Suspense boundary for all sidebar components */}
      <Suspense fallback={<Spinner isLoading={true} />}>
        {/* Desktop Sidebar */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <SideBarContent {...sidebarProps} />
        </Box>

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
              border: 'none',
            },
          }}
        >
          <SideBarContent {...sidebarProps} />
        </Drawer>

        {/* Mobile Navigation */}
        <MobileNav {...mobileNavProps} />
      </Suspense>

      {/* Scrollable Content Area */}
      <ContentArea id="content-scroll-area">
        <ContentWrapper>
          {children}
        </ContentWrapper>
      </ContentArea>

      {/* Footer */}
      <Footer>
        <Typography 
          variant="body2"
          sx={{
            color: 'text.secondary',
            fontSize: { xs: '0.75rem', md: '0.875rem' },
            textAlign: 'center',
          }}
        >
          &copy; {currentYear} {footerText.copyRigth}{' '}
          <StyledLink to={footerText.link} target="_blank">
            {footerText.developedBy}
          </StyledLink>
        </Typography>
      </Footer>
    </MainContainer>
  );
};

MainSideBar.propTypes = {
  children: PropTypes.node,
  title: PropTypes.string,
};

export default MainSideBar;