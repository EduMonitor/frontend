import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Typography from "@mui/material/Typography"
import Divider from "@mui/material/Divider"
import Fade from "@mui/material/Fade"
import Slide from "@mui/material/Slide"
import CircularProgress from "@mui/material/CircularProgress"
import Container from "@mui/material/Container"
import Grid from "@mui/material/Grid"
import Alert from "@mui/material/Alert"

import {
  FaUserCircle,
  FaArrowLeft,
  FaExclamationTriangle,
  FaClock,
  FaRedo,
} from 'react-icons/fa';
import DOMPurify from 'dompurify'
import InputField from '../components/forms/input.forms';
import { SubmittingSpinner } from '../components/spinner/spinners.spinners';
import { resetValidator } from '../utils/validators/input.validators';
import useToast from '../components/toast/toast.toast';
import { resetForm } from '../constants/forms.constant';
import useAuthTheme from './sections/themeHook.sections';
import { AnimatedGrid, FloatingElements } from '../components/animations/background.animations';
import { aiFeatures } from './sections/aifeature.sections';
import { BrandingSection } from '../components/animations/branding.animations';
import { CardBox } from '../components/cards/card.card';
import { useNavigate, useParams } from 'react-router-dom';
import { authConfig } from '../constants/string.constants';
import { fetchCsrfToken } from '../utils/hooks/token/csrf.token';
import { axiosPrivate } from '../utils/hooks/instance/axios.instance';

// API functions for React Query
const fetchTokenInfo = async (token) => {
  if (!token) throw new Error('No token provided');
  const csrfToken = fetchCsrfToken();

  const response = await axiosPrivate.get(`/api/v2/token-info/${token}`, {
    headers: {
      'x-csrf-token': csrfToken
    }
  });
  return response.data;
};

const fetchSessionStatus = async (uuid) => {
  if (!uuid) throw new Error('No UUID provided');
  const csrfToken = fetchCsrfToken();

  const response = await axiosPrivate.get(`/api/v2/sessions/${uuid}`, {
    headers: {
      'x-csrf-token': csrfToken
    }
  });
  return response.data;
};

const ResetPages = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [resetCompleted, setResetCompleted] = useState(false); // Add this state
  const { token } = useParams();
  const queryClient = useQueryClient();
  const signinSchema = resetValidator();
  
  const [values, setValues] = useState({
    password: "",
    passwordConfirm: ""
  });
  
  const { showToast, ToastComponent } = useToast();
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const theme = useAuthTheme();

  // Token validation query
  const {
    data: tokenInfo,
    isLoading: isValidatingToken,
    isError: tokenError,
    error: tokenErrorData,
    refetch: refetchToken,
    isSuccess: tokenSuccess
  } = useQuery({
    queryKey: ['tokenInfo', token],
    queryFn: () => fetchTokenInfo(token),
    enabled: !!token && !resetCompleted, // Stop querying once reset is completed
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      // Stop refetching if reset is completed, token is expired or invalid
      if (resetCompleted || tokenExpired || query.state.error) return false;
      // Refetch every 30 seconds to check token status
      return 30 * 1000;
    }
  });

  // Handle token info success/error with useEffect
  useEffect(() => {
    if (tokenSuccess && tokenInfo) {
      // Validate token type and user status
      if (tokenInfo.tokenType !== 'reset') {
        showToast({ 
          title: "Invalid Token Type", 
          description: "This link is not for password reset.", 
          status: "error" 
        });
        return;
      }
      
      if (!tokenInfo.isVerified) {
        showToast({ 
          title: "Account Not Verified", 
          description: "Please verify your email first before resetting password.", 
          status: "error" 
        });
        return;
      }
      
      // Check if token is about to expire
      const now = Date.now();
      const expiresTimestamp = new Date(tokenInfo.tokenExpires).getTime();
      const timeUntilExpiry = expiresTimestamp - now;
      
      if (timeUntilExpiry <= 0) {
        setTokenExpired(true);
        showToast({ 
          title: "Token Expired", 
          description: "Your reset link has expired. Please request a new one.", 
          status: "error" 
        });
      }
    }
  }, [tokenSuccess, tokenInfo, showToast]);

  useEffect(() => {
    if (tokenError && tokenErrorData) {
      const status = tokenErrorData.response?.status;
      const message = tokenErrorData.response?.data?.message || tokenErrorData.message;
      
      if (status === 400) {
        showToast({ 
          title: "Invalid Token", 
          description: message, 
          status: "error" 
        });
      } else if (status === 404) {
        showToast({ 
          title: "User Not Found", 
          description: "The user associated with this reset link was not found.", 
          status: "error" 
        });
      } else {
        showToast({ 
          title: "Validation Error", 
          description: "Unable to validate reset link. Please try again.", 
          status: "error" 
        });
      }
    }
  }, [tokenError, tokenErrorData, showToast]);

  // Session status query (dependent on token info)
  const {
    data: sessionInfo,
    isLoading: isValidatingSession,
    isError: sessionError,
    error: sessionErrorData,
    refetch: refetchSession
  } = useQuery({
    queryKey: ['sessionStatus', tokenInfo?.uuid],
    queryFn: () => fetchSessionStatus(tokenInfo.uuid),
    enabled: !!tokenInfo?.uuid && tokenSuccess && !tokenError && !resetCompleted, // Stop querying once reset is completed
    retry: (failureCount, error) => {
      // Don't retry on 440 (session expired) as it's expected
      if (error.response?.status === 440) return false;
      return failureCount < 2;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes (renamed from cacheTime)
    refetchOnWindowFocus: true
  });

  // Handle session error with useEffect
  useEffect(() => {
    if (sessionError && sessionErrorData) {
      // Session check is supplementary, log but don't fail the whole process
      if (sessionErrorData.response?.status === 440) {
        console.log('Session expired, but token might still be valid');
      } else {
        console.warn('Session check failed:', sessionErrorData.response?.data?.message);
      }
    }
  }, [sessionError, sessionErrorData]);

  // Timer for token expiration countdown
  useEffect(() => {
    let timer;
    
    if (tokenInfo?.tokenExpires && !tokenExpired) {
      timer = setInterval(() => {
        const now = Date.now();
        const expiresTimestamp = new Date(tokenInfo.tokenExpires).getTime();
        const remaining = expiresTimestamp - now;
        
        if (remaining <= 0) {
          setTokenExpired(true);
          setTimeLeft(null);
          // Invalidate queries when token expires
          queryClient.invalidateQueries(['tokenInfo', token]);
          showToast({ 
            title: "Token Expired", 
            description: "Your reset link has expired. Please request a new one.", 
            status: "error" 
          });
        } else {
          setTimeLeft(Math.ceil(remaining / 1000));
        }
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [tokenInfo, tokenExpired, queryClient, token, showToast]);

  // Computed values
  const isTokenValid = tokenSuccess && tokenInfo && !tokenExpired && !tokenError;
  const isValidating = isValidatingToken || isValidatingSession;
  const canSubmit = isTokenValid && !isLoading;

  const formatTimeLeft = (seconds) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRetryValidation = useCallback(() => {
    setTokenExpired(false);
    refetchToken();
    if (tokenInfo?.uuid) {
      refetchSession();
    }
  }, [refetchToken, refetchSession, tokenInfo?.uuid]);

  const handleInputChange = useCallback((event) => {
    const { name, type, value, checked } = event.target;
    const sanitizedValue = type === "checkbox" ? checked : DOMPurify.sanitize(value);
    setValues((prevValues) => ({
      ...prevValues,
      [name]: sanitizedValue
    }));
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: undefined
    }));
  }, []);

  const handlePasswordReset = useCallback(async (e) => {
    e.preventDefault();
    
    // Final token validity check before submission
    if (!canSubmit) {
      showToast({ 
        title: "Invalid Session", 
        description: "Your reset session is no longer valid.", 
        status: "error" 
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const csrfToken = await fetchCsrfToken();
      await signinSchema.validate(values, { abortEarly: false });

      const clientData = {
        password: values.password.trim(),
        passwordConfirm: values.passwordConfirm.trim()
      };

      const response = await axiosPrivate.post(`/api/v2/reset-password/${token}`, clientData, {
        headers: {
          'x-csrf-token': csrfToken,
        },
      });

      if (response.status === 200 || response.status === 201) {
        const result = response.data;
        // Mark reset as completed to stop query polling
      setResetCompleted(true);
        // Clear queries on successful reset
        queryClient.removeQueries(['tokenInfo']);
        queryClient.removeQueries(['sessionStatus']);
        
        navigate('/', { replace: true });
        showToast({ 
          title: "Success", 
          description: result.message, 
          status: "success" 
        });
      }
      
    } catch (error) {
      if (error.response && error.response.data.error.message) {
        showToast({
          title: "Reset Failed",
          description: error.response.data.error.message,
          status: "error"
        });
        setErrors(error.response.data.errors || {});
        
        // Handle specific error cases
        if (error.response.status === 400 || error.response.status === 401) {
          // Token might have expired during the process
          setTokenExpired(true);
          queryClient.invalidateQueries(['tokenInfo', token]);
        }
      } else if (error.inner) {
        const validationErrors = {};
        error.inner.forEach((err) => { 
          validationErrors[err.path] = err.message; 
        });
        setErrors(validationErrors);
      } else {
        showToast({ 
          title: "Error", 
          description: error.message, 
          status: "error" 
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [signinSchema, values, token, navigate, showToast, canSubmit, queryClient]);

  const renderedFormInputs = useMemo(() => (
    <Grid container spacing={2}>
      {resetForm().map(({ name, icon, label, placeholder, type, inputType }) => (
        <Grid size={{ xs: 12 }} key={name}>
          <InputField
            fullWidth
            label={label}
            placeholder={placeholder}
            name={name}
            prefix={icon}
            type={type}
            inputType={inputType}
            value={values[name]}
            error={!!errors[name]}
            errorMessage={errors[name]}
            onChange={handleInputChange}
            disabled={!isTokenValid}
          />
        </Grid>
      ))}
    </Grid>
  ), [values, errors, handleInputChange, isTokenValid]);

  // Show loading while validating token
  if (isValidating && !tokenInfo) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: theme.background,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={50} />
          <Typography sx={{ mt: 2, color: theme.textSecondary }}>
            Validating reset link...
          </Typography>
        </Box>
      </Box>
    );
  }

  // Show error state if token is invalid
  if (tokenError || tokenExpired) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: theme.background,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Container maxWidth="sm">
          <CardBox>
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <FaExclamationTriangle 
                style={{ 
                  fontSize: '60px', 
                  color: '#f44336', 
                  marginBottom: '16px' 
                }} 
              />
              <Typography variant="h5" sx={{ color: theme.textPrimary, mb: 2 }}>
                {tokenExpired ? 'Reset Link Expired' : 'Invalid Reset Link'}
              </Typography>
              <Typography variant="body1" sx={{ color: theme.textSecondary, mb: 3 }}>
                {tokenExpired 
                  ? 'This password reset link has expired. Please request a new one.'
                  : 'This password reset link is invalid. Please request a new password reset.'
                }
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  onClick={handleRetryValidation}
                  startIcon={<FaRedo />}
                  disabled={isValidatingToken}
                >
                  {isValidatingToken ? 'Retrying...' : 'Retry Validation'}
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/auth/forgot-password')}
                >
                  Request New Reset
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/auth/login')}
                >
                  Back to Login
                </Button>
              </Box>
            </Box>
          </CardBox>
        </Container>
        {ToastComponent}
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

      <Container maxWidth="lg">
        <Fade in timeout={1000}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 4,
              flexDirection: { xs: 'column', lg: 'row' },
            }}
          >
            <BrandingSection aiFeatures={aiFeatures} theme={theme} />
            
            <Slide direction="left" in timeout={1000}>
              <Box sx={{ flex: 1, maxWidth: 450, width: '100%' }}>
                <CardBox>
                  {/* Session Status Alert */}
                  {sessionError && sessionErrorData?.response?.status !== 440 && (
                    <Alert 
                      severity="warning" 
                      sx={{ mb: 2 }}
                      action={
                        <Button 
                          size="small" 
                          onClick={() => refetchSession()}
                          disabled={isValidatingSession}
                        >
                          {isValidatingSession ? 'Checking...' : 'Retry'}
                        </Button>
                      }
                    >
                      Session check failed. You can still proceed with password reset.
                    </Alert>
                  )}

                  {/* Timer Alert */}
                  {timeLeft && timeLeft <= 300 && ( // Show warning when less than 5 minutes left
                    <Alert 
                      severity={timeLeft <= 60 ? "error" : "warning"} 
                      icon={<FaClock />}
                      sx={{ mb: 2 }}
                    >
                      Reset link expires in: <strong>{formatTimeLeft(timeLeft)}</strong>
                    </Alert>
                  )}

                  {/* Cooldown Alert */}
                  {sessionInfo?.cooldown > 0 && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Please wait {sessionInfo.cooldown} seconds before making another request.
                    </Alert>
                  )}

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
                      <FaUserCircle style={{ fontSize: '40px', color: 'white' }} />
                    </Box>
                    <Typography
                      variant="h5"
                      sx={{
                        color: theme.textPrimary,
                        fontWeight: 600,
                        mb: 1,
                      }}
                    >
                      {authConfig.reset.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: theme.textSecondary }}
                    >
                      {authConfig.reset.subtile}
                    </Typography>
                    {tokenInfo?.email && (
                      <Typography
                        variant="body2"
                        sx={{ color: theme.textSecondary, mt: 1, fontStyle: 'italic' }}
                      >
                        Resetting password for: <strong>{tokenInfo.email}</strong>
                      </Typography>
                    )}
                  </Box>

                  <Box display={"flex"} sx={{ flexDirection: "column", gap: 3 }}>
                    {renderedFormInputs}
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={handlePasswordReset}
                      disabled={!canSubmit}
                      sx={{
                        height: 56,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #4A90E2, #50C878)',
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #357ABD, #45B849)',
                          boxShadow: '0 8px 25px rgba(74, 144, 226, 0.4)',
                          transform: 'translateY(-2px)',
                        },
                        '&:active': {
                          transform: 'translateY(0)',
                        },
                        transition: 'all 0.3s ease',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                          transition: 'left 0.6s',
                        },
                        '&:hover::before': {
                          left: '100%',
                        },
                      }}
                    >
                      {isLoading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        authConfig.reset.buttonText
                      )}
                    </Button>
                  </Box>

                  <Divider sx={{ mb: 3, mt: 4, color: theme.textSecondary }} />

                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => navigate("/auth/login")}
                      startIcon={<FaArrowLeft />}
                      sx={{
                        borderRadius: 2,
                        borderColor: theme.inputBorder || 'rgba(255, 255, 255, 0.2)',
                        color: theme.textSecondary,
                        '&:hover': {
                          borderColor: '#DB4437',
                          backgroundColor: 'rgba(219, 68, 55, 0.1)',
                          color: '#DB4437',
                        },
                      }}
                    >
                      Back to Login
                    </Button>
                  </Box>
                </CardBox>
              </Box>
            </Slide>
          </Box>
        </Fade>
      </Container>
      
      <SubmittingSpinner isLoading={isLoading} />
      {ToastComponent}
    </Box>
  );
};

export default ResetPages;