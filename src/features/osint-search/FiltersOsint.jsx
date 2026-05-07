// pages/osint/OsintFilters.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Box, Typography, Grid, Chip, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Stack, Paper, Divider,
  Switch, FormControlLabel, LinearProgress, Alert, CircularProgress,
} from "@mui/material";
import { styled, alpha, useTheme } from "@mui/material/styles";
import {
  FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaYoutube,
  FaTiktok, FaReddit, FaSearch, FaGlobe, FaExclamationTriangle, FaNewspaper,
} from "react-icons/fa";
import useAxiosPrivate from "../../utils/hooks/instance/axiosprivate.instance";
import useToast from "../../components/toast/toast.toast";

const PLT_COLORS = { facebook: "#4267B2", twitter: "#1DA1F2", linkedin: "#0077B5", instagram: "#E4405F", youtube: "#FF0000", tiktok: "#69C9D0", reddit: "#FF4500" };
const PLT_ICONS = { facebook: FaFacebook, twitter: FaTwitter, linkedin: FaLinkedin, instagram: FaInstagram, youtube: FaYoutube, tiktok: FaTiktok, reddit: FaReddit };

const COUNTRIES = [
  { code: "BF", label: "Burkina Faso" }, { code: "ML", label: "Mali" },
  { code: "NE", label: "Niger" }, { code: "SN", label: "Sénégal" },
  { code: "CI", label: "Côte d'Ivoire" }, { code: "GN", label: "Guinée" },
];
const SECTORS = ["women", "education", "health", "peace", "environment", "governance", "media", "youth"];

// ── PlatformToggle uses useTheme inside the component, not styled ──────────────
const PlatformToggleBase = styled(Box)(() => ({
  borderRadius: 8,
  padding: "8px 10px",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 700,
  fontFamily: "monospace",
  display: "flex",
  alignItems: "center",
  gap: 6,
  transition: "all 0.15s",
}));

const PlatformToggle = ({ selected, pcolor, onClick, children }) => (
  <PlatformToggleBase onClick={onClick}
    sx={{
      border: `1px solid ${selected ? pcolor : "divider"}`,
      background: selected ? alpha(pcolor, 0.1) : "transparent",
      color: selected ? pcolor : "text.disabled",
      borderColor: selected ? pcolor : "divider",
      "&:hover": { borderColor: pcolor, color: pcolor },
    }}>
    {children}
  </PlatformToggleBase>
);

export default function OsintFilters() {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const { showToast, ToastComponent } = useToast();
  const theme = useTheme();

  const [form, setForm] = useState({
    platforms: [], country: "BF", language: "", sector: "",
    minFollowers: "", minRiskScore: "", entityType: "", contentType: "",
    timeFilter: "any", flaggedOnly: false, verifiedOnly: false, tags: "", sahelContext: true,
  });
  const [filterName, setFilterName] = useState("");
  const [savedFilters, setSavedFilters] = useState([
    { id: 1, name: "Sahel — Société civile", platforms: ["facebook", "twitter"], country: "BF", active: true },
    { id: 2, name: "Désinformation BF", platforms: ["facebook"], country: "BF", active: false },
  ]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const { data: stats } = useQuery({
    queryKey: ["osint-entity-summary"],
    queryFn: async () => (await axiosPrivate.get("/api/v2/scraper/entities/stats/summary")).data?.summary,
    staleTime: 120000,
  });

  const togglePlatform = (id) =>
    setForm((f) => ({ ...f, platforms: f.platforms.includes(id) ? f.platforms.filter(p => p !== id) : [...f.platforms, id] }));

  const handlePreview = async () => {
    setPreviewLoading(true);
    try {
      const p = new URLSearchParams({ page_size: "6" });
      if (form.platforms[0]) p.append("platform", form.platforms[0]);
      if (form.entityType) p.append("entity_type", form.entityType);
      if (form.flaggedOnly) p.append("flagged", "true");
      if (form.minFollowers) p.append("min_followers", form.minFollowers);
      const res = await axiosPrivate.get(`/api/v2/scraper/entities?${p}`);
      setPreview(res.data);
    } catch { showToast({ description: "Aperçu impossible", status: "error" }); }
    finally { setPreviewLoading(false); }
  };

  const handleApply = () => {
    const p = new URLSearchParams();
    if (form.platforms.length) p.append("platform", form.platforms.join(","));
    if (form.entityType) p.append("entity_type", form.entityType);
    if (form.flaggedOnly) p.append("flagged", "true");
    if (form.minFollowers) p.append("min_followers", form.minFollowers);
    navigate(`/ai/analysis/results?${p}`);
  };

  const handleSahel = async (type) => {
    try {
      const p = new URLSearchParams({ query: form.tags || "société civile", country: form.country || "BF" });
      if (form.sector) p.append("sector", form.sector);
      await axiosPrivate.post(`/api/v2/scraper/sahel/${type}?${p}`);
      showToast({ description: "Recherche Sahel lancée", status: "success" });
      navigate("/ai/osint/results");
    } catch { showToast({ description: "Échec de la recherche Sahel", status: "error" }); }
  };

  const handleSaveFilter = () => {
    if (!filterName.trim()) return showToast({ description: "Nommez le filtre", status: "error" });
    setSavedFilters(prev => [...prev, { id: Date.now(), name: filterName, ...form, active: false }]);
    setFilterName("");
    showToast({ description: "Filtre sauvegardé", status: "success" });
  };

  const byPlatform = stats?.by_platform || [];
  const totalEntities = stats?.total || 0;

  // Reusable theme-driven styles
  const paperSx = {
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 3,
  };

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      bgcolor: theme.palette.background.default,
      color: "text.primary",
      fontSize: 13,
      "& fieldset": { borderColor: theme.palette.divider },
      "&:hover fieldset": { borderColor: theme.palette.text.disabled },
      "&.Mui-focused fieldset": { borderColor: "primary.main" },
    },
  };

  const selectSx = {
    bgcolor: theme.palette.background.default,
    color: "text.secondary",
    fontSize: 13,
    "& fieldset": { borderColor: theme.palette.divider },
    "&:hover fieldset": { borderColor: theme.palette.text.disabled },
    "&.Mui-focused fieldset": { borderColor: "primary.main" },
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", color: "text.primary" }}>

      {/* Header */}
      <Box sx={{ bgcolor: "background.paper", borderBottom: `1px solid ${theme.palette.divider}`, px: 4, py: 3 }}>
        <Chip label="FILTRES AVANCÉS" size="small"
          sx={{ bgcolor: alpha("#a78bfa", 0.1), color: "#a78bfa", border: "1px solid", borderColor: alpha("#a78bfa", 0.3), fontFamily: "monospace", fontWeight: 700, letterSpacing: 1.5, mb: 1 }} />
        <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5, fontFamily: "monospace" }}>
          Configuration des Filtres
        </Typography>
        <Typography variant="caption" color="text.disabled">
          Affinez vos recherches · Accès spécialisé Sahel/Afrique de l'Ouest
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ maxWidth: 1400, mx: "auto", p: 3 }}>

        {/* LEFT */}
        <Grid size={{ xs: 12 }} md={4}>
          <Stack spacing={2.5}>

            {/* DB Overview */}
            <Paper elevation={0} sx={{ ...paperSx, p: 2.5 }}>
              <Typography variant="caption" fontWeight={700} color="text.disabled" letterSpacing={2} fontFamily="monospace" display="block" mb={2}>
                BASE DE DONNÉES
              </Typography>
              <Grid container spacing={1.5} mb={2}>
                <Grid size={{ xs: 6 }}>
                  <Box sx={{ textAlign: "center", bgcolor: "background.default", borderRadius: 2, py: 2 }}>
                    <Typography variant="h4" fontWeight={800} color="#22d3ee" fontFamily="monospace">{totalEntities}</Typography>
                    <Typography variant="caption" color="text.disabled" fontFamily="monospace" sx={{ fontSize: 10, letterSpacing: 1 }}>ENTITÉS</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Box sx={{ textAlign: "center", bgcolor: "background.default", borderRadius: 2, py: 2 }}>
                    <Typography variant="h4" fontWeight={800} color="#f87171" fontFamily="monospace">{stats?.flagged ?? 0}</Typography>
                    <Typography variant="caption" color="text.disabled" fontFamily="monospace" sx={{ fontSize: 10, letterSpacing: 1 }}>SIGNALÉES</Typography>
                  </Box>
                </Grid>
              </Grid>
              {byPlatform.length > 0 && (
                <Stack spacing={1}>
                  <Typography variant="caption" fontWeight={700} color="text.disabled" letterSpacing={2} fontFamily="monospace" sx={{ fontSize: 9 }}>
                    PAR PLATEFORME
                  </Typography>
                  {byPlatform.map((p) => (
                    <Stack key={p._id} direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" fontFamily="monospace" sx={{ color: PLT_COLORS[p._id] || "text.disabled", width: 80, fontSize: 11 }}>
                        {p._id}
                      </Typography>
                      <LinearProgress variant="determinate"
                        value={totalEntities ? Math.min(100, (p.count / totalEntities) * 100) : 0}
                        sx={{ flex: 1, height: 3, borderRadius: 99, bgcolor: theme.palette.divider, "& .MuiLinearProgress-bar": { bgcolor: PLT_COLORS[p._id] || theme.palette.text.disabled } }}
                      />
                      <Typography variant="caption" color="text.disabled" fontFamily="monospace" sx={{ width: 28, textAlign: "right", fontSize: 10 }}>
                        {p.count}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Paper>

            {/* Sahel Shortcuts */}
            <Paper elevation={0} sx={{ ...paperSx, p: 2.5 }}>
              <Typography variant="caption" fontWeight={700} color="text.disabled" letterSpacing={2} fontFamily="monospace" display="block" mb={1}>
                RECHERCHES SAHEL
              </Typography>
              <Typography variant="caption" color="text.disabled" display="block" mb={2} sx={{ lineHeight: 1.5 }}>
                Accès rapide aux modules spécialisés Afrique de l'Ouest
              </Typography>
              <Grid container spacing={1} mb={2}>
                {[
                  { label: "Société Civile", icon: FaGlobe, color: "#22d3ee", type: "civil-society" },
                  { label: "Désinformation", icon: FaExclamationTriangle, color: "#f87171", type: "monitor-disinformation" },
                  { label: "Médias Locaux", icon: FaNewspaper, color: "#a78bfa", type: "media-coverage" },
                ].map((btn) => (
                  <Grid size={{ xs: 12 }} key={btn.type}>
                    <Button fullWidth size="small" startIcon={<btn.icon size={12} />} onClick={() => handleSahel(btn.type)}
                      sx={{ justifyContent: "flex-start", border: "1px solid", borderColor: alpha(btn.color, 0.25), color: btn.color, bgcolor: alpha(btn.color, 0.05), fontFamily: "monospace", fontWeight: 700, fontSize: 11, letterSpacing: 0.5, py: 1, "&:hover": { bgcolor: alpha(btn.color, 0.12), borderColor: btn.color } }}>
                      {btn.label}
                    </Button>
                  </Grid>
                ))}
              </Grid>
              <Divider sx={{ borderColor: theme.palette.divider, mb: 2 }} />
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: "text.disabled", fontSize: 12 }}>Pays cible</InputLabel>
                    <Select value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} label="Pays cible" sx={selectSx}>
                      {COUNTRIES.map(c => <MenuItem key={c.code} value={c.code}>{c.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: "text.disabled", fontSize: 12 }}>Secteur</InputLabel>
                    <Select value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })} label="Secteur" sx={selectSx}>
                      <MenuItem value="">Tous</MenuItem>
                      {SECTORS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth size="small" placeholder="Mot-clé ou nom d'acteur..." value={form.tags}
                    onChange={e => setForm({ ...form, tags: e.target.value })} sx={inputSx} />
                </Grid>
              </Grid>
            </Paper>

            {/* Saved Filters */}
            <Paper elevation={0} sx={{ ...paperSx, p: 2.5 }}>
              <Typography variant="caption" fontWeight={700} color="text.disabled" letterSpacing={2} fontFamily="monospace" display="block" mb={1.5}>
                FILTRES SAUVEGARDÉS
              </Typography>
              <Stack spacing={0}>
                {savedFilters.map((f) => (
                  <Stack key={f.id} direction="row" alignItems="center" spacing={1.5}
                    sx={{ py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Box flex={1}>
                      <Typography variant="caption" fontWeight={700} color="text.primary" fontFamily="monospace" display="block">{f.name}</Typography>
                      <Stack direction="row" spacing={0.5} mt={0.5} flexWrap="wrap">
                        {f.platforms?.map(p => (
                          <Typography key={p} variant="caption" sx={{ color: PLT_COLORS[p] || "text.disabled", fontSize: 10, fontFamily: "monospace" }}>{p}</Typography>
                        ))}
                        {f.country && <Typography variant="caption" sx={{ color: "text.disabled", fontSize: 10, fontFamily: "monospace" }}>{f.country}</Typography>}
                      </Stack>
                    </Box>
                    <Button size="small" variant="outlined" onClick={() => navigate("/ai/analysis/results")}
                      sx={{ fontSize: 9, fontFamily: "monospace", fontWeight: 700, borderColor: f.active ? alpha("#4ade80", 0.4) : theme.palette.divider, color: f.active ? "#4ade80" : "text.disabled", minWidth: 70, py: 0.5 }}>
                      {f.active ? "ACTIF" : "APPLIQUER"}
                    </Button>
                  </Stack>
                ))}
              </Stack>
              <Stack direction="row" spacing={1} mt={2}>
                <TextField fullWidth size="small" placeholder="Nom du filtre..." value={filterName}
                  onChange={e => setFilterName(e.target.value)} sx={inputSx} />
                <Button variant="outlined" size="small" onClick={handleSaveFilter}
                  sx={{ borderColor: alpha("#22d3ee", 0.3), color: "#22d3ee", fontFamily: "monospace", fontWeight: 700, fontSize: 11, whiteSpace: "nowrap" }}>
                  SAUV.
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </Grid>

        {/* RIGHT */}
        <Grid size={{ xs: 12 }} md={8}>
          <Stack spacing={2.5}>
            <Paper elevation={0} sx={{ ...paperSx, p: 3 }}>
              <Typography variant="caption" fontWeight={700} color="text.disabled" letterSpacing={2} fontFamily="monospace" display="block" mb={2.5}>
                CONSTRUCTION DU FILTRE
              </Typography>

              {/* Platforms */}
              <Box mb={2.5}>
                <Typography variant="caption" fontWeight={700} color="text.disabled" letterSpacing={2} fontFamily="monospace" display="block" mb={1}>
                  PLATEFORMES
                </Typography>
                <Grid container spacing={1}>
                  {Object.entries(PLT_COLORS).map(([id, color]) => {
                    const Icon = PLT_ICONS[id];
                    return (
                      <Grid size={{ xs: 6, sm: 4, md: 3 }} key={id}>
                        <PlatformToggle selected={form.platforms.includes(id) ? 1 : 0} pcolor={color} onClick={() => togglePlatform(id)}>
                          {Icon && <Icon size={12} />}{id}
                        </PlatformToggle>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>

              {/* Type filters */}
              <Grid container spacing={2} mb={2.5}>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: "text.disabled", fontSize: 12 }}>Type d'entité</InputLabel>
                    <Select value={form.entityType} onChange={e => setForm({ ...form, entityType: e.target.value })} label="Type d'entité" sx={selectSx}>
                      <MenuItem value="">Tous</MenuItem>
                      {["profile", "page", "group", "organization", "unknown"].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: "text.disabled", fontSize: 12 }}>Type de contenu</InputLabel>
                    <Select value={form.contentType} onChange={e => setForm({ ...form, contentType: e.target.value })} label="Type de contenu" sx={selectSx}>
                      <MenuItem value="">Tous</MenuItem>
                      {["post", "video", "article", "image", "story"].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: "text.disabled", fontSize: 12 }}>Période</InputLabel>
                    <Select value={form.timeFilter} onChange={e => setForm({ ...form, timeFilter: e.target.value })} label="Période" sx={selectSx}>
                      <MenuItem value="any">Toute période</MenuItem>
                      <MenuItem value="day">24 heures</MenuItem>
                      <MenuItem value="week">Cette semaine</MenuItem>
                      <MenuItem value="month">Ce mois</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 6, sm: 6 }}>
                  <TextField fullWidth size="small" label="Abonnés minimum" type="number" placeholder="Ex: 1000"
                    value={form.minFollowers} onChange={e => setForm({ ...form, minFollowers: e.target.value })}
                    InputLabelProps={{ sx: { color: "text.disabled", fontSize: 12 } }} sx={inputSx} />
                </Grid>
                <Grid size={{ xs: 6, sm: 6 }}>
                  <TextField fullWidth size="small" label="Score risque min (0-1)" type="number" placeholder="0.0 → 1.0"
                    value={form.minRiskScore} onChange={e => setForm({ ...form, minRiskScore: e.target.value })}
                    InputLabelProps={{ sx: { color: "text.disabled", fontSize: 12 } }} sx={inputSx} />
                </Grid>
              </Grid>

              {/* Toggles */}
              <Box mb={2.5}>
                <Typography variant="caption" fontWeight={700} color="text.disabled" letterSpacing={2} fontFamily="monospace" display="block" mb={1}>
                  OPTIONS
                </Typography>
                <Stack spacing={1}>
                  {[
                    { label: "Signalés uniquement", key: "flaggedOnly" },
                    { label: "Vérifiés uniquement", key: "verifiedOnly" },
                    { label: "Contexte Sahel activé", key: "sahelContext" },
                  ].map((t) => (
                    <FormControlLabel key={t.key}
                      control={<Switch size="small" checked={form[t.key]} onChange={e => setForm({ ...form, [t.key]: e.target.checked })}
                        sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#22d3ee" }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: alpha("#22d3ee", 0.4) } }}
                      />}
                      label={<Typography variant="caption" fontFamily="monospace" color={form[t.key] ? "text.primary" : "text.disabled"}>{t.label}</Typography>}
                      sx={{ m: 0 }}
                    />
                  ))}
                </Stack>
              </Box>

              <Divider sx={{ borderColor: theme.palette.divider, mb: 2.5 }} />

              <Stack direction="row" spacing={1.5}>
                <Button variant="outlined" startIcon={previewLoading ? <CircularProgress size={12} color="inherit" /> : <FaSearch size={12} />}
                  onClick={handlePreview} disabled={previewLoading}
                  sx={{ borderColor: alpha("#a78bfa", 0.3), color: "#a78bfa", fontFamily: "monospace", fontWeight: 700, fontSize: 12, "&:hover": { borderColor: "#a78bfa", bgcolor: alpha("#a78bfa", 0.08) } }}>
                  APERÇU
                </Button>
                <Button variant="contained" onClick={handleApply}
                  sx={{ background: "linear-gradient(135deg,#0891b2,#0e7490)", fontFamily: "monospace", fontWeight: 700, fontSize: 12, letterSpacing: 1, flex: 1 }}>
                  → APPLIQUER AUX RÉSULTATS
                </Button>
                <Button variant="outlined" onClick={() => setForm({ platforms: [], country: "BF", language: "", sector: "", minFollowers: "", minRiskScore: "", entityType: "", contentType: "", timeFilter: "any", flaggedOnly: false, verifiedOnly: false, tags: "", sahelContext: true })}
                  sx={{ borderColor: theme.palette.divider, color: "text.disabled", fontFamily: "monospace", fontSize: 11 }}>
                  RESET
                </Button>
              </Stack>
            </Paper>

            {/* Preview */}
            {preview && (
              <Paper elevation={0} sx={{ ...paperSx, overflow: "hidden" }}>
                <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  <Typography variant="caption" fontWeight={700} color="text.disabled" letterSpacing={2} fontFamily="monospace">
                    APERÇU — {preview.pagination?.total ?? 0} ENTITÉS TROUVÉES
                  </Typography>
                </Box>
                {preview.data?.length === 0 ? (
                  <Box p={3}><Typography variant="caption" color="text.disabled" fontFamily="monospace">Aucune entité ne correspond à ces filtres.</Typography></Box>
                ) : (
                  <Stack>
                    {preview.data?.map((entity) => (
                      <Stack key={entity._id} direction="row" alignItems="center" spacing={1.5}
                        sx={{ px: 3, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: PLT_COLORS[entity.platform] || theme.palette.divider, flexShrink: 0 }} />
                        <Box flex={1}>
                          <Typography variant="caption" fontWeight={700} color="text.primary" fontFamily="monospace">
                            {entity.name || entity.username || "Inconnu"}
                          </Typography>
                          <Stack direction="row" spacing={1} mt={0.3}>
                            <Typography variant="caption" sx={{ color: PLT_COLORS[entity.platform] || "text.disabled", fontSize: 10, fontFamily: "monospace" }}>{entity.platform}</Typography>
                            {entity.flagged && <Typography variant="caption" sx={{ color: "#f87171", fontSize: 10 }}>⚑</Typography>}
                            {entity.followers_count && <Typography variant="caption" sx={{ color: "text.disabled", fontSize: 10, fontFamily: "monospace" }}>{entity.followers_count.toLocaleString()} ab.</Typography>}
                          </Stack>
                        </Box>
                      </Stack>
                    ))}
                  </Stack>
                )}
                <Box p={2}>
                  <Button fullWidth variant="contained" onClick={handleApply}
                    sx={{ background: "linear-gradient(135deg,#0891b2,#0e7490)", fontFamily: "monospace", fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>
                    → VOIR TOUS LES RÉSULTATS
                  </Button>
                </Box>
              </Paper>
            )}
          </Stack>
        </Grid>
      </Grid>
      {ToastComponent}
    </Box>
  );
}