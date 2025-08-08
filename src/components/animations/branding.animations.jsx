import React, { useState, useEffect } from 'react';
import  Typography  from '@mui/material/Typography';
import  Box  from '@mui/material/Box';
import  Chip  from '@mui/material/Chip';
import  Fade  from '@mui/material/Fade';
import  Slide  from '@mui/material/Slide';
import  Grid  from '@mui/material/Grid';

export const AnimatedTitle = ({ title = 'EduMonitor' }) => {
  const [animatedText, setAnimatedText] = useState('');

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setAnimatedText(title.slice(0, index + 1));
      index++;
      if (index >= title.length) {
        clearInterval(interval);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [title]);

  return (
    <Typography
      variant="h1"
      sx={{
        fontSize: { xs: '3rem', md: '4.5rem' },
        mt:{md:0, sm:5,xs:5},
        fontWeight: 800,
        background: 'linear-gradient(45deg, #4A90E2, #50C878, #9B59B6)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        mb: 2,
        textShadow: '0 0 30px rgba(74, 144, 226, 0.3)',
      }}
    >
      {animatedText}
    </Typography>
  );
};



export const FeatureChips = ({ aiFeatures, theme }) => {
  const [currentFeature, setCurrentFeature] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % aiFeatures.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [aiFeatures.length]);

  return (
    <Grid container sx={{gap:1, display:'flex', justifyItems:'center'}} spacing={3}>
      {aiFeatures.map((feature, index) => (
        <Grid key={index} size={{md:4,sm:4,xs:4}}>
        <Fade  in timeout={1000 + index * 200}>
          <Chip
            icon={
              <Box sx={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
                {feature.icon}
              </Box>
            }
            label={feature.text}
            sx={{
              backgroundColor: currentFeature === index 
                ? `${feature.color}20` 
                : 'rgba(255, 255, 255, 0.1)',
              color: currentFeature === index ? feature.color : theme.textSecondary,
              border: currentFeature === index 
                ? `1px solid ${feature.color}` 
                : '1px solid transparent',
              transition: 'all 0.3s ease',
              '& .MuiChip-icon': {
                color: currentFeature === index ? feature.color : theme.textSecondary,
              },
            }}
          />
        </Fade>
        </Grid>
      ))}
    </Grid>
  );
};


export const BrandingSection = ({ aiFeatures, theme }) => {
  return (
    <Box
      sx={{
        flex: 1,
        textAlign: { xs: 'center', lg: 'left' },
        mb: { xs: 4, lg: 0 },
      }}
    >
      <Slide direction="right" in timeout={1200}>
        <Box>
          <AnimatedTitle theme={theme} />
          
          <Typography
            variant="h4"
            sx={{
              color: theme.textSecondary,
              mb: 3,
              fontWeight: 300,
            }}
          >
            AI-Powered Social Media Guardian
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: theme.textSecondary,
              mb: 4,
              fontSize: '1.1rem',
              lineHeight: 1.6,
              maxWidth: 500,
            }}
          >
            Harness the power of advanced AI to detect fake news, hate speech, 
            and harmful content across social media platforms. Protect your 
            digital community with cutting-edge machine learning.
          </Typography>

          <FeatureChips aiFeatures={aiFeatures} theme={theme} />
        </Box>
      </Slide>
    </Box>
  );
};

