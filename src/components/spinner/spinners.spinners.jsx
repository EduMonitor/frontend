import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { appConfig } from "../../constants/string.constants";

export const Spinner = ({
  isLoading = true,
  appName = appConfig.AppName,
  title = appConfig.title,
  subtitle = appConfig.subtitle,
  variant = "default",
  showAppName = true
}) => {

  // Lightweight config
  const getConfig = () => {
    switch (variant) {
      case "submitting":
        return {
          title: title || "Processing Request...",
          subtitle: subtitle || "Analyzing data patterns",
          color: "#4caf50",
          size: 50
        };
      case "loading":
        return {
          title: title || "Loading Interface...",
          subtitle: subtitle || "Preparing your workspace",
          color: "#2196f3",
          size: 60
        };
      default:
        return {
          title: title || "Initializing AI Systems...",
          subtitle: subtitle || "Connecting to neural networks",
          color: "#64b5f6",
          size: 60
        };
    }
  };

  const config = getConfig();

  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(25, 25, 35, 0.95) 100%)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease-in-out',
      }}
      open={isLoading}
    >
      {/* Main container with proper spacing */}
      <Box sx={{
        textAlign: 'center',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        animation: 'float 3s ease-in-out infinite',
        '@keyframes float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      }}>

        {/* App Name */}
        {showAppName && (
          <Typography
            variant="h4"
            component="div"
            sx={{
              background: 'linear-gradient(45deg, #fff 30%, #64b5f6 50%, #fff 70%)',
              backgroundSize: '200px 100%',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              mb: 4,
              animation: 'pulse-shimmer 3s ease-in-out infinite',
              '@keyframes pulse-shimmer': {
                '0%, 100%': {
                  opacity: 1,
                  transform: 'scale(1)',
                  backgroundPosition: '-200px 0'
                },
                '50%': {
                  opacity: 0.8,
                  transform: 'scale(1.05)',
                  backgroundPosition: 'calc(200px + 100%) 0'
                }
              }
            }}
          >
            {appName}
          </Typography>
        )}

        {/* Spinner container with decorative elements */}
        <Box sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 4,
          width: '160px',
          height: '160px'
        }}>

          {/* Outer decorative rotating circle */}
          <Box sx={{
            position: 'absolute',
            width: '140px',
            height: '140px',
            border: '1px solid rgba(100, 181, 246, 0.2)',
            borderRadius: '50%',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'rotate 8s linear infinite',
            '@keyframes rotate': {
              '0%': { transform: 'translate(-50%, -50%) rotate(0deg)' },
              '100%': { transform: 'translate(-50%, -50%) rotate(360deg)' }
            }
          }} />

          {/* Inner decorative rotating circle */}
          <Box sx={{
            position: 'absolute',
            width: '100px',
            height: '100px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'rotate-reverse 6s linear infinite',
            '@keyframes rotate-reverse': {
              '0%': { transform: 'translate(-50%, -50%) rotate(0deg)' },
              '100%': { transform: 'translate(-50%, -50%) rotate(-360deg)' }
            }
          }} />

          {/* Main spinner container */}
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            {/* Main spinner */}
            <CircularProgress
              size={config.size}
              thickness={3}
              sx={{
                color: config.color,
                filter: 'drop-shadow(0 0 15px rgba(100, 181, 246, 0.4))',
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round'
                }
              }}
            />

            {/* Inner decorative spinner */}
            <CircularProgress
              size={config.size - 20}
              thickness={2}
              variant="determinate"
              value={30}
              sx={{
                color: 'rgba(255, 255, 255, 0.3)',
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                animation: 'rotate-slow 4s linear infinite',
                '@keyframes rotate-slow': {
                  '0%': { transform: 'translate(-50%, -50%) rotate(0deg)' },
                  '100%': { transform: 'translate(-50%, -50%) rotate(-360deg)' }
                },
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round'
                }
              }}
            />
          </Box>
        </Box>

        {/* Loading text container */}
        <Box sx={{ minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Loading title */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 500,
              mb: 1,
              color: 'rgba(255, 255, 255, 0.9)',
              letterSpacing: '0.02em'
            }}
          >
            {config.title}
          </Typography>

          {/* Subtitle with shimmer */}
          <Typography
            variant="body2"
            sx={{
              background: 'linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.9) 100%)',
              backgroundSize: '200% 100%',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'shimmer 2s ease-in-out infinite',
              mb: 2,
              '@keyframes shimmer': {
                '0%': { backgroundPosition: '-200px 0' },
                '100%': { backgroundPosition: 'calc(200px + 100%) 0' }
              }
            }}
          >
            {config.subtitle}
          </Typography>

          {/* Animated dots */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.8 }}>
            {[0, 1, 2].map((index) => (
              <Box
                key={index}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: config.color,
                  animation: 'dot-bounce 1.4s ease-in-out infinite',
                  animationDelay: `${index * 0.2}s`,
                  '@keyframes dot-bounce': {
                    '0%, 80%, 100%': {
                      opacity: 0.3,
                      transform: 'scale(0.8)'
                    },
                    '40%': {
                      opacity: 1,
                      transform: 'scale(1)'
                    }
                  }
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Backdrop>
  );
};

// Simple variants for different use cases
export const SubmittingSpinner = (props) => (
  <Spinner {...props} variant="submitting" />
);

export const LoadingSpinner = (props) => (
  <Spinner {...props} variant="loading" />
);

export default Spinner;