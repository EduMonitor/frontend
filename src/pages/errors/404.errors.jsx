import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import React from 'react';
import { errorMessage } from '../../constants/string.constants';
import { useThemeMode } from '../../utils/hooks/contexts/useTheme.context';
import { FaArrowLeft, FaHome, FaSearchMinus } from 'react-icons/fa';

const Error404 = React.memo(() => {
    const { currentTheme } = useThemeMode();
    const { palette } = currentTheme;

    const handleGoHome = () => {
        window.location.href = '/';
    };

    const handleGoBack = () => {
        window.history.back();
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                backgroundColor: palette.background.default,
                backgroundImage: palette.background.default,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Container maxWidth="sm">
                <Box
                    sx={{
                        textAlign: 'center',
                        py: 8,
                        px: 4,
                        backgroundColor: palette.background.paper,
                        borderRadius: 2,
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                            transform: 'translateY(-2px)',
                        },
                    }}
                >
                    {/* Not Found Icon */}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            mb: 3,
                        }}
                    >
                        <FaSearchMinus
                            size={60}
                            color={palette.text.secondary}
                            style={{
                                opacity: 0.7,
                            }}
                        />
                    </Box>

                    {/* 404 Number */}
                    <Typography
                        variant="h1"
                        sx={{
                            fontSize: { xs: '6rem', sm: '8rem', md: '10rem' },
                            fontWeight: 300,
                            color: palette.text.secondary,
                            lineHeight: 0.8,
                            mb: 2,
                            letterSpacing: '-0.02em',
                        }}
                    >
                        404
                    </Typography>

                    {/* Main Error Message */}
                    <Typography
                        variant="h4"
                        component="h1"
                        sx={{
                            fontWeight: 500,
                            fontSize: { xs: '1.5rem', sm: '2rem' },
                            color: palette.text.primary,
                            mb: 2,
                            letterSpacing: '-0.01em',
                        }}
                    >
                        {errorMessage.error404}
                    </Typography>

                    {/* Description */}
                    <Typography
                        variant="body1"
                        sx={{
                            color: palette.text.secondary,
                            mb: 5,
                            fontSize: '1.1rem',
                            lineHeight: 1.6,
                            maxWidth: '400px',
                            mx: 'auto',
                        }}
                    >
                        The page you're looking for doesn't exist or has been moved.
                    </Typography>

                    <Divider 
                        sx={{ 
                            mb: 5, 
                            maxWidth: '200px', 
                            mx: 'auto',
                            backgroundColor: palette.divider,
                        }} 
                    />

                    {/* Action Buttons */}
                    <Stack 
                        direction={{ xs: 'column', sm: 'row' }} 
                        spacing={2}
                        justifyContent="center"
                        alignItems="center"
                    >
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<FaHome />}
                            onClick={handleGoHome}
                            sx={{
                                px: 4,
                                py: 1.5,
                                textTransform: 'none',
                                fontSize: '1rem',
                                fontWeight: 500,
                                borderRadius: 1,
                                boxShadow: 'none',
                                backgroundColor: palette.primary.main,
                                '&:hover': {
                                    backgroundColor: palette.primary.dark,
                                    boxShadow: 'none',
                                },
                            }}
                        >
                            Go Home
                        </Button>
                        
                        <Button
                            variant="text"
                            size="large"
                            startIcon={<FaArrowLeft />}
                            onClick={handleGoBack}
                            sx={{
                                px: 4,
                                py: 1.5,
                                textTransform: 'none',
                                fontSize: '1rem',
                                fontWeight: 500,
                                color: palette.text.secondary,
                                '&:hover': {
                                    backgroundColor: 'transparent',
                                    color: palette.text.primary,
                                },
                            }}
                        >
                            Go Back
                        </Button>
                    </Stack>
                </Box>
            </Container>
        </Box>
    );
});

Error404.displayName = "Error404";
export default Error404;