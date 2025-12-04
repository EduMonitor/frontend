// src/components/status.scraper.js (StatusResults.js)
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Skeleton,
  Stack,
  Grid,
  Avatar,
  alpha
} from '@mui/material';
import { 
  FaCheckCircle, 
  FaTimesCircle, 
  FaDesktop, 
  FaGlobe,
  FaEyeSlash,
  FaEye,
  FaServer
} from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import useAxiosPrivate from '../../utils/hooks/instance/axiosprivate.instance';

function StatusResults() {
  const axiosPrivate = useAxiosPrivate();

  const fetchSearchStatus = async () => {
    try {
      const response = await axiosPrivate.get('/api/v2/scraper/status');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch status: ${error}`);
    }
  };

  const { data: status, isLoading, isError } = useQuery({
    queryKey: ['osintStatus'],
    queryFn: fetchSearchStatus,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <Paper 
        elevation={2}
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 3,
          background: (theme) => alpha(theme.palette.background.paper, 0.9)
        }}
      >
        <Stack spacing={2}>
          <Skeleton variant="text" width={200} height={30} />
          <Grid container spacing={2}>
            {[1, 2, 3, 4].map(i => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
                <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Paper>
    );
  }

  if (isError || !status) {
    return (
      <Paper 
        elevation={2}
        sx={{ 
          p: 2, 
          mb: 3, 
          borderRadius: 3,
          borderLeft: 4,
          borderColor: 'warning.main',
          backgroundColor: (theme) => alpha(theme.palette.warning.main, 0.05)
        }}
      >
        <Typography variant="body2" color="warning.main">
          ⚠️ Unable to fetch system status
        </Typography>
      </Paper>
    );
  }

  const StatusCard = ({ icon, title, value, status, color = 'primary' }) => (
    <Paper
      elevation={1}
      sx={{
        p: 2.5,
        borderRadius: 2,
        height: '100%',
        transition: 'all 0.3s',
        border: 2,
        borderColor: status === 'success' 
          ? alpha(color, 0.2)
          : alpha('#d32f2f', 0.2),
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
          borderColor: status === 'success' 
            ? alpha(color, 0.5)
            : alpha('#d32f2f', 0.5),
        }
      }}
    >
      <Stack spacing={1.5}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Avatar 
            sx={{ 
              bgcolor: status === 'success' 
                ? alpha(color, 0.1)
                : alpha('#d32f2f', 0.1),
              color: status === 'success' ? color : '#d32f2f',
              width: 40,
              height: 40
            }}
          >
            {icon}
          </Avatar>
          {status === 'success' ? (
            <FaCheckCircle size={20} color="#4caf50" />
          ) : (
            <FaTimesCircle size={20} color="#d32f2f" />
          )}
        </Box>
        
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {value}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );

  const getEnvironmentColor = (env) => {
    switch (env?.toLowerCase()) {
      case 'production': return '#f44336';
      case 'development': return '#2196f3';
      case 'staging': return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  return (
    <Paper 
      elevation={3}
      sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: 3,
        background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative background element */}
      <Box
        sx={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: (theme) => alpha(theme.palette.success.main, 0.1),
          filter: 'blur(40px)',
          pointerEvents: 'none'
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Stack spacing={3}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                🔧 System Status
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Real-time operational status of OSINT services
              </Typography>
            </Box>
            
            <Chip 
              label={status.environment?.toUpperCase() || 'UNKNOWN'}
              sx={{ 
                fontWeight: 700,
                fontSize: '0.85rem',
                backgroundColor: alpha(getEnvironmentColor(status.environment), 0.1),
                color: getEnvironmentColor(status.environment),
                border: 2,
                borderColor: getEnvironmentColor(status.environment)
              }}
            />
          </Box>

          {/* Status Cards */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatusCard
                icon={<FaGlobe />}
                title="Google API"
                value={status.google_api_configured ? 'Connected' : 'Not Configured'}
                status={status.google_api_configured ? 'success' : 'error'}
                color="#4285f4"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatusCard
                icon={<FaDesktop />}
                title="Browser Engine"
                value={status.browser?.charAt(0).toUpperCase() + status.browser?.slice(1) || 'Unknown'}
                status="success"
                color="#ff9800"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatusCard
                icon={status.headless_mode ? <FaEyeSlash /> : <FaEye />}
                title="Browser Mode"
                value={status.headless_mode ? 'Headless' : 'Visible'}
                status="success"
                color="#9c27b0"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatusCard
                icon={<FaServer />}
                title="Driver Manager"
                value={status.driver_manager_enabled ? 'Enabled' : 'Disabled'}
                status="success"
                color="#00bcd4"
              />
            </Grid>
          </Grid>

          {/* Warning Message */}
          {!status.google_api_configured && (
            <Paper 
              elevation={0}
              sx={{ 
                p: 2, 
                backgroundColor: (theme) => alpha(theme.palette.error.main, 0.08),
                borderLeft: 4,
                borderColor: 'error.main',
                borderRadius: 1
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <FaTimesCircle color="#d32f2f" />
                <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>
                  Google API keys not configured. Search functionality may be limited or unavailable.
                </Typography>
              </Stack>
            </Paper>
          )}

          {/* Success Message */}
          {status.google_api_configured && (
            <Paper 
              elevation={0}
              sx={{ 
                p: 2, 
                backgroundColor: (theme) => alpha(theme.palette.success.main, 0.08),
                borderLeft: 4,
                borderColor: 'success.main',
                borderRadius: 1
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <FaCheckCircle color="#4caf50" />
                <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                  All systems operational. Ready for intelligence gathering operations.
                </Typography>
              </Stack>
            </Paper>
          )}
        </Stack>
      </Box>
    </Paper>
  );
}

export default StatusResults;