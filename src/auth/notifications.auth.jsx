import  { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Typography from "@mui/material/Typography"
import Chip from "@mui/material/Chip"
import Fade from "@mui/material/Fade"
import Slide from "@mui/material/Slide"
import IconButton from "@mui/material/IconButton"
import CircularProgress from "@mui/material/CircularProgress"
import Alert from "@mui/material/Alert"

import {
    MdEmail,
    MdRefresh,
    MdArrowBack,
    MdError,
    MdVerifiedUser,
    MdClose
} from 'react-icons/md';
import { HiSparkles } from 'react-icons/hi';
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
const ERROR_CODES = {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    TOO_MANY_REQUESTS: 429,
    SESSION_EXPIRED: 440,
    SERVER_ERROR: 500
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
        const errorMessage = error.response?.data?.detail?.error ||
            error.response?.data?.detail?.message ||
            'Request failed';
        throw new Error(errorMessage);
    }
};

const handleApiError = (error) => {
    if (!error.response) {
        return error.request
            ? 'Network error. Please check your connection and try again.'
            : error.message || 'An unexpected error occurred. Please try again.';
    }

    const { status, data } = error.response;
    const errorMessage = data.detail.error || data.detail.message;

    switch (status) {
        case ERROR_CODES.BAD_REQUEST:
            return errorMessage || 'Invalid request. Please try again.';
        case ERROR_CODES.UNAUTHORIZED:
            return 'Session expired. Please log in again.';
        case ERROR_CODES.NOT_FOUND:
            return 'Session not found. Please try logging in again.';
        case ERROR_CODES.TOO_MANY_REQUESTS:
            return 'Too many requests. Please wait before trying again.';
        case ERROR_CODES.SESSION_EXPIRED:
            return 'Session expired. Please try the process again.';
        case ERROR_CODES.SERVER_ERROR:
            return 'Server error. Please try again later.';
        default:
            return errorMessage || `Server error (${status}). Please try again.`;
    }
};

// ============================
// API FUNCTIONS
// ============================
const apiService = {
    checkSession: (uuid) => createApiCall(`/api/v2/session/${uuid}`, { method: 'get' }),

    resendEmail: async (uuid, type = null) => {
        try {
            const url = type ? `/api/v2/resend/${uuid}?type=${type}` : `/api/v2/resend/${uuid}`;
            return await createApiCall(url, { method: 'post', data: {} });
        } catch (error) {
            throw new Error(handleApiError(error));
        }
    }
};

// ============================
// CONFIGURATION
// ============================
const getSessionErrorConfig = (status) => {
    const configs = {
        [ERROR_CODES.SESSION_EXPIRED]: {
            title: 'Session Expired',
            message: 'Your session has expired. Please try the process again.'
        },
        [ERROR_CODES.UNAUTHORIZED]: {
            title: 'Session Not Found',
            message: 'Your session was not found. Please try logging in again.'
        }
    };

    return configs[status] || {
        title: 'Session Error',
        message: 'There was an issue with your session. Please try again.'
    };
};

// ============================
// MAIN COMPONENT
// ============================
const EmailNotificationPage = () => {
    const { uuid } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const theme = useAuthTheme();
    const { currentTheme } = useThemeMode();
    const { palette } = currentTheme;

    // Local state
    const [countdown, setCountdown] = useState(0);
    const [verificationError, setVerificationError] = useState(null);
    const [sessionData, setSessionData] = useState(null);

    // ============================
    // QUERIES
    // ============================
    const sessionQuery = useQuery({
        queryKey: ['session', uuid],
        queryFn: () => apiService.checkSession(uuid),
        enabled: !!uuid,
        refetchInterval: (data) => {
            // Stop refetching if verified or if there's an error
            if (data?.status === 'verified' || data?.error) return false;
            return 30000; // 30 seconds
        },
        retry: (failureCount, error) => {
            if (error.response?.status >= 400 && error.response?.status < 500) {
                return false;
            }
            return failureCount < 3;
        }
    });

    // ============================
    // MUTATIONS
    // ============================
    const resendMutation = useMutation({
        mutationFn: ({ type }) => apiService.resendEmail(uuid, type),
        onSuccess: () => {
            setCountdown(60);
            setVerificationError(null);
            queryClient.invalidateQueries(['session', uuid]);
        },
        onError: (error) => {
            console.error('Resend failed:', error);
            setVerificationError(error.message);
        }
    });

    // ============================
    // EFFECTS
    // ============================
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    useEffect(() => {
        if (sessionQuery.data) {
            const data = sessionQuery.data;

            // If already verified, redirect to home
            if (data.status === 'verified') {
                navigate('/');
                return;
            }

            setSessionData({
                email: data.email,
                sessionType: data.sessionType,
                tokenExpires: data.tokenExpires,
                cooldown: data.cooldown || 0
            });

            if (data.cooldown) {
                setCountdown(Math.ceil(data.cooldown));
            }
        }
    }, [sessionQuery.data, navigate]);

    // ============================
    // HANDLERS
    // ============================
    const handlers = {
        resendEmail: () => {
            if (countdown === 0 && !resendMutation.isPending) {
                setVerificationError(null);
                const emailType = sessionData?.sessionType || 'verification';
                resendMutation.mutate({ type: emailType });
            }
        },
        backToLogin: () => navigate('/'),
        clearError: () => {
            setVerificationError(null);
            resendMutation.reset();
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
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
            }}
        >
            <CircularProgress size={60} />
        </Box>
    );

    const renderErrorScreen = (error) => {
        const errorConfig = getSessionErrorConfig(error?.response?.status);

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
                        <Typography variant="body1" sx={{ mb: 4, fontSize: '1.1rem' }}>
                            {errorConfig.message}
                        </Typography>
                        <Button
                            variant="contained"
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
                </CardBox>
            </Box>
        );
    };

    const renderMainScreen = () => {
        const displayEmail = sessionData?.email || 'your email';
        const emailType = sessionData?.sessionType || 'verification';
        const isReset = emailType === 'reset';

        const config = {
            title: isReset ? 'Check Your Email for Reset Link' : 'Check Your Email for Verification',
            icon: isReset ? <MdEmail size={48} color="white" /> : <MdVerifiedUser size={48} color="white" />,
            description: isReset
                ? 'Click the reset link in your email to set a new password.'
                : 'Click the verification link in your email to activate your account.',
            actionText: isReset ? 'Resend Reset Email' : 'Resend Verification Email',
            gradient: isReset ? 'linear-gradient(45deg, #f59e0b, #f97316)' : 'linear-gradient(45deg, #6366f1, #8b5cf6)',
            chipColor: isReset ? 'warning' : 'primary',
            chipLabel: isReset ? 'Password Reset' : 'Account Verification'
        };

        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    background: theme.background,
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <FloatingElements aiFeatures={aiFeatures} />
                <AnimatedGrid />

                <Fade in={true} timeout={600}>
                    <CardBox>
                        <Box sx={{ maxWidth: 480, textAlign: "center", position: 'relative' }}>
                            {/* Decorative elements */}
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 20,
                                    right: 20,
                                    opacity: 0.1,
                                }}
                            >
                                <HiSparkles size={24} color={palette.primary.main} />
                            </Box>
                            <Box
                                sx={{
                                    position: 'absolute',
                                    bottom: 20,
                                    left: 20,
                                    opacity: 0.1,
                                }}
                            >
                                <HiSparkles size={32} color={palette.warning.main} />
                            </Box>

                            {/* Email Type Indicator */}
                            <Box sx={{ mb: 2 }}>
                                <Chip
                                    label={config.chipLabel}
                                    color={config.chipColor}
                                    variant="outlined"
                                    size="small"
                                />
                            </Box>

                            {/* Icon Section */}
                            <Slide direction="down" in={true} timeout={800}>
                                <Box sx={{ mb: 4 }}>
                                    <Box
                                        sx={{
                                            width: 100,
                                            height: 100,
                                            borderRadius: '50%',
                                            background: config.gradient,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto',
                                            mb: 3,
                                            boxShadow: '0 20px 40px rgba(99, 102, 241, 0.3)',
                                            animation: 'pulse 2s infinite',
                                            '@keyframes pulse': {
                                                '0%': {
                                                    boxShadow: '0 20px 40px rgba(99, 102, 241, 0.3)',
                                                },
                                                '50%': {
                                                    boxShadow: '0 25px 50px rgba(99, 102, 241, 0.5)',
                                                },
                                                '100%': {
                                                    boxShadow: '0 20px 40px rgba(99, 102, 241, 0.3)',
                                                },
                                            },
                                        }}
                                    >
                                        {config.icon}
                                    </Box>
                                </Box>
                            </Slide>

                            {/* Content Section */}
                            <Slide direction="up" in={true} timeout={1000}>
                                <Box>
                                    <Typography variant="h4" gutterBottom>
                                        {config.title} ✨
                                    </Typography>

                                    <Typography variant="body1" sx={{ mb: 1, fontSize: '1.1rem' }}>
                                        We've sent an email to
                                    </Typography>

                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: isReset ? palette.warning.main : palette.primary.main,
                                            mb: 3,
                                            fontWeight: 600,
                                            wordBreak: 'break-word',
                                        }}
                                    >
                                        {displayEmail}
                                    </Typography>

                                    <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.7 }}>
                                        {config.description}
                                        {sessionData?.tokenExpires && (
                                            <span style={{ display: 'block', marginTop: 8, fontSize: '0.9em', opacity: 0.8 }}>
                                                Link expires: {new Date(sessionData.tokenExpires).toLocaleString()}
                                            </span>
                                        )}
                                    </Typography>

                                    {/* Error Display */}
                                    {verificationError && (
                                        <Alert
                                            severity="error"
                                            sx={{ mb: 3, textAlign: 'left' }}
                                            action={
                                                <IconButton
                                                    aria-label="close"
                                                    color="inherit"
                                                    size="small"
                                                    onClick={handlers.clearError}
                                                >
                                                    <MdClose fontSize="inherit" />
                                                </IconButton>
                                            }
                                        >
                                            {verificationError}
                                        </Alert>
                                    )}

                                    {/* Resend Button Section */}
                                    <Box sx={{ mb: 4 }}>
                                        <Button
                                            variant="contained"
                                            size="large"
                                            onClick={handlers.resendEmail}
                                            disabled={resendMutation.isPending || countdown > 0}
                                            startIcon={
                                                resendMutation.isPending ? (
                                                    <CircularProgress size={20} color="inherit" />
                                                ) : (
                                                    <MdRefresh />
                                                )
                                            }
                                            sx={{
                                                py: 1.5,
                                                px: 4,
                                                borderRadius: 3,
                                                textTransform: 'none',
                                                fontSize: '1rem',
                                                fontWeight: 600,
                                                mb: 2,
                                                background: countdown > 0 || resendMutation.isPending ? '#e2e8f0' : config.gradient,
                                                color: countdown > 0 || resendMutation.isPending ? '#64748b' : 'white',
                                                boxShadow: countdown > 0 || resendMutation.isPending ? 'none' : '0 8px 25px rgba(99, 102, 241, 0.3)',
                                                '&:hover': {
                                                    background: countdown > 0 || resendMutation.isPending ? '#e2e8f0' : config.gradient,
                                                    transform: countdown > 0 || resendMutation.isPending ? 'none' : 'translateY(-2px)',
                                                    boxShadow: countdown > 0 || resendMutation.isPending ? 'none' : '0 12px 35px rgba(99, 102, 241, 0.4)',
                                                },
                                                '&:disabled': {
                                                    background: '#e2e8f0',
                                                    color: '#64748b',
                                                },
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            }}
                                        >
                                            {countdown > 0
                                                ? `Resend in ${countdown}s`
                                                : resendMutation.isPending
                                                    ? 'Sending...'
                                                    : config.actionText
                                            }
                                        </Button>

                                        {/* Success message */}
                                        {resendMutation.isSuccess && !verificationError && (
                                            <Fade in={true}>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: '#10b981',
                                                        fontWeight: 500,
                                                        mb: 2,
                                                    }}
                                                >
                                                    ✓ Email sent successfully!
                                                </Typography>
                                            </Fade>
                                        )}
                                    </Box>

                                    {/* Back to Login Button */}
                                    <Button
                                        variant="text"
                                        startIcon={<MdArrowBack />}
                                        onClick={handlers.backToLogin}
                                        sx={{
                                            textTransform: 'none',
                                            fontWeight: 500,
                                            '&:hover': {
                                                color: isReset ? '#f59e0b' : '#6366f1',
                                            },
                                        }}
                                    >
                                        Back to Login
                                    </Button>
                                </Box>
                            </Slide>
                        </Box>
                    </CardBox>
                </Fade>
            </Box>
        );
    };

    // ============================
    // RENDER LOGIC
    // ============================
    // Loading state
    if (sessionQuery.isLoading) {
        return renderLoadingScreen();
    }

    // Error state
    if (sessionQuery.error && !sessionQuery.data) {
        return renderErrorScreen(sessionQuery.error);
    }

    // Main notification screen
    return renderMainScreen();
};

export default EmailNotificationPage;