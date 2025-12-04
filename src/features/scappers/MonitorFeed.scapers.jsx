import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Grid,
  Button,
  Chip,
  FormControlLabel,
  Checkbox,
  Alert,
  Typography,
  LinearProgress,
  Fade,
  Grow,
  Stack,
  Divider,
  alpha
} from '@mui/material';
import {
  FaStop,
  FaRocket,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaSave
} from 'react-icons/fa';
import DOMPurify from 'dompurify';
import SearchResults from './Result.scraper';
import StatusResults from './StatusResults.scraper';
import { 
  BROWSERS, 
  COUNTRIES, 
  LANGUAGES, 
  PLATFORMS, 
  TIME_FILTERS 
} from '../../constants/Params.contants';
import InputField from '../../components/forms/input.forms';
import SelectField from '../../components/forms/select.forms';
import { keywordValidator } from '../../utils/validators/input.validators';
import useAxiosPrivate from '../../utils/hooks/instance/axiosprivate.instance';

const MonitoringFeedPage = () => {
  const eventSourceRef = useRef(null);
  const axiosPrivate = useAxiosPrivate();
  const keywordVali = keywordValidator();

  // Search Configuration State
  const [searchParams, setSearchParams] = useState({
    query: '',
    platforms: ['facebook', 'twitter', 'linkedin'],
    maxResults: 10,
    scrapeDetails: true,
    timeFilter: 'any',
    browser: 'chrome',
    headless: true,
    language: 'fr',
    country: 'BF',
    localContext: true
  });

  // Results & Status State
  const [searchResults, setSearchResults] = useState({});
  const [totalResults, setTotalResults] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // UI Feedback State
  const [progress, setProgress] = useState({ 
    value: 0, 
    message: '', 
    platform: '' 
  });
  const [statusMessages, setStatusMessages] = useState([]);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ============================================================================
  // INPUT HANDLERS
  // ============================================================================

  const handleInputChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    const sanitizedValue = type === "checkbox" 
      ? checked 
      : DOMPurify.sanitize(value);
    
    setSearchParams(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));
    
    setErrors(prev => ({
      ...prev,
      [name]: undefined
    }));
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
      ...prev.slice(-4),
      { 
        id: Date.now(), 
        message, 
        type, 
        timestamp: new Date() 
      }
    ]);
  }, []);

  // ============================================================================
  // SEARCH OPERATION
  // ============================================================================

  const handleSearch = useCallback(async (e) => {
    e.preventDefault();

    try {
      // Validate form
      await keywordVali.validate(searchParams, { abortEarly: false });

      if (searchParams.platforms.length === 0) {
        setError("Please select at least one platform");
        return;
      }

      // Reset state
      setIsSearching(true);
      setError(null);
      setSaveSuccess(false);
      setSearchResults({});
      setStatusMessages([]);
      setTotalResults(0);
      setProgress({ value: 0, message: "Initializing...", platform: "" });

      // Build query parameters
      const queryParams = new URLSearchParams({
        query: searchParams.query,
        platforms: searchParams.platforms.join(","),
        max_results: String(searchParams.maxResults),
        scrape_details: String(searchParams.scrapeDetails),
        time_filter: searchParams.timeFilter,
        browser: searchParams.browser,
        headless: String(searchParams.headless),
        local_context: String(searchParams.localContext),
        ...(searchParams.language && { language: searchParams.language }),
        ...(searchParams.country && { country: searchParams.country }),
      });

      // Initialize EventSource for streaming
      const url = `${import.meta.env.VITE_API_URL}/api/v2/scraper/search/stream?${queryParams}`;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      // Handle incoming events
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case "status":
              setProgress({
                value: data.progress || 0,
                message: data.message,
                platform: data.platform || "",
              });
              addStatusMessage(data.message);
              break;

            case "result":
              setSearchResults(prev => ({
                ...prev,
                [data.platform]: [...(prev[data.platform] || []), data.data],
              }));
              setTotalResults(prev => prev + 1);
              addStatusMessage(
                `Found: ${data.data.title.substring(0, 50)}...`,
                "success"
              );
              break;

            case "platform_complete":
              addStatusMessage(
                `✓ ${data.platform}: ${data.count} results`,
                "success"
              );
              break;

            case "complete":
              setProgress({
                value: 100,
                message: `Complete! Found ${data.total_results} results`,
                platform: "",
              });
              addStatusMessage(
                `🎉 Search complete! Total: ${data.total_results} results`,
                "success"
              );
              setIsSearching(false);
              eventSource.close();
              break;

            case "error":
              addStatusMessage(data.message, "error");
              if (data.severity === "error") {
                setError(data.message);
                setIsSearching(false);
                eventSource.close();
              }
              break;

            default:
              console.warn("Unknown event type:", data.type);
          }
        } catch (err) {
          console.error("Error parsing SSE event:", err);
        }
      };

      eventSource.onerror = (err) => {
        console.error("EventSource error:", err);
        setError("Connection lost. Please try again.");
        setIsSearching(false);
        eventSource.close();
      };

    } catch (validationError) {
      if (validationError.inner) {
        const formattedErrors = {};
        validationError.inner.forEach(err => {
          if (!formattedErrors[err.path]) {
            formattedErrors[err.path] = err.message;
          }
        });
        setErrors(formattedErrors);
      }
      console.error("Validation error:", validationError);
    }
  }, [keywordVali, searchParams, addStatusMessage]);

  const handleStop = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsSearching(false);
    addStatusMessage('Search stopped by user', 'warning');
  }, [addStatusMessage]);

  // ============================================================================
  // STORE OPERATION
  // ============================================================================

  const handleStoreResults = useCallback(async () => {
    if (Object.keys(searchResults).length === 0) {
      setError("No results to save");
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        query: searchParams.query,
        platforms: searchParams.platforms.join(","),
        max_results: String(searchParams.maxResults),
        scrape_details: String(searchParams.scrapeDetails),
        time_filter: searchParams.timeFilter,
        browser: searchParams.browser,
        headless: String(searchParams.headless),
        ...(searchParams.language && { language: searchParams.language }),
        ...(searchParams.country && { country: searchParams.country }),
        tags: `osint,${searchParams.country || 'general'},${new Date().toISOString().split('T')[0]}`
      });

      const response = await axiosPrivate.post(
        `/api/v2/scraper/search/store?${queryParams}`
      );

      if (response.status !== 200 && response.status !== 201) {
        throw new Error(`Failed to store: ${response.statusText}`);
      }

      const result = response.data;

      setSaveSuccess(true);
      addStatusMessage(
        `✅ Saved ${result.total_results || totalResults} results to database`,
        'success'
      );

      setTimeout(() => setSaveSuccess(false), 5000);

    } catch (err) {
      console.error("Store error:", err);
      const errorMessage = err.response?.data?.detail || err.message || "Unknown error occurred";
      setError(`Failed to save results: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  }, [
    searchResults, 
    searchParams, 
    axiosPrivate, 
    addStatusMessage, 
    totalResults
  ]);

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Box sx={{ width: '100%', p: { xs: 2, md: 3 } }}>
      {/* System Status */}
      <StatusResults />

      {/* Search Configuration Form */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mb: 3,
          background: (theme) => 
            `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
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
                  background: (theme) => 
                    `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                🔍 OSINT Intelligence Platform
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sahel-optimized social media intelligence with deep scraping
              </Typography>
            </Box>

            <Divider />

            {/* Search Query Input */}
            <InputField
              fullWidth
              label="Search Query"
              value={searchParams.query}
              name="query"
              error={!!errors.query}
              errorMessage={errors.query}
              onChange={handleInputChange}
              placeholder="Enter keywords, names, or topics..."
              variant="outlined"
              isRequired
              disabled={isSearching}
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

            {/* Search Parameters */}
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                ⚙️ Search Parameters
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <SelectField
                    value={searchParams.timeFilter}
                    name="timeFilter"
                    enableSearch={false}
                    onChange={handleInputChange}
                    label="Time Filter"
                    disabled={isSearching}
                    options={TIME_FILTERS}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <InputField
                    fullWidth
                    type="number"
                    label="Max Results"
                    name="maxResults"
                    value={searchParams.maxResults}
                    onChange={handleInputChange}
                    inputProps={{ min: 1, max: 50 }}
                    variant="outlined"
                    disabled={isSearching}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <SelectField
                    value={searchParams.language}
                    name="language"
                    enableSearch={false}
                    onChange={handleInputChange}
                    label="Language"
                    disabled={isSearching}
                    options={LANGUAGES}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <SelectField
                    value={searchParams.country}
                    name="country"
                    enableSearch={false}
                    onChange={handleInputChange}
                    label="Country"
                    disabled={isSearching}
                    options={COUNTRIES}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <SelectField
                    value={searchParams.browser}
                    name="browser"
                    enableSearch={false}
                    onChange={handleInputChange}
                    label="Browser"
                    disabled={isSearching}
                    options={BROWSERS}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={searchParams.scrapeDetails}
                        name="scrapeDetails"
                        onChange={handleInputChange}
                        disabled={isSearching}
                      />
                    }
                    label="🔬 Deep Scraping"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={searchParams.headless}
                        name="headless"
                        onChange={handleInputChange}
                        disabled={isSearching}
                      />
                    }
                    label="👻 Headless"
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={searchParams.localContext}
                        name="localContext"
                        onChange={handleInputChange}
                        disabled={isSearching}
                      />
                    }
                    label="🌍 Sahel Context"
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Action Buttons */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {!isSearching ? (
                <>
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
                      background: (theme) => 
                        `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
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

                  {Object.keys(searchResults).length > 0 && (
                    <Button
                      variant="outlined"
                      size="large"
                      startIcon={isSaving ? <FaSpinner className="fa-spin" /> : <FaSave />}
                      onClick={handleStoreResults}
                      disabled={isSaving}
                      sx={{
                        py: 1.5,
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        minWidth: 200,
                        borderWidth: 2,
                        '&:hover': {
                          borderWidth: 2,
                          transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.3s'
                      }}
                    >
                      {isSaving ? 'Saving...' : 'Save to Database'}
                    </Button>
                  )}
                </>
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

      {/* Error Alert */}
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

      {/* Success Alert */}
      {saveSuccess && (
        <Fade in={saveSuccess}>
          <Alert
            severity="success"
            onClose={() => setSaveSuccess(false)}
            sx={{ mb: 3, borderRadius: 2 }}
            icon={<FaCheckCircle />}
          >
            <Typography variant="subtitle2" fontWeight={600}>
              Results Saved Successfully
            </Typography>
            Data has been stored in the database with tags and metadata.
          </Alert>
        </Fade>
      )}

      {/* Progress Indicator */}
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
                  label={`${totalResults} results`}
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
                    background: (theme) => 
                      `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                  }
                }}
              />

              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                {progress.message}
                {progress.platform && ` • ${progress.platform}`}
              </Typography>

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

      {/* Search Results */}
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
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                mb: 3 
              }}>
                <Typography variant="h5" sx={{ 
                  fontWeight: 700, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1 
                }}>
                  🎯 Intelligence Results
                </Typography>
                <Chip
                  label={`${totalResults} Total`}
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
            background: (theme) => 
              `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`
          }}
        >
          <Typography variant="h3" sx={{ mb: 2, opacity: 0.3 }}>
            🔍
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Ready for Intelligence Operation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure parameters and launch search
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default MonitoringFeedPage;