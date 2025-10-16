import { memo, useState } from 'react';
import PropTypes from 'prop-types';
import { AppBar, Toolbar, IconButton, Badge, Menu, MenuItem, Divider, Avatar, Typography, Box } from '@mui/material';
import { FiMenu, FiChevronDown, FiBell, FiFacebook, FiTwitter, FiInstagram, FiLinkedin } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

import { authConfig } from '../../constants/string.constants';
import { stringAvatar } from '../avatars/avatars.avatar';
import { AdminRoutes } from '../../constants/routes.constant';
import { formatDate } from '../../utils/functions/format-date.functions';
import useAuthTheme from '../../auth/sections/themeHook.sections';

const MobileNav = memo(({ onOpen, name, onLogout, title, profileImage, markAsRead, notifications }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifAnchorEl, setNotifAnchorEl] = useState(null);
    
    const theme = useTheme();
    const authTheme = useAuthTheme();
    
    const openMenu = (event) => setAnchorEl(event.currentTarget);
    const handleNotifMenuOpen = (event) => setNotifAnchorEl(event.currentTarget);
    const unreadCountNotifs = notifications?.filter(n => !n.read).length;

    const handleMenuClose = () => {
        setAnchorEl(null);
        setNotifAnchorEl(null);
    };

    const closeMenu = () => setAnchorEl(null);

    return (
        <AppBar
            position="fixed"
            sx={{
                background: authTheme.background || theme.palette.background.paper,
                backdropFilter: 'blur(8px)',
                zIndex: 1000,
                borderRadius: 0,
                ml: { sm: 0, md: '250px' },
                boxShadow: theme.shadows[6],
                width: { sm: '100vw', md: 'calc(100% - 250px)' },
                borderBottom: `1px solid ${theme.palette.divider}`,
            }}
        >
            <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
                <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
                    <Typography 
                        sx={{
                            color: authTheme.textPrimary || theme.palette.text.primary,
                        }} 
                        variant="h6"
                    >
                        {title}
                    </Typography>
                </Box>

                <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center' }}>
                    
                    <IconButton 
                        onClick={onOpen} 
                        sx={{ 
                            color: theme.palette.text.primary,
                            '&:hover': {
                                backgroundColor: theme.palette.action.hover,
                            }
                        }}
                    >
                        <FiMenu />
                    </IconButton>
                    <img src="/logo.png" style={{ height: 45, marginLeft: '8px' }} />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FiFacebook size={24} color="#1877F2" />
                        <FiTwitter size={24} color="#1DA1F2" style={{ marginLeft: 8 }} />
                        <FiLinkedin size={24} color="#0077B5" style={{ marginLeft: 8 }} />
                        <FiInstagram size={24} color="#E1306C" style={{ marginLeft: 8 }} />
                        
                    </Box>
                    <Box>
                        <IconButton 
                            sx={{ 
                                mx: 1, 
                                backgroundColor: theme.palette.action.selected,
                                color: theme.palette.text.primary,
                                '&:hover': {
                                    backgroundColor: theme.palette.action.hover,
                                }
                            }} 
                            onClick={handleNotifMenuOpen}
                        >
                            <Badge badgeContent={unreadCountNotifs} color="error">
                                <FiBell />
                            </Badge>
                        </IconButton>
                        
                        <Menu
                            anchorEl={notifAnchorEl}
                            open={Boolean(notifAnchorEl)}
                            onClose={handleMenuClose}
                            slotProps={{
                                paper: {
                                    sx: { 
                                        maxWidth: 400, 
                                        p: 1,
                                        backgroundColor: theme.palette.background.paper,
                                        color: theme.palette.text.primary,
                                        border: `1px solid ${theme.palette.divider}`,
                                    },
                                },
                            }}
                        >
                            {notifications?.length > 0 ? (
                                notifications?.map((notif, index) => (
                                    <MenuItem
                                        key={index}
                                        onClick={() => {
                                            markAsRead(notif._id);
                                            handleMenuClose();
                                        }}
                                        sx={{
                                            opacity: notif.read ? 0.7 : 1,
                                            display: 'block',
                                            p: 1,
                                            borderRadius: 1,
                                            '&:hover': { 
                                                bgcolor: theme.palette.action.hover,
                                            },
                                            color: theme.palette.text.primary,
                                        }}
                                    >
                                        <Box>
                                            <Typography 
                                                fontSize={18} 
                                                fontWeight="bold"
                                                color={theme.palette.text.primary}
                                            >
                                                {'Type Notification'}
                                            </Typography>
                                            <Typography
                                                fontSize={15}
                                                mt={1}
                                                color={theme.palette.text.primary}
                                                sx={{
                                                    display: '-webkit-box',
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    WebkitLineClamp: 3,
                                                    textOverflow: 'ellipsis',
                                                    maxHeight: '4.5em',
                                                    lineHeight: 1.5,
                                                    whiteSpace: 'pre-wrap',
                                                    wordWrap: 'break-word',
                                                }}
                                            >
                                                {notif.message}
                                            </Typography>
                                            <Typography 
                                                fontSize={12} 
                                                mt={2} 
                                                color={theme.palette.text.secondary} 
                                                textAlign="right"
                                            >
                                                {formatDate(notif.createdAt)}
                                            </Typography>
                                        </Box>
                                    </MenuItem>
                                ))
                            ) : (
                                <MenuItem disabled>
                                    <Typography color={theme.palette.text.secondary} fontSize={15}>
                                        No new messages
                                    </Typography>
                                </MenuItem>
                            )}
                        </Menu>
                    </Box>

                    <IconButton 
                        onClick={openMenu} 
                        sx={{
                            color: theme.palette.text.primary,
                            '&:hover': {
                                backgroundColor: theme.palette.action.hover,
                            }
                        }}
                    >
                        {profileImage ? (
                            <Badge color="secondary" variant="dot">
                                <Avatar src={profileImage} alt={name} />
                            </Badge>
                        ) : (
                            <Avatar {...stringAvatar(name)} />
                        )}
                        <FiChevronDown style={{ marginLeft: '4px' }} />
                    </IconButton>

                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={closeMenu}
                        slotProps={{
                            paper: {
                                sx: {  
                                    backgroundColor: theme.palette.background.paper,
                                    color: theme.palette.text.primary,
                                    border: `1px solid ${theme.palette.divider}`,
                                },
                            },
                        }}
                    >
                        <MenuItem 
                            onClick={closeMenu}
                            sx={{
                                '&:hover': {
                                    backgroundColor: theme.palette.action.hover,
                                }
                            }}
                        >
                            <Link 
                                to={AdminRoutes.profiles} 
                                style={{ 
                                    color: theme.palette.text.primary, 
                                    textDecoration: 'none' 
                                }}
                            >
                                {'Profile'}
                            </Link>
                        </MenuItem>
                        <Divider sx={{ my: 0.5, borderColor: theme.palette.divider }} />
                        <MenuItem 
                            onClick={onLogout} 
                            sx={{ 
                                color: theme.palette.text.primary,
                                '&:hover': {
                                    backgroundColor: theme.palette.action.hover,
                                }
                            }}
                        >
                            {authConfig.logOut.title}
                        </MenuItem>
                    </Menu>
                </Box>
            </Toolbar>
        </AppBar>
    );
});

MobileNav.displayName = 'MobileNav';

MobileNav.propTypes = {
    onOpen: PropTypes.func.isRequired,
    name: PropTypes.string.isRequired,
    notifications: PropTypes.array,
    markAsRead: PropTypes.func,
    title: PropTypes.string,
    profileImage: PropTypes.string,
    onLogout: PropTypes.func.isRequired,
};

export default MobileNav;