import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import { Avatar, Chip, IconButton } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

// animated primitives and styled containers to match the admin design
const slideIn = keyframes`
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
`;
const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

export const PageContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(3),
    animation: `${slideIn} 360ms ease-out`,
}));

export const HeaderBox = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(3),
    justifyContent: 'space-between',
    marginBottom: theme.spacing(3),
}));

export const IconWrapper = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: theme.palette.mode === 'dark' ? 'rgba(16,185,129,0.06)' : 'linear-gradient(135deg, rgba(16, 33, 185, 0.12), rgba(16, 81, 185, 0.04))',
    color: theme.palette.success.main,
    fontSize: '1.25rem',
    cursor: 'pointer',
}));

export const BackButton = styled(Button)(({ theme }) => ({
    minWidth: 44,
    padding: 8,
    borderRadius: theme.spacing(1),
    background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'
}));

export const CardContainer = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2.5),
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
    marginBottom: theme.spacing(2.5),
}));

export const SectionTitle = styled(Typography)(({ theme }) => ({
    fontWeight: 700,
    fontSize: '1.05rem',
    marginBottom: theme.spacing(1),
    color: theme.palette.primary.main,
}));

export const FormContainer = styled(Box)(({ theme }) => ({
    borderRadius: theme.spacing(1),
}));


export const ProfileCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  border: `1px solid ${theme.palette.mode === 'dark' 
    ? 'rgba(66, 153, 66, 0.2)' 
    : 'rgba(66, 153, 66, 0.15)'}`,
  borderRadius: theme.spacing(2),
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, rgba(26, 26, 46, 0.6) 0%, rgba(15, 15, 35, 0.8) 100%)'
    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
  backdropFilter: 'blur(10px)',
  boxShadow: theme.palette.mode === 'dark'
    ? '0 8px 24px rgba(0, 0, 0, 0.4)'
    : '0 8px 24px rgba(0, 0, 0, 0.08)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
  },
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(3),
  },
}));

export const AvatarSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  background: theme.palette.mode === 'dark'
    ? 'rgba(66, 153, 66, 0.05)'
    : 'rgba(66, 153, 66, 0.03)',
  border: `1px solid ${theme.palette.mode === 'dark' 
    ? 'rgba(66, 153, 66, 0.15)' 
    : 'rgba(66, 153, 66, 0.1)'}`,
}));

export const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 140,
  height: 140,
  border: `4px solid ${theme.palette.mode === 'dark' 
    ? 'rgba(66, 153, 66, 0.3)' 
    : 'rgba(66, 153, 66, 0.2)'}`,
  boxShadow: theme.palette.mode === 'dark'
    ? '0 8px 24px rgba(0, 0, 0, 0.4)'
    : '0 8px 24px rgba(0, 0, 0, 0.15)',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)',
  },
}));

export const CameraButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  bottom: 8,
  right: 8,
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  width: 40,
  height: 40,
  boxShadow: theme.palette.mode === 'dark'
    ? '0 4px 12px rgba(0, 0, 0, 0.4)'
    : '0 4px 12px rgba(0, 0, 0, 0.2)',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
    transform: 'scale(1.1)',
    animation: `${pulse} 1s ease-in-out infinite`,
  },
}));


export const StyledButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.5, 3),
  fontSize: '1rem',
  fontWeight: 600,
  borderRadius: theme.spacing(1.5),
  textTransform: 'none',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.palette.mode === 'dark'
      ? '0 8px 24px rgba(66, 153, 66, 0.4)'
      : '0 8px 24px rgba(66, 153, 66, 0.3)',
  },
  '&:disabled': {
    transform: 'none',
  }
}));

export const InfoChip = styled(Chip)(({ theme }) => ({
  marginTop: theme.spacing(2),
  fontWeight: 600,
  fontSize: '0.875rem',
  padding: theme.spacing(0.5, 1),
  background: theme.palette.mode === 'dark'
    ? 'rgba(66, 153, 66, 0.2)'
    : 'rgba(66, 153, 66, 0.15)',
  border: `1px solid ${theme.palette.mode === 'dark' 
    ? 'rgba(66, 153, 66, 0.3)' 
    : 'rgba(66, 153, 66, 0.2)'}`,
}));

export const PasswordStrengthBox = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1),
  background: theme.palette.mode === 'dark'
    ? 'rgba(66, 153, 66, 0.05)'
    : 'rgba(66, 153, 66, 0.03)',
  border: `1px solid ${theme.palette.mode === 'dark' 
    ? 'rgba(66, 153, 66, 0.15)' 
    : 'rgba(66, 153, 66, 0.1)'}`,
}));