// pages/osint/OsintResults.jsx
import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box, Typography, Grid, Chip, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, IconButton, Tooltip, Stack, Paper, Card,
  CardContent, CardActions, Avatar, Badge, Tab, Tabs, Pagination,
  CircularProgress, Alert, Divider,
} from "@mui/material";
import { styled, alpha, useTheme } from "@mui/material/styles";
import {
  FaEye, FaFlag, FaTrash, FaSearch, FaFacebook, FaTwitter, FaLinkedin,
  FaInstagram, FaYoutube, FaTiktok, FaReddit, FaSync, FaPlus,
  FaNetworkWired, FaDatabase, FaHistory, FaExclamationTriangle,
} from "react-icons/fa";
import useAxiosPrivate from "../../utils/hooks/instance/axiosprivate.instance";
import useToast from "../../components/toast/toast.toast";
import CustomModal from "../../components/modal/Custome.modal";
import { AdminRoutes } from "../../constants/routes.constant";

// ── Helpers ────────────────────────────────────────────────────────────────────

const PLT_COLORS = { facebook: "#4267B2", twitter: "#1DA1F2", linkedin: "#0077B5", instagram: "#E4405F", youtube: "#FF0000", tiktok: "#69C9D0", reddit: "#FF4500" };
const PLT_ICONS = { facebook: FaFacebook, twitter: FaTwitter, linkedin: FaLinkedin, instagram: FaInstagram, youtube: FaYoutube, tiktok: FaTiktok, reddit: FaReddit };

const PlatformIcon = ({ platform, size = 14 }) => {
  const Icon = PLT_ICONS[platform] || FaNetworkWired;
  return <Icon size={size} color={PLT_COLORS[platform] || "#64748b"} />;
};

const PlatformChip = ({ platform }) => (
  <Chip
    icon={<PlatformIcon platform={platform} size={11} />}
    label={platform} size="small"
    sx={{ fontSize: 10, height: 20, fontFamily: "monospace", fontWeight: 700, color: PLT_COLORS[platform] || "#64748b", bgcolor: alpha(PLT_COLORS[platform] || "#64748b", 0.1), border: "1px solid", borderColor: alpha(PLT_COLORS[platform] || "#64748b", 0.3) }}
  />
);

const RiskChip = ({ score }) => {
  if (!score || score <= 0) return null;
  const color = score >= 0.7 ? "#f87171" : score >= 0.4 ? "#fbbf24" : "#4ade80";
  return (
    <Chip label={`Risque ${(score * 100).toFixed(0)}%`} size="small"
      sx={{ fontSize: 10, height: 20, fontFamily: "monospace", color, bgcolor: alpha(color, 0.1), border: "1px solid", borderColor: alpha(color, 0.3) }} />
  );
};

const formatDate = (d) => {
  if (!d || typeof d === "object") return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};

const safeStr = (val, fallback = "—") => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string" || typeof val === "number") return val;
  return fallback;
};

const safeNum = (val, fallback = 0) => {
  if (val === null || val === undefined) return fallback;
  const n = Number(val);
  return isNaN(n) ? fallback : n;
};

const safeArray = (val) => {
  if (!Array.isArray(val)) return [];
  return val.filter((item) => typeof item === "string" || typeof item === "number");
};

// ── Styled Tabs ────────────────────────────────────────────────────────────────

const StyledTabs = styled(Tabs)(() => ({
  "& .MuiTabs-indicator": { backgroundColor: "#22d3ee", height: 2 },
  "& .MuiTab-root": { color: "#475569", fontFamily: "monospace", fontWeight: 700, letterSpacing: 2, fontSize: 11, minHeight: 48 },
  "& .Mui-selected": { color: "#22d3ee !important" },
}));

// ── Entity Card ────────────────────────────────────────────────────────────────

const EntityCard = ({ entity, onView, onFlag, onDelete }) => {
  const theme = useTheme();
  return (
    <Card elevation={0} sx={{
      position: "relative", height: "100%",
      background: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 3,
      transition: "border-color 0.2s, transform 0.15s",
      "&:hover": { borderColor: alpha("#22d3ee", 0.3), transform: "translateY(-1px)" },
    }}>
      {entity.flagged && (
        <Chip label="⚑ SIGNALÉ" size="small"
          sx={{ position: "absolute", top: 12, right: 12, zIndex: 1, fontSize: 9, height: 20, fontFamily: "monospace", fontWeight: 700, bgcolor: alpha("#f87171", 0.15), color: "#f87171", border: "1px solid", borderColor: alpha("#f87171", 0.3) }} />
      )}
      <CardContent sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start" mb={1.5}>
          <Badge color={entity.is_verified ? "success" : "default"} variant="dot" overlap="circular" anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
            <Avatar src={entity.profile_image_url}
              sx={{ width: 44, height: 44, border: "2px solid", borderColor: PLT_COLORS[entity.platform] || theme.palette.divider, bgcolor: alpha(PLT_COLORS[entity.platform] || theme.palette.divider, 0.2) }}>
              <PlatformIcon platform={entity.platform} size={18} />
            </Avatar>
          </Badge>
          <Box flex={1} minWidth={0}>
            <Typography variant="subtitle2" fontWeight={700} color="text.primary" noWrap fontFamily="monospace">
              {safeStr(entity.name || entity.username, "Inconnu")}
            </Typography>
            <Typography variant="caption" color="text.disabled" fontFamily="monospace">
              @{safeStr(entity.username)}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={0.7} flexWrap="wrap" mb={1.5} useFlexGap>
          <PlatformChip platform={entity.platform} />
          {entity.entity_type && typeof entity.entity_type === "string" && (
            <Chip label={entity.entity_type} size="small" sx={{ fontSize: 10, height: 20, fontFamily: "monospace", color: "text.secondary", bgcolor: theme.palette.action.hover }} />
          )}
          {entity.is_verified && (
            <Chip label="VÉRIFIÉ" size="small" sx={{ fontSize: 10, height: 20, fontFamily: "monospace", color: "#4ade80", bgcolor: alpha("#4ade80", 0.1) }} />
          )}
        </Stack>
        <Typography variant="caption" color="text.secondary" display="block"
          sx={{ lineHeight: 1.5, mb: 1, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {safeStr(entity.bio, "Pas de description")}
        </Typography>
        {entity.followers_count != null && typeof entity.followers_count === "number" && (
          <Typography variant="caption" color="text.disabled" fontFamily="monospace">
            {entity.followers_count.toLocaleString()} abonnés
          </Typography>
        )}
      </CardContent>
      <Divider sx={{ borderColor: theme.palette.divider }} />
      <CardActions sx={{ px: 1.5, py: 1, gap: 0.5 }}>
        <Tooltip title="Voir détails">
          <IconButton size="small" onClick={onView} sx={{ color: "#22d3ee", "&:hover": { bgcolor: alpha("#22d3ee", 0.1) } }}><FaEye size={13} /></IconButton>
        </Tooltip>
        <Tooltip title={entity.flagged ? "Retirer signalement" : "Signaler"}>
          <IconButton size="small" onClick={onFlag} sx={{ color: entity.flagged ? "#f87171" : "#fbbf24", "&:hover": { bgcolor: alpha(entity.flagged ? "#f87171" : "#fbbf24", 0.1) } }}><FaFlag size={13} /></IconButton>
        </Tooltip>
        <Tooltip title="Supprimer">
          <IconButton size="small" onClick={onDelete} sx={{ color: "text.disabled", "&:hover": { bgcolor: alpha("#f87171", 0.1), color: "#f87171" } }}><FaTrash size={13} /></IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

// ── Content Card ───────────────────────────────────────────────────────────────

const ContentCard = ({ content, onView, onFlag, onDelete }) => {
  const theme = useTheme();
  return (
    <Card elevation={0} sx={{
      position: "relative", height: "100%",
      background: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 3,
      transition: "border-color 0.2s, transform 0.15s",
      "&:hover": { borderColor: alpha("#22d3ee", 0.3), transform: "translateY(-1px)" },
    }}>
      {content.flagged && (
        <Chip label="⚑ SIGNALÉ" size="small"
          sx={{ position: "absolute", top: 12, right: 12, zIndex: 1, fontSize: 9, height: 20, fontFamily: "monospace", fontWeight: 700, bgcolor: alpha("#f87171", 0.15), color: "#f87171", border: "1px solid", borderColor: alpha("#f87171", 0.3) }} />
      )}
      <CardContent sx={{ pb: 1 }}>
        <Stack direction="row" spacing={0.7} flexWrap="wrap" mb={1.5} useFlexGap>
          <PlatformChip platform={content.platform} />
          {content.content_type && typeof content.content_type === "string" && (
            <Chip label={content.content_type} size="small" sx={{ fontSize: 10, height: 20, fontFamily: "monospace", color: "text.secondary", bgcolor: theme.palette.action.hover }} />
          )}
          <RiskChip score={content.risk_score} />
        </Stack>
        <Typography variant="subtitle2" fontWeight={700} color="text.primary" noWrap fontFamily="monospace" mb={0.75}>
          {safeStr(content.title, "Sans titre")}
        </Typography>
        <Typography variant="caption" color="text.secondary"
          sx={{ lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {safeStr(content.text || content.description, "Pas de contenu")}
        </Typography>
        <Typography variant="caption" color="text.disabled" fontFamily="monospace" display="block" mt={1}>
          {formatDate(content.scraped_at || content.published_at)}
        </Typography>
      </CardContent>
      <Divider sx={{ borderColor: theme.palette.divider }} />
      <CardActions sx={{ px: 1.5, py: 1, gap: 0.5 }}>
        <Tooltip title="Voir détails">
          <IconButton size="small" onClick={onView} sx={{ color: "#22d3ee", "&:hover": { bgcolor: alpha("#22d3ee", 0.1) } }}><FaEye size={13} /></IconButton>
        </Tooltip>
        <Tooltip title={content.flagged ? "Retirer signalement" : "Signaler"}>
          <IconButton size="small" onClick={onFlag} sx={{ color: content.flagged ? "#f87171" : "#fbbf24", "&:hover": { bgcolor: alpha(content.flagged ? "#f87171" : "#fbbf24", 0.1) } }}><FaFlag size={13} /></IconButton>
        </Tooltip>
        <Tooltip title="Supprimer">
          <IconButton size="small" onClick={onDelete} sx={{ color: "text.disabled", "&:hover": { bgcolor: alpha("#f87171", 0.1), color: "#f87171" } }}><FaTrash size={13} /></IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

// ── Session Card ───────────────────────────────────────────────────────────────

const SESSION_STATUS_COLOR = { completed: "#4ade80", running: "#22d3ee", failed: "#f87171" };

const SessionCard = ({ session, onView, onDelete }) => {
  const theme = useTheme();
  const status = safeStr(session?.status, "completed");
  const sc = SESSION_STATUS_COLOR[status] || "#64748b";
  const query = safeStr(session?.query, "—");
  const searchType = safeStr(session?.search_type, "standard");
  const createdAt = formatDate(session?.created_at || session?.started_at);
  const entityCount = safeNum(session?.entity_count ?? session?.entities_found);
  const contentCount = safeNum(session?.content_count ?? session?.content_found);
  const durationRaw = session?.duration_seconds;
  const duration = (typeof durationRaw === "number") ? `${Math.round(durationRaw)}s` : "—";
  const platforms = safeArray(session?.platforms);

  return (
    <Card elevation={0} sx={{
      height: "100%",
      background: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 3,
      transition: "border-color 0.2s, transform 0.15s",
      "&:hover": { borderColor: alpha("#22d3ee", 0.3), transform: "translateY(-1px)" },
    }}>
      <CardContent sx={{ pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box flex={1} mr={1}>
            <Typography variant="subtitle2" fontWeight={700} color="text.primary" noWrap fontFamily="monospace">
              &ldquo;{query}&rdquo;
            </Typography>
            <Typography variant="caption" color="text.disabled" fontFamily="monospace">
              {searchType} · {createdAt}
            </Typography>
          </Box>
          <Chip label={status}  size="small"
            sx={{flex:1, fontSize: 10, height: 20, fontFamily: "monospace", fontWeight: 700, color: sc, bgcolor: alpha(sc, 0.1), border: "1px solid", borderColor: alpha(sc, 0.3) }} />
        </Stack>
        <Grid container spacing={1} mb={1.5}>
          {[
            { label: "Entités", val: entityCount, color: "#22d3ee" },
            { label: "Contenus", val: contentCount, color: "#a78bfa" },
            { label: "Durée", val: duration, color: "#fbbf24" },
          ].map((st) => (
            <Grid size={{ xs: 4 }} key={st.label}>
              <Box sx={{ textAlign: "center", bgcolor: theme.palette.action.hover, borderRadius: 1.5, py: 1 }}>
                <Typography variant="subtitle2" fontWeight={800} color={st.color} fontFamily="monospace">{st.val}</Typography>
                <Typography variant="caption" color="text.disabled" fontFamily="monospace" sx={{ fontSize: 9, letterSpacing: 1 }}>{st.label}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
        {platforms.length > 0 && (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {platforms.map((p) => <PlatformChip key={p} platform={p} />)}
          </Stack>
        )}
      </CardContent>
      <Divider sx={{ borderColor: theme.palette.divider }} />
      <CardActions sx={{ px: 1.5, py: 1, gap: 0.5 }}>
        <Tooltip title="Voir détails">
          <IconButton size="small" onClick={onView} sx={{ color: "#22d3ee", "&:hover": { bgcolor: alpha("#22d3ee", 0.1) } }}><FaEye size={13} /></IconButton>
        </Tooltip>
        <Tooltip title="Supprimer">
          <IconButton size="small" onClick={onDelete} sx={{ color: "text.disabled", "&:hover": { bgcolor: alpha("#f87171", 0.1), color: "#f87171" } }}><FaTrash size={13} /></IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

const TABS = ["entities", "content", "sessions"];
const TABMETA = {
  entities: { label: "ENTITÉS", icon: FaNetworkWired },
  content: { label: "CONTENUS", icon: FaDatabase },
  sessions: { label: "SESSIONS", icon: FaHistory },
};

export default function OsintResults() {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();
  const { showToast, ToastComponent } = useToast();
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState("entities");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("");
  const [flagged, setFlagged] = useState("");
  const [contentType, setContentType] = useState("");
  const [sessionStatus, setSessionStatus] = useState("");
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["osint-stats"],
    queryFn: async () => (await axiosPrivate.get("/api/v2/scraper/dashboard/stats")).data?.stats,
    staleTime: 1000 * 60 * 5,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    refetchOnWindowFocus: false,
  });

  const buildParams = useCallback(() => {
    const p = new URLSearchParams({ page: page.toString(), page_size: "12" });
    if (search) p.append("search", search);
    if (platform) p.append("platform", platform);
    if (flagged) p.append("flagged", flagged);
    if (activeTab === "content" && contentType) p.append("content_type", contentType);
    if (activeTab === "sessions" && sessionStatus) p.append("status", sessionStatus);
    return p.toString();
  }, [page, search, platform, flagged, contentType, sessionStatus, activeTab]);

  const endpoints = {
    entities: "/api/v2/scraper/entities",
    content: "/api/v2/scraper/content",
    sessions: "/api/v2/scraper/sessions",
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["osint-results", activeTab, page, search, platform, flagged, contentType, sessionStatus],
    queryFn: async () => (await axiosPrivate.get(`${endpoints[activeTab]}?${buildParams()}`)).data,
    staleTime: 30000,
  });

  const handleTabChange = (_, newTab) => { setActiveTab(newTab); setPage(1); setSearch(""); setPlatform(""); setFlagged(""); };
  const resetFilters = () => { setSearch(""); setPlatform(""); setFlagged(""); setContentType(""); setSessionStatus(""); setPage(1); };

  const handleFlag = useCallback(async (item, type) => {
    const ep = type === "content" ? `/api/v2/scraper/content/${item._id}/flag` : `/api/v2/scraper/entities/${item._id}/flag`;
    try {
      await axiosPrivate.patch(ep, { flagged: !item.flagged });
      showToast({ description: item.flagged ? "Signal retiré" : "Signalé avec succès", status: "success" });
      refetch(); queryClient.invalidateQueries(["osint-stats"]);
    } catch { showToast({ description: "Erreur lors du signalement", status: "error" }); }
  }, [axiosPrivate, refetch, queryClient, showToast]);

  const handleDeleteClick = (item) => { setSelectedItem(item); setDeleteModal(true); };

  const confirmDelete = async () => {
    if (!selectedItem) return;
    setIsDeleting(true);
    const ep = { entities: `/api/v2/scraper/entities/${selectedItem._id}`, content: `/api/v2/scraper/content/${selectedItem._id}`, sessions: `/api/v2/scraper/sessions/${selectedItem._id}` }[activeTab];
    try {
      await axiosPrivate.delete(ep);
      showToast({ description: "Supprimé avec succès", status: "success" });
      refetch(); queryClient.invalidateQueries(["osint-stats"]);
      setDeleteModal(false);
    } catch { showToast({ description: "Erreur lors de la suppression", status: "error" }); }
    finally { setIsDeleting(false); }
  };

  const totals = stats?.totals || {};
  const items = data?.data || [];
  const pagination = data?.pagination || {};
  const deleteLabel = selectedItem ? safeStr(selectedItem.name || selectedItem.title || selectedItem.query, "cet élément") : "cet élément";

  // Reusable filter input/select styles
  const filterInputSx = {
    "& .MuiOutlinedInput-root": {
      bgcolor: theme.palette.background.paper,
      color: "text.primary",
      fontSize: 13,
      "& fieldset": { borderColor: theme.palette.divider },
      "&:hover fieldset": { borderColor: theme.palette.text.disabled },
      "&.Mui-focused fieldset": { borderColor: "primary.main" },
    },
  };

  const filterSelectSx = {
    bgcolor: theme.palette.background.paper,
    color: "text.secondary",
    fontSize: 13,
    "& fieldset": { borderColor: theme.palette.divider },
    "&:hover fieldset": { borderColor: theme.palette.text.disabled },
    "&.Mui-focused fieldset": { borderColor: "primary.main" },
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", color: "text.primary" }}>

      {/* Header */}
      <Box sx={{ bgcolor: "background.paper", borderBottom: `1px solid ${theme.palette.divider}`, px: 2, py: 3 }}>
        <Stack direction={{ md: "row", xs: "column" }} justifyContent="space-between" alignItems="flex-start" mb={2.5}>
          <Box>
            <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5, fontFamily: "monospace" }}>
              Résultats OSINT
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Entités · Contenus · Sessions collectées
            </Typography>
          </Box>
          <Stack direction="row" sx={{display:"flex", justifyContent:{md:"right", sx:"space-between"}}} spacing={1} mt={{md:0,sm:2, xs:3}}>
            <Tooltip title="Actualiser">
              <IconButton size="small" onClick={() => { queryClient.invalidateQueries(["osint-stats"]); refetch(); }}
                sx={{ color: "text.disabled", border: `1px solid ${theme.palette.divider}`, borderRadius: 2, "&:hover": { color: "#22d3ee", borderColor: "#22d3ee" } }}>
                <FaSync size={13} />
              </IconButton>
            </Tooltip>
            <Button variant="contained" startIcon={<FaPlus size={12} />} onClick={() => navigate(`/ai/${AdminRoutes.Analysis.New}`)}
              sx={{ background: "linear-gradient(135deg, #0891b2, #0e7490)", fontFamily: "monospace", fontWeight: 700, fontSize: 12, letterSpacing: 1, borderRadius: 2 }}>
              NOUVELLE RECHERCHE
            </Button>
          </Stack>
        </Stack>

        {/* Global Stats */}
        <Stack direction="row" display="flex" flexWrap="wrap" gap={3} alignContent="center" spacing={1.5}>
          {[
            { label: "Entités", val: totals.entities, color: "#22d3ee", icon: FaNetworkWired },
            { label: "Contenus", val: totals.content, color: "#a78bfa", icon: FaDatabase },
            { label: "Sessions", val: totals.sessions, color: "#4ade80", icon: FaHistory },
            { label: "Entités signalées", val: totals.flagged_entities, color: "#f87171", icon: FaExclamationTriangle },
            { label: "Contenus signalés", val: totals.flagged_content, color: "#fbbf24", icon: FaFlag },
          ].map((st) => (
            <Paper key={st.label} elevation={0}
              sx={{ background: theme.palette.background.paper, border: `1px solid ${alpha(st.color, 0.2)}`, borderRadius: 2.5, px: 2.5, py: 2, textAlign: "center", flex: 1 }}>
              <st.icon size={12} color={st.color} style={{ marginBottom: 4 }} />
              <Typography variant="h5" fontWeight={800} color={st.color} fontFamily="monospace">{safeNum(st.val)}</Typography>
              <Typography variant="caption" color="text.disabled" fontFamily="monospace" letterSpacing={0.5} display="block" mt={0.5} sx={{ fontSize: 10 }}>
                {st.label}
              </Typography>
            </Paper>
          ))}
        </Stack>
      </Box>

      {/* Tabs */}
      <Box sx={{ bgcolor: "background.paper", borderBottom: `1px solid ${theme.palette.divider}`, px: 2 }}>
        <StyledTabs value={activeTab} onChange={handleTabChange}>
          {TABS.map((tab) => (
            <Tab key={tab} value={tab}
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <span>{TABMETA[tab].label}</span>
                  <Chip
                    label={safeNum(tab === "entities" ? totals.entities : tab === "content" ? totals.content : totals.sessions)}
                    size="small"
                    sx={{ height: 18, fontSize: 10, fontFamily: "monospace", bgcolor: activeTab === tab ? alpha("#22d3ee", 0.15) : theme.palette.action.hover, color: activeTab === tab ? "#22d3ee" : "text.disabled" }}
                  />
                </Stack>
              }
            />
          ))}
        </StyledTabs>
      </Box>

      <Box sx={{ maxWidth: 1400, mx: "auto", px: {md:2, xs:1}, py: 3 }}>

        {/* Filters */}
        <Stack direction="row" spacing={1.5} mb={3} flexWrap="wrap" useFlexGap>
          <TextField size="small" placeholder="Rechercher..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            InputProps={{ startAdornment: <FaSearch size={12} color={theme.palette.text.disabled} style={{ marginRight: 8 }} /> }}
            sx={{ minWidth: 220, ...filterInputSx }}
          />
          {activeTab !== "sessions" && (
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel sx={{ color: "text.disabled", fontSize: 13 }}>Plateforme</InputLabel>
              <Select value={platform} onChange={(e) => { setPlatform(e.target.value); setPage(1); }} label="Plateforme" sx={filterSelectSx}>
                <MenuItem value="">Toutes</MenuItem>
                {Object.keys(PLT_COLORS).map((p) => (
                  <MenuItem key={p} value={p}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PlatformIcon platform={p} size={12} />
                      <span>{p}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {activeTab !== "sessions" && (
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel sx={{ color: "text.disabled", fontSize: 13 }}>Signalé</InputLabel>
              <Select value={flagged} onChange={(e) => { setFlagged(e.target.value); setPage(1); }} label="Signalé" sx={filterSelectSx}>
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="true">Signalés</MenuItem>
                <MenuItem value="false">Non signalés</MenuItem>
              </Select>
            </FormControl>
          )}
          {activeTab === "content" && (
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel sx={{ color: "text.disabled", fontSize: 13 }}>Type</InputLabel>
              <Select value={contentType} onChange={(e) => { setContentType(e.target.value); setPage(1); }} label="Type" sx={filterSelectSx}>
                <MenuItem value="">Tous</MenuItem>
                {["post", "video", "article", "image", "story"].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
          )}
          {activeTab === "sessions" && (
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel sx={{ color: "text.disabled", fontSize: 13 }}>Statut</InputLabel>
              <Select value={sessionStatus} onChange={(e) => { setSessionStatus(e.target.value); setPage(1); }} label="Statut" sx={filterSelectSx}>
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="completed">Complété</MenuItem>
                <MenuItem value="running">En cours</MenuItem>
                <MenuItem value="failed">Échoué</MenuItem>
              </Select>
            </FormControl>
          )}
          <Button size="small" variant="outlined" onClick={resetFilters}
            sx={{ borderColor: theme.palette.divider, color: "text.disabled", fontFamily: "monospace", fontSize: 11, "&:hover": { borderColor: "text.disabled" } }}>
            ✕ RESET
          </Button>
        </Stack>

        {/* Grid */}
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={8}><CircularProgress size={36} sx={{ color: "#22d3ee" }} /></Box>
        ) : items.length === 0 ? (
          <Alert severity="info" sx={{ bgcolor: alpha("#22d3ee", 0.05), color: "text.secondary", border: "1px solid", borderColor: alpha("#22d3ee", 0.2), fontFamily: "monospace" }}>
            Aucun résultat trouvé pour ces filtres
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {activeTab === "entities" && items.map((e) => (
              <Grid size={{ md: 4, sm: 6, xs: 12 }} key={e._id}>
                <EntityCard entity={e}
                  onView={() => navigate(`/ai/analysis/entites/${e._id}`)}
                  onFlag={() => handleFlag(e, "entity")}
                  onDelete={() => handleDeleteClick(e)} />
              </Grid>
            ))}
            {activeTab === "content" && items.map((c) => (
              <Grid size={{ md: 4, sm: 6, xs: 12 }} key={c._id}>
                <ContentCard content={c}
                  onView={() => navigate(`/ai/analysis/content/${c._id}`)}
                  onFlag={() => handleFlag(c, "content")}
                  onDelete={() => handleDeleteClick(c)} />
              </Grid>
            ))}
            {activeTab === "sessions" && items.map((s) => (
              <Grid size={{ md: 4, sm: 6, xs: 12 }} key={s._id}>
                <SessionCard session={s}
                  onView={() => navigate(`/ai/analysis/sessions-content/${s._id}`)}
                  onDelete={() => handleDeleteClick(s)} />
              </Grid>
            ))}
          </Grid>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <Box display="flex" justifyContent="center" mt={4} pt={2} sx={{ borderTop: `1px solid ${theme.palette.divider}` }}>
            <Pagination count={pagination.total_pages} page={page} onChange={(_, v) => setPage(v)}
              sx={{
                "& .MuiPaginationItem-root": { color: "text.disabled", fontFamily: "monospace", border: `1px solid ${theme.palette.divider}`, bgcolor: "background.paper" },
                "& .Mui-selected": { bgcolor: alpha("#22d3ee", 0.15), color: "#22d3ee", borderColor: "#22d3ee" },
              }}
            />
          </Box>
        )}
      </Box>

      {/* Delete Modal */}
      {selectedItem && (
        <CustomModal open={deleteModal} onClose={() => setDeleteModal(false)} onConfirm={confirmDelete}
          title="Confirmer la suppression" confirmText="Supprimer" cancelText="Annuler"
          isLoading={isDeleting} titleColor="error" confirmColor="error">
          <Typography color="text.secondary">
            Supprimer <strong style={{ color: "#f87171" }}>{deleteLabel}</strong> ? Cette action est irréversible.
          </Typography>
        </CustomModal>
      )}
      {ToastComponent}
    </Box>
  );
}