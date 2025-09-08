import React, { useState, useEffect, useRef } from 'react';

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
import {  FaShield } from 'react-icons/fa6';
import { FaArrowLeft, FaCalendarTimes, FaCheck, FaEnvelope, FaLock, FaPhone, FaSync, FaTimes } from 'react-icons/fa';
import useAuthTheme from './sections/themeHook.sections';
import { AnimatedGrid, FloatingElements } from '../components/animations/background.animations';
import { aiFeatures } from './sections/aifeature.sections';
import { ErrorCardSection, SuccessCardSection } from './sections/card.section';
import { CardBox } from '../components/cards/card.card';
import { useThemeMode } from '../utils/hooks/contexts/useTheme.context';
import { useNavigate } from 'react-router-dom';


const TwoFactorAuth = () => {
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [isResending, setIsResending] = useState(false);
  const [step, setStep] = useState('verify'); // 'verify', 'success', 'error'
  const [attempts, setAttempts] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRefs = useRef([]);
  const theme = useAuthTheme();

  const { currentTheme } = useThemeMode(); // ✅ Destructure correctly
  const { palette } = currentTheme;
  const navigator =useNavigate()

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && step === 'verify') {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, step]);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle input change
  const handleInputChange = (index, value) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    setErrorMessage('');
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    // Auto-verify when all digits are entered
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      setTimeout(() => handleVerify(newCode.join('')), 500);
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pasteData.length === 6) {
      const newCode = pasteData.split('');
      setVerificationCode(newCode);
      setTimeout(() => handleVerify(pasteData), 500);
    }
  };

  // Verify code
  const handleVerify = async (code = verificationCode.join('')) => {
    if (code.length !== 6) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate verification logic
      if (code === '123456') {
        setStep('success');
        setTimeout(() => {
          // Redirect to dashboard
          console.log('Redirecting to dashboard...');
        }, 3000);
      } else {
        setAttempts(prev => prev + 1);
        if (attempts >= 2) {
          setStep('error');
          setErrorMessage('Too many incorrect attempts. Account temporarily locked.');
        } else {
          setErrorMessage(`Incorrect code. ${2 - attempts} attempts remaining.`);
          setVerificationCode(['', '', '', '', '', '']);
          inputRefs.current[0]?.focus();
        }
      }
    } catch (error) {
      console.log(error)
      setErrorMessage('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend code
  const handleResend = async () => {
    setIsResending(true);
    setErrorMessage('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTimeLeft(300);
      setVerificationCode(['', '', '', '', '', '']);
      setAttempts(0);
      inputRefs.current[0]?.focus();
    } catch (error) {
      console.log(error)
      setErrorMessage('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };



  // Progress calculation
  const progress = Math.max(0, ((300 - timeLeft) / 300) * 100);

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
            {/* Error State */}
            {step === 'error' && (
              <ErrorCardSection setStep={setStep} setAttempts={setAttempts} setErrorMessage={setErrorMessage} setTimeLeft={setAttempts} setVerificationCode={setVerificationCode} />
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
                      Enter the 6-digit verification code sent to your email
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
                          disabled={isLoading}
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
                  </Box>

                  {/* Timer and Resend */}
                  <Box sx={{ mb: 4 }}>
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 2 }}>
                      <FaCalendarTimes sx={{ fontSize: 20, color: theme.textSecondary }} />
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
                        <FaLock sx={{ mr: 2 }} />
                        Verify & Continue
                      </>
                    )}
                  </Button>

                  <Divider sx={{ color: theme.textSecondary, mb: 3 }}>

                  </Divider>
                  <Button
                    variant="text"

                    startIcon={<FaArrowLeft />}
                    onClick={()=>navigator("/")}
                    sx={{
                      display:"flex",
                      alignSelf:"center",
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
            )}
          </CardBox>
        </Fade>
      </Container>
    </Box>
  );
};

export default TwoFactorAuth;