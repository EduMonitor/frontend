import { useCallback, useState } from "react";
import PropTypes from 'prop-types';
import { NavLink, useLocation } from "react-router-dom";
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Collapse from "@mui/material/Collapse";
import { styled } from "@mui/system";
import { FiChevronDown, FiChevronUp, FiX } from "react-icons/fi";
import { useTheme } from '@mui/material/styles';

const ContentSidebar = ({ onClose, menuItems, onClick, ...rest }) => {
    const [openChildrenIndex, setOpenChildrenIndex] = useState(null);
    const location = useLocation();
    const theme = useTheme(); // Use MUI's useTheme hook instead of custom hook

    const isActive = useCallback((link) => {
        if (link.path === location.pathname) return true;
        if (Array.isArray(link.children)) {
            return link.children.some((child) => child.path === location.pathname);
        }
        return false;
    }, [location.pathname]);

    const toggleChildren = useCallback((index) => {
        setOpenChildrenIndex((prevIndex) => (prevIndex === index ? null : index));
    }, []);

    return (
        <StyledSidebar {...rest}>
            <Box 
                sx={{
                    boxShadow: 6,
                    borderBottom: `1px solid ${theme.palette.divider}`
                }} 
                display="flex" 
                alignItems="center" 
                p={2} 
                justifyContent="space-between"
            >
                {/* Center logo and title */}
                <Box display="flex" alignItems="center" flexDirection="column" flex="1" textAlign="center">
                    <img src="/logo.png" alt="logo" height={90} width={"100%"} />
                </Box>
                {/* Close icon for smaller screens */}
                <IconButton 
                    sx={{ 
                        position: "absolute", 
                        display: { xs: 'block', md: 'none' }, 
                        top: 8, 
                        right: 8,
                        color: theme.palette.text.primary
                    }} 
                    onClick={onClose}
                >
                    <FiX />
                </IconButton>
            </Box>
            <Divider sx={{ bgcolor: theme.palette.primary.main, mb: 2 }} />

            <Box sx={{ paddingBottom: "80px" }}>
                {menuItems && menuItems?.map((link, index) => {
                    if (!link) return null;
                    const active = isActive(link);
                    const isOpen = openChildrenIndex === index;

                    return (
                        <Box 
                            key={index} 
                            mb={1} 
                            sx={{ 
                                bgcolor: active ? theme.palette.primary.main : 'transparent', 
                                borderRadius: 1,
                                mx: 1
                            }}
                        >
                            {link?.children ? (
                                <Box
                                    onClick={() => toggleChildren(index)}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        p: 1.5,
                                        cursor: 'pointer',
                                        borderRadius: 1,
                                        "&:hover": { 
                                            bgcolor: theme.palette.action.hover,
                                        }
                                    }}
                                >
                                    <Box display="flex" gap={2} alignItems="center">
                                        {link?.icon && (
                                            <link.icon
                                                size={20}
                                                color={active ? theme.palette.primary.contrastText : theme.palette.text.primary}
                                            />
                                        )}
                                        <Typography 
                                            color={active ? theme.palette.primary.contrastText : theme.palette.text.primary} 
                                            variant="body2"
                                            sx={{ fontWeight: active ? 600 : 400 }}
                                        >
                                            {link?.name}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ color: active ? theme.palette.primary.contrastText : theme.palette.text.secondary }}>
                                        {isOpen ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                                    </Box>
                                </Box>
                            ) : (
                                <NavLink to={link.path} onClick={onClose} style={{ textDecoration: 'none' }}>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,
                                            p: 1.5,
                                            borderRadius: 1,
                                            "&:hover": { 
                                                bgcolor: theme.palette.action.hover,
                                            }
                                        }}
                                    >
                                        {link.icon && (
                                            <link.icon
                                                size={20}
                                                color={active ? theme.palette.primary.contrastText : theme.palette.text.primary}
                                            />
                                        )}
                                        <Typography 
                                            color={active ? theme.palette.primary.contrastText : theme.palette.text.primary} 
                                            variant="body2"
                                            sx={{ fontWeight: active ? 600 : 400 }}
                                        >
                                            {link.name}
                                        </Typography>
                                    </Box>
                                </NavLink>
                            )}

                            <Collapse in={isOpen} timeout="auto" unmountOnExit>
                                <Box pl={3} mb={1}>
                                    {link.children && link.children.map((subItem, ind) => {
                                        const subActive = isActive(subItem);
                                        return (
                                            <NavLink key={ind} to={subItem.path} onClick={onClose} style={{ textDecoration: 'none' }}>
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        p: 1,
                                                        gap: 2,
                                                        borderRadius: 1,
                                                        "&:hover": { 
                                                            bgcolor: theme.palette.action.hover,
                                                        },
                                                        bgcolor: subActive ? theme.palette.secondary.light : 'transparent',
                                                    }}
                                                >
                                                    {subItem.icon && (
                                                        <subItem.icon
                                                            size={16}
                                                            color={subActive ? theme.palette.primary.contrastText : theme.palette.text.primary}
                                                        />
                                                    )}
                                                    <Typography 
                                                        color={subActive ? theme.palette.primary.contrastText : theme.palette.text.primary} 
                                                        variant="body2"
                                                        sx={{ 
                                                            fontSize: '0.8rem',
                                                            fontWeight: subActive ? 500 : 400
                                                        }}
                                                    >
                                                        {subItem.name}
                                                    </Typography>
                                                </Box>
                                            </NavLink>
                                        );
                                    })}
                                </Box>
                            </Collapse>
                        </Box>
                    );
                })}
            </Box>

            <FixedButtonContainer>
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={onClick} 
                    fullWidth
                    sx={{
                        fontWeight: 600,
                        py: 1.5
                    }}
                >
                    Déconnecter
                </Button>
            </FixedButtonContainer>
        </StyledSidebar>
    );
};

const StyledSidebar = styled(Box)(({ theme }) => ({
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    width: '250px',
    backgroundColor: theme.palette.sidebar || theme.palette.background.paper,
    color: theme.palette.text.primary,
    overflowY: 'auto',
    zIndex: 100,
    borderRight: `1px solid ${theme.palette.divider}`,
    // Add shadow based on theme mode
    boxShadow: theme.palette.mode === 'dark' 
        ? '2px 0 8px rgba(0, 0, 0, 0.3)' 
        : '2px 0 8px rgba(0, 0, 0, 0.1)',
}));

const FixedButtonContainer = styled(Box)(({ theme }) => ({
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '250px',
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    borderTop: `1px solid ${theme.palette.divider}`,
    boxShadow: theme.palette.mode === 'dark'
        ? '0px -4px 8px rgba(0, 0, 0, 0.3)'
        : '0px -4px 8px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
}));

ContentSidebar.propTypes = {
    onClose: PropTypes.func,
    onClick: PropTypes.func,
    menuItems: PropTypes.array,
};

export default ContentSidebar;