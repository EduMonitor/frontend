// src/components/MonitoringFeedPage.js
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Alert,
  Typography,
  LinearProgress,
  Card,
  CardContent,
  Fade,
  Grow,
  Stack,
  Divider,
  alpha
} from '@mui/material';
import { 
  FaSearch, 
  FaStop, 
  FaRocket, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaSpinner
} from 'react-icons/fa';
import SearchResults from './Result.scraper';
import StatusResults from './StatusResults.scraper';


const PLATFORMS = [
  { id: 'facebook', label: 'Facebook', color: '#1877f2', emoji: '📘' },
  { id: 'twitter', label: 'Twitter/X', color: '#1da1f2', emoji: '🐦' },
  { id: 'linkedin', label: 'LinkedIn', color: '#0a66c2', emoji: '💼' },
  { id: 'instagram', label: 'Instagram', color: '#e4405f', emoji: '📸' },
  { id: 'youtube', label: 'YouTube', color: '#ff0000', emoji: '🎬' },
  { id: 'tiktok', label: 'TikTok', color: '#000000', emoji: '🎵' }
];

const TIME_FILTERS = [
  { value: 'any', label: 'Any Time', icon: '🌐' },
  { value: 'day', label: 'Past 24 Hours', icon: '📅' },
  { value: 'week', label: 'Past Week', icon: '📆' },
  { value: 'month', label: 'Past Month', icon: '🗓️' }
];

const BROWSERS = [
  { value: 'auto', label: 'Auto Detection', icon: '🤖' },
  { value: 'chrome', label: 'Chrome', icon: '🌐' },
  { value: 'firefox', label: 'Firefox', icon: '🦊' },
  { value: 'edge', label: 'Edge', icon: '🌊' }
];

const LANGUAGES = [
  { value: '', label: 'Any Language', flag: '🌍' },
  { value: 'fr', label: 'French', flag: '🇫🇷' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'mos', label: 'Mossi (Local)', flag: '🇧🇫' }
];

const COUNTRIES = [
  { value: '', label: 'Any Country', flag: '🌍' },
  { value: 'BF', label: 'Burkina Faso', flag: '🇧🇫' },
  { value: 'US', label: 'United States', flag: '🇺🇸' },
  { value: 'FR', label: 'France', flag: '🇫🇷' }
];

const MonitoringFeedPage = () => {
  const eventSourceRef = useRef(null);
  
  const [searchParams, setSearchParams] = useState({
    query: '',
    platforms: ['facebook', 'twitter', 'linkedin'],
    maxResults: 10,
    scrapeDetails: true,
    timeFilter: 'any',
    browser: 'auto',
    headless: true,
    language: '',
    country: 'BF'
  });
  
  const [searchResults, setSearchResults] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState({ value: 0, message: '', platform: '' });
  const [statusMessages, setStatusMessages] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [error, setError] = useState(null);

  const handleInputChange = useCallback((field, value) => {
    setSearchParams(prev => ({ ...prev, [field]: value }));
  }, []);

  const handlePlatformToggle = useCallback((platformId) => {
    setSearchParams(prev => {
      const newPlatforms = prev.platforms.includes(platformId)
        ? prev.platforms.filter(p => p !== platformId)
        : [...prev.platforms, platformId];
      return { ...prev, platforms: newPlatforms };
    });
  }, []);

  const addStatusMessage = useCallback((message, type = 'info') => {
    setStatusMessages(prev => [
      ...prev.slice(-4), // Keep only last 5 messages
      { id: Date.now(), message, type, timestamp: new Date() }
    ]);
  }, []);

  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    
    if (!searchParams.query.trim()) {
      setError('Please enter a search query');
      return;
    }

    if (searchParams.platforms.length === 0) {
      setError('Please select at least one platform');
      return;
    }

    // Reset state
    setIsSearching(true);
    setError(null);
    setSearchResults({});
    setStatusMessages([]);
    setTotalResults(0);
    setProgress({ value: 0, message: 'Initializing...', platform: '' });

    // Build query string
    const queryParams = new URLSearchParams({
      query: searchParams.query,
      platforms: searchParams.platforms.join(','),
      max_results: searchParams.maxResults.toString(),
      scrape_details: searchParams.scrapeDetails.toString(),
      time_filter: searchParams.timeFilter,
      browser: searchParams.browser,
      headless: searchParams.headless.toString(),
      ...(searchParams.language && { language: searchParams.language }),
      ...(searchParams.country && { country: searchParams.country })
    });

    try {

      
      // Create EventSource for SSE
      const url = `${'http://localhost:8000'}/api/v2/scraper/search/stream?${queryParams}`;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'status':
              setProgress({
                value: data.progress || 0,
                message: data.message,
                platform: data.platform || ''
              });
              addStatusMessage(data.message, 'info');
              break;
              
            case 'result':
              setSearchResults(prev => ({
                ...prev,
                [data.platform]: [...(prev[data.platform] || []), data.data]
              }));
              setTotalResults(prev => prev + 1);
              addStatusMessage(
                `Found: ${data.data.title.substring(0, 50)}...`,
                'success'
              );
              break;
              
            case 'platform_complete':
              addStatusMessage(
                `✓ ${data.platform}: ${data.count} results`,
                'success'
              );
              break;
              
            case 'complete':
              setProgress({
                value: 100,
                message: `Complete! Found ${data.total_results} results`,
                platform: ''
              });
              addStatusMessage(
                `🎉 Search complete! Total: ${data.total_results} results`,
                'success'
              );
              setIsSearching(false);
              eventSource.close();
              break;
              
            case 'error':
              addStatusMessage(data.message, 'error');
              if (data.severity === 'error') {
                setError(data.message);
                setIsSearching(false);
                eventSource.close();
              }
              break;
              
            default:
              console.log('Unknown event type:', data.type);
          }
        } catch (err) {
          console.error('Error parsing event data:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('EventSource error:', err);
        setError('Connection lost. Please try again.');
        setIsSearching(false);
        eventSource.close();
      };

    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'An error occurred during search');
      setIsSearching(false);
    }
  }, [searchParams, addStatusMessage]);

  const handleStop = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsSearching(false);
    addStatusMessage('Search stopped by user', 'warning');
  }, [addStatusMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return (
    <Box sx={{ width: '100%', p: { xs: 2, md: 3 } }}>
      {/* Service Status */}
      <StatusResults />

      {/* Main Search Card */}
      <Paper 
        elevation={3}
        sx={{ 
          p: 4, 
          mb: 3, 
          background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decorative Background */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: (theme) => alpha(theme.palette.primary.main, 0.1),
            filter: 'blur(40px)',
            pointerEvents: 'none'
          }}
        />

        <form onSubmit={handleSearch}>
          <Stack spacing={3}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography 
                variant="h4" 
                gutterBottom 
                sx={{ 
                  fontWeight: 700,
                  background: (theme) => `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                🔍 OSINT Intelligence Platform
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Advanced social media intelligence gathering with real-time streaming
              </Typography>
            </Box>

            <Divider />

            {/* Search Query */}
            <TextField
              fullWidth
              label="Search Query"
              value={searchParams.query}
              onChange={(e) => handleInputChange('query', e.target.value)}
              placeholder="Enter keywords, names, or topics to investigate..."
              variant="outlined"
              required
              disabled={isSearching}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontSize: '1.1rem'
                }
              }}
            />

            {/* Platform Selection */}
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                📱 Target Platforms
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1.5}>
                {PLATFORMS.map(platform => (
                  <Chip
                    key={platform.id}
                    label={`${platform.emoji} ${platform.label}`}
                    onClick={() => handlePlatformToggle(platform.id)}
                    color={searchParams.platforms.includes(platform.id) ? 'primary' : 'default'}
                    variant={searchParams.platforms.includes(platform.id) ? 'filled' : 'outlined'}
                    disabled={isSearching}
                    sx={{
                      px: 2,
                      py: 2.5,
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      backgroundColor: searchParams.platforms.includes(platform.id) 
                        ? `${platform.color} !important` 
                        : undefined,
                      color: searchParams.platforms.includes(platform.id) 
                        ? 'white !important' 
                        : undefined,
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 2
                      }
                    }}
                  />
                ))}
              </Stack>
            </Box>

            <Divider />

            {/* Advanced Filters */}
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                ⚙️ Search Parameters
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControl fullWidth variant="outlined" disabled={isSearching}>
                    <InputLabel>Time Filter</InputLabel>
                    <Select
                      value={searchParams.timeFilter}
                      onChange={(e) => handleInputChange('timeFilter', e.target.value)}
                      label="Time Filter"
                    >
                      {TIME_FILTERS.map(filter => (
                        <MenuItem key={filter.value} value={filter.value}>
                          {filter.icon} {filter.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Max Results"
                    value={searchParams.maxResults}
                    onChange={(e) => handleInputChange('maxResults', parseInt(e.target.value) || 1)}
                    inputProps={{ min: 1, max: 50 }}
                    variant="outlined"
                    disabled={isSearching}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControl fullWidth variant="outlined" disabled={isSearching}>
                    <InputLabel>Language</InputLabel>
                    <Select
                      value={searchParams.language}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                      label="Language"
                    >
                      {LANGUAGES.map(lang => (
                        <MenuItem key={lang.value} value={lang.value}>
                          {lang.flag} {lang.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControl fullWidth variant="outlined" disabled={isSearching}>
                    <InputLabel>Country</InputLabel>
                    <Select
                      value={searchParams.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      label="Country"
                    >
                      {COUNTRIES.map(country => (
                        <MenuItem key={country.value} value={country.value}>
                          {country.flag} {country.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControl fullWidth variant="outlined" disabled={isSearching}>
                    <InputLabel>Browser</InputLabel>
                    <Select
                      value={searchParams.browser}
                      onChange={(e) => handleInputChange('browser', e.target.value)}
                      label="Browser"
                    >
                      {BROWSERS.map(browser => (
                        <MenuItem key={browser.value} value={browser.value}>
                          {browser.icon} {browser.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={searchParams.scrapeDetails}
                        onChange={(e) => handleInputChange('scrapeDetails', e.target.checked)}
                        disabled={isSearching}
                      />
                    }
                    label="🔬 Scrape Details"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={searchParams.headless}
                        onChange={(e) => handleInputChange('headless', e.target.checked)}
                        disabled={isSearching}
                      />
                    }
                    label="👻 Headless Mode"
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Action Buttons */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {!isSearching ? (
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={<FaRocket />}
                  sx={{ 
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    background: (theme) => `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    boxShadow: 3,
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s'
                  }}
                >
                  Launch Intelligence Operation
                </Button>
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  color="error"
                  startIcon={<FaStop />}
                  onClick={handleStop}
                  sx={{ py: 1.5, fontSize: '1.1rem', fontWeight: 700 }}
                >
                  Stop Search
                </Button>
              )}
            </Stack>
          </Stack>
        </form>
      </Paper>

      {/* Progress Section */}
      {isSearching && (
        <Grow in={isSearching}>
          <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FaSpinner className="fa-spin" />
                  Operation in Progress
                </Typography>
                <Chip 
                  label={`${totalResults} results found`}
                  color="success"
                  variant="outlined"
                  size="small"
                />
              </Box>
              
              <LinearProgress 
                variant="determinate" 
                value={progress.value}
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    background: (theme) => `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                  }
                }}
              />
              
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                {progress.message}
                {progress.platform && ` • ${progress.platform}`}
              </Typography>

              {/* Status Messages */}
              {statusMessages.length > 0 && (
                <Stack spacing={1} sx={{ maxHeight: 200, overflowY: 'auto' }}>
                  {statusMessages.map((msg) => (
                    <Fade key={msg.id} in timeout={300}>
                      <Alert 
                        severity={msg.type}
                        icon={
                          msg.type === 'success' ? <FaCheckCircle /> :
                          msg.type === 'error' ? <FaExclamationTriangle /> :
                          <FaSpinner className="fa-spin" />
                        }
                        sx={{ fontSize: '0.85rem' }}
                      >
                        {msg.message}
                      </Alert>
                    </Fade>
                  ))}
                </Stack>
              )}
            </Stack>
          </Paper>
        </Grow>
      )}

      {/* Error Display */}
      {error && (
        <Fade in={!!error}>
          <Alert 
            severity="error" 
            onClose={() => setError(null)}
            sx={{ mb: 3, borderRadius: 2 }}
            icon={<FaExclamationTriangle />}
          >
            <Typography variant="subtitle2" fontWeight={600}>
              Operation Failed
            </Typography>
            {error}
          </Alert>
        </Fade>
      )}

      {/* Results Section */}
      {Object.keys(searchResults).length > 0 && (
        <Fade in timeout={500}>
          <Box>
            <Paper 
              elevation={3}
              sx={{ 
                p: 3, 
                mb: 3,
                borderRadius: 3,
                background: (theme) => alpha(theme.palette.background.paper, 0.9)
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                  🎯 Intelligence Results
                </Typography>
                <Chip 
                  label={`${totalResults} Total Results`}
                  color="primary"
                  sx={{ 
                    fontSize: '1rem', 
                    fontWeight: 600,
                    px: 2,
                    py: 2.5
                  }}
                />
              </Box>

              <SearchResults 
                results={{ results: searchResults, count: totalResults }}
                platforms={Object.keys(searchResults)}
              />
            </Paper>
          </Box>
        </Fade>
      )}

      {/* Empty State */}
      {!isSearching && Object.keys(searchResults).length === 0 && !error && (
        <Paper 
          sx={{ 
            p: 6, 
            textAlign: 'center',
            borderRadius: 3,
            background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`
          }}
        >
          <Typography variant="h3" sx={{ mb: 2, opacity: 0.3 }}>
            🔍
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Ready to Launch Intelligence Operation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter your search query and select platforms to begin gathering intelligence
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default MonitoringFeedPage;