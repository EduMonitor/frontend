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
import useAuth from '../../utils/hooks/contexts/useAth.contexts';

const DorkingScrappers = () => {
  const eventSourceRef = useRef(null);
  const axiosPrivate = useAxiosPrivate();
  const keywordVali = keywordValidator();
  // Inside DorkingScrappers component, add:
  const { auth } = useAuth(); // Add this hook
  // Search Configuration State
  const [searchParams, setSearchParams] = useState({
    query: '',
    platforms: ['facebook', 'twitter', 'linkedin'],
    maxResults: 10,
    scrapeDetails: true,
    timeFilter: 'any',
    language: 'fr',
    country: 'BF'
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
  // SEARCH OPERATION - DORKING STREAMING
  // ============================================================================

  // Replace your handleSearch function with this authenticated version




  // Replace handleSearch with this:
  const handleSearch = useCallback(async (e) => {
    e.preventDefault();

    try {
      // Validate form
      await keywordVali.validate(searchParams, { abortEarly: false });

      if (searchParams.platforms.length === 0) {
        setError("Please select at least one platform");
        return;
      }

      // Check auth
      if (!auth?.accessToken) {
        setError("🔐 Please log in to use Dorking search");
        return;
      }

      // Reset state
      setIsSearching(true);
      setError(null);
      setSaveSuccess(false);
      setSearchResults({});
      setStatusMessages([]);
      setTotalResults(0);
      setProgress({ value: 0, message: "Initializing Dorking search...", platform: "" });

      // Build query parameters
      const queryParams = new URLSearchParams({
        query: searchParams.query,
        platforms: searchParams.platforms.join(","),
        max_results: String(searchParams.maxResults),
        scrape_details: String(searchParams.scrapeDetails),
        time_filter: searchParams.timeFilter,
        ...(searchParams.language && { language: searchParams.language }),
        ...(searchParams.country && { country: searchParams.country }),
      });

      // Use fetch instead of EventSource for authentication support
      const url = `${import.meta.env.VITE_API_URL}/api/v2/dorking/search/stream?${queryParams}`;

      console.log('🚀 Starting authenticated Dorking search...');
      console.log('📡 URL:', url);
      console.log('🔑 Has token:', !!auth?.accessToken);

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include', // Include cookies
        headers: {
          'Authorization': `Bearer ${auth.accessToken}`,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      // Read stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Store reader for cleanup
      eventSourceRef.current = {
        reader,
        cancel: () => reader.cancel()
      };

      // Process stream
      const readStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              console.log('✅ Stream complete');
              setIsSearching(false);
              break;
            }

            // Decode chunk
            buffer += decoder.decode(value, { stream: true });

            // Split by newlines
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.substring(6));
                  console.log('📨 SSE Event:', data.type, data);

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
                      console.log('✅ New result:', data.data.title);
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
                      console.log(`✅ Platform ${data.platform} complete: ${data.count} results`);
                      addStatusMessage(
                        `✓ ${data.platform}: ${data.count} results`,
                        "success"
                      );
                      break;

                    case "complete":
                      console.log(`🎉 Search complete! Total: ${data.total_results}`);
                      setProgress({
                        value: 100,
                        message: `Complete! Found ${data.total_results} results`,
                        platform: "",
                      });
                      addStatusMessage(
                        `🎉 Dorking search complete! Total: ${data.total_results} results`,
                        "success"
                      );
                      setIsSearching(false);
                      return; // Exit

                    case "error":
                      console.error('❌ SSE Error:', data.message);
                      addStatusMessage(data.message, "error");
                      if (data.severity === "error") {
                        setError(data.message);
                        setIsSearching(false);
                        return;
                      }
                      break;

                    default:
                      console.warn("Unknown event type:", data.type);
                  }
                } catch (err) {
                  console.error("Error parsing SSE:", err, "Line:", line);
                }
              }
            }
          }
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error("Stream error:", err);
            setError("Connection lost. Please try again.");
            setIsSearching(false);
          }
        }
      };

      readStream();

    } catch (validationError) {
      if (validationError.inner) {
        const formattedErrors = {};
        validationError.inner.forEach(err => {
          if (!formattedErrors[err.path]) {
            formattedErrors[err.path] = err.message;
          }
        });
        setErrors(formattedErrors);
      } else {
        setError(validationError.message || "An error occurred");
      }
      setIsSearching(false);
      console.error("Error:", validationError);
    }
  }, [keywordVali, searchParams, addStatusMessage, auth?.accessToken]);

  // Update handleStop:
  const handleStop = useCallback(() => {
    if (eventSourceRef.current?.cancel) {
      eventSourceRef.current.cancel();
      eventSourceRef.current = null;
    }
    setIsSearching(false);
    addStatusMessage('Search stopped by user', 'warning');
  }, [addStatusMessage]);


  // ============================================================================
  // STORE OPERATION - DORKING STORE
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
      // Build query parameters for DORKING store endpoint
      const queryParams = new URLSearchParams({
        query: searchParams.query,
        platforms: searchParams.platforms.join(","),
        max_results: String(searchParams.maxResults),
        scrape_details: String(searchParams.scrapeDetails),
        time_filter: searchParams.timeFilter,
        ...(searchParams.language && { language: searchParams.language }),
        ...(searchParams.country && { country: searchParams.country }),
        tags: `dorking,osint,${searchParams.country || 'general'},${new Date().toISOString().split('T')[0]}`
      });

      const response = await axiosPrivate.post(
        `/api/v2/dorking/search/store?${queryParams}`
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
                🔍 Google Dorking Intelligence
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Advanced Google CSE-powered OSINT with Sahel optimization
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
                ⚙️ Dorking Parameters
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

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={searchParams.scrapeDetails}
                        name="scrapeDetails"
                        onChange={handleInputChange}
                        disabled={isSearching}
                      />
                    }
                    label="🔬 Extract Metadata"
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
                    Launch Dorking Operation
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
            Dorking results have been stored in the database with tags and metadata.
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
                  Dorking in Progress
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
                  🎯 Dorking Results
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
            Ready for Dorking Operation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure parameters and launch Google Dorking search
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default DorkingScrappers;