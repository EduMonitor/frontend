// src/pages/GoogleSocialSearch.jsx

import React, { useState } from 'react';
import { Box, TextField, Button, Card, Typography, Chip } from '@mui/material';
import { axiosPrivate } from '../utils/hooks/instance/axios.instance';

const GoogleSocialSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await axiosPrivate.post('/api/v2/google-social-search/search', {
        query: query,
        platforms: ['linkedin', 'twitter', 'facebook'],
        scrape_details: true
      });
      
      setResults(response.data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Social Media Profile & Post Search
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search for profiles or posts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </Box>
      
      {results && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Found {results.total_results} results
          </Typography>
          
          {Object.entries(results.results).map(([platform, items]) => (
            <Box key={platform} sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom>
                {platform.toUpperCase()} ({items.length})
              </Typography>
              
              {items.map((item, index) => (
                <Card key={index} sx={{ p: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6">
                      {item.name || item.title}
                    </Typography>
                    <Chip label={item.type} size="small" />
                  </Box>
                  
                  {item.headline && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {item.headline}
                    </Typography>
                  )}
                  
                  {item.about && (
                    <Typography variant="body2" paragraph>
                      {item.about}
                    </Typography>
                  )}
                  
                  {item.content && (
                    <Typography variant="body2" paragraph>
                      {item.content}
                    </Typography>
                  )}
                  
                  {item.description && (
                    <Typography variant="body2" color="text.secondary">
                      {item.description}
                    </Typography>
                  )}
                  
                  <Button
                    href={item.url}
                    target="_blank"
                    variant="outlined"
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    View Original
                  </Button>
                </Card>
              ))}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default GoogleSocialSearch;