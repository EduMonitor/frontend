// pages/osint/Dashboard.jsx
import { useState } from 'react';
import {
    Box, Grid, Paper, Typography, Card, Chip, LinearProgress,
    Alert, Stack, Divider, Avatar, List, ListItem, ListItemText,
    ListItemAvatar, CircularProgress, Badge, ToggleButton,
    ToggleButtonGroup, alpha, Tooltip, IconButton,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import {
    FaUsers, FaFileAlt, FaExclamationTriangle, FaChartLine,
    FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaYoutube,
    FaTiktok, FaReddit, FaFlag, FaRocket, FaClock, FaShieldAlt,
    FaGlobe, FaSearch, FaDatabase, FaKey, FaBolt, FaUserShield,
} from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import useCurrentUser from '../../utils/hooks/current/user.currents';
import useAxiosPrivate from '../../utils/hooks/instance/axiosprivate.instance';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const GlassCard = styled(Paper)(({ theme }) => ({
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 12,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme.shadows[8],
    },
}));

const StatBlock = styled(Box)(({ accentcolor }) => ({
    padding: '20px 24px',
    borderRadius: 10,
    background: alpha(accentcolor, 0.06),
    border: `1px solid ${alpha(accentcolor, 0.18)}`,
    position: 'relative',
    overflow: 'hidden',
    '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        width: 3,
        height: '100%',
        background: accentcolor,
        borderRadius: '10px 0 0 10px',
    },
}));

const SectionLabel = styled(Typography)(({ theme }) => ({
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 2,
    color: theme.palette.text.disabled,
    textTransform: 'uppercase',
}));

const PlatformBar = styled(Box)(({ barcolor }) => ({
    height: 6,
    borderRadius: 99,
    background: alpha(barcolor, 0.15),
    overflow: 'hidden',
    '& > div': {
        height: '100%',
        borderRadius: 99,
        background: barcolor,
        transition: 'width 0.8s ease',
    },
}));

// ============================================================================
// CONSTANTS
// ============================================================================

const PLATFORM_META = {
    facebook:  { color: '#4267B2', icon: FaFacebook  },
    twitter:   { color: '#1DA1F2', icon: FaTwitter   },
    linkedin:  { color: '#0077B5', icon: FaLinkedin  },
    instagram: { color: '#E4405F', icon: FaInstagram },
    youtube:   { color: '#FF0000', icon: FaYoutube   },
    tiktok:    { color: '#69C9D0', icon: FaTiktok    },
    reddit:    { color: '#FF4500', icon: FaReddit    },
};

const getPlatformMeta = (platform) =>
    PLATFORM_META[platform?.toLowerCase()] || { color: '#888', icon: FaGlobe };

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// eslint-disable-next-line no-unused-vars
const KpiCard = ({ label, value, icon: Icon, color, sub }) => (
    <StatBlock accentcolor={color}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
            <Box>
                <SectionLabel mb={1}>{label}</SectionLabel>
                <Typography variant="h4" fontWeight={800} color={color} sx={{ fontFamily: 'monospace', lineHeight: 1 }}>
                    {(value ?? 0).toLocaleString()}
                </Typography>
                {sub && (
                    <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace', mt: 0.5, display: 'block' }}>
                        {sub}
                    </Typography>
                )}
            </Box>
            <Box sx={{ color, opacity: 0.4, fontSize: 36 }}>
                <Icon />
            </Box>
        </Stack>
    </StatBlock>
);

const SessionRow = ({ session, getPlatformMeta }) => (
    <Box sx={{
        display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.5,
        borderRadius: 2, mb: 0.5,
        bgcolor: (t) => alpha(t.palette.primary.main, 0.03),
        border: '1px solid', borderColor: 'divider',
        '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.07) },
        transition: 'background 0.15s',
    }}>
        <Avatar sx={{
            width: 34, height: 34, flexShrink: 0,
            bgcolor: session.status === 'completed'
                ? alpha('#22c55e', 0.15)
                : alpha('#f59e0b', 0.15),
        }}>
            {session.status === 'completed'
                ? <FaRocket size={14} color="#22c55e" />
                : <FaClock size={14} color="#f59e0b" />}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap fontFamily="monospace">
                {session.query || 'Unnamed Session'}
            </Typography>
            <Stack direction="row" spacing={0.75} mt={0.4} flexWrap="wrap" useFlexGap>
                <Chip size="small" label={session.status?.toUpperCase() || 'UNKNOWN'}
                    sx={{
                        height: 18, fontSize: 9, fontFamily: 'monospace', fontWeight: 700,
                        bgcolor: session.status === 'completed' ? alpha('#22c55e', 0.12) : alpha('#f59e0b', 0.12),
                        color: session.status === 'completed' ? '#22c55e' : '#f59e0b',
                    }} />
                <Chip size="small" label={`${session.entities_found || 0} entities`} variant="outlined"
                    sx={{ height: 18, fontSize: 9, fontFamily: 'monospace' }} />
                <Chip size="small" label={`${session.content_found || 0} content`} variant="outlined"
                    sx={{ height: 18, fontSize: 9, fontFamily: 'monospace' }} />
                {session.platforms?.slice(0, 3).map((p) => {
                    const { color } = getPlatformMeta(p);
                    return (
                        <Chip key={p} size="small" label={p}
                            sx={{ height: 18, fontSize: 9, bgcolor: alpha(color, 0.12), color }} />
                    );
                })}
            </Stack>
        </Box>

        {session.analyst_email && (
            <Tooltip title={session.analyst_email}>
                <Chip size="small" icon={<FaUserShield size={9} />} label={session.analyst_email.split('@')[0]}
                    sx={{ height: 20, fontSize: 9, fontFamily: 'monospace', flexShrink: 0 }} />
            </Tooltip>
        )}
    </Box>
);

// ============================================================================
// MAIN DASHBOARD
// ============================================================================

const Dashboard = () => {
    const { currentUser } = useCurrentUser();
    const axiosPrivate    = useAxiosPrivate();
    const theme           = useTheme();
    const [period, setPeriod] = useState(30);

    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

    // ── Data fetching ────────────────────────────────────────────────────────
    //
    // Admin   → /dashboard/stats          (global totals)
    //           /analysts/dashboard        (own data + usage)
    // Analyst → /analysts/dashboard        (own data only)

    const { data: globalStats, isLoading: loadingGlobal } = useQuery({
        queryKey: ['osint-global-stats'],
        queryFn:  () => axiosPrivate.get('/api/v2/scraper/dashboard/stats').then(r => r.data),
        enabled:  isAdmin,
        staleTime: 30_000,
        retry: 1,
    });

    const { data: myDashboard, isLoading: loadingMy } = useQuery({
        queryKey: ['osint-my-dashboard', period],
        queryFn:  () =>
            axiosPrivate
                .get(`/api/v2/scraper/analysts/dashboard?days=${period}`)
                .then(r => r.data),
        staleTime: 30_000,
        retry: 1,
    });

    const { data: myUsage, isLoading: loadingUsage } = useQuery({
        queryKey: ['api-usage-me', period],
        queryFn:  () =>
            axiosPrivate
                .get(`/api/v2/api-tracker/me?days=${period}`)
                .then(r => r.data),
        staleTime: 30_000,
        retry: 1,
    });

    const { data: allAnalysts, isLoading: loadingAllAnalysts } = useQuery({
        queryKey: ['api-usage-today'],
        queryFn:  () => axiosPrivate.get('/api/v2/api-tracker/today').then(r => r.data),
        enabled:  isAdmin,
        staleTime: 30_000,
        retry: 1,
    });

    // ── Derived values ────────────────────────────────────────────────────────

    // For display: admins see global totals in KPIs, analysts see own totals
    const kpiSource = isAdmin ? globalStats?.stats?.totals : myDashboard?.stats;

    const isLoading = isAdmin
        ? loadingGlobal || loadingMy || loadingUsage || loadingAllAnalysts
        : loadingMy || loadingUsage;

    // ── Loading ───────────────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Stack spacing={2} alignItems="center">
                    <CircularProgress size={48} thickness={3} />
                    <Typography variant="body2" color="text.disabled" fontFamily="monospace" letterSpacing={2}>
                        LOADING INTELLIGENCE...
                    </Typography>
                </Stack>
            </Box>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────

    const platformStats = isAdmin
        ? globalStats?.stats?.entities_by_platform
        : myDashboard?.platforms_breakdown;

    const recentSessions = isAdmin
        ? globalStats?.stats?.recent_sessions
        : myDashboard?.recent_sessions;

    const totalEntities = kpiSource?.total_entities ?? kpiSource?.entities ?? 0;
    const totalContent  = kpiSource?.total_content  ?? kpiSource?.content  ?? 0;
    const flaggedEnt    = kpiSource?.flagged_entities ?? 0;
    const flaggedCont   = kpiSource?.flagged_content  ?? 0;

    const quotaRemaining = myUsage?.quota_remaining ?? myDashboard?.stats?.quota_remaining ?? 0;
    const quotaUsed      = 100 - quotaRemaining;
    const canSearch      = myUsage?.can_search ?? true;
    const todayCalls     = myUsage?.data?.today_calls ?? 0;

    return (
        <Box sx={{ width: '100%', p: { xs: 2, md: 3 }, bgcolor: 'background.default', minHeight: '100vh' }}>

            {/* ── Header ──────────────────────────────────────────────────── */}
            <Box sx={{ mb: 4 }}>
                <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                    <Avatar sx={{ width: 52, height: 52, bgcolor: alpha(theme.palette.primary.main, 0.15), color: 'primary.main', fontWeight: 800, fontFamily: 'monospace', fontSize: 20 }}>
                        {currentUser?.firstName?.charAt(0) || 'U'}
                    </Avatar>
                    <Box flex={1}>
                        <Typography variant="h5" fontWeight={800} fontFamily="monospace" letterSpacing={-0.5}>
                            {isAdmin ? '🛡 Admin Dashboard' : `👋 ${currentUser?.firstName || 'Analyst'}`}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" fontFamily="monospace" letterSpacing={1}>
                            {isAdmin
                                ? 'GLOBAL VIEW — ALL ANALYSTS'
                                : `${currentUser?.email} — YOUR DATA ONLY`}
                        </Typography>
                    </Box>

                    {/* Period picker */}
                    <ToggleButtonGroup
                        value={period} exclusive size="small"
                        onChange={(_, v) => v && setPeriod(v)}
                        sx={{ bgcolor: 'background.paper' }}
                    >
                        {[7, 30, 90].map(d => (
                            <ToggleButton key={d} value={d}
                                sx={{ fontFamily: 'monospace', fontSize: 11, px: 1.5 }}>
                                {d}d
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                </Stack>

                {/* Quota warning banner */}
                {!canSearch && (
                    <Alert severity="error" icon={<FaKey />} sx={{ fontFamily: 'monospace', fontSize: 12, mb: 2 }}>
                        Daily search quota exhausted. Resets at midnight UTC.
                    </Alert>
                )}
                {canSearch && quotaRemaining <= 10 && (
                    <Alert severity="warning" icon={<FaKey />} sx={{ fontFamily: 'monospace', fontSize: 12, mb: 2 }}>
                        Only {quotaRemaining} API calls remaining today.
                    </Alert>
                )}
            </Box>

            {/* ── KPI Row ──────────────────────────────────────────────────── */}
            <Grid container spacing={2} mb={3}>
                {[
                    { label: isAdmin ? 'Total Entities' : 'Your Entities',   value: totalEntities, icon: FaUsers,            color: '#3b82f6', sub: `Last ${period} days` },
                    { label: isAdmin ? 'Total Content'  : 'Your Content',    value: totalContent,  icon: FaFileAlt,          color: '#22c55e', sub: `Last ${period} days` },
                    { label: 'Flagged Entities',                              value: flaggedEnt,    icon: FaFlag,             color: '#ef4444', sub: 'Requires review'      },
                    { label: 'Flagged Content',                               value: flaggedCont,   icon: FaExclamationTriangle, color: '#f59e0b', sub: 'High-risk items'  },
                ].map((k) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={k.label}>
                        <KpiCard {...k} />
                    </Grid>
                ))}
            </Grid>

            {/* ── Quota + API Usage Row ────────────────────────────────────── */}
            <Grid container spacing={2} mb={3}>

                {/* Quota gauge */}
                <Grid size={{ xs: 12, md: isAdmin ? 4 : 6 }}>
                    <GlassCard elevation={0} sx={{ p: 3, height: '100%' }}>
                        <SectionLabel mb={2}>API QUOTA — TODAY</SectionLabel>
                        <Stack spacing={1.5}>
                            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                                <Typography variant="h3" fontWeight={800} fontFamily="monospace"
                                    color={quotaRemaining <= 10 ? 'error.main' : 'success.main'}>
                                    {quotaRemaining}
                                </Typography>
                                <Typography variant="caption" color="text.disabled" fontFamily="monospace">
                                    / 100 remaining
                                </Typography>
                            </Stack>

                            <LinearProgress
                                variant="determinate"
                                value={quotaUsed}
                                sx={{
                                    height: 8, borderRadius: 99,
                                    bgcolor: alpha('#3b82f6', 0.1),
                                    '& .MuiLinearProgress-bar': {
                                        borderRadius: 99,
                                        bgcolor: quotaRemaining <= 10 ? 'error.main' : '#3b82f6',
                                    },
                                }}
                            />

                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="caption" color="text.disabled" fontFamily="monospace">
                                    {quotaUsed} used today
                                </Typography>
                                <Chip size="small"
                                    label={canSearch ? 'CAN SEARCH' : 'QUOTA FULL'}
                                    sx={{
                                        height: 18, fontSize: 9, fontFamily: 'monospace', fontWeight: 700,
                                        bgcolor: canSearch ? alpha('#22c55e', 0.12) : alpha('#ef4444', 0.12),
                                        color: canSearch ? '#22c55e' : '#ef4444',
                                    }} />
                            </Stack>

                            <Divider />

                            <Stack spacing={0.75}>
                                {[
                                    { label: 'Calls today',                     value: todayCalls },
                                    { label: `Calls last ${period}d`,           value: myUsage?.data?.total_calls ?? 0 },
                                    { label: 'Sessions run',                    value: myDashboard?.stats?.total_sessions ?? 0 },
                                ].map(({ label, value }) => (
                                    <Stack key={label} direction="row" justifyContent="space-between">
                                        <Typography variant="caption" color="text.secondary" fontFamily="monospace">{label}</Typography>
                                        <Typography variant="caption" fontWeight={700} fontFamily="monospace">{value}</Typography>
                                    </Stack>
                                ))}
                            </Stack>
                        </Stack>
                    </GlassCard>
                </Grid>

                {/* My recent API calls */}
                <Grid size={{ xs: 12, md: isAdmin ? 4 : 6 }}>
                    <GlassCard elevation={0} sx={{ p: 3, height: '100%' }}>
                        <SectionLabel mb={2}>
                            {isAdmin ? 'YOUR API ACTIVITY' : 'RECENT API CALLS'}
                        </SectionLabel>
                        <Stack spacing={1}>
                            {myUsage?.data?.calls_per_day?.slice(-7).map((day) => (
                                <Stack key={day._id} direction="row" spacing={1.5} alignItems="center">
                                    <Typography variant="caption" color="text.disabled" fontFamily="monospace"
                                        sx={{ minWidth: 80 }}>
                                        {day._id}
                                    </Typography>
                                    <PlatformBar barcolor="#3b82f6" sx={{ flex: 1 }}>
                                        <div style={{ width: `${Math.min((day.count / 100) * 100, 100)}%` }} />
                                    </PlatformBar>
                                    <Typography variant="caption" fontWeight={700} fontFamily="monospace"
                                        sx={{ minWidth: 24, textAlign: 'right' }}>
                                        {day.count}
                                    </Typography>
                                </Stack>
                            ))}
                            {!myUsage?.data?.calls_per_day?.length && (
                                <Typography variant="caption" color="text.disabled" fontFamily="monospace"
                                    sx={{ fontStyle: 'italic' }}>
                                    No API calls in this period
                                </Typography>
                            )}
                        </Stack>
                    </GlassCard>
                </Grid>

                {/* Admin only: all analysts today */}
                {isAdmin && (
                    <Grid size={{ xs: 12, md: 4 }}>
                        <GlassCard elevation={0} sx={{ p: 3, height: '100%' }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                                <SectionLabel>ANALYSTS TODAY</SectionLabel>
                                <Chip size="small"
                                    label={`${allAnalysts?.data?.total_calls_today ?? 0} calls`}
                                    sx={{ height: 18, fontSize: 9, fontFamily: 'monospace' }} />
                            </Stack>
                            <Stack spacing={1} sx={{ maxHeight: 220, overflowY: 'auto' }}>
                                {allAnalysts?.data?.analysts?.map((a) => (
                                    <Stack key={a.analyst_uuid} direction="row" spacing={1.5} alignItems="center"
                                        sx={{
                                            p: 1, borderRadius: 1.5,
                                            bgcolor: alpha(theme.palette.primary.main, 0.04),
                                            border: '1px solid', borderColor: 'divider',
                                        }}>
                                        <Avatar sx={{ width: 28, height: 28, fontSize: 11, bgcolor: alpha('#3b82f6', 0.15), color: '#3b82f6' }}>
                                            {a.analyst_email?.charAt(0)?.toUpperCase()}
                                        </Avatar>
                                        <Box flex={1} minWidth={0}>
                                            <Typography variant="caption" fontWeight={600} fontFamily="monospace" noWrap display="block">
                                                {a.analyst_email}
                                            </Typography>
                                            <Typography variant="caption" color="text.disabled" fontFamily="monospace" noWrap display="block">
                                                {a.last_query || '—'}
                                            </Typography>
                                        </Box>
                                        <Chip size="small" label={`${a.calls_today}×`}
                                            sx={{ height: 18, fontSize: 9, fontFamily: 'monospace', fontWeight: 700,
                                                bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6' }} />
                                    </Stack>
                                ))}
                                {!allAnalysts?.data?.analysts?.length && (
                                    <Typography variant="caption" color="text.disabled" fontFamily="monospace"
                                        sx={{ fontStyle: 'italic' }}>
                                        No analyst activity today
                                    </Typography>
                                )}
                            </Stack>
                        </GlassCard>
                    </Grid>
                )}
            </Grid>

            {/* ── Platform Distribution + Sessions ─────────────────────────── */}
            <Grid container spacing={2} mb={3}>

                {/* Platform breakdown */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <GlassCard elevation={0} sx={{ p: 3, height: '100%' }}>
                        <SectionLabel mb={2}>
                            {isAdmin ? 'GLOBAL PLATFORM DISTRIBUTION' : 'YOUR PLATFORM DISTRIBUTION'}
                        </SectionLabel>
                        <Stack spacing={1.5}>
                            {platformStats?.map((p, i) => {
                                const { color, icon: Icon } = getPlatformMeta(p._id);
                                const total = platformStats.reduce((s, x) => s + x.count, 0);
                                const pct   = total ? Math.round((p.count / total) * 100) : 0;
                                return (
                                    <Stack key={p._id || i} direction="row" spacing={1.5} alignItems="center">
                                        <Box sx={{ color, fontSize: 16, flexShrink: 0 }}><Icon /></Box>
                                        <Box flex={1} minWidth={0}>
                                            <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                                <Typography variant="caption" fontWeight={600} fontFamily="monospace" textTransform="capitalize">
                                                    {p._id || 'unknown'}
                                                </Typography>
                                                <Typography variant="caption" fontWeight={700} fontFamily="monospace" color={color}>
                                                    {p.count}
                                                </Typography>
                                            </Stack>
                                            <PlatformBar barcolor={color}>
                                                <div style={{ width: `${pct}%` }} />
                                            </PlatformBar>
                                        </Box>
                                        <Typography variant="caption" color="text.disabled" fontFamily="monospace"
                                            sx={{ minWidth: 32, textAlign: 'right' }}>
                                            {pct}%
                                        </Typography>
                                    </Stack>
                                );
                            })}
                            {!platformStats?.length && (
                                <Alert severity="info" icon={<FaSearch />} sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                                    No platform data. Start a search to populate.
                                </Alert>
                            )}
                        </Stack>
                    </GlassCard>
                </Grid>

                {/* Recent sessions */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <GlassCard elevation={0} sx={{ p: 3, height: '100%' }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                            <SectionLabel>
                                {isAdmin ? 'RECENT SESSIONS — ALL ANALYSTS' : 'YOUR RECENT SESSIONS'}
                            </SectionLabel>
                            <FaRocket color={theme.palette.primary.main} size={14} />
                        </Stack>
                        <Stack spacing={0.5} sx={{ maxHeight: 360, overflowY: 'auto' }}>
                            {recentSessions?.map((session, i) => (
                                <SessionRow key={session._id || session.id || i}
                                    session={session}
                                    getPlatformMeta={getPlatformMeta} />
                            ))}
                            {!recentSessions?.length && (
                                <Alert severity="info" icon={<FaSearch />} sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                                    No recent sessions. Launch a search to see activity.
                                </Alert>
                            )}
                        </Stack>
                    </GlassCard>
                </Grid>
            </Grid>

            {/* ── Admin: global stats row ───────────────────────────────────── */}
            {isAdmin && (
                <Grid container spacing={2} mb={3}>
                    {[
                        { label: 'Total Sessions',  value: globalStats?.stats?.totals?.sessions,        icon: FaDatabase, color: '#8b5cf6' },
                        { label: 'Active Sessions', value: globalStats?.stats?.totals?.active_sessions, icon: FaBolt,     color: '#06b6d4' },
                        { label: 'Flagged Entities',value: globalStats?.stats?.totals?.flagged_entities, icon: FaFlag,    color: '#ef4444' },
                        { label: 'Flagged Content', value: globalStats?.stats?.totals?.flagged_content,  icon: FaShieldAlt, color: '#f59e0b' },
                    ].map((k) => (
                        <Grid size={{ xs: 6, md: 3 }} key={k.label}>
                            <KpiCard {...k} sub="Global — all analysts" />
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* ── Footer ───────────────────────────────────────────────────── */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="caption" color="text.disabled" fontFamily="monospace" letterSpacing={1}>
                    🌍 BURKINA FASO &amp; SAHEL REGION — {new Date().toLocaleString()}
                    {isAdmin && '  •  ADMIN VIEW'}
                </Typography>
            </Box>

        </Box>
    );
};

export default Dashboard;