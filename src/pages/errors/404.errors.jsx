import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useTheme,
  useMediaQuery,
} from '@mui/material';

import Container from "@mui/material/Container"
import Typography from "@mui/material/Typography"
import IconButton from "@mui/material/IconButton"
import Chip from "@mui/material/Chip"
import Fade from "@mui/material/Fade"
import Slide from "@mui/material/Slide"
import Box from "@mui/material/Box"
import Paper from "@mui/material/Paper"
import Grid from "@mui/material/Grid"
import Zoom from "@mui/material/Zoom"
import Button from "@mui/material/Button"
import MenuItem from "@mui/material/MenuItem"
import {
  FaHome,
  FaSearch,
  FaArrowLeft,
  FaRocket,
  FaStar,
  FaHeart,
  FaMagic,
  FaGhost
} from 'react-icons/fa';
import useAuthTheme from '../../auth/sections/themeHook.sections';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [animationStep, setAnimationStep] = useState(0);
  const [floatingElements, setFloatingElements] = useState([]);
  const themeA = useAuthTheme();
  useEffect(() => {
    // Staggered animation sequence
    const timer1 = setTimeout(() => setAnimationStep(1), 300);
    const timer2 = setTimeout(() => setAnimationStep(2), 800);
    const timer3 = setTimeout(() => setAnimationStep(3), 1300);

    // Generate floating elements
    const elements = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      icon: [FaRocket, FaStar, FaHeart, FaMagic, FaGhost][i % 5],
      delay: i * 200,
      duration: 3000 + (i * 500),
    }));
    setFloatingElements(elements);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

 

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
     navigate('/');
  };

  const FloatingIcon = ({ delay, duration }) => (
    <Box
      sx={{
        position: 'absolute',
        animation: `float ${duration}ms ease-in-out infinite`,
        animationDelay: `${delay}ms`,
        opacity: 0.3,
        color: theme.palette.primary.main,
        fontSize: { xs: '1.5rem', md: '2rem' },
        '@keyframes float': {
          '0%, 100%': { 
            transform: 'translateY(0px) rotate(0deg)',
            opacity: 0.3 
          },
          '25%': { 
            transform: 'translateY(-20px) rotate(90deg)',
            opacity: 0.6 
          },
          '50%': { 
            transform: 'translateY(-10px) rotate(180deg)',
            opacity: 0.8 
          },
          '75%': { 
            transform: 'translateY(-30px) rotate(270deg)',
            opacity: 0.4 
          },
        }
      }}
    >
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: themeA.background,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        py: { xs: 4, md: 8 }
      }}
    >
      {/* Floating Background Elements */}
      {floatingElements.map(({ id, icon, delay, duration }) => (
        <FloatingIcon
          key={id}
          Icon={icon}
          delay={delay}
          duration={duration}
          sx={{
            top: `${Math.random() * 80 + 10}%`,
            left: `${Math.random() * 80 + 10}%`,
          }}
        />
      ))}

      {/* Background Decorative Circles */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          right: '15%',
          width: { xs: 200, md: 400 },
          height: { xs: 200, md: 400 },
          borderRadius: '50%',
          background: `linear-gradient(45deg, ${theme.palette.primary.main}20, ${theme.palette.secondary.main}15)`,
          filter: 'blur(100px)',
          animation: 'pulse 4s ease-in-out infinite',
          '@keyframes pulse': {
            '0%, 100%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.1)' },
          }
        }}
      />
      
      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          left: '10%',
          width: { xs: 150, md: 300 },
          height: { xs: 150, md: 300 },
          borderRadius: '50%',
          background: `linear-gradient(45deg, ${theme.palette.secondary.main}25, ${theme.palette.primary.main}20)`,
          filter: 'blur(80px)',
          animation: 'pulse 3s ease-in-out infinite reverse',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
        <Grid container spacing={4} alignItems="center" justifyContent="center">
          {/* Left Column - 404 Text */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box textAlign={{ xs: 'center', md: 'left' }}>
              <Fade in={true} timeout={1000}>
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '8rem', sm: '12rem', md: '15rem' },
                    fontWeight: 900,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    textShadow: '0 0 50px rgba(76, 175, 80, 0.3)',
                    lineHeight: 0.8,
                    mb: 2,
                    position: 'relative',
                  }}
                >
                  404
                </Typography>
              </Fade>

              <Slide in={animationStep >= 1} direction="right" timeout={800}>
                <Box>
                  <Typography
                    variant={isMobile ? "h4" : "h3"}
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                      mb: 2,
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    Oops! Page Introuvable
                  </Typography>
                  
                  <Typography
                    variant="h6"
                    sx={{
                      color: theme.palette.text.secondary,
                      mb: 4,
                      maxWidth: 400,
                      lineHeight: 1.6,
                    }}
                  >
                    Il semble que la page que vous recherchez n'existe pas ou a été déplacée. 
                    Ne vous inquiétez pas, explorons ensemble d'autres options !
                  </Typography>

                  {/* Fun Stats */}
                  <Box display="flex" gap={2} mb={4} flexWrap="wrap">
                    <Chip
                      icon={<FaRocket />}
                      label="Espace perdu"
                      variant="outlined"
                      color="primary"
                      sx={{
                        fontWeight: 600,
                        '&:hover': { transform: 'scale(1.05)' },
                        transition: 'transform 0.2s ease'
                      }}
                    />
                    <Chip
                      icon={<FaGhost />}
                      label="Page fantôme"
                      variant="outlined"
                      color="secondary"
                      sx={{
                        fontWeight: 600,
                        '&:hover': { transform: 'scale(1.05)' },
                        transition: 'transform 0.2s ease'
                      }}
                    />
                  </Box>
                </Box>
              </Slide>
            </Box>
          </Grid>

          {/* Right Column - Actions */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Zoom in={animationStep >= 2} timeout={1000}>
              <Paper
                elevation={20}
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: 4,
                  background: themeA.background,
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  }
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.text.primary,
                    mb: 3,
                    textAlign: 'center'
                  }}
                >
                  Que souhaitez-vous faire ?
                </Typography>

                <Box display="flex" flexDirection="column" gap={2}>
             

                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<FaHome />}
                    onClick={handleGoHome}
                    fullWidth
                    sx={{
                      py: 2,
                      borderRadius: 3,
                      borderWidth: 2,
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      textTransform: 'none',
                      '&:hover': {
                        borderWidth: 2,
                        transform: 'translateY(-3px)',
                        boxShadow: `0 12px 30px ${theme.palette.primary.main}20`,
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Retournez à l'accueil
                  </Button>

                  <Button
                    variant="text"
                    size="large"
                    startIcon={<FaArrowLeft />}
                    onClick={handleGoBack}
                    fullWidth
                    sx={{
                      py: 2,
                      borderRadius: 3,
                      fontWeight: 600,
                      fontSize: '1.1rem',
                      textTransform: 'none',
                      color: theme.palette.text.secondary,
                      '&:hover': {
                        bgcolor: `${theme.palette.primary.main}10`,
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Retour à la page précédente
                  </Button>
                </Box>

              
              </Paper>
            </Zoom>
          </Grid>
        </Grid>

        {/* Bottom Message */}
        <Fade in={animationStep >= 3} timeout={1000}>
          <Box
            textAlign="center"
            mt={6}
            sx={{
              p: 3,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <Typography
              variant="body1"
              sx={{
                color: theme.palette.text.secondary,
                fontStyle: 'italic',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                flexWrap: 'wrap'
              }}
            >
              Besoin d'aide ? Notre équipe est là pour vous
              <IconButton
                size="small"
                sx={{
                  color: theme.palette.error.main,
                  animation: 'heartbeat 1.5s ease-in-out infinite',
                  '@keyframes heartbeat': {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.1)' },
                  }
                }}
              >
                <FaHeart />
              </IconButton>
            </Typography>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default NotFoundPage;