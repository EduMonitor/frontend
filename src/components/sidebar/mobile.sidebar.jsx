import { memo, useState } from 'react';
import PropTypes from 'prop-types';
import { AppBar, Toolbar, IconButton, Badge, Menu, MenuItem, Divider, Avatar, Typography, Box, Select } from '@mui/material';
import { FiMenu, FiChevronDown, FiBell } from 'react-icons/fi';
import { Link } from 'react-router-dom';

import { useLoginText } from '../../../constant/strings/text.strings';
import LazyImage from '../../imagesloader/images.loader';
import { stringAvatar } from '../../avatar/name.avatar';
import { useUsersRoute } from '../../../constant/strings/routing.strings';
import { formatDate } from '../../../utiles/helpers/functions/data-format.functions';

const MobileNav = memo(({ onOpen, name, onLogout, title, profileImage ,markAsRead,notifications}) => {
    const loginText = useLoginText();

    const [anchorEl, setAnchorEl] = useState(null);
    const userRouters = useUsersRoute()
    const openMenu = (event) => setAnchorEl(event.currentTarget);
    const [notifAnchorEl, setNotifAnchorEl] = useState(null);

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
                backgroundColor: 'transparent',
                backdropFilter: 'blur(8px)',
                zIndex: 1000,
                ml: { sm: 0, md: '250px' },
                boxShadow: 6,
                width: { sm: '100vw', md: 'calc(100% - 250px)' },
            }}
        >
            <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
                <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
                    <Typography variant="h6">{title}</Typography>
                </Box>

                <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center' }}>
                    <IconButton onClick={onOpen} color="black">
                        <FiMenu />
                    </IconButton>
                    <LazyImage src="/images/logo/logo.png" style={{ height: 45, borderRadius: '10px' }} />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    

                    <Box>
                        <IconButton sx={{ mx: 1, bgcolor: 'black' }} color="inherit" onClick={handleNotifMenuOpen}>
                            <Badge badgeContent={unreadCountNotifs} color="error">
                                <FiBell />
                            </Badge>
                        </IconButton>
                        <Menu
                            anchorEl={notifAnchorEl}
                            open={Boolean(notifAnchorEl)}
                            onClose={handleMenuClose}
                            PaperProps={{
                                sx: { color: 'common.white', maxWidth: 400, p: 1 },
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
                                            '&:hover': { bgcolor: 'primary.dark' },
                                        }}
                                    >
                                        <Box>
                                            <Typography fontSize={18} fontWeight="bold">
                                                {'Type Notification'}

                                            </Typography>
                                            <Typography
                                                fontSize={15}
                                                mt={1}
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
                                            <Typography fontSize={12} mt={2} color="textSecondary" textAlign="right">
                                                {formatDate(notif.createdAt)}
                                            </Typography>
                                        </Box>
                                    </MenuItem>
                                ))
                            ) : (
                                <MenuItem disabled>
                                    <Typography color="textSecondary" fontSize={15}>
                                        No new messages
                                    </Typography>
                                </MenuItem>
                            )}
                        </Menu>
                    </Box>

                    {/* <IconButton sx={{ mx: 1, bgcolor: 'black' }}>
                        <FaGraduationCap />
                    </IconButton> */}

                    <IconButton onClick={openMenu} color="black">
                        {profileImage ? (
                            <Badge color="secondary" variant="dot">
                                <Avatar src={profileImage} alt={name} />
                            </Badge>
                        ) : (
                            <Avatar {...stringAvatar(name)} />
                        )}
                        <FiChevronDown />
                    </IconButton>

                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={closeMenu}
                        PaperProps={{
                            sx: {
                                backgroundColor: 'primary.main',
                                color: 'common.white',
                            },
                        }}
                    >
                        <MenuItem onClick={closeMenu}>
                            <Link to={userRouters.settings.profile} style={{ color: 'inherit', textDecoration: 'none' }}>
                                {'Profile'}
                            </Link>
                        </MenuItem>
                        <Divider sx={{ my: 0.5, borderColor: 'primary.light' }} />
                        <MenuItem onClick={onLogout} sx={{ color: 'white' }}>
                            {loginText.Logout}
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
