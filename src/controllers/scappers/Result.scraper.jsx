// src/components/result_scraper.js (SearchResults.js)
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  IconButton,
  Link,
  Stack,
  Divider,
  Tabs,
  Tab,
  Badge,
  Avatar,
  alpha,
  Tooltip
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { 
  FaExternalLinkAlt, 
  FaChevronDown, 
  FaChevronUp,
  FaCalendar,
  FaGlobe,
  FaUserCircle,
  FaBuilding,
  FaCheckCircle
} from 'react-icons/fa';

const PLATFORM_CONFIG = {
  facebook: { color: '#1877f2', emoji: '📘', name: 'Facebook' },
  twitter: { color: '#1da1f2', emoji: '🐦', name: 'Twitter/X' },
  linkedin: { color: '#0a66c2', emoji: '💼', name: 'LinkedIn' },
  instagram: { color: '#e4405f', emoji: '📸', name: 'Instagram' },
  youtube: { color: '#ff0000', emoji: '🎬', name: 'YouTube' },
  tiktok: { color: '#000000', emoji: '🎵', name: 'TikTok' },
  reddit: { color: '#ff4500', emoji: '🤖', name: 'Reddit' }
};

function SearchResults({ results, platforms }) {
  const [activeTab, setActiveTab] = useState(0);

  if (!results || !results.results) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h4" sx={{ opacity: 0.3, mb: 2 }}>
          🔍
        </Typography>
        <Typography color="text.secondary">
          No results to display
        </Typography>
      </Box>
    );
  }

  const platformKeys = platforms || Object.keys(results.results);
  const totalResults = Object.values(results.results).reduce(
    (sum, arr) => sum + arr.length, 
    0
  );

  return (
    <Box>
      {/* Platform Tabs */}
      <Paper 
        elevation={0} 
        sx={{ 
          mb: 3, 
          backgroundColor: 'transparent',
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              minHeight: 60
            }
          }}
        >
          <Tab 
            label={
              <Badge badgeContent={totalResults} color="primary" max={999}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2 }}>
                  🌐 All Results
                </Box>
              </Badge>
            }
          />
          {platformKeys.map(platform => {
            const config = PLATFORM_CONFIG[platform] || { emoji: '🌐', name: platform };
            const count = results.results[platform]?.length || 0;
            
            return (
              <Tab 
                key={platform}
                label={
                  <Badge badgeContent={count} color="secondary" max={999}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
                      <span>{config.emoji}</span>
                      {config.name}
                    </Box>
                  </Badge>
                }
              />
            );
          })}
        </Tabs>
      </Paper>

      {/* Results Content */}
      {activeTab === 0 ? (
        <AllPlatformsView results={results.results} platformKeys={platformKeys} />
      ) : (
        <SinglePlatformView 
          platform={platformKeys[activeTab - 1]} 
          results={results.results[platformKeys[activeTab - 1]] || []}
        />
      )}
    </Box>
  );
}

function AllPlatformsView({ results, platformKeys }) {
  return (
    <Stack spacing={3}>
      {platformKeys.map(platform => {
        const platformResults = results[platform] || [];
        if (platformResults.length === 0) return null;

        const config = PLATFORM_CONFIG[platform] || { emoji: '🌐', name: platform, color: '#666' };

        return (
          <Paper 
            key={platform} 
            elevation={2}
            sx={{ 
              p: 3, 
              borderRadius: 3,
              border: 2,
              borderColor: alpha(config.color, 0.2),
              transition: 'all 0.3s',
              '&:hover': {
                borderColor: alpha(config.color, 0.5),
                transform: 'translateY(-2px)',
                boxShadow: 4
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar 
                sx={{ 
                  bgcolor: alpha(config.color, 0.1),
                  color: config.color,
                  width: 56,
                  height: 56,
                  fontSize: '1.8rem'
                }}
              >
                {config.emoji}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: config.color }}>
                  {config.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {platformResults.length} result{platformResults.length !== 1 ? 's' : ''} found
                </Typography>
              </Box>
            </Box>

            <Stack spacing={2}>
              {platformResults.slice(0, 5).map((result, index) => (
                <ResultCard key={index} result={result} platform={platform} compact />
              ))}
            </Stack>

            {platformResults.length > 5 && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Chip 
                  label={`+ ${platformResults.length - 5} more results`}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            )}
          </Paper>
        );
      })}
    </Stack>
  );
}

function SinglePlatformView({ platform, results }) {
  if (results.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h4" sx={{ opacity: 0.3, mb: 2 }}>
          📭
        </Typography>
        <Typography color="text.secondary">
          No results found for {platform}
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {results.map((result, index) => (
        <ResultCard key={index} result={result} platform={platform} />
      ))}
    </Stack>
  );
}

function ResultCard({ result, platform, compact = false }) {
  const [expanded, setExpanded] = useState(false);
  const config = PLATFORM_CONFIG[platform] || { emoji: '🌐', name: platform, color: '#666' };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  const hasScrapedData = result.scraped_data && !result.scraped_data.scrape_error;

  return (
    <Card 
      elevation={3}
      sx={{ 
        borderRadius: 2,
        transition: 'all 0.3s',
        border: 2,
        borderColor: 'transparent',
        '&:hover': {
          borderColor: alpha(config.color, 0.3),
          transform: 'translateX(4px)',
          boxShadow: 6
        }
      }}
    >
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: alpha(config.color, 0.1), color: config.color }}>
            {config.emoji}
          </Avatar>
        }
        action={
          <Tooltip title="Open in new tab">
            <IconButton 
              href={result.link}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              sx={{ color: config.color }}
            >
              <FaExternalLinkAlt />
            </IconButton>
          </Tooltip>
        }
        title={
          <Link 
            href={result.link}
            target="_blank"
            rel="noopener"
            underline="hover"
            sx={{ 
              color: 'text.primary',
              fontWeight: 600,
              fontSize: '1.05rem',
              '&:hover': { color: config.color }
            }}
          >
            {result.title || 'Untitled Result'}
          </Link>
        }
        subheader={
          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
            <Chip 
              icon={result.is_profile ? <FaUserCircle /> : <FaBuilding />}
              label={result.is_profile ? 'Profile' : 'Page'}
              size="small"
              sx={{ 
                backgroundColor: result.is_profile ? alpha('#4caf50', 0.1) : alpha('#2196f3', 0.1),
                color: result.is_profile ? '#4caf50' : '#2196f3',
                fontWeight: 600
              }}
            />
            {result.date && (
              <Chip 
                icon={<FaCalendar />}
                label={formatDate(result.date)}
                size="small"
                variant="outlined"
              />
            )}
            {hasScrapedData && (
              <Chip 
                icon={<FaCheckCircle />}
                label="Scraped"
                size="small"
                color="success"
                variant="outlined"
              />
            )}
          </Stack>
        }
        sx={{ pb: 1 }}
      />

      <CardContent sx={{ pt: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {result.snippet}
        </Typography>

        {/* Scraped Data Section */}
        {result.scraped_data && !compact && (
          <>
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FaGlobe /> Scraped Intelligence
              </Typography>
              <IconButton 
                size="small"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <FaChevronUp /> : <FaChevronDown />}
              </IconButton>
            </Box>

            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <Paper 
                variant="outlined" 
                sx={{ 
                  mt: 2, 
                  p: 2, 
                  backgroundColor: alpha(config.color, 0.02),
                  borderColor: alpha(config.color, 0.2)
                }}
              >
                {result.scraped_data.scrape_error ? (
                  <Alert severity="warning" icon={<FaExclamationTriangle />}>
                    {result.scraped_data.scrape_error}
                  </Alert>
                ) : (
                  <Stack spacing={2}>
                    {result.scraped_data.page_title && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          Page Title
                        </Typography>
                        <Typography variant="body2">
                          {result.scraped_data.page_title}
                        </Typography>
                      </Box>
                    )}

                    {result.scraped_data.meta_description && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          Description
                        </Typography>
                        <Typography variant="body2">
                          {result.scraped_data.meta_description}
                        </Typography>
                      </Box>
                    )}

                    {result.scraped_data.content_snippet && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          Content Preview
                        </Typography>
                        <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                          "{result.scraped_data.content_snippet.substring(0, 300)}..."
                        </Typography>
                      </Box>
                    )}

                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip 
                        label={`Browser: ${result.scraped_data.browser_used}`}
                        size="small"
                        variant="outlined"
                      />
                      {result.scraped_data.scraped_at && (
                        <Chip 
                          label={`Scraped: ${formatDate(result.scraped_data.scraped_at)}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Stack>

                    {result.scraped_data.note && (
                      <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'info.main' }}>
                        ℹ️ {result.scraped_data.note}
                      </Typography>
                    )}
                  </Stack>
                )}
              </Paper>
            </Collapse>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default SearchResults;