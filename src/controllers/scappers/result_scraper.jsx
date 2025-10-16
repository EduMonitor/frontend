// src/components/SearchResults.js
import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  IconButton,
  Tooltip,
  Link,
  Skeleton
} from '@mui/material';

import { formatDistanceToNow, parseISO } from 'date-fns';
import { FaBoxOpen, FaCalendar, FaCode, FaExpandArrowsAlt } from 'react-icons/fa';
import { FaTextSlash } from 'react-icons/fa6';

const PLATFORM_ICONS = {
  facebook: '📘',
  twitter: '🐦',
  linkedin: '💼',
  instagram: '📸',
  youtube: '🎬',
  tiktok: '🎵'
};

const PLATFORM_COLORS = {
  facebook: '#1877f2',
  twitter: '#1da1f2',
  linkedin: '#0a66c2',
  instagram: '#e4405f',
  youtube: '#ff0000',
  tiktok: '#000000'
};

function SearchResults({ results, activeTab, platforms }) {
  if (!results) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">No results to display</Typography>
      </Box>
    );
  }

  if (activeTab === 0) {
    // Overview tab
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Intelligence Summary
        </Typography>
        <Typography variant="body2" color="text.secondary" >
          Found {results.count} results across {Object.keys(results.results).length} platforms
        </Typography>
        
        {Object.entries(results.results).map(([platform, platformResults]) => (
          <Paper key={platform} sx={{ mb: 2, p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              <span style={{ marginRight: 8 }}>{PLATFORM_ICONS[platform] || '🌐'}</span>
              {platform.charAt(0).toUpperCase() + platform.slice(1)} ({platformResults.length} results)
            </Typography>
            
            {platformResults.slice(0, 3).map((result, index) => (
              <Card key={index} sx={{ mb: 1, backgroundColor: 'background.default' }}>
                <CardContent>
                  <Typography variant="subtitle2" component="div">
                    <Link href={result.link} target="_blank" rel="noopener" underline="hover">
                      {result.title || 'Untitled Result'}
                    </Link>
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {result.snippet?.substring(0, 100)}...
                  </Typography>
                  {result.date && (
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      <CalendarIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                      {formatDistanceToNow(parseISO(result.date), { addSuffix: true })}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {platformResults.length > 3 && (
              <Typography variant="caption" color="text.secondary">
                + {platformResults.length - 3} more results
              </Typography>
            )}
          </Paper>
        ))}
      </Box>
    );
  }

  // Individual platform tabs
  const currentPlatform = platforms[activeTab - 1];
  const platformResults = results.results[currentPlatform] || [];

  if (platformResults.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">
          No results found for {currentPlatform}
        </Typography>
      </Box>
    );
  }

  return (
    <List>
      {platformResults.map((result, index) => (
        <ResultItem 
          key={index} 
          result={result} 
          platform={currentPlatform} 
        />
      ))}
    </List>
  );
}

function ResultItem({ result, platform }) {
  const [expanded, setExpanded] = React.useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  return (
    <ListItem alignItems="flex-start" sx={{ flexDirection: 'column', mb: 2, p: 0 }}>
      <Card sx={{ width: '100%', backgroundColor: 'background.paper' }}>
        <CardHeader
          title={
            <Link 
              href={result.link} 
              target="_blank" 
              rel="noopener" 
              underline="hover"
              sx={{ 
                color: PLATFORM_COLORS[platform] || 'primary.main',
                '&:hover': { color: 'primary.light' }
              }}
            >
              {result.title || 'Untitled Result'}
              <FaBoxOpen fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
            </Link>
          }
          subheader={
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Chip 
                label={`${PLATFORM_ICONS[platform]} ${platform}`}
                size="small"
                sx={{ 
                  backgroundColor: PLATFORM_COLORS[platform] + '20',
                  color: PLATFORM_COLORS[platform],
                  mr: 1
                }}
              />
              {result.date && (
                <Typography variant="caption" display="flex" alignItems="center">
                  <FaCalendar fontSize="small" sx={{ mr: 0.5 }} />
                  {formatDate(result.date)}
                </Typography>
              )}
            </Box>
          }
          sx={{ pb: 1 }}
        />
        
        <CardContent sx={{ pt: 0 }}>
          <Typography variant="body2" color="text.primary" paragraph>
            {result.snippet}
          </Typography>
          
          {result.scraped_data && (
            <>
              <IconButton
                onClick={handleExpandClick}
                aria-expanded={expanded}
                aria-label="show more"
                size="small"
              >
                <FaExpandArrowsAlt sx={{ transform: expanded ? 'rotate(180deg)' : 'none' }} />
              </IconButton>
              
              <Collapse in={expanded} timeout="auto" unmountOnExit>
                <Paper variant="outlined" sx={{ mt: 2, p: 2, backgroundColor: 'background.default' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    <FaCode fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Scraped Intelligence
                  </Typography>
                  
                  <Typography variant="body2" paragraph>
                    <strong>Page Title:</strong> {result.scraped_data.page_title}
                  </Typography>
                  
                  {result.scraped_data.meta_description && (
                    <Typography variant="body2" paragraph>
                      <FaTextSlash fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                      <strong>Description:</strong> {result.scraped_data.meta_description}
                    </Typography>
                  )}
                  
                  {result.scraped_data.content_snippet && (
                    <Typography variant="body2" paragraph sx={{ fontStyle: 'italic' }}>
                      "{result.scraped_data.content_snippet.substring(0, 200)}..."
                    </Typography>
                  )}
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                    <Chip 
                      label={`Browser: ${result.scraped_data.browser_used}`} 
                      size="small" 
                      variant="outlined"
                    />
                    <Chip 
                      label={`Scraped: ${formatDate(result.scraped_data.scraped_at)}`} 
                      size="small" 
                      variant="outlined"
                    />
                    {result.scraped_data.last_modified && (
                      <Chip 
                        label={`Modified: ${formatDate(result.scraped_data.last_modified)}`} 
                        size="small" 
                        variant="outlined"
                      />
                    )}
                  </Box>
                  
                  {result.scraped_data.note && (
                    <Typography variant="caption" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
                      Note: {result.scraped_data.note}
                    </Typography>
                  )}
                </Paper>
              </Collapse>
            </>
          )}
        </CardContent>
      </Card>
    </ListItem>
  );
}

export default SearchResults;