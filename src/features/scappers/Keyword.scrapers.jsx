// src/components/MonitoringFeedPages.js
import React, { useState, useCallback } from 'react';
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
  CircularProgress,
  Typography,
  Tabs,
  Tab,
  Badge,
  LinearProgress,
  IconButton
} from '@mui/material';
import { FaSearch, FaTimes } from 'react-icons/fa';
import DOMPurify from 'dompurify'
import SearchResults from './result_scraper';
import ServiceStatus from './status.scraper';

import useAxiosPrivate from '../../utils/hooks/instance/axiosprivate.instance';
import { BROWSERS, COUNTRIES, LANGUAGES, PLATFORMS, TIME_FILTERS } from '../../constants/Params.contants';
import InputField from '../../components/forms/input.forms';


const MonitoringFeedPages = () => {
  const axiosPrivate = useAxiosPrivate();
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

  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' });
  const [activeTab, setActiveTab] = useState(0);

  // const handleInputChange = useCallback((field, value) => {
  //   setSearchParams(prev => ({
  //     ...prev,
  //     [field]: value
  //   }));
  // }, []);

  const handleInputChange = useCallback((event) => {
    const { name, value } = event.target;
    const sanitizedValue = DOMPurify.sanitize(value);
    setSearchParams((prevValues) => ({
      ...prevValues,
      [name]: sanitizedValue
    }));
  }, []);

  const handlePlatformToggle = useCallback((platformId) => {
    setSearchParams(prev => {
      const newPlatforms = prev.platforms.includes(platformId)
        ? prev.platforms.filter(p => p !== platformId)
        : [...prev.platforms, platformId];

      return {
        ...prev,
        platforms: newPlatforms
      };
    });
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!searchParams.query.trim()) {
      setError('Please enter a search query');
      return;
    }

    if (searchParams.platforms.length === 0) {
      setError('Please select at least one platform');
      return;
    }

    setLoading(true);
    setError(null);
    setSearchResults(null);
    setProgress({ current: 0, total: searchParams.platforms.length, message: 'Starting search...' });

    try {
      // Build query string with all parameters (matching your backend routes)
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

      // Use GET request to match your backend route
      const response = await axiosPrivate.get(`/api/v2/osint/search?${queryParams}`);

      setSearchResults(response.data);
      setProgress({ current: searchParams.platforms.length, total: searchParams.platforms.length, message: 'Search completed!' });
      setActiveTab(1); // Switch to results tab
    } catch (err) {
      console.error('Search error:', err);
      setError(err.response?.data?.message || err.message || 'An error occurred during search');
    } finally {
      setLoading(false);
    }
  }, [axiosPrivate, searchParams]);

  // eslint-disable-next-line no-unused-vars
  const handleReset = useCallback(() => {
    setSearchParams({
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
    setSearchResults(null);
    setError(null);
    setProgress({ current: 0, total: 0, message: '' });
    setActiveTab(0);
  }, []);

  const totalResults = searchResults?.results
    ? Object.values(searchResults.results).reduce((sum, platformResults) => sum + platformResults.length, 0)
    : 0;

  return (
    <Box sx={{ width: '100%' }}>
      {/* Service Status */}
      <ServiceStatus />

      {/* Search Form */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: 'background.paper' }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Search Query */}
            <Grid size={{ md: 12, sm: 12, xs: 12 }}>

              <InputField
                fullWidth
                label="Search Query"
                value={searchParams.query}
                name={"query"}
                onChange={handleInputChange}
                placeholder="Enter keywords to search for..."
                required
                disabled={loading}
              />
            </Grid>

            {/* Platforms Selection */}
            <Grid size={{ md: 12, sm: 12, xs: 12 }}>

              <Typography variant="subtitle2" gutterBottom>
                Select Platforms:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {PLATFORMS.map(platform => (
                  <Chip
                    key={platform.id}
                    label={platform.label}
                    onClick={() => handlePlatformToggle(platform.id)}
                    color={searchParams.platforms.includes(platform.id) ? 'primary' : 'default'}
                    variant={searchParams.platforms.includes(platform.id) ? 'filled' : 'outlined'}
                    disabled={loading}
                    sx={{
                      backgroundColor: searchParams.platforms.includes(platform.id)
                        ? `${platform.color} !important`
                        : undefined,
                      color: searchParams.platforms.includes(platform.id) ? 'white !important' : undefined
                    }}
                  />
                ))}
              </Box>
            </Grid>

            {/* Filters - First Row */}
            <Grid size={{ md: 3, sm: 12, xs: 12 }}>

              <FormControl fullWidth variant="outlined" disabled={loading}>
                <InputLabel>Time Filter</InputLabel>
                <Select
                  value={searchParams.timeFilter}
                  onChange={(e) => handleInputChange('timeFilter', e.target.value)}
                  label="Time Filter"
                >
                  {TIME_FILTERS.map(filter => (
                    <MenuItem key={filter.value} value={filter.value}>
                      {filter.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ md: 3, sm: 12, xs: 12 }}>

              <TextField
                fullWidth
                type="number"
                label="Max Results"
                value={searchParams.maxResults}
                onChange={(e) => handleInputChange('maxResults', parseInt(e.target.value) || 1)}
                inputProps={{ min: 1, max: 50 }}
                variant="outlined"
                disabled={loading}
              />
            </Grid>

            <Grid size={{ md: 3, sm: 12, xs: 12 }}>
              <FormControl fullWidth variant="outlined" disabled={loading}>
                <InputLabel>Language</InputLabel>
                <Select
                  value={searchParams.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  label="Language"
                >
                  {LANGUAGES.map(lang => (
                    <MenuItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ md: 3, sm: 12, xs: 12 }}>
              <FormControl fullWidth variant="outlined" disabled={loading}>
                <InputLabel>Country</InputLabel>
                <Select
                  value={searchParams.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  label="Country"
                >
                  {COUNTRIES.map(country => (
                    <MenuItem key={country.value} value={country.value}>
                      {country.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Browser and Options */}
            <Grid size={{ md: 3, sm: 12, xs: 12 }}>
              <FormControl fullWidth variant="outlined" disabled={loading}>
                <InputLabel>Browser</InputLabel>
                <Select
                  value={searchParams.browser}
                  onChange={(e) => handleInputChange('browser', e.target.value)}
                  label="Browser"
                >
                  {BROWSERS.map(browser => (
                    <MenuItem key={browser.value} value={browser.value}>
                      {browser.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={searchParams.scrapeDetails}
                    onChange={(e) => handleInputChange('scrapeDetails', e.target.checked)}
                    disabled={loading}
                  />
                }
                label="Scrape Details"
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={searchParams.headless}
                    onChange={(e) => handleInputChange('headless', e.target.checked)}
                    disabled={loading}
                  />
                }
                label="Headless Mode"
              />
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FaSearch />}
                  disabled={loading}
                  sx={{ py: 1.5 }}
                >
                  {loading ? 'Gathering Intelligence...' : 'Launch Intelligence Operation'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>

        {/* Progress Indicator */}
        {loading && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <LinearProgress
                variant={progress.total > 0 ? "determinate" : "indeterminate"}
                value={progress.total > 0 ? (progress.current / progress.total) * 100 : 0}
                sx={{ flex: 1 }}
              />
            </Box>
            <Typography variant="caption" display="block" sx={{ textAlign: 'center' }}>
              {progress.message || 'Processing...'}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <IconButton
              color="inherit"
              size="small"
              onClick={() => setError(null)}
            >
              <FaTimes />
            </IconButton>
          }
        >
          {error}
        </Alert>
      )}

      {/* Results Tabs */}
      {searchResults && (
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              label={
                <Badge badgeContent={totalResults} color="primary">
                  Results Overview
                </Badge>
              }
            />
            {searchResults?.results && Object.keys(searchResults.results).map(platform => (
              <Tab
                key={platform}
                label={
                  <Badge
                    badgeContent={searchResults.results[platform]?.length || 0}
                    color="secondary"
                  >
                    {PLATFORMS.find(p => p.id === platform)?.label || platform}
                  </Badge>
                }
              />
            ))}
          </Tabs>

          <Box sx={{ p: 3 }}>
            <SearchResults
              results={searchResults}
              activeTab={activeTab}
              platforms={Object.keys(searchResults?.results || {})}
            />
          </Box>
        </Paper>
      )}
    </Box>
  );
}

export default MonitoringFeedPages;