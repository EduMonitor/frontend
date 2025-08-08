import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    CircularProgress,
    Fade,
    Grow,
    Slide
} from '@mui/material';
import { MdEmail, MdRefresh, MdCheckCircle, MdArrowBack } from 'react-icons/md';
import { HiSparkles } from 'react-icons/hi';
import { aiFeatures } from './sections/aifeature.sections';
import { AnimatedGrid, FloatingElements } from '../components/animations/background.animations';
import useAuthTheme from './sections/themeHook.sections';
import { useThemeMode } from '../utils/hooks/contexts/useTheme.context';
import { CardBox } from '../components/cards/card.card';


const EmailVerifyPage = () => {
    const [isResending, setIsResending] = useState(false);
    const [resendCount, setResendCount] = useState(0);
    const [countdown, setCountdown] = useState(0);
    const [isVerified, setIsVerified] = useState(false);
    const [userEmail] = useState('user@example.com'); // This would come from props/context
    const theme = useAuthTheme();
    const { currentTheme } = useThemeMode();
    const { palette } = currentTheme;
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleResendEmail = async () => {
        setIsResending(true);
        setResendCount(prev => prev + 1);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        setIsResending(false);
        setCountdown(60); // 60 second cooldown
    };

    const handleBackToLogin = () => {
        // Navigate back to login - this would use your router
        console.log('Navigate back to login');
    };

    // Simulate verification success (for demo)
    const simulateVerification = () => {
        setIsVerified(true);
    };

    if (isVerified) {
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
                {/* Background Components */}
                <FloatingElements aiFeatures={aiFeatures} />
                <AnimatedGrid />
                <Grow in={true} timeout={800}>
                    <CardBox  >
                <Box sx={{
                    maxWidth:480,
                    textAlign:"center"
                }}>
                   
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
                            Email Verified! 🎉
                        </Typography>

                        <Typography variant="body1" sx={{ mb: 4, fontSize: '1.1rem' }}>
                            Awesome! Your email has been successfully verified. You can now access all features of your account.
                        </Typography>

                        <Button
                            variant="contained"
                            size="large"
                            onClick={() => console.log('Continue to dashboard')}
                            sx={{
                                py: 1.5,
                                px: 4,
                                borderRadius: 3,
                                textTransform: 'none',
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
                                boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #4f46e5, #7c3aed)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 12px 35px rgba(99, 102, 241, 0.4)',
                                },
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                        >
                            Continue to Dashboard
                        </Button>
                    </Box>
                </CardBox>
                </Grow>
            </Box>
        );
    }

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
            {/* Background Components */}
            <FloatingElements aiFeatures={aiFeatures} />
            <AnimatedGrid />

            <Fade in={true} timeout={600}>
              <CardBox  >
                <Box sx={{
                    maxWidth:480,
                    textAlign:"center"
                }}>
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

                    <Slide direction="down" in={true} timeout={800}>
                        <Box sx={{ mb: 4 }}>
                            <Box
                                sx={{
                                    width: 100,
                                    height: 100,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
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
                                <MdEmail size={48} color="white" />
                            </Box>
                        </Box>
                    </Slide>

                    <Slide direction="up" in={true} timeout={1000}>
                        <Box>
                            <Typography
                                variant="h4"
                                gutterBottom
                            >
                                Check Your Email ✨
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 1, fontSize: '1.1rem' }}>
                                We've sent a verification link to
                            </Typography>

                            <Typography
                                variant="h6"
                                sx={{
                                    color: palette.primary.main,
                                    mb: 3,
                                    fontWeight: 600,
                                    wordBreak: 'break-word',
                                }}
                            >
                                {userEmail}
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.7 }}>
                                Click the link in your email to verify your account. The link will expire in 24 hours.
                            </Typography>

                            <Box sx={{ mb: 4 }}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={handleResendEmail}
                                    disabled={isResending || countdown > 0}
                                    startIcon={
                                        isResending ? (
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
                                        background: countdown > 0 ? '#e2e8f0' : 'linear-gradient(45deg, #6366f1, #8b5cf6)',
                                        color: countdown > 0 ? '#64748b' : 'white',
                                        boxShadow: countdown > 0 ? 'none' : '0 8px 25px rgba(99, 102, 241, 0.3)',
                                        '&:hover': {
                                            background: countdown > 0 ? '#e2e8f0' : 'linear-gradient(45deg, #4f46e5, #7c3aed)',
                                            transform: countdown > 0 ? 'none' : 'translateY(-2px)',
                                            boxShadow: countdown > 0 ? 'none' : '0 12px 35px rgba(99, 102, 241, 0.4)',
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
                                        : isResending
                                            ? 'Sending...'
                                            : resendCount > 0
                                                ? 'Resend Email'
                                                : 'Resend Verification Email'
                                    }
                                </Button>

                                {resendCount > 0 && (
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

                                <Button
                                    variant="outlined"
                                    size="large"
                                    onClick={simulateVerification}
                                    sx={{
                                        py: 1.5,
                                        px: 4,
                                        borderRadius: 3,
                                        textTransform: 'none',
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        borderColor: '#e2e8f0',
                                        color: '#64748b',
                                        '&:hover': {
                                            borderColor: '#6366f1',
                                            color: '#6366f1',
                                            background: 'rgba(99, 102, 241, 0.04)',
                                        },
                                        transition: 'all 0.3s ease',
                                    }}
                                >
                                    Simulate Verification (Demo)
                                </Button>
                            </Box>

                            <Button
                                variant="text"
                                startIcon={<MdArrowBack />}
                                onClick={handleBackToLogin}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    '&:hover': {
                                        color: '#6366f1',
                                        // background: 'rgba(99, 102, 241, 0.04)',
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
}


export default EmailVerifyPage