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
  FaArrowLeft,
} from 'react-icons/fa';
import DOMPurify from 'dompurify'
import InputField from '../components/forms/input.forms';
import { Spinner } from '../components/spinner/spinners.spinners';
import { signInValidator } from '../utils/validators/input.validators';
import useToast from '../components/toast/toast.toast';
import { forgotForm} from '../constants/forms.constant';
import useAuthTheme from './sections/themeHook.sections';
import { AnimatedGrid, FloatingElements } from '../components/animations/background.animations';
import { aiFeatures } from './sections/aifeature.sections';
import { BrandingSection } from '../components/animations/branding.animations';
import { CardBox } from '../components/cards/card.card';
import { useNavigate } from 'react-router-dom';
import { authConfig } from '../constants/string.constants';

const ForgotPages = () => {
  const [isLoading, setIsLoading] = useState(false);
  const signinSchema = signInValidator()
  const [values, setValues] = useState({
    email: "",
  });
  const { showToast, ToastComponent } = useToast()

  const navigate = useNavigate();
  const [errors, setErrors] = useState({})
  const theme = useAuthTheme();


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
      await signinSchema.validate(values, { abortEarly: false });
      setIsLoading(false);
      // const clientData = {
      //     emailOrPhone:  values.email.toLowerCase().trim(),
      //     password: values.password.trim()
      // };

      // const response = await axiosPrivate.post('/api/signin', clientData);

      // if (response.status === 200 || response.status === 201) {
      //     const result = response.data;
      //     setAuth({ accessToken: result.token, role: result.role, refreshToken: result.refresh_token });
      //     localStorage.setItem("persist", true);
      //     localStorage.setItem('refresh_token', result.refresh_token);
      //     navigate(result.redirection, { replace: true });
      //     showToast({ title: "Success", description: result.message, status: "success" });
      // }
    } catch (error) {
      if (error.response && error.response.data.message) {
        showToast({ title: "", description: error.response.data.message, status: "error" });
      } else if (error.inner) {
        const validationErrors = {};
        error.inner.forEach((err) => { validationErrors[err.path] = err.message; });
        setErrors(validationErrors);
      } else {
        showToast({ title: "", description: error.message, status: "error" });
      }
    } finally {
      setIsLoading(false);
    }
  }, [signinSchema, values, showToast]);


  const renderedFormInputs = useMemo(() => (
    <Grid container spacing={2}>
      {forgotForm().map(({ name, icon, label, placeholder, type, inputType }) => (
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
                     {authConfig.forgot.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: theme.textSecondary }}
                    >
                       {authConfig.forgot.subtile}
                    </Typography>
                  </Box>

                  <Box display={"flex"} sx={{ flexDirection: "column", gap: 3 }}>
                    {renderedFormInputs}
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
                        authConfig.forgot.buttonText
                      )}
                    </Button>
                  </Box>

                  <Divider sx={{ mb: 3, mt: 4, color: theme.textSecondary }}>
    
                  </Divider>

                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={()=>navigate("/")}
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
                      Back
                    </Button>
                  
                  </Box>

                
                </CardBox>
              </Box>
            </Slide>
          </Box>
        </Fade>
      </Container>

      {/* Loading Backdrop */}
      <Spinner isLoading={isLoading} />
      {ToastComponent}
    </Box>
  );
};

export default ForgotPages;