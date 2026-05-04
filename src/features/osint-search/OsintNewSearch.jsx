// pages/osint/OsintNewSearch.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Grid, Chip, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, IconButton, Tooltip, Stack, Paper,
  LinearProgress, Divider, Switch, FormControlLabel, CircularProgress,
  Alert, Badge,
} from "@mui/material";
import { styled, alpha, useTheme } from "@mui/material/styles";
import {
  FaSearch, FaStop, FaSave, FaFacebook, FaTwitter, FaLinkedin,
  FaInstagram, FaYoutube, FaTiktok, FaReddit,
  FaChevronDown, FaChevronUp,
} from "react-icons/fa";
import useAxiosPrivate from "../../utils/hooks/instance/axiosprivate.instance";
import useToast from "../../components/toast/toast.toast";
import useAuth from "../../utils/hooks/contexts/useAth.contexts";

// ── Styled Components ──────────────────────────────────────────────────────────

const DarkPaper = styled(Paper)(({ theme }) => ({
  background: theme.palette.background.paper,
  border: "1px solid",
  borderColor: theme.palette.divider,
  borderRadius: 12,
}));

const Terminal = styled(Box)(({ theme }) => ({
  background: theme.palette.background.default,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 10,
  overflow: "hidden",
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
}));

const TerminalHeader = styled(Box)(({ theme }) => ({
  background: theme.palette.background.paper,
  padding: "10px 16px",
  display: "flex",
  alignItems: "center",
  gap: 6,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const LogLine = styled(Box)(({ logtype, theme }) => {
  const colors = {
    info: theme.palette.text.secondary,
    result: theme.palette.info.main,
    success: theme.palette.success.main,
    error: theme.palette.error.main,
    warn: theme.palette.warning.main,
    done: theme.palette.secondary.main,
  };
  return {
    color: colors[logtype] || theme.palette.text.secondary,
    fontSize: 12,
    display: "flex",
    gap: 10,
    lineHeight: 1.7,
  };
});

const PlatformToggle = styled(Box)(({ selected, platformcolor, theme }) => ({
  border: `1px solid ${selected ? platformcolor : theme.palette.divider}`,
  borderRadius: 8,
  padding: "8px 12px",
  cursor: "pointer",
  background: selected ? alpha(platformcolor, 0.1) : "transparent",
  color: selected ? platformcolor : theme.palette.text.disabled,
  transition: "all 0.15s ease",
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  fontWeight: 600,
  "&:hover": { borderColor: platformcolor, color: platformcolor },
}));

const StatPill = styled(Paper)(({ accentcolor, theme }) => ({
  background: theme.palette.background.paper,
  border: `1px solid ${alpha(accentcolor, 0.25)}`,
  borderRadius: 8,
  padding: "12px 16px",
  textAlign: "center",
  flex: 1,
}));

const SearchButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.info.dark}, ${theme.palette.info.main})`,
  color: "#fff",
  fontWeight: 700,
  letterSpacing: 1,
  fontSize: 13,
  padding: "12px 24px",
  borderRadius: 8,
  "&:hover": {
    background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
  },
  "&:disabled": { opacity: 0.5, color: "#fff" },
}));

// ── Platform config ────────────────────────────────────────────────────────────

const PLATFORMS = [
  { id: "facebook", label: "Facebook", color: "#4267B2", icon: FaFacebook },
  { id: "twitter", label: "Twitter", color: "#1DA1F2", icon: FaTwitter },
  { id: "linkedin", label: "LinkedIn", color: "#0077B5", icon: FaLinkedin },
  { id: "instagram", label: "Instagram", color: "#E4405F", icon: FaInstagram },
  { id: "youtube", label: "YouTube", color: "#FF0000", icon: FaYoutube },
  { id: "tiktok", label: "TikTok", color: "#69C9D0", icon: FaTiktok },
  { id: "reddit", label: "Reddit", color: "#FF4500", icon: FaReddit },
];

const COUNTRIES = [
  { code: "BF", label: "Burkina Faso" }, { code: "ML", label: "Mali" },
  { code: "NE", label: "Niger" }, { code: "SN", label: "Sénégal" },
  { code: "CI", label: "Côte d'Ivoire" }, { code: "GN", label: "Guinée" },
];

const LANGUAGES = [
  { code: "fr", label: "Français" }, { code: "en", label: "English" },
  { code: "mos", label: "Mooré" }, { code: "dyu", label: "Dioula" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function OsintNewSearch() {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const { showToast, ToastComponent } = useToast();
  const theme = useTheme();        // ← accès aux tokens MUI dans le JSX
  const eventSourceRef = useRef(null);
  const logsEndRef = useRef(null);
  const { auth } = useAuth();
  const [query, setQuery] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState(["facebook", "twitter"]);
  const [maxResults, setMaxResults] = useState(10);
  const [scrapeDetails, setScrapeDetails] = useState(true);
  const [timeFilter, setTimeFilter] = useState("any");
  const [country, setCountry] = useState("BF");
  const [language, setLanguage] = useState("fr");
  const [localContext, setLocalContext] = useState(true);
  const [browser, setBrowser] = useState("chrome");
  const [headless, setHeadless] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [isStreaming, setIsStreaming] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [results, setResults] = useState({});
  const [logs, setLogs] = useState([]);
  const [isDone, setIsDone] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);
  useEffect(() => () => eventSourceRef.current?.close(), []);

  const togglePlatform = (id) =>
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );

  const addLog = (msg, type = "info") =>
    setLogs((prev) => [...prev, { msg, type, time: new Date().toLocaleTimeString("fr-FR") }]);

  const handleSearch = () => {
    if (!query.trim()) return showToast({ description: "Entrez une requête de recherche", status: "error" });
    if (!selectedPlatforms.length) return showToast({ description: "Sélectionnez au moins une plateforme", status: "error" });

    setIsStreaming(true);
    setIsDone(false);
    setResults({});
    setLogs([]);
    setProgress(0);
    setTotalResults(0);
    const token = auth?.accessToken; // get from your auth context
    const params = new URLSearchParams({
      query, platforms: selectedPlatforms.join(","),
      max_results: maxResults, scrape_details: scrapeDetails,
      time_filter: timeFilter, browser, headless, local_context: localContext,
      ...(country && { country }), ...(language && { language }),
      ...(token && { token }), // ← add token here
    });
    const url = `${import.meta.env.VITE_API_URL}/api/v2/scraper/search/stream?${params}`;
    const es = new EventSource(url,{ withCredentials: true });
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "status") {
        setStatusMsg(data.message);
        setProgress(data.progress || 0);
        addLog(data.message, "info");
      } else if (data.type === "result") {
        setResults((prev) => ({ ...prev, [data.platform]: [...(prev[data.platform] || []), data.data] }));
        setTotalResults((n) => n + 1);
        addLog(`[${data.platform.toUpperCase()}] ${data.data.title || data.data.link}`, "result");
      } else if (data.type === "platform_complete") {
        addLog(`✓ ${data.platform} — ${data.count} résultats`, "success");
      } else if (data.type === "error") {
        addLog(`✗ ${data.message}`, "error");
      } else if (data.type === "complete") {
        setProgress(100);
        setStatusMsg("Recherche terminée");
        setIsDone(true);
        setIsStreaming(false);
        es.close();
        addLog(`— TERMINÉ: ${data.total_results} résultats sur ${data.platforms_searched} plateforme(s) —`, "done");
      }
    };

    es.onerror = () => {
      addLog("Connexion interrompue", "error");
      setIsStreaming(false);
      es.close();
    };
  };

  const handleStop = () => {
    eventSourceRef.current?.close();
    setIsStreaming(false);
    addLog("Recherche arrêtée manuellement", "warn");
  };

  const handleSaveResults = async () => {
    try {
      const res = await axiosPrivate.post(
        `/api/v2/scraper/search/store-results?query=${encodeURIComponent(query)}`, results
      );
      showToast({ description: `${res.data.total_results} résultats sauvegardés`, status: "success" });
      navigate("/ai/analysis/results");
    } catch {
      showToast({ description: "Échec de la sauvegarde", status: "error" });
    }
  };

  // Couleurs accent OSINT — restent fixes (identité visuelle)
  const ACCENT = "#22d3ee";
  const ACCENT_A = (o) => alpha(ACCENT, o);

  const flatResults = Object.values(results).flat();
  const profileCount = flatResults.filter((r) => r.is_profile).length;
  const contentCount = flatResults.filter((r) => !r.is_profile).length;

  // sx réutilisable pour les Select / TextField dark-aware
  const selectSx = {
    bgcolor: "background.default",
    color: "text.secondary",
    fontSize: 13,
    fontFamily: "monospace",
    "& fieldset": { borderColor: "divider" },
    "&:hover fieldset": { borderColor: "text.disabled" },
    "&.Mui-focused fieldset": { borderColor: ACCENT },
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", color: "text.primary" }}>

      {/* ── Header ── */}
      <Box sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider", px: 4, py: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Chip
            label="OSINT"
            size="small"
            sx={{
              bgcolor: ACCENT_A(0.1),
              color: ACCENT,
              border: "1px solid",
              borderColor: ACCENT_A(0.3),
              fontWeight: 700,
              letterSpacing: 1.5,
              fontFamily: "monospace",
            }}
          />
          <Box>
            <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5, fontFamily: "monospace" }}>
              Nouvelle Recherche
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Surveillance multi-plateforme &amp; extraction de données
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Grid container spacing={3} sx={{ maxWidth: 1400, mx: "auto", p: 3 }}>

        {/* ── LEFT: Config Panel ── */}
        <Grid size={{ sm: 12, md: 4, xs: 12 }}>
          <DarkPaper elevation={0} sx={{ p: 3 }}>
            <Stack spacing={3}>

              {/* Query */}
              <Box>
                <Typography variant="caption" fontWeight={700} color="text.disabled" letterSpacing={2}
                  sx={{ fontFamily: "monospace", display: "block", mb: 1 }}>
                  REQUÊTE DE RECHERCHE
                </Typography>
                <TextField
                  fullWidth size="small"
                  placeholder="Ex: Aminata Touré militante droits femmes..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isStreaming && handleSearch()}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "background.default",
                      fontFamily: "monospace",
                      color: "text.primary",
                      fontSize: 13,
                      "& fieldset": { borderColor: "divider" },
                      "&:hover fieldset": { borderColor: "text.disabled" },
                      "&.Mui-focused fieldset": { borderColor: ACCENT },
                    },
                  }}
                />
              </Box>

              {/* Platforms */}
              <Box>
                <Typography variant="caption" fontWeight={700} color="text.disabled" letterSpacing={2}
                  sx={{ fontFamily: "monospace", display: "block", mb: 1 }}>
                  PLATEFORMES ({selectedPlatforms.length}/{PLATFORMS.length})
                </Typography>
                <Grid container spacing={1}>
                  {PLATFORMS.map((p) => (
                    <Grid size={{ xs: 6 }} key={p.id}>
                      <PlatformToggle
                        selected={selectedPlatforms.includes(p.id) ? 1 : 0}
                        platformcolor={p.color}
                        onClick={() => togglePlatform(p.id)}
                      >
                        <p.icon size={13} />
                        {p.label}
                      </PlatformToggle>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Quick Options */}
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" fontWeight={700} color="text.disabled" letterSpacing={2}
                    sx={{ fontFamily: "monospace", display: "block", mb: 1 }}>
                    MAX / PLATEFORME
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select value={maxResults} onChange={(e) => setMaxResults(e.target.value)}
                      sx={{ "& .MuiOutlinedInput-input": selectSx, "& fieldset": { borderColor: "divider" } }}>
                      {[5, 10, 20, 30, 50].map((n) => <MenuItem key={n} value={n}>{n} résultats</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" fontWeight={700} color="text.disabled" letterSpacing={2}
                    sx={{ fontFamily: "monospace", display: "block", mb: 1 }}>
                    PÉRIODE
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}
                      sx={{ "& .MuiOutlinedInput-input": selectSx, "& fieldset": { borderColor: "divider" } }}>
                      <MenuItem value="any">Toute période</MenuItem>
                      <MenuItem value="day">Dernières 24h</MenuItem>
                      <MenuItem value="week">Cette semaine</MenuItem>
                      <MenuItem value="month">Ce mois</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Toggles */}
              <Stack spacing={1}>
                {[
                  { label: "Scraping profond", val: scrapeDetails, set: setScrapeDetails },
                  { label: "Contexte Sahel", val: localContext, set: setLocalContext },
                  { label: "Mode sans tête", val: headless, set: setHeadless },
                ].map((t) => (
                  <FormControlLabel
                    key={t.label}
                    control={
                      <Switch size="small" checked={t.val} onChange={(e) => t.set(e.target.checked)}
                        sx={{
                          "& .MuiSwitch-switchBase.Mui-checked": { color: ACCENT },
                          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: ACCENT_A(0.4) },
                        }}
                      />
                    }
                    label={
                      <Typography variant="caption" fontFamily="monospace" color={t.val ? "text.primary" : "text.disabled"}>
                        {t.label}
                      </Typography>
                    }
                    sx={{ m: 0 }}
                  />
                ))}
              </Stack>

              {/* Advanced */}
              <Box>
                <Button
                  size="small" fullWidth
                  endIcon={showAdvanced ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  sx={{ color: "text.disabled", fontFamily: "monospace", fontSize: 11, letterSpacing: 1, justifyContent: "space-between", px: 0 }}
                >
                  OPTIONS AVANCÉES
                </Button>
                {showAdvanced && (
                  <Stack spacing={1.5} mt={2} p={2}
                    sx={{ bgcolor: "background.default", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 6 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel sx={{ color: "text.disabled", fontSize: 12 }}>Pays</InputLabel>
                          <Select value={country} onChange={(e) => setCountry(e.target.value)} label="Pays"
                            sx={{ bgcolor: "background.default", color: "text.secondary", fontSize: 12, "& fieldset": { borderColor: "divider" } }}>
                            <MenuItem value="">Aucun</MenuItem>
                            {COUNTRIES.map((c) => <MenuItem key={c.code} value={c.code}>{c.label}</MenuItem>)}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel sx={{ color: "text.disabled", fontSize: 12 }}>Langue</InputLabel>
                          <Select value={language} onChange={(e) => setLanguage(e.target.value)} label="Langue"
                            sx={{ bgcolor: "background.default", color: "text.secondary", fontSize: 12, "& fieldset": { borderColor: "divider" } }}>
                            <MenuItem value="">Toutes</MenuItem>
                            {LANGUAGES.map((l) => <MenuItem key={l.code} value={l.code}>{l.label}</MenuItem>)}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ color: "text.disabled", fontSize: 12 }}>Navigateur</InputLabel>
                      <Select value={browser} onChange={(e) => setBrowser(e.target.value)} label="Navigateur"
                        sx={{ bgcolor: "background.default", color: "text.secondary", fontSize: 12, "& fieldset": { borderColor: "divider" } }}>
                        {["chrome", "firefox", "edge", "auto"].map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Stack>
                )}
              </Box>

              <Divider sx={{ borderColor: "divider" }} />

              {/* CTA */}
              <Stack spacing={1.5}>
                {!isStreaming ? (
                  <SearchButton fullWidth startIcon={<FaSearch />} onClick={handleSearch} disabled={!query.trim()}>
                    LANCER LA RECHERCHE
                  </SearchButton>
                ) : (
                  <Button fullWidth variant="outlined" startIcon={<FaStop />} onClick={handleStop}
                    sx={{
                      borderColor: "error.main",
                      color: "error.light",
                      bgcolor: alpha(theme.palette.error.main, 0.08),
                      "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.16) },
                      fontFamily: "monospace",
                      fontWeight: 700,
                    }}>
                    ARRÊTER
                  </Button>
                )}
                {isDone && totalResults > 0 && (
                  <Button fullWidth variant="outlined" startIcon={<FaSave />} onClick={handleSaveResults}
                    sx={{
                      borderColor: alpha(theme.palette.success.main, 0.4),
                      color: "success.main",
                      bgcolor: alpha(theme.palette.success.main, 0.07),
                      "&:hover": { bgcolor: alpha(theme.palette.success.main, 0.14) },
                      fontFamily: "monospace",
                      fontWeight: 700,
                    }}>
                    SAUVEGARDER ({totalResults})
                  </Button>
                )}
              </Stack>
            </Stack>
          </DarkPaper>
        </Grid>

        {/* ── RIGHT: Live Feed ── */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={2.5}>

            {/* Progress */}
            <DarkPaper elevation={0} sx={{ p: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                  {statusMsg || "En attente de lancement..."}
                </Typography>
                <Typography variant="caption" fontWeight={700} sx={{ color: ACCENT, fontFamily: "monospace" }}>
                  {progress}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 4, borderRadius: 99,
                  bgcolor: "divider",
                  "& .MuiLinearProgress-bar": {
                    background: `linear-gradient(90deg, #0891b2, ${ACCENT})`,
                    borderRadius: 99,
                  },
                }}
              />
            </DarkPaper>

            {/* Stats Pills */}
            <Stack direction="row" display="flex" flexWrap="wrap" gap={2} spacing={1.5}>
              {[
                { label: "Résultats", val: totalResults, color: ACCENT },
                { label: "Plateformes", val: Object.keys(results).length, color: "#a78bfa" },
                { label: "Profils", val: profileCount, color: theme.palette.success.main },
                { label: "Contenus", val: contentCount, color: theme.palette.warning.main },
              ].map((st) => (
                <StatPill key={st.label} elevation={0} accentcolor={st.color}>
                  <Typography variant="h5" fontWeight={800} sx={{ color: st.color, fontFamily: "monospace" }}>
                    {st.val}
                  </Typography>
                  <Typography variant="caption" color="text.disabled" letterSpacing={1}
                    fontFamily="monospace" display="block" mt={0.5}>
                    {st.label}
                  </Typography>
                </StatPill>
              ))}
            </Stack>

            {/* Terminal */}
            <Terminal>
              <TerminalHeader>
                {["error.main", "warning.main", "success.main"].map((c) => (
                  <Box key={c} sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: c, opacity: 0.7 }} />
                ))}
                <Typography variant="caption" color="text.disabled" fontFamily="monospace"
                  letterSpacing={2} ml={1} flex={1}>
                  OSINT_TERMINAL — LOG EN DIRECT
                </Typography>
                {isStreaming && (
                  <Box sx={{
                    width: 8, height: 8, borderRadius: "50%", bgcolor: "success.main",
                    animation: "pulse 1s infinite"
                  }} />
                )}
              </TerminalHeader>
              <Box sx={{ p: 2, maxHeight: 280, overflowY: "auto" }}>
                {logs.length === 0 ? (
                  <Typography variant="caption" color="text.disabled" fontFamily="monospace"
                    sx={{ fontStyle: "italic" }}>
                    Prêt. Lancez une recherche pour voir les logs...
                  </Typography>
                ) : (
                  <Stack spacing={0.3}>
                    {logs.map((log, i) => (
                      <LogLine key={i} logtype={log.type}>
                        <Box component="span" sx={{ color: "text.disabled", minWidth: 70, fontFamily: "monospace", fontSize: 11 }}>
                          {log.time}
                        </Box>
                        <Box component="span" sx={{ fontFamily: "monospace", fontSize: 12 }}>{log.msg}</Box>
                      </LogLine>
                    ))}
                    <div ref={logsEndRef} />
                  </Stack>
                )}
              </Box>
            </Terminal>

            {/* Results Preview */}
            {totalResults > 0 && (
              <DarkPaper elevation={0} sx={{ overflow: "hidden" }}>
                <Box sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                  <Typography variant="caption" fontWeight={700} color="text.disabled"
                    letterSpacing={2} fontFamily="monospace">
                    APERÇU — {totalResults} RÉSULTATS
                  </Typography>
                </Box>
                <Box sx={{ maxHeight: 280, overflowY: "auto" }}>
                  {Object.entries(results).map(([platform, items]) =>
                    items.slice(0, 3).map((item, i) => {
                      const plt = PLATFORMS.find((p) => p.id === platform);
                      return (
                        <Box key={`${platform}-${i}`}
                          sx={{
                            display: "flex", alignItems: "center", gap: 1.5, px: 2.5, py: 1.2,
                            borderBottom: "1px solid", borderColor: "background.default"
                          }}>
                          <Box sx={{
                            width: 8, height: 8, borderRadius: "50%",
                            bgcolor: plt?.color || "text.disabled", flexShrink: 0
                          }} />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="caption" color="text.primary" display="block"
                              noWrap fontFamily="monospace">
                              {item.title || item.link}
                            </Typography>
                            <Stack direction="row" spacing={1} mt={0.3}>
                              <Typography variant="caption"
                                sx={{ color: plt?.color || "text.secondary", fontSize: 10, fontFamily: "monospace" }}>
                                {platform}
                              </Typography>
                              {item.is_profile && (
                                <Chip label="PROFIL" size="small"
                                  sx={{
                                    height: 16, fontSize: 9,
                                    bgcolor: alpha(theme.palette.success.main, 0.1),
                                    color: "success.main",
                                    fontFamily: "monospace", fontWeight: 700
                                  }} />
                              )}
                            </Stack>
                          </Box>
                        </Box>
                      );
                    })
                  )}
                  {totalResults > 9 && (
                    <Box sx={{ textAlign: "center", py: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
                      <Typography variant="caption" color="text.disabled" fontFamily="monospace">
                        +{totalResults - 9} résultats supplémentaires — sauvegardez pour tout voir
                      </Typography>
                    </Box>
                  )}
                </Box>
              </DarkPaper>
            )}
          </Stack>
        </Grid>
      </Grid>
      {ToastComponent}
    </Box>
  );
}