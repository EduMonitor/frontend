import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';

import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Typography from "@mui/material/Typography"
import Grow from "@mui/material/Grow"
import CircularProgress from "@mui/material/CircularProgress"
import Alert from "@mui/material/Alert"
import {
    MdCheckCircle,
    MdArrowBack,
    MdError,
} from 'react-icons/md';
import { aiFeatures } from './sections/aifeature.sections';
import { AnimatedGrid, FloatingElements } from '../components/animations/background.animations';
import useAuthTheme from './sections/themeHook.sections';
import { useThemeMode } from '../utils/hooks/contexts/useTheme.context';
import { CardBox } from '../components/cards/card.card';
import { axiosPrivate } from '../utils/hooks/instance/axios.instance';
import { fetchCsrfToken } from '../utils/hooks/token/csrf.token';

// ============================
// CONSTANTS
// ============================
const EMAIL_TYPES = {
    VERIFICATION: 'verification',
    RESET: 'reset'
};

// ============================
// API UTILITIES
// ============================
const createApiCall = async (url, options = {}) => {
    try {
        const csrfToken = await fetchCsrfToken();
        const response = await axiosPrivate({
            url,
            headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': csrfToken,
            },
            ...options
        });
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.error || 
                           error.response?.data?.message || 
                           'Request failed';
        throw new Error(errorMessage);
    }
};

// ============================
// API FUNCTIONS
// ============================
const apiService = {
    verifyEmail: (token) => createApiCall(`/api/v2/verify/${token}`, { method: 'get' }),
    
    // Get session info using the token (to determine email type and get user UUID)
    getSessionFromToken: (token) => createApiCall(`/api/v2/session/${token}`, { method: 'get' })
};

// ============================
// CONFIGURATION
// ============================
const getSuccessConfig = (emailType) => {
    if (emailType === EMAIL_TYPES.RESET) {
        return {
            title: 'Reset Link Confirmed! 🔑',
            description: 'Great! You can now set a new password for your account.',
            buttonText: 'Set New Password',
            action: 'reset',
            gradient: 'linear-gradient(45deg, #f59e0b, #f97316)'
        };
    }

    return {
        title: 'Email Verified! 🎉',
        description: 'Awesome! Your email has been successfully verified. You can now access all features of your account.',
        buttonText: 'Continue to Dashboard',
        action: 'dashboard',
        gradient: 'linear-gradient(45deg, #6366f1, #8b5cf6)'
    };
};

const getErrorConfig = (emailType) => ({
    title: emailType === EMAIL_TYPES.RESET ? 'Reset Link Invalid' : 'Verification Failed',
    description: emailType === EMAIL_TYPES.RESET 
        ? 'The reset link may have expired or is invalid. Please request a new one.'
        : 'The verification link may have expired or is invalid. Please try again.'
});

// ============================
// MAIN COMPONENT
// ============================
const EmailVerificationPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const theme = useAuthTheme();
    const { currentTheme } = useThemeMode();
    const { palette } = currentTheme;

    // Local state
    const [isVerified, setIsVerified] = useState(false);
    const [verificationError, setVerificationError] = useState(null);
    const [emailType, setEmailType] = useState(null);
    const [userUuid, setUserUuid] = useState(null);

    // ============================
    // MUTATIONS
    // ============================
    const verifyMutation = useMutation({
        mutationFn: () => apiService.verifyEmail(token),
        onSuccess: (data) => {
            if (data.status === 'success') {
                setIsVerified(true);
                setVerificationError(null);
                // Extract email type from response or determine from verification result
                setEmailType(data.emailType || data.type || EMAIL_TYPES.VERIFICATION);
            }
        },
        onError: (error) => {
            setVerificationError(error.message);
        }
    });

    const sessionMutation = useMutation({
        mutationFn: () => apiService.getSessionFromToken(token),
        onSuccess: (data) => {
            // Get session info to determine email type
            setEmailType(data.sessionType || EMAIL_TYPES.VERIFICATION);
            setUserUuid(data.uuid);
        },
        onError: (error) => {
            console.log('Session info error:', error.message);
            // Continue with verification even if session info fails
        }
    });

    // ============================
    // EFFECTS
    // ============================
    useEffect(() => {
        if (token && !isVerified && !verificationError && !verifyMutation.isSuccess) {
            // First try to get session info to determine email type
            sessionMutation.mutate();
            // Then attempt verification
            verifyMutation.mutate();
        }
    }, [token, isVerified, verificationError, verifyMutation.isSuccess, verifyMutation, sessionMutation]);

    // ============================
    // HANDLERS
    // ============================
    const handlers = {
        backToLogin: () => navigate('/'),
        continueToDashboard: () => navigate('/'),
        goToPasswordReset: () => navigate(`/auth/reset-password/${token}`),
        requestNewLink: () => {
            if (userUuid) {
                navigate(`/auth/notification/${userUuid}`);
            } else {
                navigate('/auth/forgot-password');
            }
        },
        getSuccessAction: (action) => {
            switch (action) {
                case 'reset':
                    return handlers.goToPasswordReset;
                case 'verification':
                    return handlers.continueToDashboard;
                default:
                    return handlers.continueToDashboard;
            }
        }
    };

    // ============================
    // RENDER HELPERS
    // ============================
    const renderLoadingScreen = () => (
        <Box
            sx={{
                minHeight: '100vh',
                background: theme.background,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
            }}
        >
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
                Verifying your email...
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
                Please wait while we process your request
            </Typography>
        </Box>
    );

    const renderSuccessScreen = (config) => (
        <Box
            sx={{
                minHeight: '100vh',
                background: theme.background,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
            }}
        >
            <FloatingElements aiFeatures={aiFeatures} />
            <AnimatedGrid />
            <Grow in={true} timeout={800}>
                <CardBox>
                    <Box sx={{ maxWidth: 480, textAlign: "center" }}>
                        <Box sx={{ mb: 3 }}>
                            <MdCheckCircle
                                size={80}
                                color={palette.success.main}
                                style={{
                                    filter: 'drop-shadow(0 4px 12px rgba(16, 185, 129, 0.3))',
                                }}
                            />
                        </Box>
                        <Typography variant="h4" gutterBottom sx={{ mb: 2 }}>
                            {config.title}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 4, fontSize: '1.1rem' }}>
                            {config.description}
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={handlers.getSuccessAction(config.action)}
                            sx={{
                                py: 1.5,
                                px: 4,
                                borderRadius: 3,
                                textTransform: 'none',
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                background: config.gradient,
                                boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)',
                                '&:hover': {
                                    background: config.gradient,
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 12px 35px rgba(99, 102, 241, 0.4)',
                                },
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                        >
                            {config.buttonText}
                        </Button>
                    </Box>
                </CardBox>
            </Grow>
        </Box>
    );

    const renderErrorScreen = () => {
        const errorConfig = getErrorConfig(emailType);
        
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    background: theme.background,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2,
                }}
            >
                <FloatingElements aiFeatures={aiFeatures} />
                <AnimatedGrid />
                <CardBox>
                    <Box sx={{ maxWidth: 480, textAlign: "center" }}>
                        <Box sx={{ mb: 3 }}>
                            <MdError
                                size={80}
                                color={palette.error.main}
                                style={{
                                    filter: 'drop-shadow(0 4px 12px rgba(239, 68, 68, 0.3))',
                                }}
                            />
                        </Box>
                        <Typography variant="h4" gutterBottom sx={{ mb: 2 }}>
                            {errorConfig.title}
                        </Typography>
                        <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                            {verificationError}
                        </Alert>
                        <Typography variant="body1" sx={{ mb: 4, fontSize: '1.1rem' }}>
                            {errorConfig.description}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Button
                                variant="contained"
                                size="large"
                                onClick={handlers.requestNewLink}
                                sx={{
                                    py: 1.5,
                                    px: 4,
                                    borderRadius: 3,
                                    textTransform: 'none',
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                }}
                            >
                                Request New Link
                            </Button>
                            <Button
                                variant="outlined"
                                size="large"
                                onClick={handlers.backToLogin}
                                startIcon={<MdArrowBack />}
                                sx={{
                                    py: 1.5,
                                    px: 4,
                                    borderRadius: 3,
                                    textTransform: 'none',
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                }}
                            >
                                Back to Login
                            </Button>
                        </Box>
                    </Box>
                </CardBox>
            </Box>
        );
    };

    // ============================
    // RENDER LOGIC
    // ============================
    // Loading state
    if (verifyMutation.isPending || sessionMutation.isPending) {
        return renderLoadingScreen();
    }

    // Successfully verified
    if (isVerified) {
        const successConfig = getSuccessConfig(emailType);
        return renderSuccessScreen(successConfig);
    }

    // Verification error
    if (verificationError) {
        return renderErrorScreen();
    }

    // Fallback loading state
    return renderLoadingScreen();
};

export default EmailVerificationPage;