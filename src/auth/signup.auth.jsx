import React, { useState, useCallback, useMemo } from 'react';
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Typography from "@mui/material/Typography"
import Divider from "@mui/material/Divider"
import Fade from "@mui/material/Fade"
import Checkbox from "@mui/material/Checkbox"
import Slide from "@mui/material/Slide"
import CircularProgress from "@mui/material/CircularProgress"
import Container from "@mui/material/Container"
import Grid from "@mui/material/Grid"
import FormControlLabel from "@mui/material/FormControlLabel"
import LinearProgress from "@mui/material/LinearProgress"

import {
    FaGoogle,
    FaFacebook,
    FaUserCircle,
} from 'react-icons/fa';
import DOMPurify from 'dompurify'
import InputField from '../components/forms/input.forms';
import { Spinner } from '../components/spinner/spinners.spinners';
import useToast from '../components/toast/toast.toast';
import { registerForm } from '../constants/forms.constant';
import useAuthTheme from './sections/themeHook.sections';
import { AnimatedGrid, FloatingElements } from '../components/animations/background.animations';
import { aiFeatures } from './sections/aifeature.sections';
import { BrandingSection } from '../components/animations/branding.animations';
import { CardBox } from '../components/cards/card.card';
import { Link, useNavigate } from 'react-router-dom';
import { authConfig } from '../constants/string.constants';
import { signUpValidator } from '../utils/validators/input.validators';
import { fetchCsrfToken } from '../utils/hooks/token/csrf.token';
import { axiosPrivate } from '../utils/hooks/instance/axios.instance';
import useFacebookAuth from '../utils/functions/handlFacebook-login';
const SignUpAuth = () => {
    const [isLoading, setIsLoading] = useState(false);
    const signUpSchema = signUpValidator()
    const [values, setValues] = useState({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        passwordConfirm: "",
        termeCondition: false
    });
    const { showToast, ToastComponent } = useToast()
    const [passwordStrength, setPasswordStrength] = useState(0);
  const { isFacebookLoading, handleFacebookLogin, FacebookToastComponent } = useFacebookAuth();

    const navigate = useNavigate()
    const [errors, setErrors] = useState({})
    const theme = useAuthTheme();

    const calculatePasswordStrength = (password) => {
        let strength = 0;
        if (/\d/.test(password)) strength += 20;
        if (/[a-z]/.test(password)) strength += 20;
        if (/[A-Z]/.test(password)) strength += 20;
        if (/[!@#$%^&*(){}_<>|:;]/.test(password)) strength += 20;
        if (password.length >= 6) strength += 20;
        return strength;
    };

    const getPasswordStrengthLabel = (strength) => {
        if (strength < 40) return "Weak";
        if (strength < 80) return "Medium";
        return "Strong";
    };

    const handleInputChange = useCallback((event) => {
        const { name, type, value, checked } = event.target;
        const sanitizedValue = type === "checkbox" ? checked : DOMPurify.sanitize(value);
        setValues((prevValues) => ({
            ...prevValues,
            [name]: sanitizedValue,
        }));
        setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: undefined,
        }));

        if (name === "password") {
            setPasswordStrength(calculatePasswordStrength(sanitizedValue));
        }
    }, []);


    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Validate form first
            await signUpSchema.validate(values, { abortEarly: false });

            // Get CSRF token
            const csrfToken = await fetchCsrfToken();

            const clientData = {
                firstName: values.firstName.trim(),
                lastName: values.lastName.trim(),
                email: values.email.toLowerCase().trim(),
                password: values.password.trim(),
            };

            const response = await axiosPrivate.post(`/api/v2/signup`, clientData, {
                headers: { "x-csrf-token": csrfToken },
            });

            if (response.status === 200 || response.status === 201) {
                showToast({
                    title: "Success",
                    description: response.data.message || "Account created successfully",
                    status: "success",
                });
                navigate(response.data.redirectUrl, { replace: true });
            }

        } catch (error) {
            if (error.response?.data) {
                // New errorHandler format
                const apiError = error.response.data.detail.errors || {};
                const safeMessage = error.response.data.detail.message || "An error occurred during signup";

                showToast({
                    title: ``,
                    description: safeMessage,
                    status: "error"
                });
                setErrors(apiError);


            } else if (error.inner) {
                // Yup validation errors
                const validationErrors = {};
                error.inner.forEach((err) => {
                    validationErrors[err.path] = err.message;
                });
                setErrors(validationErrors);

            } else if (error.message) {
                // Network or unexpected errors
                showToast({
                    title: "Error",
                    description: error.message,
                    status: "error"
                });

            } else {
                // Catch-all
                showToast({
                    title: "Error",
                    description: "An unexpected error occurred",
                    status: "error"
                });
            }

        } finally {
            setIsLoading(false);
        }
    }, [signUpSchema, values, showToast, navigate]);


    const renderedFormInputs = useMemo(() => {
        const formInputs = registerForm();

        return (
            <Grid container spacing={2}>
                {/* First and Last Name Fields in the Same Row */}
                <Grid size={{ sm: 12, md: 6, xs: 12 }}>
                    <InputField
                        prefix={formInputs[0].icon}
                        label={formInputs[0].label}
                        placeholder={formInputs[0].placeholder}
                        name={formInputs[0].name}
                        type={formInputs[0].type}
                        value={values[formInputs[0].name]}
                        error={!!errors[formInputs[0].name]}
                        errorMessage={errors[formInputs[0].name]}
                        onChange={handleInputChange}
                        fullWidth
                    />
                </Grid>

                <Grid size={{ sm: 12, md: 6, xs: 12 }}>
                    <InputField
                        prefix={formInputs[1].icon}
                        label={formInputs[1].label}
                        placeholder={formInputs[1].placeholder}
                        name={formInputs[1].name}
                        type={formInputs[1].type}
                        value={values[formInputs[1].name]}
                        error={!!errors[formInputs[1].name]}
                        errorMessage={errors[formInputs[1].name]}
                        onChange={handleInputChange}
                        fullWidth
                    />
                </Grid>

                {/* Email or Phone Field in its own Row */}
                <Grid size={{ sm: 12, md: 12, xs: 12 }}>
                    <InputField
                        prefix={formInputs[2].icon}
                        label={formInputs[2].label}
                        placeholder={formInputs[2].placeholder}
                        name={formInputs[2].name}
                        type={formInputs[2].type}
                        inputType={formInputs[2].inputType}
                        value={values[formInputs[2].name]}
                        error={!!errors[formInputs[2].name]}
                        errorMessage={errors[formInputs[2].name]}
                        onChange={handleInputChange}
                        fullWidth
                    />
                </Grid>

                {/* Password and Confirm Password Fields in the Same Row */}
                <Grid size={{ sm: 12, md: 6, xs: 12 }}>
                    <InputField
                        prefix={formInputs[3].icon}
                        label={formInputs[3].label}
                        placeholder={formInputs[3].placeholder}
                        name={formInputs[3].name}
                        type={formInputs[3].type}
                        value={values[formInputs[3].name]}
                        error={!!errors[formInputs[3].name]}
                        errorMessage={errors[formInputs[3].name]}
                        onChange={handleInputChange}
                        fullWidth
                    />
                </Grid>
                <Grid size={{ sm: 12, md: 6, xs: 12 }}>
                    <InputField
                        prefix={formInputs[4].icon}
                        label={formInputs[4].label}
                        placeholder={formInputs[4].placeholder}
                        name={formInputs[4].name}
                        type={formInputs[4].type}
                        value={values[formInputs[4].name]}
                        error={!!errors[formInputs[4].name]}
                        errorMessage={errors[formInputs[4].name]}
                        onChange={handleInputChange}
                        fullWidth
                    />
                </Grid>
            </Grid>
        );
    }, [values, errors, handleInputChange]);

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
                            <Box sx={{ flex: 1, maxWidth: 600, width: '100%' }}>
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
                                            {authConfig.signUp.title}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{ color: theme.textSecondary }}
                                        >
                                            {authConfig.signUp.subtile}
                                        </Typography>
                                    </Box>

                                    <Box display={"flex"} sx={{ flexDirection: "column", gap: 3 }}>
                                        <form onSubmit={handleSubmit}>
                                            {renderedFormInputs}
                                            {values.password && (
                                                <Box>
                                                    <Typography variant="body2" my={2}>
                                                        Password Strength <strong>{getPasswordStrengthLabel(passwordStrength)}</strong>
                                                    </Typography>
                                                    <Box>
                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={passwordStrength}
                                                            color={
                                                                passwordStrength < 40
                                                                    ? "error"
                                                                    : passwordStrength < 80
                                                                        ? "warning"
                                                                        : "success"
                                                            }
                                                        />
                                                    </Box>
                                                </Box>
                                            )}

                                            <Box my={2}>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            name="termeCondition"
                                                            checked={values.termeCondition}
                                                            onChange={handleInputChange}
                                                            color="primary"
                                                        />
                                                    }
                                                    label={
                                                        <Typography variant="body2">
                                                            I Aggree with{' '}
                                                            <Link
                                                                href="#"
                                                                sx={{
                                                                    color: 'primary.main',
                                                                    textDecoration: 'none',
                                                                    fontWeight: 600,
                                                                    '&:hover': { textDecoration: 'underline' }
                                                                }}
                                                            >
                                                                Terme Conditions
                                                            </Link>
                                                            {' '}and{' '}
                                                            <Link
                                                                href="#"
                                                                sx={{
                                                                    color: 'primary.main',
                                                                    textDecoration: 'none',
                                                                    fontWeight: 600,
                                                                    '&:hover': { textDecoration: 'underline' }
                                                                }}
                                                            >
                                                                privacy Policy
                                                            </Link>
                                                        </Typography>
                                                    }
                                                />
                                                {errors.termeCondition && (
                                                    <Typography variant="body2" color="error" sx={{ mt: 1, ml: 4 }}>
                                                        {errors.termeCondition}
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                type='submit'
                                                size="large"
                                                disabled={isLoading || !values.termeCondition}
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
                                                    authConfig.signUp.buttonText
                                                )}
                                            </Button>
                                        </form>
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
                                            Already have an account?{' '}
                                            <Button
                                                variant="text"
                                                onClick={() => navigate("/")}
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
                                                Sign In here
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
            <Spinner isLoading={isLoading} />
            {ToastComponent}
            {FacebookToastComponent}
        </Box>
    );
};

export default SignUpAuth;