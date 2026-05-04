/* eslint-disable no-unused-vars */
// pages/osint/Analyser.jsx
//
// URL FIXES applied:
//  - Content list:  /api/v2/osint/analysts/content   (was /api/v2/scraper/analysts/content)
//  - Session list:  /api/v2/osint/analysts/sessions  (was /api/v2/scraper/analysts/sessions)
//  - Analysis text: /api/v2/analysis/text            (was already correct — needs main.py fix)
//  - Analysis post: /api/v2/analysis/content/{id}    (was already correct — needs main.py fix)
//  - Bulk session:  /api/v2/analysis/bulk/session/{id} (same)
//  - Flagged:       /api/v2/analysis/flagged/summary  (same)
//
// BEHAVIOUR FIXES:
//  - ContentAnalysisRow onAnalyse called with (id) only — text arg dropped
//  - Both useQuery fetches have .catch(() => []) so UI never hard-crashes
//  - handleContentAnalyse deduplicates: removes stale result before re-adding
//  - Session bulk success message now shows correctly from mutation data
//  - Flagged summary KPI grid shows even when results.length > 0

import { useState } from 'react';
import {
    Box, Grid, Paper, Typography, Card, Chip, LinearProgress,
    Alert, Stack, Divider, Avatar, CircularProgress, Tooltip,
    IconButton, TextField, Button, Tab, Tabs, alpha,
    List, ListItem, ListItemText, Collapse,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import {
    FaSearch, FaShieldAlt, FaExclamationTriangle, FaFire,
    FaCheckCircle, FaTimesCircle, FaBrain, FaChartPie,
    FaListAlt, FaRobot, FaFlag, FaBolt, FaInfoCircle,
    FaAngleDown, FaAngleUp, FaSyncAlt, FaFlask,
    FaEye, FaFilter, FaRegClock, FaDatabase,
} from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAxiosPrivate from '../../utils/hooks/instance/axiosprivate.instance';
import useCurrentUser from '../../utils/hooks/current/user.currents';

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
    padding: '16px 20px',
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
        borderRadius: 0,  // FIX: single-sided border must not have rounded corners
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

const RiskBadge = styled(Chip)(({ risklevel }) => {
    const colors = {
        high:    { bg: alpha('#ef4444', 0.12), color: '#ef4444' },
        medium:  { bg: alpha('#f59e0b', 0.12), color: '#f59e0b' },
        low:     { bg: alpha('#22c55e', 0.12), color: '#22c55e' },
        unknown: { bg: alpha('#888', 0.12),    color: '#888'    },
    };
    const c = colors[risklevel] || colors.unknown;
    return { backgroundColor: c.bg, color: c.color, fontFamily: 'monospace', fontWeight: 700 };
});

const ScoreArc = ({ score = 0, color = '#3b82f6', size = 80 }) => {
    const radius = (size - 10) / 2;
    const circ   = 2 * Math.PI * radius;
    const dash   = circ * Math.min(score, 1);
    return (
        <Box sx={{ position: 'relative', width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke={alpha(color, 0.15)} strokeWidth={8} />
                <circle cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke={color} strokeWidth={8}
                    strokeDasharray={`${dash} ${circ}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.8s ease' }} />
            </svg>
            <Box sx={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Typography variant="caption" fontWeight={800} fontFamily="monospace" color={color}>
                    {Math.round(score * 100)}%
                </Typography>
            </Box>
        </Box>
    );
};

// ============================================================================
// CONSTANTS
// ============================================================================

const RISK_META = {
    high:   { color: '#ef4444', icon: FaFire,               label: 'HIGH RISK'   },
    medium: { color: '#f59e0b', icon: FaExclamationTriangle, label: 'MEDIUM RISK' },
    low:    { color: '#22c55e', icon: FaCheckCircle,         label: 'LOW RISK'    },
};

const SENTIMENT_META = {
    positive: { color: '#22c55e', label: 'Positive' },
    negative: { color: '#ef4444', label: 'Negative' },
    neutral:  { color: '#94a3b8', label: 'Neutral'  },
};

// ============================================================================
// ANALYSIS RESULT CARD
// ============================================================================

const AnalysisResultCard = ({ analysis, contentId, text }) => {
    const theme  = useTheme();
    const [open, setOpen] = useState(false);

    if (!analysis) return null;

    const risk      = analysis.disinformation_risk || {};
    const sentiment = analysis.sentiment           || {};
    const toxicity  = analysis.toxicity            || {};
    const topic     = analysis.topic               || {};

    const riskMeta = RISK_META[risk.risk_level]            || RISK_META.low;
    const sentMeta = SENTIMENT_META[sentiment.sentiment]   || SENTIMENT_META.neutral;
    const RiskIcon = riskMeta.icon;

    return (
        <GlassCard elevation={0} sx={{ overflow: 'hidden' }}>
            <Box sx={{ height: 4, bgcolor: riskMeta.color, width: '100%' }} />

            <Box sx={{ p: 3 }}>
                {/* Header */}
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={2}>
                    <Box>
                        <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                            <RiskIcon color={riskMeta.color} size={16} />
                            <Typography variant="subtitle2" fontWeight={800} fontFamily="monospace" color={riskMeta.color}>
                                {riskMeta.label}
                            </Typography>
                        </Stack>
                        {contentId && (
                            <Typography variant="caption" color="text.disabled" fontFamily="monospace">
                                ID: {contentId}
                            </Typography>
                        )}
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <RiskBadge
                            size="small"
                            risklevel={risk.risk_level || 'unknown'}
                            label={`${Math.round((risk.risk_score || 0) * 100)}% risk`}
                        />
                        {toxicity.is_toxic && (
                            <Chip size="small" label="TOXIC" icon={<FaFlag size={9} />}
                                sx={{ bgcolor: alpha('#ef4444', 0.12), color: '#ef4444',
                                    fontFamily: 'monospace', fontWeight: 700, fontSize: 9 }} />
                        )}
                    </Stack>
                </Stack>

                {/* Text preview */}
                {text && (
                    <Box sx={{
                        p: 1.5, borderRadius: 2, mb: 2,
                        bgcolor: alpha(theme.palette.text.primary, 0.03),
                        border: '1px solid', borderColor: 'divider',
                    }}>
                        <Typography variant="caption" fontFamily="monospace" color="text.secondary"
                            sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {text}
                        </Typography>
                    </Box>
                )}

                {/* Score arcs */}
                <Grid container spacing={2} mb={2}>
                    <Grid size={4}>
                        <Stack alignItems="center" spacing={0.5}>
                            <ScoreArc score={risk.risk_score || 0} color={riskMeta.color} />
                            <SectionLabel>Disinfo Risk</SectionLabel>
                        </Stack>
                    </Grid>
                    <Grid size={4}>
                        <Stack alignItems="center" spacing={0.5}>
                            <ScoreArc score={toxicity.toxicity_score || 0} color="#ef4444" />
                            <SectionLabel>Toxicity</SectionLabel>
                        </Stack>
                    </Grid>
                    <Grid size={4}>
                        <Stack alignItems="center" spacing={0.5}>
                            <ScoreArc score={sentiment.confidence || 0} color={sentMeta.color} />
                            <SectionLabel>Sentiment</SectionLabel>
                        </Stack>
                    </Grid>
                </Grid>

                <Divider sx={{ mb: 2 }} />

                {/* Sentiment + Topic */}
                <Grid container spacing={1} mb={2}>
                    <Grid size={6}>
                        <StatBlock accentcolor={sentMeta.color}>
                            <SectionLabel mb={0.5}>Sentiment</SectionLabel>
                            <Typography variant="body2" fontWeight={700} fontFamily="monospace" color={sentMeta.color}>
                                {sentMeta.label}
                            </Typography>
                        </StatBlock>
                    </Grid>
                    <Grid size={6}>
                        <StatBlock accentcolor="#8b5cf6">
                            <SectionLabel mb={0.5}>Topic</SectionLabel>
                            <Typography variant="body2" fontWeight={700} fontFamily="monospace" color="#8b5cf6"
                                sx={{ textTransform: 'capitalize' }}>
                                {topic.primary_topic || '—'}
                            </Typography>
                        </StatBlock>
                    </Grid>
                </Grid>

                {/* Risk factors */}
                {risk.risk_factors?.length > 0 && (
                    <Box mb={2}>
                        <SectionLabel mb={1}>Risk Factors</SectionLabel>
                        <Stack direction="row" flexWrap="wrap" gap={0.75}>
                            {risk.risk_factors.map((f, i) => (
                                <Chip key={i} size="small" label={f}
                                    icon={<FaExclamationTriangle size={8} />}
                                    sx={{
                                        height: 20, fontSize: 9, fontFamily: 'monospace',
                                        bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b',
                                    }} />
                            ))}
                        </Stack>
                    </Box>
                )}

                {/* Toxicity breakdown */}
                {Object.keys(toxicity.categories || {}).length > 0 && (
                    <>
                        <Button size="small" onClick={() => setOpen(!open)}
                            endIcon={open ? <FaAngleUp size={10} /> : <FaAngleDown size={10} />}
                            sx={{ fontFamily: 'monospace', fontSize: 10, mb: 1, color: 'text.secondary' }}>
                            {open ? 'Hide' : 'Show'} toxicity breakdown
                        </Button>
                        <Collapse in={open}>
                            <Stack spacing={0.75} mb={1}>
                                {Object.entries(toxicity.categories).map(([cat, score]) => (
                                    <Stack key={cat} direction="row" spacing={1.5} alignItems="center">
                                        <Typography variant="caption" fontFamily="monospace" color="text.secondary"
                                            sx={{ minWidth: 110, textTransform: 'capitalize' }}>
                                            {cat.replace(/_/g, ' ')}
                                        </Typography>
                                        <Box flex={1}>
                                            <LinearProgress variant="determinate" value={score * 100}
                                                sx={{
                                                    height: 5, borderRadius: 99,
                                                    bgcolor: alpha('#ef4444', 0.1),
                                                    '& .MuiLinearProgress-bar': {
                                                        bgcolor: score >= 0.65 ? '#ef4444' : score >= 0.3 ? '#f59e0b' : '#22c55e',
                                                        borderRadius: 99,
                                                    },
                                                }} />
                                        </Box>
                                        <Typography variant="caption" fontFamily="monospace" fontWeight={700}
                                            sx={{ minWidth: 36, textAlign: 'right' }}>
                                            {Math.round(score * 100)}%
                                        </Typography>
                                    </Stack>
                                ))}
                            </Stack>
                        </Collapse>
                    </>
                )}

                {/* Footer */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1}>
                    <Typography variant="caption" color="text.disabled" fontFamily="monospace">
                        {analysis.analyzed_at ? new Date(analysis.analyzed_at).toLocaleString() : ''}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" fontFamily="monospace">
                        {analysis.duration_seconds != null ? `${analysis.duration_seconds}s` : ''}{analysis.device ? ` · ${analysis.device}` : ''}
                    </Typography>
                </Stack>
            </Box>
        </GlassCard>
    );
};

// ============================================================================
// CONTENT ROW
// ============================================================================

// FIX: onAnalyse signature is (id) only — text was passed but never used in
//      the mutation; keeping the call site clean avoids confusion.
const ContentAnalysisRow = ({ content, onAnalyse, loading }) => {
    const analysis = content.ai_analysis;
    const risk     = analysis?.disinformation_risk;
    const riskMeta = RISK_META[risk?.risk_level] || null;
    const RiskIcon = riskMeta?.icon;

    const contentId = content._id || content.id;

    return (
        <Box sx={{
            display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.5,
            borderRadius: 2, mb: 0.5,
            bgcolor: (t) => alpha(t.palette.primary.main, 0.03),
            border: '1px solid', borderColor: 'divider',
        }}>
            <Avatar sx={{
                width: 34, height: 34, flexShrink: 0,
                bgcolor: riskMeta ? alpha(riskMeta.color, 0.15) : alpha('#888', 0.1),
            }}>
                {riskMeta
                    ? <RiskIcon size={14} color={riskMeta.color} />
                    : <FaRobot size={14} color="#888" />}
            </Avatar>

            <Box flex={1} minWidth={0}>
                <Typography variant="body2" fontWeight={600} fontFamily="monospace" noWrap>
                    {content.title || content.text?.slice(0, 60) || content.url || 'No text'}
                </Typography>
                <Stack direction="row" spacing={0.75} mt={0.4}>
                    <Chip size="small" label={content.platform || 'unknown'}
                        sx={{ height: 16, fontSize: 9, fontFamily: 'monospace' }} />
                    {content.flagged && (
                        <Chip size="small" label="FLAGGED" icon={<FaFlag size={8} />}
                            sx={{ height: 16, fontSize: 9, bgcolor: alpha('#ef4444', 0.1), color: '#ef4444', fontFamily: 'monospace' }} />
                    )}
                    {analysis && (
                        <RiskBadge size="small"
                            risklevel={risk?.risk_level || 'unknown'}
                            label={riskMeta?.label || 'analyzed'} />
                    )}
                </Stack>
            </Box>

            <Button
                size="small"
                variant={analysis ? 'outlined' : 'contained'}
                startIcon={loading ? <CircularProgress size={10} /> : <FaBrain size={10} />}
                disabled={loading}
                onClick={() => onAnalyse(contentId)}   // FIX: only pass id
                sx={{ fontFamily: 'monospace', fontSize: 10, whiteSpace: 'nowrap', flexShrink: 0 }}
            >
                {analysis ? 'Re-analyse' : 'Analyse'}
            </Button>
        </Box>
    );
};

// ============================================================================
// MAIN PAGE
// ============================================================================

const Analyser = () => {
    const axiosPrivate = useAxiosPrivate();
    const queryClient  = useQueryClient();
    const { currentUser } = useCurrentUser();
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

    const [tab, setTab]             = useState(0);
    const [rawText, setRawText]     = useState('');
    const [contentId, setContentId] = useState('');
    const [sessionId, setSessionId] = useState('');
    const [results, setResults]     = useState([]);
    const [analyzingIds, setAnalyzingIds] = useState(new Set());

    // ── FIX: correct URL — mounted at /api/v2/osint, not /api/v2/scraper ────
    const { data: contentList, isLoading: loadingContent } = useQuery({
        queryKey: ['analyser-content-list'],
        queryFn: () =>
            axiosPrivate
                .get('/api/v2/osint/analysts/content?page_size=30&sort_by=scraped_at')
                .then(r => r.data?.data || [])
                .catch(() => []),   // FIX: graceful fallback — never crashes tab 1
        staleTime: 30_000,
        retry: 1,
    });

    // ── FIX: correct URL for sessions ───────────────────────────────────────
    const { data: sessionList, isLoading: loadingSessions } = useQuery({
        queryKey: ['analyser-session-list'],
        queryFn: () =>
            axiosPrivate
                .get('/api/v2/osint/analysts/sessions?page_size=20&sort_by=started_at')
                .then(r => r.data?.data || [])
                .catch(() => []),   // FIX: graceful fallback — never crashes tab 2
        staleTime: 30_000,
        retry: 1,
    });

    // ── Raw text mutation — /api/v2/analysis/text ────────────────────────────
    // Requires main.py to register analysis_routes at prefix /api/v2/analysis
    const rawMutation = useMutation({
        mutationFn: (text) =>
            axiosPrivate
                .post('/api/v2/analysis/text', { text, include_topic: true })
                .then(r => r.data),
        onSuccess: (data) => {
            setResults(prev => [{
                text:     rawText,
                analysis: data.analysis,
                id:       Date.now(),
            }, ...prev]);
        },
    });

    // ── Content ID mutation — /api/v2/analysis/content/{id} ─────────────────
    const contentMutation = useMutation({
        mutationFn: (id) =>
            axiosPrivate
                .post(`/api/v2/analysis/content/${id}`)
                .then(r => r.data),
        onSuccess: (data, id) => {
            // FIX: always remove old result for this id first, then prepend fresh one
            setResults(prev => [
                { contentId: id, analysis: data.analysis, id: Date.now() },
                ...prev.filter(r => r.contentId !== id),
            ]);
            queryClient.invalidateQueries(['analyser-content-list']);
            setAnalyzingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
        },
        onError: (_, id) => {
            setAnalyzingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
        },
    });

    // ── Session bulk mutation — /api/v2/analysis/bulk/session/{id} ───────────
    const sessionMutation = useMutation({
        mutationFn: (id) =>
            axiosPrivate
                .post(`/api/v2/analysis/bulk/session/${id}?limit=50`)
                .then(r => r.data),
    });

    // ── Flagged summary (admin) — /api/v2/analysis/flagged/summary ───────────
    const { data: flaggedSummary } = useQuery({
        queryKey: ['analyser-flagged-summary'],
        queryFn: () =>
            axiosPrivate
                .get('/api/v2/analysis/flagged/summary')
                .then(r => r.data)
                .catch(() => null),
        enabled:   isAdmin,
        staleTime: 60_000,
        retry: 1,
    });

    // ── Handlers ─────────────────────────────────────────────────────────────

    const handleRawAnalyse = () => {
        if (rawText.trim().length < 10) return;
        rawMutation.mutate(rawText.trim());
    };

    // FIX: only one argument — content row now correctly calls onAnalyse(id)
    const handleContentAnalyse = (id) => {
        setAnalyzingIds(prev => new Set(prev).add(id));
        contentMutation.mutate(id);
    };

    const handleSessionAnalyse = () => {
        if (!sessionId.trim()) return;
        sessionMutation.mutate(sessionId.trim());
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <Box sx={{ width: '100%', p: { xs: 2, md: 3 }, bgcolor: 'background.default', minHeight: '100vh' }}>

            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Stack direction="row" alignItems="center" spacing={2} mb={1}>
                    <Avatar sx={{ width: 52, height: 52, bgcolor: alpha('#8b5cf6', 0.15), color: '#8b5cf6' }}>
                        <FaBrain size={22} />
                    </Avatar>
                    <Box>
                        <Typography variant="h5" fontWeight={800} fontFamily="monospace" letterSpacing={-0.5}>
                            AI Content Analyser
                        </Typography>
                        <Typography variant="caption" color="text.disabled" fontFamily="monospace" letterSpacing={1}>
                            DISINFORMATION · HATE SPEECH · TOXICITY · SENTIMENT
                        </Typography>
                    </Box>
                </Stack>
            </Box>

            {/* Admin KPIs — shown always (not gated on results.length) */}
            {isAdmin && flaggedSummary?.summary && (
                <Grid container spacing={2} mb={3}>
                    {[
                        { label: 'Total Flagged',       value: flaggedSummary.summary.total_flagged,       color: '#ef4444', icon: FaFlag },
                        { label: 'Hate Speech',         value: flaggedSummary.summary.hate_speech,         color: '#f97316', icon: FaFire },
                        { label: 'High Disinfo Risk',   value: flaggedSummary.summary.high_disinfo_risk,   color: '#f59e0b', icon: FaExclamationTriangle },
                        { label: 'Medium Disinfo Risk', value: flaggedSummary.summary.medium_disinfo_risk, color: '#3b82f6', icon: FaShieldAlt },
                    ].map(({ label, value, color, icon: Icon }) => (
                        <Grid size={{ xs: 6, md: 3 }} key={label}>
                            <StatBlock accentcolor={color}>
                                <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                                    <Box>
                                        <SectionLabel mb={0.5}>{label}</SectionLabel>
                                        <Typography variant="h4" fontWeight={800} fontFamily="monospace" color={color}>
                                            {(value ?? 0).toLocaleString()}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ color, opacity: 0.4, fontSize: 28 }}><Icon /></Box>
                                </Stack>
                            </StatBlock>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Grid container spacing={3}>

                {/* LEFT: Input panel */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <GlassCard elevation={0} sx={{ p: 0, overflow: 'hidden', position: 'sticky', top: 16 }}>

                        <Tabs value={tab} onChange={(_, v) => setTab(v)}
                            sx={{
                                px: 2, pt: 1,
                                '& .MuiTab-root': { fontFamily: 'monospace', fontSize: 10, fontWeight: 700, letterSpacing: 1, minHeight: 40 },
                            }}>
                            <Tab icon={<FaFlask size={11} />} iconPosition="start" label="RAW TEXT" />
                            <Tab icon={<FaDatabase size={11} />} iconPosition="start" label="CONTENT" />
                            <Tab icon={<FaListAlt size={11} />} iconPosition="start" label="SESSION" />
                        </Tabs>

                        <Divider />

                        <Box sx={{ p: 3 }}>

                            {/* TAB 0 — Raw text */}
                            {tab === 0 && (
                                <Stack spacing={2}>
                                    <SectionLabel>Paste or type text to analyse</SectionLabel>
                                    <TextField
                                        multiline rows={8} fullWidth
                                        placeholder="Ce gouvernement ment au peuple, c'est de la propagande..."
                                        value={rawText}
                                        onChange={(e) => setRawText(e.target.value)}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                fontFamily: 'monospace', fontSize: 13, borderRadius: 2,
                                            },
                                        }}
                                    />
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="caption" color="text.disabled" fontFamily="monospace">
                                            {rawText.length} chars
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            startIcon={rawMutation.isPending
                                                ? <CircularProgress size={12} color="inherit" />
                                                : <FaBrain size={12} />}
                                            disabled={rawText.trim().length < 10 || rawMutation.isPending}
                                            onClick={handleRawAnalyse}
                                            sx={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, borderRadius: 2 }}
                                        >
                                            {rawMutation.isPending ? 'Analysing...' : 'Analyse Text'}
                                        </Button>
                                    </Stack>
                                    {rawMutation.isError && (
                                        <Alert severity="error" sx={{ fontFamily: 'monospace', fontSize: 11 }}>
                                            {rawMutation.error?.response?.data?.detail || 'Analysis failed'}
                                        </Alert>
                                    )}
                                </Stack>
                            )}

                            {/* TAB 1 — Content list */}
                            {tab === 1 && (
                                <Stack spacing={2}>
                                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                                        <SectionLabel>Your scraped content</SectionLabel>
                                        <IconButton size="small"
                                            onClick={() => queryClient.invalidateQueries(['analyser-content-list'])}>
                                            <FaSyncAlt size={12} />
                                        </IconButton>
                                    </Stack>

                                    {/* Manual ID entry */}
                                    <Stack direction="row" spacing={1}>
                                        <TextField size="small" fullWidth
                                            placeholder="Content ID (MongoDB ObjectId)"
                                            value={contentId}
                                            onChange={(e) => setContentId(e.target.value)}
                                            sx={{ '& input': { fontFamily: 'monospace', fontSize: 12 } }}
                                        />
                                        <Button variant="outlined" size="small"
                                            startIcon={<FaBrain size={10} />}
                                            disabled={!contentId.trim() || contentMutation.isPending}
                                            onClick={() => handleContentAnalyse(contentId.trim())}
                                            sx={{ fontFamily: 'monospace', fontSize: 10, whiteSpace: 'nowrap' }}
                                        >
                                            Go
                                        </Button>
                                    </Stack>

                                    {contentMutation.isError && (
                                        <Alert severity="error" sx={{ fontFamily: 'monospace', fontSize: 11 }}>
                                            {contentMutation.error?.response?.data?.detail || 'Analysis failed'}
                                        </Alert>
                                    )}

                                    <Divider />

                                    {loadingContent
                                        ? <CircularProgress size={24} sx={{ alignSelf: 'center' }} />
                                        : (
                                            <Stack spacing={0.5} sx={{ maxHeight: 420, overflowY: 'auto' }}>
                                                {contentList?.map((c, i) => (
                                                    <ContentAnalysisRow
                                                        key={c._id || i}
                                                        content={c}
                                                        onAnalyse={handleContentAnalyse}
                                                        loading={analyzingIds.has(c._id || c.id)}
                                                    />
                                                ))}
                                                {!contentList?.length && (
                                                    <Alert severity="info" sx={{ fontFamily: 'monospace', fontSize: 11 }}>
                                                        No content found. Scrape something first.
                                                    </Alert>
                                                )}
                                            </Stack>
                                        )}
                                </Stack>
                            )}

                            {/* TAB 2 — Session bulk */}
                            {tab === 2 && (
                                <Stack spacing={2}>
                                    <SectionLabel>Bulk analyse all content from a session</SectionLabel>

                                    <Stack direction="row" spacing={1}>
                                        <TextField size="small" fullWidth
                                            placeholder="Session ID"
                                            value={sessionId}
                                            onChange={(e) => setSessionId(e.target.value)}
                                            sx={{ '& input': { fontFamily: 'monospace', fontSize: 12 } }}
                                        />
                                        <Button variant="contained" size="small"
                                            startIcon={sessionMutation.isPending
                                                ? <CircularProgress size={10} color="inherit" />
                                                : <FaBolt size={10} />}
                                            disabled={!sessionId.trim() || sessionMutation.isPending}
                                            onClick={handleSessionAnalyse}
                                            sx={{ fontFamily: 'monospace', fontSize: 10, whiteSpace: 'nowrap' }}
                                        >
                                            Run Bulk
                                        </Button>
                                    </Stack>

                                    {/* FIX: use sessionMutation.data directly — was missing null-guard */}
                                    {sessionMutation.isSuccess && sessionMutation.data && (
                                        <Alert severity="success" sx={{ fontFamily: 'monospace', fontSize: 11 }}>
                                            Queued {sessionMutation.data.queued ?? 0} items for background analysis.
                                            Skipped {sessionMutation.data.skipped ?? 0} already-analysed.
                                        </Alert>
                                    )}
                                    {sessionMutation.isError && (
                                        <Alert severity="error" sx={{ fontFamily: 'monospace', fontSize: 11 }}>
                                            {sessionMutation.error?.response?.data?.detail || 'Bulk analysis failed'}
                                        </Alert>
                                    )}

                                    <Divider />

                                    <SectionLabel>Recent sessions</SectionLabel>
                                    {loadingSessions
                                        ? <CircularProgress size={24} sx={{ alignSelf: 'center' }} />
                                        : (
                                            <Stack spacing={0.5} sx={{ maxHeight: 360, overflowY: 'auto' }}>
                                                {sessionList?.map((s, i) => (
                                                    <Box key={s._id || i}
                                                        onClick={() => setSessionId(s._id)}
                                                        sx={{
                                                            px: 2, py: 1.5, borderRadius: 2, cursor: 'pointer',
                                                            border: '1px solid',
                                                            borderColor: sessionId === s._id ? 'primary.main' : 'divider',
                                                            bgcolor: sessionId === s._id
                                                                ? (t) => alpha(t.palette.primary.main, 0.07)
                                                                : (t) => alpha(t.palette.primary.main, 0.02),
                                                            '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.06) },
                                                            transition: 'all 0.15s',
                                                        }}>
                                                        <Typography variant="body2" fontWeight={600} fontFamily="monospace" noWrap>
                                                            {s.query || 'Unnamed Session'}
                                                        </Typography>
                                                        <Stack direction="row" spacing={0.75} mt={0.5}>
                                                            <Chip size="small"
                                                                label={s.status?.toUpperCase() || 'UNKNOWN'}
                                                                sx={{ height: 16, fontSize: 9, fontFamily: 'monospace' }} />
                                                            <Typography variant="caption" color="text.disabled" fontFamily="monospace">
                                                                {s.content_found || 0} items
                                                            </Typography>
                                                        </Stack>
                                                    </Box>
                                                ))}
                                                {!sessionList?.length && (
                                                    <Alert severity="info" sx={{ fontFamily: 'monospace', fontSize: 11 }}>
                                                        No sessions found.
                                                    </Alert>
                                                )}
                                            </Stack>
                                        )}
                                </Stack>
                            )}
                        </Box>
                    </GlassCard>
                </Grid>

                {/* RIGHT: Results panel */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                        <SectionLabel>
                            Analysis Results {results.length > 0 && `(${results.length})`}
                        </SectionLabel>
                        {results.length > 0 && (
                            <Button size="small" onClick={() => setResults([])}
                                sx={{ fontFamily: 'monospace', fontSize: 10, color: 'text.secondary' }}>
                                Clear all
                            </Button>
                        )}
                    </Stack>

                    {results.length === 0 && (
                        <GlassCard elevation={0} sx={{ p: 6, textAlign: 'center' }}>
                            <Box sx={{ mb: 2, color: alpha('#888', 0.3) }}>
                                <FaEye size={40} />
                            </Box>
                            <Typography variant="body2" color="text.disabled" fontFamily="monospace">
                                Analysis results will appear here.
                            </Typography>
                            <Typography variant="caption" color="text.disabled" fontFamily="monospace">
                                Use the panel on the left to start.
                            </Typography>
                        </GlassCard>
                    )}

                    <Stack spacing={2}>
                        {results.map((r) => (
                            <AnalysisResultCard
                                key={r.id}
                                analysis={r.analysis}
                                contentId={r.contentId}
                                text={r.text}
                            />
                        ))}
                    </Stack>

                    {/* Admin: recently auto-flagged — only shown when no user-triggered results */}
                    {isAdmin && flaggedSummary?.recent_flagged?.length > 0 && results.length === 0 && (
                        <Box mt={3}>
                            <SectionLabel mb={2}>RECENTLY AUTO-FLAGGED</SectionLabel>
                            <Stack spacing={1.5}>
                                {flaggedSummary.recent_flagged.map((c, i) => (
                                    <AnalysisResultCard
                                        key={c._id || i}
                                        analysis={c.ai_analysis}
                                        contentId={c._id}
                                        text={c.text || c.title}
                                    />
                                ))}
                            </Stack>
                        </Box>
                    )}
                </Grid>
            </Grid>

            {/* Footer */}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="caption" color="text.disabled" fontFamily="monospace" letterSpacing={1}>
                    SAHEL REGION AI ANALYSIS — CamemBERT · toxic-bert · BART-MNLI
                </Typography>
            </Box>
        </Box>
    );
};

export default Analyser;