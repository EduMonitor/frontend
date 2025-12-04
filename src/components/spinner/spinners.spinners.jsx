import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

export const Spinner = ({
  isLoading = true,
  variant = "default",
  size = 60
}) => {

  // Color config without purple
  const getColor = () => {
    switch (variant) {
      case "submitting":
        return "#4caf50"; // Green
      case "loading":
        return "#2196f3"; // Blue
      default:
        return "#2196f3"; // Blue
    }
  };

  const color = getColor();

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
      {/* Main container */}
      <Box sx={{
        textAlign: 'center',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>

        {/* Spinner container with decorative elements */}
        <Box sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '160px',
          height: '160px'
        }}>

          {/* Outer decorative rotating circle */}
          <Box sx={{
            position: 'absolute',
            width: '140px',
            height: '140px',
            border: `1px solid ${color}33`,
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
              size={size}
              thickness={3}
              sx={{
                color: color,
                filter: `drop-shadow(0 0 15px ${color}66)`,
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round'
                }
              }}
            />

            {/* Inner decorative spinner */}
            <CircularProgress
              size={size - 20}
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