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
import { useLoginText } from "../../../constant/strings/text.strings";
import { UsersMenuItems } from "../../../constant/items/users.items";


const ContentSidebar = ({ onClose, onClick, ...rest }) => {
    const [openChildrenIndex, setOpenChildrenIndex] = useState(null);
    const location = useLocation();
    const loginText = useLoginText()

    const items = UsersMenuItems();

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
            <Box sx={{ backgroundColor: "white",boxShadow:6 }} display="flex" alignItems="center" p={2} justifyContent="space-between">
                {/* Center logo and title */}
                <Box display="flex" alignItems="center" flexDirection="column" flex="1" textAlign="center">
                    <img src='/images/logo/logo.png' alt="logo" height={90} width={100} />
                </Box>
                {/* Close icon for smaller screens */}
                <IconButton color="primary" sx={{ position: "absolute", display: { xs: 'block', md: 'none', top: 8, right: 8 } }} onClick={onClose}>
                    <FiX />
                </IconButton>
            </Box>
            <Divider   sx={{ bgcolor: "primary.main", mb: 2 }} />

            <Box sx={{ paddingBottom: "80px" }}>
                {items && items.map((link, index) => {
                    if (!link) return null; // Add this check
                    const active = isActive(link);
                    const isOpen = openChildrenIndex === index;

                    return (
                        <Box key={index} mb={1} sx={{ bgcolor: active ? 'primary.main' : 'inherit', borderRadius: 1 }}>
                            {link?.children ? (
                                <Box
                                    onClick={() => toggleChildren(index)}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        p: 1.5,
                                        cursor: 'pointer',
                                        "&:hover": { bgcolor: 'primary.main', color: 'white' }
                                    }}
                                >
                                    <Box display="flex" gap={2}>
                                        {link?.icon && (
                                            <link.icon
                                                mr="4"
                                                color="white"
                                                fontSize="20"
                                            />
                                        )}
                                        <Typography color="common.white" variant="body2">
                                            {link?.name}
                                        </Typography>
                                    </Box>
                                    {isOpen ? <FiChevronUp /> : <FiChevronDown />}
                                </Box>
                            ) : (
                                <NavLink to={link.path} onClick={onClose} style={{ textDecoration: 'none' }}>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,
                                            p: 1.5,
                                            "&:hover": { bgcolor: 'primary.main', color: 'white' }
                                        }}
                                    >
                                        {link.icon && (
                                            <link.icon
                                                mr="4"
                                                color="white"
                                                fontSize="20"
                                            />
                                        )}
                                        <Typography color="common.white" variant="body2">
                                            {link.name}
                                        </Typography>
                                    </Box>
                                </NavLink>
                            )}

                            <Collapse in={isOpen} timeout="auto" unmountOnExit>
                                <Box pl={3} mb={1}>
                                    {link.children && link.children.map((subItem, ind) => (
                                        <NavLink key={ind} to={subItem.path} onClick={onClose} style={{ textDecoration: 'none' }}>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    p: 1,
                                                    gap: 2,
                                                    "&:hover": { bgcolor: 'primary.main', color: 'white' },
                                                    bgcolor: isActive(subItem) ? 'primary.light' : 'inherit',
                                                    borderRadius: 1
                                                }}
                                            >
                                                {subItem.icon && (
                                                    <subItem.icon
                                                        mr="4"
                                                        color="white"
                                                        fontSize="20"
                                                    />
                                                )}
                                                <Typography color="common.white" variant="body2">
                                                    {subItem.name}
                                                </Typography>
                                            </Box>
                                        </NavLink>
                                    ))}
                                </Box>
                            </Collapse>
                        </Box>
                    );
                })}

            </Box>

            <FixedButtonContainer>
                <Button variant="contained" color="primary" onClick={onClick} fullWidth>
                    {loginText.Logout}
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
    borderRight:"3px solid red",
    backgroundColor: theme.palette.sidebar,
    color: theme.palette.common.white,
    overflowY: 'auto',
    zIndex: 100,
}));

// Style for the fixed button at the bottom of the sidebar
const FixedButtonContainer = styled(Box)(({ theme }) => ({
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '250px',
    padding: theme.spacing(2),
    backgroundColor: theme.palette.grey[800],
    boxShadow: '0px -4px 8px rgba(0, 0, 0, 0.2)',
    zIndex: 1000,
}));

ContentSidebar.propTypes = {
    onClose: PropTypes.func,
    onClick: PropTypes.func,
};

export default ContentSidebar;
