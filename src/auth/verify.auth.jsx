import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Box,
    Typography,
    Button,
    CircularProgress,
    Fade,
    Grow,
    Slide,
    Alert,
    Chip,
    IconButton
} from '@mui/material';
import {
    MdEmail,
    MdRefresh,
    MdCheckCircle,
    MdArrowBack,
    MdError,
    MdLock,
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
// CONSTANTS & TYPES
// ============================
const EMAIL_TYPES = {
    VERIFICATION: 'verification',
    RESET: 'reset'
};

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
    const errorMessage = data.detail?.error || data.detail?.message;

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
    
    getTokenInfo: (token) => createApiCall(`/api/v2/token-info/${token}`, { method: 'get' }),
    
    verifyEmail: (token) => createApiCall(`/api/v2/verify/${token}`, { method: 'get' }),
    
    checkVerificationStatus: (identifier) => 
        createApiCall(`/api/v2/check-session/${identifier}`, { method: 'get' })
        .catch(() => null), // Silent fail for status checks
    
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
// CONFIGURATION OBJECTS
// ============================
const getEmailTypeConfig = (emailType) => {
    const configs = {
        [EMAIL_TYPES.VERIFICATION]: {
            title: 'Verify Your Email',
            icon: <MdVerifiedUser size={48} color="white" />,
            description: 'Click the verification link in your email to activate your account.',
            actionText: 'Resend Verification Email',
            gradient: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
            chipColor: 'primary',
            chipLabel: 'Account Verification'
        },
        [EMAIL_TYPES.RESET]: {
            title: 'Reset Your Password',
            icon: <MdLock size={48} color="white" />,
            description: 'Click the reset link in your email to set a new password.',
            actionText: 'Resend Reset Email',
            gradient: 'linear-gradient(45deg, #f59e0b, #f97316)',
            chipColor: 'warning',
            chipLabel: 'Password Reset'
        }
    };

    return configs[emailType] || {
        title: 'Check Your Email',
        icon: <MdEmail size={48} color="white" />,
        description: 'We\'ve sent you an email with further instructions.',
        actionText: 'Resend Email',
        gradient: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
        chipColor: 'primary',
        chipLabel: 'Email Verification'
    };
};

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
const EmailVerifyPage = () => {
    const { uuid, token } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const theme = useAuthTheme();
    const { currentTheme } = useThemeMode();
    const { palette } = currentTheme;

    // Derived state
    const isSessionMode = !!uuid && !token;
    const isTokenMode = !!token && !uuid;
    const identifier = uuid || token;

    // Local state
    const [countdown, setCountdown] = useState(0);
    const [isVerified, setIsVerified] = useState(false);
    const [verificationError, setVerificationError] = useState(null);
    const [emailType, setEmailType] = useState(null);
    const [tokenData, setTokenData] = useState(null);

    // ============================
    // QUERIES
    // ============================
    const sessionQuery = useQuery({
        queryKey: ['session', uuid],
        queryFn: () => apiService.checkSession(uuid),
        enabled: isSessionMode,
        refetchInterval: (data) => data?.status === 'verified' ? false : 30000,
        retry: (failureCount, error) => {
            if (error.response?.status >= 400 && error.response?.status < 500) {
                return false;
            }
            return failureCount < 3;
        }
    });

    const tokenQuery = useQuery({
        queryKey: ['tokenInfo', token],
        queryFn: () => apiService.getTokenInfo(token),
        enabled: isTokenMode,
        retry: (failureCount, error) => {
            if (error.response?.status >= 400 && error.response?.status < 500) {
                return false;
            }
            return failureCount < 3;
        }
    });

    const statusQuery = useQuery({
        queryKey: ['verificationStatus', identifier],
        queryFn: () => apiService.checkVerificationStatus(identifier),
        enabled: !!identifier,
        refetchInterval: 10000,
        retry: false
    });

    // ============================
    // MUTATIONS
    // ============================
    const resendMutation = useMutation({
        mutationFn: ({ type }) => apiService.resendEmail(uuid, type),
        onSuccess: (data) => {
            setCountdown(60);
            setEmailType(data.emailType);
            setVerificationError(null);
            queryClient.invalidateQueries(['session', uuid]);
            queryClient.invalidateQueries(['tokenInfo', token]);
            queryClient.invalidateQueries(['verificationStatus', identifier]);
        },
        onError: (error) => {
            console.error('Resend failed:', error);
            setVerificationError(error.message);
        }
    });

    const verifyMutation = useMutation({
        mutationFn: () => apiService.verifyEmail(token),
        onSuccess: (data) => {
            if (data.status === 'success') {
                setIsVerified(true);
                setVerificationError(null);
                queryClient.invalidateQueries(['session', uuid]);
                queryClient.invalidateQueries(['tokenInfo', token]);
                queryClient.invalidateQueries(['verificationStatus', identifier]);
            }
        },
        onError: (error) => {
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
        if (token && !isVerified && !verificationError && !verifyMutation.isSuccess) {
            verifyMutation.mutate();
        }
    }, [token, isVerified, verificationError, verifyMutation.isSuccess, verifyMutation]);

    useEffect(() => {
        const data = sessionQuery.data || tokenQuery.data;
        if (!data) return;

        const sessionType = data.sessionType || data.tokenType;
        setEmailType(sessionType);
        
        if (data.cooldown) {
            setCountdown(Math.ceil(data.cooldown));
        }

        setTokenData({
            email: data.email,
            sessionType,
            tokenExpires: data.tokenExpires,
            cooldown: data.cooldown || 0
        });
    }, [sessionQuery.data, tokenQuery.data]);

    useEffect(() => {
        if (statusQuery.data?.isVerified && !isVerified) {
            setIsVerified(true);
        }
    }, [statusQuery.data, isVerified]);

    // ============================
    // HANDLERS
    // ============================
    const handlers = {
        resendEmail: () => {
            if (countdown === 0 && !resendMutation.isPending) {
                setVerificationError(null);
                const currentEmailType = emailType || sessionQuery.data?.sessionType;
                resendMutation.mutate({ type: currentEmailType });
            }
        },
        backToLogin: () => navigate('/'),
        continueToDashboard: () => navigate('/'),
        goToPasswordReset: () => navigate(`/auth/reset-password/${token}`),
        clearError: () => {
            setVerificationError(null);
            resendMutation.reset();
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

    const renderVerificationErrorScreen = () => {
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
                                onClick={() => navigate(`/auth/notification/${uuid}`)}
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

    const renderMainScreen = () => {
        const emailTypeConfig = getEmailTypeConfig(emailType);
        const displayEmail = tokenData?.email || 'your email';

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
                            {emailType && (
                                <Box sx={{ mb: 2 }}>
                                    <Chip
                                        label={emailTypeConfig.chipLabel}
                                        color={emailTypeConfig.chipColor}
                                        variant="outlined"
                                        size="small"
                                    />
                                </Box>
                            )}

                            {/* Icon Section */}
                            <Slide direction="down" in={true} timeout={800}>
                                <Box sx={{ mb: 4 }}>
                                    <Box
                                        sx={{
                                            width: 100,
                                            height: 100,
                                            borderRadius: '50%',
                                            background: emailTypeConfig.gradient,
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
                                        {emailTypeConfig.icon}
                                    </Box>
                                </Box>
                            </Slide>

                            {/* Content Section */}
                            <Slide direction="up" in={true} timeout={1000}>
                                <Box>
                                    <Typography variant="h4" gutterBottom>
                                        {emailTypeConfig.title} ✨
                                    </Typography>

                                    <Typography variant="body1" sx={{ mb: 1, fontSize: '1.1rem' }}>
                                        {`We've sent an email to`}
                                    </Typography>

                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: emailType === EMAIL_TYPES.RESET ? palette.warning.main : palette.primary.main,
                                            mb: 3,
                                            fontWeight: 600,
                                            wordBreak: 'break-word',
                                        }}
                                    >
                                        {displayEmail}
                                    </Typography>

                                    <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.7 }}>
                                        {emailTypeConfig.description}
                                        {tokenData?.tokenExpires && (
                                            <span style={{ display: 'block', marginTop: 8, fontSize: '0.9em', opacity: 0.8 }}>
                                                Link expires: {new Date(tokenData.tokenExpires).toLocaleString()}
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
                                                background: countdown > 0 || resendMutation.isPending ? '#e2e8f0' : emailTypeConfig.gradient,
                                                color: countdown > 0 || resendMutation.isPending ? '#64748b' : 'white',
                                                boxShadow: countdown > 0 || resendMutation.isPending ? 'none' : '0 8px 25px rgba(99, 102, 241, 0.3)',
                                                '&:hover': {
                                                    background: countdown > 0 || resendMutation.isPending ? '#e2e8f0' : emailTypeConfig.gradient,
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
                                                    : emailTypeConfig.actionText
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
                                                    {resendMutation.data?.emailType && (
                                                        <span> ({resendMutation.data.emailType})</span>
                                                    )}
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
                                                color: emailType === EMAIL_TYPES.RESET ? '#f59e0b' : '#6366f1',
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
    // Loading states
    if ((sessionQuery.isLoading && isSessionMode) || (tokenQuery.isLoading && isTokenMode)) {
        return renderLoadingScreen();
    }

    // Error states
    if ((sessionQuery.error && !sessionQuery.data && isSessionMode) || 
        (tokenQuery.error && !tokenQuery.data && isTokenMode)) {
        const error = sessionQuery.error || tokenQuery.error;
        return renderErrorScreen(error);
    }

    // Already verified (session mode)
    if (sessionQuery.data?.status === 'verified') {
        return renderSuccessScreen({
            title: 'Already Verified! ✨',
            description: 'Your account is already verified and ready to use. You can access all features.',
            buttonText: 'Continue to Dashboard',
            action: 'dashboard',
            gradient: 'linear-gradient(45deg, #6366f1, #8b5cf6)'
        });
    }

    // Successfully verified
    if (isVerified) {
        const successConfig = getSuccessConfig(emailType);
        return renderSuccessScreen(successConfig);
    }

    // Verification error (token mode only)
    if (verificationError && !isSessionMode) {
        return renderVerificationErrorScreen();
    }

    // Main verification/reset waiting screen
    return renderMainScreen();
};

export default EmailVerifyPage;