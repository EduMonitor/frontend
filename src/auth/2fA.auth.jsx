// ============================================
// FILE: TwoFactorAuth.jsx - CORRECTED VERSION
// ============================================
import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Typography from "@mui/material/Typography"
import Divider from "@mui/material/Divider"
import Fade from "@mui/material/Fade"
import Slide from "@mui/material/Slide"
import TextField from "@mui/material/TextField"
import CircularProgress from "@mui/material/CircularProgress"
import Container from "@mui/material/Container"
import Alert from "@mui/material/Alert"
import Stack from "@mui/material/Stack"
import LinearProgress from "@mui/material/LinearProgress"
import { FaShield } from 'react-icons/fa6';
import { FaArrowLeft, FaCalendarTimes, FaLock, FaSync } from 'react-icons/fa';
import useAuthTheme from './sections/themeHook.sections';
import { AnimatedGrid, FloatingElements } from '../components/animations/background.animations';
import { aiFeatures } from './sections/aifeature.sections';
import { ErrorCardSection, SuccessCardSection } from './sections/card.section';
import { CardBox } from '../components/cards/card.card';
import { useThemeMode } from '../utils/hooks/contexts/useTheme.context';
import { useNavigate, useParams } from 'react-router-dom';
import useAuth from '../utils/hooks/contexts/useAth.contexts';
import useToast from '../components/toast/toast.toast';
import { axiosPrivate } from '../utils/hooks/instance/axios.instance';
import { fetchCsrfToken } from '../utils/hooks/token/csrf.token';

// ============================
// API UTILITIES (YOUR ACTUAL API)
// ============================
const fetchSessions = async ({uuid }) => {
    try {
        const csrfToken = await fetchCsrfToken();
        const response = await axiosPrivate.get(`/api/v2/session/${uuid}`, {
            headers: {
                'x-csrf-token': csrfToken
            }
        });
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.detail?.error ||
            error.response?.data?.detail?.message ||
            'Request failed';
        throw new Error(errorMessage);
    }
};


const TwoFactorAuth = () => {
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isResending, setIsResending] = useState(false);
  
  // ✅ FIX 1: Initialize as null, not 'verify'
  const [step, setStep] = useState(null);
  
  const [errorMessage, setErrorMessage] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const inputRefs = useRef([]);
  const theme = useAuthTheme();
  const { currentTheme } = useThemeMode();
  const { palette } = currentTheme;
  const navigate = useNavigate();
  const { uuid } = useParams();
  const { setAuth } = useAuth();
  const { showToast, ToastComponent } = useToast();

  // Fetch session data with React Query (YOUR API)
  const { data: sessionData, isLoading: isLoadingSession, error: sessionError, refetch } = useQuery({
    queryKey: ['twoFactorSession', uuid],
    queryFn: () => fetchSessions({ uuid }),
    enabled: !!uuid,
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: () => {
      return step === 'verify' ? 30000 : false;
    }
  });

  // ✅ FIX 2: Handle session data updates and SET STEP based on backend
  useEffect(() => {
    if (!sessionData) return;

    // Validate session type from YOUR BACKEND
    if (sessionData.sessionType === '2fa_verification') {
      // Check if locked first
      if (sessionData.isLocked) {
        setStep('error');
        setErrorMessage(sessionData.message || 'Account temporarily locked');
      } else {
        // ✅ Only set to 'verify' when backend confirms valid 2FA session
        setStep('verify');
      }
      
      // Update state from backend
      setTimeLeft(sessionData.timeRemaining || 0);
      setAttemptsLeft(sessionData.attemptsLeft || 3);
    } else {
      // Invalid session type
      setStep('error');
      setErrorMessage('Invalid 2FA session');
      showToast({ 
        title: "Error", 
        description: "Invalid 2FA session", 
        status: "error" 
      });
      navigate('/', { replace: true });
    }
  }, [sessionData, navigate, showToast]);

  // ✅ FIX 3: Handle session errors properly
  useEffect(() => {
    if (!sessionError) return;

    console.error('Session fetch error:', sessionError);
    
    // Set error step
    setStep('error');
    setErrorMessage(sessionError.response?.data?.detail?.message || "Failed to load session");
    
    showToast({ 
      title: "Session Error", 
      description: sessionError.response?.data?.detail?.message || "Failed to load session", 
      status: "error" 
    });
    
    // Redirect after showing error
    if (sessionError.response) {
      setTimeout(() => navigate('/', { replace: true }), 3000);
    }
  }, [sessionError, navigate, showToast]);

  // Timer countdown - synced with backend
  useEffect(() => {
    if (timeLeft > 0 && step === 'verify') {
      const timer = setTimeout(() => setTimeLeft(prev => Math.max(0, prev - 1)), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && step === 'verify' && sessionData) {
      setErrorMessage('Verification code expired. Please request a new code.');
    }
  }, [timeLeft, step, sessionData]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (index, value) => {
    if (value.length > 1) return;
    if (!/^[A-Z0-9]*$/i.test(value)) return;
    
    const newCode = [...verificationCode];
    newCode[index] = value.toUpperCase();
    setVerificationCode(newCode);
    setErrorMessage('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      setTimeout(() => handleVerify(newCode.join('')), 500);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (pasteData.length === 6) {
      const newCode = pasteData.split('');
      setVerificationCode(newCode);
      setTimeout(() => handleVerify(pasteData), 500);
    }
  };

  // Verify code (YOUR API)
  const handleVerify = async (code = verificationCode.join('')) => {
    if (code.length !== 6) {
      setErrorMessage('Please enter all 6 characters');
      return;
    }

    if (timeLeft === 0) {
      setErrorMessage('Code expired. Please request a new code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const csrfToken = await fetchCsrfToken();
      const response = await axiosPrivate.post('/api/v2/verify-2fa', {
        uuid: uuid,
        code: code
      },
      {
        headers: {
          'x-csrf-token': csrfToken
        },
      }
    );

      if (response.status === 200) {
        const result = response.data;

        setAuth({ 
          accessToken: result.accessToken, 
          role: result.data.role,
          uuid: result.data.uuid,
          firstName: result.data.firstName
        });

        localStorage.setItem("persist", true);

        setStep('success');
        showToast({ 
          title: "Success", 
          description: result.message, 
          status: "success" 
        });

        setTimeout(() => {
          navigate(result.redirectUrl || '/ai/dashboard', { replace: true });
        }, 2000);
      }
    } catch (error) {
      console.error('Verification error:', error);
      
      if (error.response?.data?.detail) {
        const errorDetail = error.response.data.detail;
        
        if (errorDetail.status === 'locked') {
          setStep('error');
          setErrorMessage(errorDetail.message);
          showToast({ 
            title: "Account Locked", 
            description: errorDetail.message, 
            status: "error" 
          });
          return;
        }

        if (errorDetail.status === 'invalid_code') {
          setAttemptsLeft(errorDetail.attemptsLeft || 0);
          setErrorMessage(errorDetail.message);
          setVerificationCode(['', '', '', '', '', '']);
          inputRefs.current[0]?.focus();
          
          showToast({ 
            title: "Invalid Code", 
            description: errorDetail.message, 
            status: "error" 
          });
          
          refetch();
          return;
        }

        if (errorDetail.status === 'expired') {
          setErrorMessage(errorDetail.message);
          showToast({ 
            title: "Code Expired", 
            description: errorDetail.message, 
            status: "warning" 
          });
          return;
        }

        setErrorMessage(errorDetail.message || 'Verification failed');
        showToast({ 
          title: "Error", 
          description: errorDetail.message || 'Verification failed', 
          status: "error" 
        });
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
        showToast({ 
          title: "Error", 
          description: 'An unexpected error occurred', 
          status: "error" 
        });
      }
      
      setVerificationCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  // Resend code (YOUR API)
  const handleResend = async () => {
    setIsResending(true);
    setErrorMessage('');

    try {
      const response = await axiosPrivate.post('/api/v2/resend-2fa', {
        uuid: uuid
      }, {
        withCredentials: true
      });

      if (response.status === 200) {
        const result = response.data;
        setTimeLeft(result.expiresIn || 300);
        setVerificationCode(['', '', '', '', '', '']);
        setAttemptsLeft(3);
        inputRefs.current[0]?.focus();
        
        showToast({ 
          title: "Code Resent", 
          description: result.message, 
          status: "success" 
        });

        refetch();
      }
    } catch (error) {
      console.error('Resend error:', error);
      const errorMsg = error.response?.data?.detail?.message || 'Failed to resend code';
      setErrorMessage(errorMsg);
      showToast({ 
        title: "Resend Failed", 
        description: errorMsg, 
        status: "error" 
      });
    } finally {
      setIsResending(false);
    }
  };

  const progress = sessionData?.codeExpires 
    ? Math.min(100, Math.max(0, ((300 - timeLeft) / 300) * 100))
    : 0;

  // ✅ FIX 4: Show loading while fetching OR while step is null
  if (isLoadingSession || step === null) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: palette.background.default,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <FloatingElements aiFeatures={aiFeatures} />
        <AnimatedGrid />

        <Container maxWidth="sm">
          <Fade in timeout={1000}>
            <CardBox step={step}>
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <CircularProgress size={60} sx={{ mb: 3, color: theme.accent }} />
                <Typography variant="h6" sx={{ color: theme.textPrimary, mb: 1 }}>
                  Loading Session...
                </Typography>
                <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                  Please wait while we verify your session
                </Typography>
              </Box>
            </CardBox>
          </Fade>
        </Container>
      </Box>
    );
  }

  // Show error if session is in error state
  if (step === 'error') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: palette.background.default,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <FloatingElements aiFeatures={aiFeatures} />
        <AnimatedGrid />

        <Container maxWidth="sm">
          <Fade in timeout={1000}>
            <CardBox step="error">
              <ErrorCardSection 
                setStep={setStep} 
                setErrorMessage={setErrorMessage} 
                setTimeLeft={setTimeLeft} 
                setVerificationCode={setVerificationCode}
                errorMessage={errorMessage}
              />
            </CardBox>
          </Fade>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: palette.background.default,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <FloatingElements aiFeatures={aiFeatures} />
      <AnimatedGrid />

      <Container maxWidth="sm">
        <Fade in timeout={1000}>
          <CardBox step={step}>
            {/* Success State */}
            {step === 'success' && (
              <SuccessCardSection />
            )}

            {/* Main Verification State */}
            {step === 'verify' && (
              <Slide direction="up" in timeout={800}>
                <Box>
                  {/* Header */}
                  <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #4A90E2, #9B59B6)',
                        mb: 2,
                        animation: 'pulse 2s ease-in-out infinite',
                        '@keyframes pulse': {
                          '0%': { boxShadow: '0 0 0 0 rgba(74, 144, 226, 0.7)' },
                          '70%': { boxShadow: '0 0 0 20px rgba(74, 144, 226, 0)' },
                          '100%': { boxShadow: '0 0 0 0 rgba(74, 144, 226, 0)' },
                        },
                      }}
                    >
                      <FaShield style={{ fontSize: '40px', color: 'white' }} />
                    </Box>

                    <Typography
                      variant="h4"
                      sx={{
                        color: theme.textPrimary,
                        fontWeight: 700,
                        mb: 2,
                      }}
                    >
                      Two-Factor Authentication
                    </Typography>

                    <Typography
                      variant="body1"
                      sx={{
                        color: theme.textSecondary,
                        fontSize: '1.1rem',
                      }}
                    >
                      Secure your account with an additional layer of protection
                    </Typography>
                  </Box>

                  {/* Code Input */}
                  <Box sx={{ mb: 4 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.textSecondary,
                        textAlign: 'center',
                        mb: 3,
                      }}
                    >
                      Enter the 6-character verification code sent to {sessionData?.email || 'your email'}
                    </Typography>

                    <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
                      {verificationCode.map((digit, index) => (
                        <TextField
                          key={index}
                          inputRef={el => inputRefs.current[index] = el}
                          value={digit}
                          onChange={(e) => handleInputChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          onPaste={handlePaste}
                          disabled={isLoading || timeLeft === 0}
                          sx={{
                            width: 56,
                            '& .MuiOutlinedInput-root': {
                              height: 56,
                              bgcolor: 'rgba(255, 255, 255, 0.05)',
                              borderRadius: 2,
                              fontSize: '1.5rem',
                              fontWeight: 700,
                              textAlign: 'center',
                              '&.Mui-focused fieldset': {
                                borderColor: theme.accent,
                                boxShadow: `0 0 0 3px ${theme.accent}20`,
                              },
                              '& input': {
                                color: theme.textPrimary,
                                textAlign: 'center',
                                padding: 0,
                                textTransform: 'uppercase',
                              },
                            },
                          }}
                          inputProps={{
                            maxLength: 1,
                            style: { textAlign: 'center' }
                          }}
                        />
                      ))}
                    </Stack>

                    {errorMessage && (
                      <Alert
                        severity="error"
                        sx={{
                          bgcolor: `${theme.error}20`,
                          border: `1px solid ${theme.error}30`,
                          color: theme.error,
                          '& .MuiAlert-icon': {
                            color: theme.error,
                          },
                        }}
                      >
                        {errorMessage}
                      </Alert>
                    )}

                    {attemptsLeft < 3 && attemptsLeft > 0 && (
                      <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: attemptsLeft === 1 ? theme.error : theme.warning,
                            fontWeight: 600 
                          }}
                        >
                          ⚠️ {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Timer and Resend */}
                  <Box sx={{ mb: 4 }}>
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 2 }}>
                      <FaCalendarTimes style={{ fontSize: 20, color: theme.textSecondary }} />
                      <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                        Code expires in {formatTime(timeLeft)}
                      </Typography>
                    </Stack>

                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      sx={{
                        height: 4,
                        borderRadius: 2,
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: timeLeft > 60 ? theme.accent : theme.warning,
                          borderRadius: 2,
                        },
                        mb: 2,
                      }}
                    />

                    <Box sx={{ textAlign: 'center' }}>
                      {timeLeft > 0 ? (
                        <Button
                          onClick={handleResend}
                          disabled={isResending}
                          startIcon={isResending ? <CircularProgress size={16} /> : <FaSync />}
                          sx={{
                            color: theme.accent,
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': {
                              bgcolor: `${theme.accent}10`,
                            },
                          }}
                        >
                          {isResending ? 'Sending...' : 'Resend Code'}
                        </Button>
                      ) : (
                        <Typography variant="body2" sx={{ color: theme.error, fontWeight: 600 }}>
                          Code expired. Please request a new one.
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Verify Button */}
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handleVerify()}
                    disabled={verificationCode.join('').length !== 6 || isLoading || timeLeft === 0}
                    sx={{
                      height: 56,
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${theme.accent}, ${theme.success})`,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      position: 'relative',
                      overflow: 'hidden',
                      mb: 3,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.accent}dd, ${theme.success}dd)`,
                        boxShadow: `0 8px 25px ${theme.accent}40`,
                        transform: 'translateY(-2px)',
                      },
                      '&:active': {
                        transform: 'translateY(0)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {isLoading ? (
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <CircularProgress size={24} color="inherit" />
                        <span>Verifying...</span>
                      </Stack>
                    ) : (
                      <>
                        <FaLock style={{ marginRight: '8px' }} />
                        Verify & Continue
                      </>
                    )}
                  </Button>

                  <Divider sx={{ color: theme.textSecondary, mb: 3 }} />
                  
                  <Button
                    variant="text"
                    startIcon={<FaArrowLeft />}
                    onClick={() => navigate("/", { replace: true })}
                    sx={{
                      display: "flex",
                      alignSelf: "center",
                      textTransform: 'none',
                      fontWeight: 500,
                      '&:hover': {
                        color: '#6366f1',
                      },
                    }}
                  >
                    Back to Login
                  </Button>
                </Box>
              </Slide>
            )}
          </CardBox>
        </Fade>
      </Container>
      {ToastComponent}
    </Box>
  );
};

export default TwoFactorAuth;