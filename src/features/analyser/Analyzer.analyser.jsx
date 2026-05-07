/* eslint-disable no-unused-vars */
// pages/osint/Analyser.jsx — REDESIGNED
// New fields displayed:
//   risk_summary.label, conclusion, author_position, ai_opinion,
//   sahel_violations, topic_scores bar chart, all toxicity categories
// New input: language selector (Français, English, Mooré, Dioula, Hausa,
//   Fulfulde, Bambara, Arabic, Wolof, Auto-detect)

import { useState } from 'react';
import {
    Box, Grid, Paper, Typography, Card, Chip, LinearProgress,
    Alert, Stack, Divider, Avatar, CircularProgress, Tooltip,
    IconButton, TextField, Button, Tab, Tabs, alpha, Select,
    MenuItem, FormControl, InputLabel, Collapse,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import {
    FaSearch, FaShieldAlt, FaExclamationTriangle, FaFire,
    FaCheckCircle, FaTimesCircle, FaBrain, FaChartPie,
    FaListAlt, FaRobot, FaFlag, FaBolt, FaInfoCircle,
    FaAngleDown, FaAngleUp, FaSyncAlt, FaFlask,
    FaEye, FaFilter, FaRegClock, FaDatabase, FaGlobeAfrica,
    FaUserSecret, FaBalanceScale, FaMicroscope,
} from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAxiosPrivate from '../../utils/hooks/instance/axiosprivate.instance';
import useCurrentUser from '../../utils/hooks/current/user.currents';

// ============================================================================
// LANGUAGE OPTIONS
// ============================================================================

const LANGUAGES = [
    { value: 'fr',   label: 'Français'       },
    { value: 'en',   label: 'English'        },
    { value: 'mos',  label: 'Mooré'          },
    { value: 'dyu',  label: 'Dioula'         },
    { value: 'ha',   label: 'Hausa'          },
    { value: 'ff',   label: 'Fulfulde'       },
    { value: 'bm',   label: 'Bambara'        },
    { value: 'ar',   label: 'Arabic / عربي'  },
    { value: 'wo',   label: 'Wolof'          },
    { value: 'auto', label: 'Auto-detect'    },
];

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
        borderRadius: 0,
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

const CONCLUSION_META = {
    green:  { color: '#22c55e', bg: alpha('#22c55e', 0.08) },
    yellow: { color: '#f59e0b', bg: alpha('#f59e0b', 0.08) },
    orange: { color: '#f97316', bg: alpha('#f97316', 0.08) },
    red:    { color: '#ef4444', bg: alpha('#ef4444', 0.08) },
};

// ============================================================================
// TOPIC BAR CHART
// ============================================================================

const TopicBars = ({ topicScores = {} }) => {
    const sorted = Object.entries(topicScores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

    return (
        <Stack spacing={0.75}>
            {sorted.map(([topic, score]) => (
                <Stack key={topic} direction="row" spacing={1.5} alignItems="center">
                    <Typography variant="caption" fontFamily="monospace" color="text.secondary"
                        sx={{ minWidth: 90, textTransform: 'capitalize', fontSize: 10 }}>
                        {topic}
                    </Typography>
                    <Box flex={1}>
                        <LinearProgress
                            variant="determinate"
                            value={score * 100}
                            sx={{
                                height: 5, borderRadius: 99,
                                bgcolor: alpha('#8b5cf6', 0.08),
                                '& .MuiLinearProgress-bar': {
                                    bgcolor: '#8b5cf6', borderRadius: 99,
                                },
                            }}
                        />
                    </Box>
                    <Typography variant="caption" fontFamily="monospace" fontWeight={700}
                        sx={{ minWidth: 36, textAlign: 'right', fontSize: 10 }}>
                        {Math.round(score * 100)}%
                    </Typography>
                </Stack>
            ))}
        </Stack>
    );
};

// ============================================================================
// ANALYSIS RESULT CARD — full redesign with all new fields
// ============================================================================

const AnalysisResultCard = ({ analysis, contentId, text }) => {
    const theme  = useTheme();
    const [toxOpen, setToxOpen]     = useState(false);
    const [topicOpen, setTopicOpen] = useState(false);

    if (!analysis) return null;

    const risk      = analysis.disinformation_risk  || {};
    const riskSum   = analysis.risk_summary         || {};
    const sentiment = analysis.sentiment            || {};
    const toxicity  = analysis.toxicity             || {};
    const topic     = analysis.topic                || {};
    const author    = analysis.author_position      || {};
    const aiOp      = analysis.ai_opinion           || {};
    const conclusion = analysis.conclusion          || {};
    const sahel     = analysis.sahel_violations     || {};

    const riskMeta  = RISK_META[risk.risk_level]           || RISK_META.low;
    const sentMeta  = SENTIMENT_META[sentiment.sentiment]  || SENTIMENT_META.neutral;
    const concMeta  = CONCLUSION_META[conclusion.color]    || CONCLUSION_META.green;
    const RiskIcon  = riskMeta.icon;

    return (
        <GlassCard elevation={0} sx={{ overflow: 'hidden' }}>
            {/* Top colour bar */}
            <Box sx={{ height: 4, bgcolor: riskMeta.color, width: '100%' }} />

            <Box sx={{ p: 3 }}>

                {/* ── Header ── */}
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={2}>
                    <Box>
                        <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                            <RiskIcon color={riskMeta.color} size={16} />
                            <Typography variant="subtitle2" fontWeight={800} fontFamily="monospace" color={riskMeta.color}>
                                {riskSum.label || riskMeta.label}
                            </Typography>
                        </Stack>
                        {contentId && (
                            <Typography variant="caption" color="text.disabled" fontFamily="monospace">
                                ID: {contentId}
                            </Typography>
                        )}
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" justifyContent="flex-end">
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

                {/* ── Text preview ── */}
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

                {/* ── Score arcs ── */}
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

                {/* ── Sentiment + Topic ── */}
                <Grid container spacing={1} mb={2}>
                    <Grid size={6}>
                        <StatBlock accentcolor={sentMeta.color}>
                            <SectionLabel mb={0.5}>Sentiment</SectionLabel>
                            <Typography variant="body2" fontWeight={700} fontFamily="monospace" color={sentMeta.color}
                                sx={{ textTransform: 'capitalize' }}>
                                {sentMeta.label}
                            </Typography>
                            <Typography variant="caption" fontFamily="monospace" color="text.disabled">
                                score: {(sentiment.score || 0).toFixed(3)}
                            </Typography>
                        </StatBlock>
                    </Grid>
                    <Grid size={6}>
                        <StatBlock accentcolor="#8b5cf6">
                            <SectionLabel mb={0.5}>Primary Topic</SectionLabel>
                            <Typography variant="body2" fontWeight={700} fontFamily="monospace" color="#8b5cf6"
                                sx={{ textTransform: 'capitalize' }}>
                                {topic.primary_topic || '—'}
                            </Typography>
                            <Typography variant="caption" fontFamily="monospace" color="text.disabled">
                                conf: {Math.round((topic.confidence || 0) * 100)}%
                            </Typography>
                        </StatBlock>
                    </Grid>
                </Grid>

                {/* ── Conclusion box ── */}
                {conclusion.action && (
                    <Box sx={{
                        p: 1.5, borderRadius: 2, mb: 2,
                        bgcolor: concMeta.bg,
                        border: `1px solid ${alpha(concMeta.color, 0.25)}`,
                        display: 'flex', alignItems: 'flex-start', gap: 1.5,
                    }}>
                        <Typography sx={{ fontSize: 20, lineHeight: 1 }}>{conclusion.icon}</Typography>
                        <Box>
                            <Typography variant="body2" fontWeight={700} fontFamily="monospace" color={concMeta.color}>
                                {conclusion.action_fr || conclusion.action}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                                {conclusion.summary}
                            </Typography>
                        </Box>
                    </Box>
                )}

                {/* ── Author position ── */}
                {author.stance && (
                    <Box sx={{
                        p: 1.5, borderRadius: 2, mb: 2,
                        bgcolor: alpha(theme.palette.text.primary, 0.03),
                        border: '1px solid', borderColor: 'divider',
                    }}>
                        <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                            <FaUserSecret size={12} color="#8b5cf6" />
                            <SectionLabel>Author Position</SectionLabel>
                        </Stack>
                        <Typography variant="body2" fontWeight={700} fontFamily="monospace" mb={0.5}>
                            {author.label || author.stance}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                            {author.description}
                        </Typography>
                        <Stack direction="row" spacing={0.75} mt={1} flexWrap="wrap">
                            {author.is_alarming     && <Chip size="small" label="Alarmist"      sx={{ height: 18, fontSize: 9, fontFamily: 'monospace', bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b' }} />}
                            {author.is_critical     && <Chip size="small" label="Critical"      sx={{ height: 18, fontSize: 9, fontFamily: 'monospace', bgcolor: alpha('#ef4444', 0.1), color: '#ef4444' }} />}
                            {author.is_supportive   && <Chip size="small" label="Supportive"    sx={{ height: 18, fontSize: 9, fontFamily: 'monospace', bgcolor: alpha('#22c55e', 0.1), color: '#22c55e' }} />}
                            {author.is_conspiratorial && <Chip size="small" label="Conspiratorial" sx={{ height: 18, fontSize: 9, fontFamily: 'monospace', bgcolor: alpha('#ef4444', 0.1), color: '#ef4444' }} />}
                        </Stack>
                    </Box>
                )}

                {/* ── AI Opinion ── */}
                {aiOp.opinion && (
                    <Box sx={{
                        p: 1.5, borderRadius: 2, mb: 2,
                        bgcolor: alpha('#3b82f6', 0.04),
                        border: `1px solid ${alpha('#3b82f6', 0.15)}`,
                    }}>
                        <Stack direction="row" spacing={1} alignItems="center" mb={0.75}>
                            <FaMicroscope size={12} color="#3b82f6" />
                            <SectionLabel>AI Opinion</SectionLabel>
                            <Box flex={1} />
                            <Typography variant="caption" fontFamily="monospace" fontWeight={700}
                                sx={{ color: aiOp.credibility === 'acceptable' ? '#22c55e' : '#f59e0b' }}>
                                {aiOp.credibility_icon} {aiOp.credibility}
                            </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                            {aiOp.opinion}
                        </Typography>
                        {aiOp.requires_verification && (
                            <Chip size="small" label="Requires verification" icon={<FaExclamationTriangle size={8} />}
                                sx={{ mt: 1, height: 18, fontSize: 9, fontFamily: 'monospace', bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b' }} />
                        )}
                    </Box>
                )}

                {/* ── Sahel violations ── */}
                <Box sx={{
                    p: 1.5, borderRadius: 2, mb: 2,
                    bgcolor: sahel.sahel_safe
                        ? alpha('#22c55e', 0.05)
                        : alpha('#ef4444', 0.07),
                    border: `1px solid ${alpha(sahel.sahel_safe ? '#22c55e' : '#ef4444', 0.2)}`,
                }}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                        <FaGlobeAfrica size={12} color={sahel.sahel_safe ? '#22c55e' : '#ef4444'} />
                        <SectionLabel>Sahel Context</SectionLabel>
                    </Stack>
                    <Typography variant="caption" fontFamily="monospace"
                        color={sahel.sahel_safe ? '#22c55e' : '#ef4444'}>
                        {sahel.summary}
                    </Typography>
                    {sahel.violation_count > 0 && (
                        <Stack direction="row" spacing={0.5} mt={0.75} flexWrap="wrap">
                            {sahel.violation_types.map((v, i) => (
                                <Chip key={i} size="small" label={v}
                                    sx={{ height: 18, fontSize: 9, fontFamily: 'monospace',
                                        bgcolor: alpha('#ef4444', 0.1), color: '#ef4444' }} />
                            ))}
                        </Stack>
                    )}
                </Box>

                {/* ── Risk factors ── */}
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

                {/* ── Topic distribution (collapsible) ── */}
                {Object.keys(topic.topic_scores || {}).length > 0 && (
                    <Box mb={2}>
                        <Button size="small" onClick={() => setTopicOpen(!topicOpen)}
                            endIcon={topicOpen ? <FaAngleUp size={10} /> : <FaAngleDown size={10} />}
                            sx={{ fontFamily: 'monospace', fontSize: 10, mb: 1, color: 'text.secondary' }}>
                            {topicOpen ? 'Hide' : 'Show'} topic distribution
                        </Button>
                        <Collapse in={topicOpen}>
                            <TopicBars topicScores={topic.topic_scores} />
                        </Collapse>
                    </Box>
                )}

                {/* ── Toxicity breakdown (collapsible) ── */}
                {Object.keys(toxicity.categories || {}).length > 0 && (
                    <Box mb={1}>
                        <Button size="small" onClick={() => setToxOpen(!toxOpen)}
                            endIcon={toxOpen ? <FaAngleUp size={10} /> : <FaAngleDown size={10} />}
                            sx={{ fontFamily: 'monospace', fontSize: 10, mb: 1, color: 'text.secondary' }}>
                            {toxOpen ? 'Hide' : 'Show'} toxicity breakdown
                        </Button>
                        <Collapse in={toxOpen}>
                            <Stack spacing={0.75}>
                                {Object.entries(toxicity.categories).map(([cat, score]) => (
                                    <Stack key={cat} direction="row" spacing={1.5} alignItems="center">
                                        <Typography variant="caption" fontFamily="monospace" color="text.secondary"
                                            sx={{ minWidth: 110, textTransform: 'capitalize', fontSize: 10 }}>
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
                                            sx={{ minWidth: 36, textAlign: 'right', fontSize: 10 }}>
                                            {Math.round(score * 100)}%
                                        </Typography>
                                    </Stack>
                                ))}
                            </Stack>
                        </Collapse>
                    </Box>
                )}

                {/* ── Footer ── */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2}
                    sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.5 }}>
                    <Typography variant="caption" color="text.disabled" fontFamily="monospace">
                        {analysis.analyzed_at ? new Date(analysis.analyzed_at).toLocaleString() : ''}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" fontFamily="monospace">
                        {analysis.duration_seconds != null ? `${analysis.duration_seconds}s` : ''}
                        {analysis.device ? ` · ${analysis.device}` : ''}
                    </Typography>
                </Stack>
            </Box>
        </GlassCard>
    );
};

// ============================================================================
// CONTENT ROW
// ============================================================================

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
                onClick={() => onAnalyse(contentId)}
                sx={{ fontFamily: 'monospace', fontSize: 10, whiteSpace: 'nowrap', flexShrink: 0 }}
            >
                {analysis ? 'Re-analyse' : 'Analyse'}
            </Button>
        </Box>
    );
};

// ============================================================================
// LANGUAGE SELECTOR COMPONENT
// ============================================================================

const LanguageSelector = ({ value, onChange }) => (
    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel sx={{ fontFamily: 'monospace', fontSize: 12 }}>
            Language / Langue
        </InputLabel>
        <Select
            value={value}
            label="Language / Langue"
            onChange={(e) => onChange(e.target.value)}
            sx={{ fontFamily: 'monospace', fontSize: 12 }}
        >
            {LANGUAGES.map((l) => (
                <MenuItem key={l.value} value={l.value}
                    sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                    {l.label}
                </MenuItem>
            ))}
        </Select>
    </FormControl>
);

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
    const [language, setLanguage]   = useState('fr');
    const [contentId, setContentId] = useState('');
    const [sessionId, setSessionId] = useState('');
    const [results, setResults]     = useState([]);
    const [analyzingIds, setAnalyzingIds] = useState(new Set());

    // ── Content list ────────────────────────────────────────────────────────
    const { data: contentList, isLoading: loadingContent } = useQuery({
        queryKey: ['analyser-content-list'],
        queryFn: () =>
            axiosPrivate
                .get('/api/v2/scraper/content')
                .then(r => r.data?.data || [])
                .catch(() => []),
        staleTime: 30_000,
        retry: 1,
    });

    // ── Session list ────────────────────────────────────────────────────────
    const { data: sessionList, isLoading: loadingSessions } = useQuery({
        queryKey: ['analyser-session-list'],
        queryFn: () =>
            axiosPrivate
                .get('/api/v2/scraper/sessions')
                .then(r => r.data?.data || [])
                .catch(() => []),
        staleTime: 30_000,
        retry: 1,
    });

    // ── Raw text mutation ────────────────────────────────────────────────────
    const rawMutation = useMutation({
        mutationFn: (text) =>
            axiosPrivate
                .post('/api/v2/analysis/text', {
                    text,
                    language,           // ← sends selected language to backend
                    include_topic: true,
                })
                .then(r => r.data),
        onSuccess: (data) => {
            setResults(prev => [{
                text:     rawText,
                analysis: data.analysis,
                id:       Date.now(),
            }, ...prev]);
        },
    });

    // ── Content ID mutation ──────────────────────────────────────────────────
    const contentMutation = useMutation({
        mutationFn: (id) =>
            axiosPrivate
                .post(`/api/v2/analysis/content/${id}`, { language })
                .then(r => r.data),
        onSuccess: (data, id) => {
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

    // ── Session bulk mutation ────────────────────────────────────────────────
    const sessionMutation = useMutation({
        mutationFn: (id) =>
            axiosPrivate
                .post(`/api/v2/analysis/bulk/session/${id}?limit=50`, { language })
                .then(r => r.data),
    });

    // ── Flagged summary (admin) ──────────────────────────────────────────────
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

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleRawAnalyse = () => {
        if (rawText.trim().length < 10) return;
        rawMutation.mutate(rawText.trim());
    };

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
                            DISINFORMATION · HATE SPEECH · TOXICITY · SENTIMENT · SAHEL CONTEXT
                        </Typography>
                    </Box>
                </Stack>
            </Box>

            {/* Admin KPIs */}
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

                {/* ── LEFT: Input panel ── */}
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
                                    {/* Language selector */}
                                    <LanguageSelector value={language} onChange={setLanguage} />

                                    <SectionLabel>Paste or type text to analyse</SectionLabel>
                                    <TextField
                                        multiline rows={7} fullWidth
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
                                            {rawText.length} chars · {LANGUAGES.find(l => l.value === language)?.label}
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
                                    {/* Language selector */}
                                    <LanguageSelector value={language} onChange={setLanguage} />

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
                                            <Stack spacing={0.5} sx={{ maxHeight: 380, overflowY: 'auto' }}>
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
                                    {/* Language selector */}
                                    <LanguageSelector value={language} onChange={setLanguage} />

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
                                            <Stack spacing={0.5} sx={{ maxHeight: 300, overflowY: 'auto' }}>
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

                {/* ── RIGHT: Results panel ── */}
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

                    {/* Admin: recently auto-flagged */}
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