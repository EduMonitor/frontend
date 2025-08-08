import { FaCheck, FaTimes } from "react-icons/fa"
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import Slide from '@mui/material/Slide'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import CircularProgress from '@mui/material/CircularProgress'
import { useThemeMode } from "../../utils/hooks/contexts/useTheme.context"
import { FaCircleCheck } from "react-icons/fa6"

export const SuccessCardSection = () => {
  const { currentTheme } = useThemeMode(); // ✅ Destructure correctly
  const { palette } = currentTheme;
  return (
    <Slide direction="up" in timeout={800}>
      <Box sx={{ textAlign: 'center' }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #218208ff, #28cfabff)',
            mb: 2,
            animation: 'pulse 2s ease-in-out infinite',
            '@keyframes pulse': {
              '0%': { boxShadow: '0 0 0 0 rgba(158, 226, 74, 0.7)' },
              '70%': { boxShadow: '0 0 0 20px rgba(74, 226, 203, 0)' },
              '100%': { boxShadow: '0 0 0 0 rgba(74, 226, 168, 0)' },
            },
          }}
        >
          <FaCheck style={{ fontSize: '40px', color: 'white' }} />
        </Box>

        <Typography
          variant="h4"
          sx={{
            color: palette.text.primary,
            fontWeight: 700,
            mb: 2,
          }}
        >
          Authentication Successful!
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: palette.text.secondary,
            mb: 4,
            fontSize: '1.1rem',
          }}
        >
          Welcome back, You're being redirected to your secure dashboard.
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <CircularProgress
            size={40}
            sx={{ color: palette.success.main }}
          />
        </Box>

        <Chip
          icon={<FaCircleCheck />}
          label="Secure Access Granted"
          sx={{
            bgcolor: `${palette.success.main}20`,
            color: palette.success.main,
            fontWeight: 600,
          }}
        />
      </Box>
    </Slide>
  )
}

export const ErrorCardSection = ({ setStep, setAttempts, setTimeLeft, setVerificationCode, setErrorMessage }) => {
  const { currentTheme } = useThemeMode(); // ✅ Destructure correctly
  const { palette } = currentTheme;
  return (<Slide direction="up" in timeout={800}>
    <Box sx={{ textAlign: 'center' }}>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #de1526ff, #b6596aff)',
          mb: 2,
          animation: 'pulse 2s ease-in-out infinite',
          '@keyframes pulse': {
            '0%': { boxShadow: '0 0 0 0 rgba(224, 2, 2, 0.7)' },
            '70%': { boxShadow: '0 0 0 20px rgba(81, 39, 8, 0)' },
            '100%': { boxShadow: '0 0 0 0 rgba(127, 117, 57, 0)' },
          },
        }}
      >
        <FaTimes style={{ fontSize: '40px', color: 'white' }} />
      </Box>

      <Typography
        variant="h4"
        sx={{
          color: palette.text.primary,
          fontWeight: 700,
          mb: 2,
        }}
      >
        Access Denied
      </Typography>

      <Typography
        variant="body1"
        sx={{
          color: palette.text.secondary,
          mb: 4,
        }}
      >
        Multiple failed attempts detected. Your account has been temporarily locked for security.
      </Typography>

      <Stack spacing={2}>
        <Button
          fullWidth
          variant="contained"
          onClick={() => {
            setStep('verify');
            setAttempts(0);
            setTimeLeft(300);
            setVerificationCode(['', '', '', '', '', '']);
            setErrorMessage('');
          }}
          sx={{
            height: 56,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${palette.accent}, ${palette.success.main})`,
            fontSize: '1.1rem',
            fontWeight: 600,
            textTransform: 'none',
          }}
        >
          Try Again
        </Button>

        <Button
          fullWidth
          variant="outlined"
          sx={{
            height: 56,
            borderRadius: 2,
            borderColor: 'rgba(255, 255, 255, 0.2)',
            color: 'warning',
            fontSize: '1.1rem',
            fontWeight: 600,
            textTransform: 'none',
          }}
        >
          Contact Support
        </Button>
      </Stack>
    </Box>
  </Slide>)
}

