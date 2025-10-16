import React, { useState, useCallback, useMemo } from 'react';
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Typography from "@mui/material/Typography"
import Divider from "@mui/material/Divider"
import Fade from "@mui/material/Fade"
import Slide from "@mui/material/Slide"
import FormControlLabel from "@mui/material/FormControlLabel"
import CircularProgress from "@mui/material/CircularProgress"
import Container from "@mui/material/Container"
import Grid from "@mui/material/Grid"
import Checkbox from "@mui/material/Checkbox"

import {
  FaGoogle,
  FaFacebook,
  FaUserCircle,
} from 'react-icons/fa';
import DOMPurify from 'dompurify'
import InputField from '../components/forms/input.forms';
import {  SubmittingSpinner } from '../components/spinner/spinners.spinners';
import { signInValidator } from '../utils/validators/input.validators';
import useToast from '../components/toast/toast.toast';
import { loginForm } from '../constants/forms.constant';
import useAuthTheme from './sections/themeHook.sections';
import { AnimatedGrid, FloatingElements } from '../components/animations/background.animations';
import { aiFeatures } from './sections/aifeature.sections';
import { BrandingSection } from '../components/animations/branding.animations';
import { CardBox } from '../components/cards/card.card';
import { useNavigate } from 'react-router-dom';
import { Link } from '@mui/material';
import { authConfig } from '../constants/string.constants';
import { axiosPrivate } from '../utils/hooks/instance/axios.instance';
import useAuth from '../utils/hooks/contexts/useAth.contexts';
import { fetchCsrfToken } from '../utils/hooks/token/csrf.token';
import useFacebookAuth from '../utils/functions/handlFacebook-login';

const SignInAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const signinSchema = signInValidator()
  const [values, setValues] = useState({
    email: "",
    password: "",
    rememberMe: false
  });
  const { showToast, ToastComponent } = useToast()
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const [errors, setErrors] = useState({})
  const theme = useAuthTheme();
  const { isFacebookLoading, handleFacebookLogin, FacebookToastComponent } = useFacebookAuth();

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



const handleLogin = useCallback(async (e) => {
  e.preventDefault();
  setIsLoading(true);
  
  try {
    // Validate form
    await signinSchema.validate(values, { abortEarly: false });
    
    // Get CSRF token
    const csrfToken = await fetchCsrfToken();
    
    // Prepare login data
    const clientData = {
      email: values.email.toLowerCase().trim(),
      password: values.password.trim()
    };
    
    // Send login request
    const response = await axiosPrivate.post('/api/v2/signin', clientData, { 
      headers: { "x-csrf-token": csrfToken } 
    });
        
    if (response.status === 200 || response.status === 201) {
      const result = response.data;
      
      // Handle email verification required
      if (result.status === "verification_required") {
        showToast({ 
          title: "Verification Required", 
          description: result.message, 
          status: "warning" 
        });
        navigate(result.redirectUrl, { replace: true });
        return;
      }
      
      // Handle 2FA required
      if (result.status === "2fa_required") {
          showToast({ 
          title: "", 
          description: result.message, 
          status: "info" 
        });
        
        // Navigate to 2FA page with uuid in URL
        const redirectPath = result.redirectUrl || `/auth/verify-factor/${result.uuid}`;
        
        navigate(redirectPath, { 
          replace: true,
          state: { 
            uuid: result.uuid,
            email: result.email 
          }
        });
        return;
      }
      
      // Handle direct login (2FA disabled)
      if (result.status === "success" && result.accessToken) {
        setAuth({ 
          accessToken: result.accessToken, 
          role: result.data.role,
          uuid: result.data.uuid,
          firstName: result.data.firstName
        });
        
        localStorage.setItem("persist", true);
        
        navigate(result.redirectUrl, { replace: true });
        showToast({ 
          title: "Success", 
          description: result.message, 
          status: "success" 
        });
      }
    }
  } catch (error) {    
    // Handle API errors
    if (error.response && error.response.data.detail) {
      const apiError = error.response.data.detail;
      const statuCode= error.response.data.detail.status===401
      // Handle field-specific errors
      if (apiError.errors) {
        setErrors(apiError.errors);
      }
      
      // Show error message
      showToast({ 
        title:!statuCode && apiError.status === "locked" ? "Account Locked" : "Login Failed", 
        description: apiError.message, 
        status:statuCode?"warning": "error" 
      });
    } 
    // Handle validation errors
    else if (error.inner) {
      const validationErrors = {};
      error.inner.forEach((err) => { 
        validationErrors[err.path] = err.message; 
      });
      setErrors(validationErrors);
    } 
    // Handle unexpected errors
    else {
      showToast({ 
        title: "Error", 
        description: error.message || "An unexpected error occurred", 
        status: "error" 
      });
    }
  } finally {
    setIsLoading(false);
  }
}, [signinSchema, values, setAuth, navigate, showToast]);



  const renderedFormInputs = useMemo(() => (
    <Grid container spacing={2}>
      {loginForm().map(({ name, icon, label, placeholder, type, inputType }) => (
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
          />
        </Grid>
      ))}
    </Grid>
  ), [values, errors, handleInputChange]);

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
            {/* Right Side - Login Form */}
            <Slide direction="left" in timeout={1000}>
              <Box sx={{ flex: 1, maxWidth: 450, width: '100%' }}>
                <CardBox>
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
                      {authConfig.signIn.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: theme.textSecondary }}
                    >
                      {authConfig.signIn.subtile}
                    </Typography>
                  </Box>

                  <Box display={"flex"} sx={{ flexDirection: "column", gap: 3 }}>
                    {renderedFormInputs}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={values.rememberMe}
                            onChange={handleInputChange}
                            color="primary"
                            name='rememberMe'
                          />
                        }
                        label="Remember Me"
                      />
                      <Link
                        href="/auth/forgot-password"
                        variant="body2"
                        sx={{
                          textDecoration: 'none',
                          color: 'primary.main',
                          fontWeight: 600,
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        Forgotten Password ?
                      </Link>
                    </Box>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={handleLogin}
                      disabled={isLoading}
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
                        'Sign In to Dashboard'
                      )}
                    </Button>
                  </Box>

                  <Divider sx={{ mb: 3, mt: 4, color: theme.textSecondary }}>
                    <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                      or continue with
                    </Typography>
                  </Divider>

                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<FaGoogle />}
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
                      Google
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handleFacebookLogin}
                      disabled={isFacebookLoading}  
                      startIcon={<FaFacebook />}
                      sx={{
                        borderRadius: 2,
                        borderColor: theme.inputBorder || 'rgba(255, 255, 255, 0.2)',
                        color: theme.textSecondary,
                        '&:hover': {
                          borderColor: '#4267B2',
                          backgroundColor: 'rgba(66, 103, 178, 0.1)',
                          color: '#4267B2',
                        },
                      }}
                    >
                      Facebook
                    </Button>
                  </Box>

                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: theme.textSecondary }}>
                      Don't have an account?{' '}
                      <Button
                        variant="text"
                        onClick={() => navigate("/auth/signup")}
                        sx={{
                          color: theme.accent,
                          textTransform: 'none',
                          fontWeight: 600,
                          p: 0,
                          minWidth: 'auto',
                          '&:hover': {
                            backgroundColor: 'transparent',
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        Sign up here
                      </Button>
                    </Typography>
                  </Box>
                </CardBox>
              </Box>
            </Slide>
          </Box>
        </Fade>
      </Container>

      {/* Loading Backdrop */}
      <SubmittingSpinner isLoading={isLoading} />
      {ToastComponent}
      {FacebookToastComponent}
    </Box>
  );
};

export default SignInAuth;