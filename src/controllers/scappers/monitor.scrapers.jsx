// src/components/MonitoringFeedPages.js
import React, { useState } from 'react';
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
  Badge
} from '@mui/material';
import { FaSearch, FaTimes } from 'react-icons/fa';
import SearchResults from './result_scraper';
import ServiceStatus from './status.scraper';
import useAxiosPrivate from '../../utils/hooks/instance/axiosprivate.instance';

const PLATFORMS = [
  { id: 'facebook', label: 'Facebook', color: '#1877f2' },
  { id: 'twitter', label: 'Twitter/X', color: '#1da1f2' },
  { id: 'linkedin', label: 'LinkedIn', color: '#0a66c2' },
  { id: 'instagram', label: 'Instagram', color: '#e4405f' },
  { id: 'youtube', label: 'YouTube', color: '#ff0000' },
  { id: 'tiktok', label: 'TikTok', color: '#000000' }
];

const TIME_FILTERS = [
  { value: 'any', label: 'Any Time' },
  { value: 'day', label: 'Past 24 Hours' },
  { value: 'week', label: 'Past Week' },
  { value: 'month', label: 'Past Month' }
];

const BROWSERS = [
  { value: 'auto', label: 'Auto Detection' },
  { value: 'chrome', label: 'Chrome' },
  { value: 'firefox', label: 'Firefox' },
  { value: 'edge', label: 'Edge' }
];

const MonitoringFeedPages = () => {
  const axiosPrivate = useAxiosPrivate();
  
  const [searchParams, setSearchParams] = useState({
    query: '',
    platforms: ['facebook', 'twitter', 'linkedin'],
    maxResults: 10,
    scrapeDetails: true,
    timeFilter: 'any',
    browser: 'auto',
    headless: true
  });
  
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const handleInputChange = (field, value) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePlatformToggle = (platformId) => {
    setSearchParams(prev => {
      const newPlatforms = prev.platforms.includes(platformId)
        ? prev.platforms.filter(p => p !== platformId)
        : [...prev.platforms, platformId];
      
      return {
        ...prev,
        platforms: newPlatforms
      };
    });
  };

  const handleSubmit = async (e) => {
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

    try {
      // Build query parameters
      const params = {
        query: searchParams.query,
        platforms: searchParams.platforms.join(','),
        max_results: searchParams.maxResults,
        scrape_details: searchParams.scrapeDetails,
        time_filter: searchParams.timeFilter,
        browser: searchParams.browser,
        headless: searchParams.headless
      };

      const response = await axiosPrivate.get('/api/v2/osint/search', { params });

      setSearchResults(response.data);
      setActiveTab(1); // Switch to results tab
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Search failed';
      setError(`Search failed: ${errorMessage}`);
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchClick = () => {
    const params = new URLSearchParams({
      query: searchParams.query,
      platforms: searchParams.platforms.join(','),
      max_results: searchParams.maxResults.toString(),
      scrape_details: searchParams.scrapeDetails.toString(),
      time_filter: searchParams.timeFilter,
      browser: searchParams.browser,
      headless: searchParams.headless.toString()
    }).toString();

    window.open(`/api/v2/osint/search?${params}`, '_blank');
  };

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
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Search Query"
                value={searchParams.query}
                onChange={(e) => handleInputChange('query', e.target.value)}
                placeholder="Enter keywords to search for..."
                variant="outlined"
                required
              />
            </Grid>

            {/* Platforms Selection */}
            <Grid item xs={12}>
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
            <Grid item xs={12} md={3}>
              <FormControl fullWidth variant="outlined">
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

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Max Results"
                value={searchParams.maxResults}
                onChange={(e) => handleInputChange('maxResults', parseInt(e.target.value) || 1)}
                inputProps={{ min: 1, max: 50 }}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth variant="outlined">
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
                  />
                }
                label="Scrape Details"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={searchParams.headless}
                    onChange={(e) => handleInputChange('headless', e.target.checked)}
                  />
                }
                label="Headless Mode"
              />
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FaSearch />}
                disabled={loading}
                sx={{ py: 1.5 }}
              >
                {loading ? 'Searching...' : 'Launch Intelligence Operation'}
              </Button>
            </Grid>
          </Grid>
        </form>

        {/* Direct API Call Button */}
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleSearchClick}
            disabled={!searchParams.query.trim() || loading}
          >
            Test Direct API Call
          </Button>
        </Box>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Results Tabs */}
      {(searchResults || loading) && (
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
            {loading ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Gathering intelligence...</Typography>
              </Box>
            ) : (
              <SearchResults
                results={searchResults} 
                activeTab={activeTab}
                platforms={Object.keys(searchResults?.results || {})}
              />
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
}

export default MonitoringFeedPages;