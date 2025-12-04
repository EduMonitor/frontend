// src/components/Result.scraper.js
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
  Tooltip,
  Grid
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
  FaCheckCircle,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaLink,
  FaEnvelope,
  FaPhone,
  FaUsers,
  FaImage,
  FaHashtag,
  FaKey,
  FaBriefcase,
  FaGraduationCap
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
        <Typography variant="h4" sx={{ opacity: 0.3, mb: 2 }}>🔍</Typography>
        <Typography color="text.secondary">No results to display</Typography>
      </Box>
    );
  }

  const platformKeys = platforms || Object.keys(results.results);
  const totalResults = Object.values(results.results).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <Box>
      <Paper elevation={0} sx={{ mb: 3, backgroundColor: 'transparent', borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ '& .MuiTab-root': { fontSize: '1rem', fontWeight: 600, textTransform: 'none', minHeight: 60 } }}
        >
          <Tab label={
            <Badge badgeContent={totalResults} color="primary" max={999}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2 }}>🌐 All Results</Box>
            </Badge>
          } />
          {platformKeys.map(platform => {
            const config = PLATFORM_CONFIG[platform] || { emoji: '🌐', name: platform };
            const count = results.results[platform]?.length || 0;
            return (
              <Tab key={platform} label={
                <Badge badgeContent={count} color="secondary" max={999}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
                    <span>{config.emoji}</span>{config.name}
                  </Box>
                </Badge>
              } />
            );
          })}
        </Tabs>
      </Paper>

      {activeTab === 0 ? (
        <AllPlatformsView results={results.results} platformKeys={platformKeys} />
      ) : (
        <SinglePlatformView platform={platformKeys[activeTab - 1]} results={results.results[platformKeys[activeTab - 1]] || []} />
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
          <Paper key={platform} elevation={2} sx={{ p: 3, borderRadius: 3, border: 2, borderColor: alpha(config.color, 0.2), transition: 'all 0.3s', '&:hover': { borderColor: alpha(config.color, 0.5), transform: 'translateY(-2px)', boxShadow: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{ bgcolor: alpha(config.color, 0.1), color: config.color, width: 56, height: 56, fontSize: '1.8rem' }}>
                {config.emoji}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: config.color }}>{config.name}</Typography>
                <Typography variant="body2" color="text.secondary">{platformResults.length} result{platformResults.length !== 1 ? 's' : ''}</Typography>
              </Box>
            </Box>
            <Stack spacing={2}>
              {platformResults.slice(0, 5).map((result, index) => (
                <ResultCard key={index} result={result} platform={platform} compact />
              ))}
            </Stack>
            {platformResults.length > 5 && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Chip label={`+ ${platformResults.length - 5} more`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
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
        <Typography variant="h4" sx={{ opacity: 0.3, mb: 2 }}>📭</Typography>
        <Typography color="text.secondary">No results for {platform}</Typography>
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
  const scrapedData = result.scraped_data || {};

  return (
    <Card elevation={3} sx={{ borderRadius: 2, transition: 'all 0.3s', border: 2, borderColor: 'transparent', '&:hover': { borderColor: alpha(config.color, 0.3), transform: 'translateX(4px)', boxShadow: 6 } }}>
      <CardHeader
        avatar={<Avatar sx={{ bgcolor: alpha(config.color, 0.1), color: config.color }}>{config.emoji}</Avatar>}
        action={
          <Tooltip title="Open"><IconButton href={result.link} target="_blank" rel="noopener noreferrer" size="small" sx={{ color: config.color }}><FaExternalLinkAlt /></IconButton></Tooltip>
        }
        title={
          <Link href={result.link} target="_blank" rel="noopener" underline="hover" sx={{ color: 'text.primary', fontWeight: 600, fontSize: '1.05rem', '&:hover': { color: config.color } }}>
            {result.title || 'Untitled'}
          </Link>
        }
        subheader={
          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
            <Chip icon={result.is_profile ? <FaUserCircle /> : <FaBuilding />} label={result.is_profile ? 'Profile' : 'Page'} size="small" sx={{ backgroundColor: result.is_profile ? alpha('#4caf50', 0.1) : alpha('#2196f3', 0.1), color: result.is_profile ? '#4caf50' : '#2196f3', fontWeight: 600 }} />
            {result.entity_type && result.entity_type !== 'unknown' && (
              <Chip label={result.entity_type} size="small" color="secondary" variant="outlined" />
            )}
            {result.date && <Chip icon={<FaCalendar />} label={formatDate(result.date)} size="small" variant="outlined" />}
            {hasScrapedData && <Chip icon={<FaCheckCircle />} label="Scraped" size="small" color="success" variant="outlined" />}
            {result.sahel_relevance_score > 0 && (
              <Chip label={`Sahel: ${result.sahel_relevance_score}`} size="small" sx={{ bgcolor: alpha('#ff9800', 0.1), color: '#ff9800' }} />
            )}
            {result.civil_society_score > 0 && (
              <Chip label={`CS: ${result.civil_society_score}`} size="small" sx={{ bgcolor: alpha('#9c27b0', 0.1), color: '#9c27b0' }} />
            )}
          </Stack>
        }
        sx={{ pb: 1 }}
      />

      <CardContent sx={{ pt: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{result.snippet}</Typography>

        {/* DEEP SCRAPED DATA */}
        {result.scraped_data && !compact && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FaGlobe /> Deep Intelligence
              </Typography>
              <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                {expanded ? <FaChevronUp /> : <FaChevronDown />}
              </IconButton>
            </Box>

            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <Paper variant="outlined" sx={{ mt: 2, p: 2, backgroundColor: alpha(config.color, 0.02), borderColor: alpha(config.color, 0.2) }}>
                {scrapedData.scrape_error ? (
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 2, bgcolor: alpha('#ff9800', 0.1), borderRadius: 1 }}>
                    <FaExclamationTriangle color="#ff9800" />
                    <Typography variant="body2" color="warning.main">{scrapedData.scrape_error}</Typography>
                  </Stack>
                ) : (
                  <Stack spacing={2}>
                    {/* Profile Information */}
                    {scrapedData.is_profile && (
                      <Paper elevation={0} sx={{ p: 2, bgcolor: alpha('#4caf50', 0.05), borderRadius: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FaUserCircle /> Profile Data
                        </Typography>
                        <Grid container spacing={2}>
                          {scrapedData.profile_name && (
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>Name</Typography>
                              <Typography variant="body2">{scrapedData.profile_name}</Typography>
                            </Grid>
                          )}
                          {scrapedData.username && (
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>Username</Typography>
                              <Typography variant="body2">@{scrapedData.username}</Typography>
                            </Grid>
                          )}
                          {scrapedData.display_name && (
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>Display Name</Typography>
                              <Typography variant="body2">{scrapedData.display_name}</Typography>
                            </Grid>
                          )}
                          {scrapedData.bio && (
                            <Grid size={{ xs: 12 }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>Bio</Typography>
                              <Typography variant="body2">{scrapedData.bio}</Typography>
                            </Grid>
                          )}
                          {scrapedData.location && (
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}><FaMapMarkerAlt /> Location</Typography>
                              <Typography variant="body2">{scrapedData.location}</Typography>
                            </Grid>
                          )}
                          {scrapedData.website && (
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}><FaLink /> Website</Typography>
                              <Link href={scrapedData.website} target="_blank" variant="body2">{scrapedData.website}</Link>
                            </Grid>
                          )}
                          {scrapedData.email && (
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}><FaEnvelope /> Email</Typography>
                              <Typography variant="body2">{scrapedData.email}</Typography>
                            </Grid>
                          )}
                          {scrapedData.phone && (
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}><FaPhone /> Phone</Typography>
                              <Typography variant="body2">{scrapedData.phone}</Typography>
                            </Grid>
                          )}
                        </Grid>

                        {/* Metrics */}
                        {(scrapedData.followers_count || scrapedData.following_count || scrapedData.posts_count) && (
                          <Box sx={{ mt: 2 }}>
                            <Stack direction="row" spacing={2} flexWrap="wrap">
                              {scrapedData.followers_count && <Chip icon={<FaUsers />} label={`${scrapedData.followers_count} Followers`} size="small" color="primary" />}
                              {scrapedData.following_count && <Chip label={`${scrapedData.following_count} Following`} size="small" variant="outlined" />}
                              {scrapedData.posts_count && <Chip label={`${scrapedData.posts_count} Posts`} size="small" variant="outlined" />}
                              {scrapedData.likes_count && <Chip label={`${scrapedData.likes_count} Likes`} size="small" variant="outlined" />}
                            </Stack>
                          </Box>
                        )}

                        {/* Status */}
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                          {scrapedData.is_verified && <Chip icon={<FaCheckCircle />} label="Verified" size="small" color="success" />}
                          {scrapedData.is_private && <Chip label="Private" size="small" color="warning" />}
                          {scrapedData.joined_date && <Chip icon={<FaCalendar />} label={`Joined: ${formatDate(scrapedData.joined_date)}`} size="small" variant="outlined" />}
                        </Stack>

                        {/* Professional Info */}
                        {(scrapedData.work || scrapedData.education) && (
                          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                            {scrapedData.work && (
                              <Box sx={{ mb: 1 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}><FaBriefcase /> Work</Typography>
                                <Typography variant="body2">{scrapedData.work}</Typography>
                              </Box>
                            )}
                            {scrapedData.education && (
                              <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}><FaGraduationCap /> Education</Typography>
                                <Typography variant="body2">{scrapedData.education}</Typography>
                              </Box>
                            )}
                          </Box>
                        )}

                        {/* Skills */}
                        {scrapedData.skills && scrapedData.skills.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Skills</Typography>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                              {scrapedData.skills.slice(0, 10).map((skill, i) => (
                                <Chip key={i} label={skill} size="small" variant="outlined" />
                              ))}
                            </Stack>
                          </Box>
                        )}
                      </Paper>
                    )}

                    {/* Keywords & Hashtags */}
                    {((scrapedData.keywords && scrapedData.keywords.length > 0) || (scrapedData.hashtags && scrapedData.hashtags.length > 0)) && (
                      <Paper elevation={0} sx={{ p: 2, bgcolor: alpha('#2196f3', 0.05), borderRadius: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Content Analysis</Typography>
                        {scrapedData.keywords && scrapedData.keywords.length > 0 && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}><FaKey /> Keywords</Typography>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                              {scrapedData.keywords.slice(0, 15).map((kw, i) => (
                                <Chip key={i} label={kw} size="small" variant="outlined" />
                              ))}
                            </Stack>
                          </Box>
                        )}
                        {scrapedData.hashtags && scrapedData.hashtags.length > 0 && (
                          <Box>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}><FaHashtag /> Hashtags</Typography>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                              {scrapedData.hashtags.slice(0, 15).map((tag, i) => (
                                <Chip key={i} label={tag} size="small" color="secondary" variant="outlined" />
                              ))}
                            </Stack>
                          </Box>
                        )}
                      </Paper>
                    )}

                    {/* Recent Posts */}
                    {scrapedData.recent_posts && scrapedData.recent_posts.length > 0 && (
                      <Paper elevation={0} sx={{ p: 2, bgcolor: alpha('#9c27b0', 0.05), borderRadius: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Recent Posts ({scrapedData.recent_posts.length})</Typography>
                        <Stack spacing={1}>
                          {scrapedData.recent_posts.slice(0, 3).map((post, i) => (
                            <Box key={i} sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                              <Typography variant="caption" color="text.secondary">{post.timestamp}</Typography>
                              <Typography variant="body2" sx={{ mt: 0.5 }}>{post.text}</Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Paper>
                    )}

                    {/* Basic Metadata */}
                    <Box>
                      {scrapedData.page_title && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>Page Title</Typography>
                          <Typography variant="body2">{scrapedData.page_title}</Typography>
                        </Box>
                      )}
                      {scrapedData.meta_description && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>Meta Description</Typography>
                          <Typography variant="body2">{scrapedData.meta_description}</Typography>
                        </Box>
                      )}
                      {scrapedData.content_snippet && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>Content</Typography>
                          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                            "{scrapedData.content_snippet.substring(0, 200)}..."
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Technical Info */}
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
                      <Chip label={`Browser: ${scrapedData.browser_used || 'unknown'}`} size="small" variant="outlined" />
                      {scrapedData.scraped_at && <Chip label={`Scraped: ${formatDate(scrapedData.scraped_at)}`} size="small" variant="outlined" />}
                    </Stack>
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