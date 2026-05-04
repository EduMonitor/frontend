// pages/osint/EntityDetail.jsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box, Typography, Grid, Chip, Button, Stack, Paper, Avatar,
  CircularProgress, LinearProgress, Alert, Badge, Select, MenuItem, FormControl,
} from "@mui/material";
import {  alpha, useTheme } from "@mui/material/styles";
import { FaArrowLeft, FaFlag, FaTrash, FaBell, FaFileAlt, FaExternalLinkAlt } from "react-icons/fa";
import useAxiosPrivate from "../../utils/hooks/instance/axiosprivate.instance";
import useToast from "../../components/toast/toast.toast";

const PLT_COLORS = { facebook: "#4267B2", twitter: "#1DA1F2", linkedin: "#0077B5", instagram: "#E4405F", youtube: "#FF0000", tiktok: "#69C9D0", reddit: "#FF4500" };

const fmt = (d) => d ? new Date(d).toLocaleString("fr-FR") : "—";
const fmtD = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";
const riskColor = (s) => s >= 0.7 ? "#f87171" : s >= 0.4 ? "#fbbf24" : "#4ade80";

// ── Themed sub-components ──────────────────────────────────────────────────────

const MetaRow = ({ label, value }) => {
  const theme = useTheme();
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start"
      sx={{ py: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
      <Typography variant="caption" color="text.disabled" sx={{ fontFamily: "monospace" }}>{label}</Typography>
      <Typography variant="caption" color="text.secondary"
        sx={{ textAlign: "right", maxWidth: "55%", wordBreak: "break-word", fontFamily: "monospace" }}>
        {value || "—"}
      </Typography>
    </Stack>
  );
};

const StatBox = ({ label, value, color }) => {
  const theme = useTheme();
  return (
    <Box sx={{ textAlign: "center", bgcolor: theme.palette.background.default, borderRadius: 2, p: 1.5 }}>
      <Typography variant="h5" fontWeight={800} color={color} fontFamily="monospace">{value ?? 0}</Typography>
      <Typography variant="caption" color="text.disabled" fontFamily="monospace" sx={{ fontSize: 9, letterSpacing: 1 }}>
        {label}
      </Typography>
    </Box>
  );
};

// ── Main ───────────────────────────────────────────────────────────────────────

export default function EntityDetail() {
  const { entityId } = useParams();
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();
  const { showToast, ToastComponent } = useToast();
  const theme = useTheme();

  const [contentTab, setContentTab] = useState("all");
  const [days, setDays] = useState(30);
  const [showReport, setShowReport] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const { data: entityData, isLoading, refetch } = useQuery({
    queryKey: ["entity", entityId],
    queryFn: async () => (await axiosPrivate.get(`/api/v2/scraper/entities/${entityId}`)).data,
    staleTime: 60000,
  });

  const { data: contentData } = useQuery({
    queryKey: ["entity-content", entityId, contentTab, days],
    queryFn: async () => {
      const p = new URLSearchParams({ days, page_size: "20" });
      if (contentTab === "flagged") p.append("flagged", "true");
      return (await axiosPrivate.get(`/api/v2/scraper/entities/${entityId}/content?${p}`)).data;
    },
    enabled: !!entityId,
  });

  const { data: reportData, refetch: fetchReport } = useQuery({
    queryKey: ["entity-report", entityId],
    queryFn: async () => (await axiosPrivate.get(`/api/v2/scraper/entities/${entityId}/report`)).data,
    enabled: showReport,
    staleTime: 120000,
  });

  const handleFlag = async () => {
    await axiosPrivate.patch(`/api/v2/scraper/entities/${entityId}/flag`, { flagged: !entity.flagged });
    showToast({ description: entity.flagged ? "Signal retiré" : "Entité signalée", status: "success" });
    refetch(); queryClient.invalidateQueries(["osint-stats"]);
  };

  const handleMonitor = async () => {
    setIsMonitoring(true);
    try {
      await axiosPrivate.post(`/api/v2/scraper/entities/${entityId}/monitor`);
      showToast({ description: "Surveillance lancée", status: "success" });
    } catch { showToast({ description: "Échec surveillance", status: "error" }); }
    finally { setIsMonitoring(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm("Supprimer définitivement cette entité ?")) return;
    await axiosPrivate.delete(`/api/v2/scraper/entities/${entityId}`);
    navigate("/ai/analysis/results");
  };

  if (isLoading) return (
    <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
      <CircularProgress sx={{ color: "primary.main" }} />
    </Box>
  );

  const entity = entityData?.data;
  const stats = entityData?.statistics;
  if (!entity) return <Box p={4}><Alert severity="error">Entité introuvable</Alert></Box>;

  const pltColor = PLT_COLORS[entity.platform] || theme.palette.text.disabled;
  const risk = entity.risk_score || 0;
  const flaggedRatio = stats?.total_content ? (stats.flagged_content / stats.total_content) : 0;

  // Reusable paper style using theme
  const paperSx = {
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 3,
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", color: "text.primary" }}>

      {/* Nav */}
      <Box sx={{ px: 4, py: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Button startIcon={<FaArrowLeft size={12} />} onClick={() => navigate("/ai/analysis/results")}
            sx={{ color: "text.disabled", fontFamily: "monospace", fontSize: 12, letterSpacing: 1, "&:hover": { color: "text.secondary" } }}>
            RETOUR
          </Button>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined"
              startIcon={isMonitoring ? <CircularProgress size={10} color="inherit" /> : <FaBell size={11} />}
              onClick={handleMonitor} disabled={isMonitoring}
              sx={{ borderColor: alpha("#22d3ee", 0.3), color: "#22d3ee", fontFamily: "monospace", fontWeight: 700, fontSize: 11, "&:hover": { borderColor: "#22d3ee", bgcolor: alpha("#22d3ee", 0.08) } }}>
              SURVEILLER
            </Button>
            <Button size="small" variant="outlined" startIcon={<FaFlag size={11} />} onClick={handleFlag}
              sx={{ borderColor: alpha(entity.flagged ? "#f87171" : "#fbbf24", 0.3), color: entity.flagged ? "#f87171" : "#fbbf24", fontFamily: "monospace", fontWeight: 700, fontSize: 11 }}>
              {entity.flagged ? "RETIRER SIGNAL" : "SIGNALER"}
            </Button>
            <Button size="small" variant="outlined" startIcon={<FaFileAlt size={11} />}
              onClick={() => { setShowReport(true); fetchReport(); }}
              sx={{ borderColor: alpha("#a78bfa", 0.3), color: "#a78bfa", fontFamily: "monospace", fontWeight: 700, fontSize: 11 }}>
              RAPPORT
            </Button>
            <Button size="small" variant="outlined" color="error" startIcon={<FaTrash size={11} />} onClick={handleDelete}
              sx={{ borderColor: alpha("#f87171", 0.3), fontFamily: "monospace", fontWeight: 700, fontSize: 11 }}>
              SUPPRIMER
            </Button>
          </Stack>
        </Stack>
      </Box>

      {entity.flagged && (
        <Alert severity="error" sx={{ borderRadius: 0, bgcolor: alpha("#f87171", 0.1), color: "#fca5a5", fontFamily: "monospace", "& .MuiAlert-icon": { color: "#f87171" } }}>
          ENTITÉ SIGNALÉE — {entity.flag_reason || "Raison non spécifiée"}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ maxWidth: 1400, mx: "auto", p: 3 }}>

        {/* LEFT */}
        <Grid size={{ md: 4, sm: 6, xs: 12 }}>
          <Stack spacing={2.5}>

            {/* Profile Card */}
            <Paper elevation={0} sx={{ ...paperSx, p: 3, borderColor: `${alpha(pltColor, 0.25)} !important` }}>
              <Stack alignItems="center" spacing={1.5} mb={2}>
                <Badge color={entity.is_verified ? "success" : "default"} variant="dot" overlap="circular" anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
                  <Avatar src={entity.profile_image_url}
                    sx={{ width: 80, height: 80, border: `3px solid ${pltColor}`, bgcolor: alpha(pltColor, 0.15), fontSize: 32 }}>
                    {!entity.profile_image_url && "◉"}
                  </Avatar>
                </Badge>
                {entity.is_verified && (
                  <Chip label="✓ VÉRIFIÉ" size="small"
                    sx={{ bgcolor: alpha("#4ade80", 0.1), color: "#4ade80", border: "1px solid", borderColor: alpha("#4ade80", 0.3), fontFamily: "monospace", fontWeight: 700, fontSize: 10 }} />
                )}
                <Typography variant="h6" fontWeight={800} color="text.primary" fontFamily="monospace" textAlign="center">
                  {entity.name || entity.username || "Inconnu"}
                </Typography>
                <Typography variant="caption" color="text.disabled" fontFamily="monospace">
                  @{entity.username || "—"}
                </Typography>
                <Stack direction="row" spacing={0.7} flexWrap="wrap" justifyContent="center">
                  <Chip label={entity.platform} size="small"
                    sx={{ bgcolor: alpha(pltColor, 0.1), color: pltColor, border: "1px solid", borderColor: alpha(pltColor, 0.3), fontFamily: "monospace", fontWeight: 700, fontSize: 10 }} />
                  {entity.entity_type && (
                    <Chip label={entity.entity_type} size="small"
                      sx={{ bgcolor: theme.palette.action.hover, color: "text.secondary", fontFamily: "monospace", fontSize: 10 }} />
                  )}
                  {entity.location && (
                    <Chip label={entity.location} size="small"
                      sx={{ bgcolor: theme.palette.action.hover, color: "text.secondary", fontFamily: "monospace", fontSize: 10 }} />
                  )}
                </Stack>
              </Stack>

              {entity.bio && (
                <Typography variant="body2" color="text.secondary" textAlign="center" mb={2} sx={{ lineHeight: 1.6 }}>
                  {entity.bio}
                </Typography>
              )}
              {entity.website && (
                <Button fullWidth size="small" variant="outlined" startIcon={<FaExternalLinkAlt size={10} />}
                  href={entity.website} target="_blank"
                  sx={{ borderColor: alpha("#22d3ee", 0.2), color: "#22d3ee", fontFamily: "monospace", fontSize: 11, mb: 2 }}>
                  {entity.website.slice(0, 40)}...
                </Button>
              )}

              <Grid container spacing={1} mb={2}>
                {[
                  { label: "Abonnés", val: entity.followers_count?.toLocaleString(), color: pltColor },
                  { label: "Abonnements", val: entity.following_count?.toLocaleString(), color: "text.secondary" },
                  { label: "Posts", val: entity.posts_count?.toLocaleString(), color: "text.secondary" },
                ].map((m) => (
                  <Grid size={{ xs: 4 }} key={m.label}>
                    <Box sx={{ textAlign: "center", bgcolor: theme.palette.background.default, borderRadius: 2, py: 1.5 }}>
                      <Typography variant="subtitle2" fontWeight={800} color={m.color} fontFamily="monospace">{m.val ?? "—"}</Typography>
                      <Typography variant="caption" color="text.disabled" fontFamily="monospace" sx={{ fontSize: 9 }}>{m.label}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <MetaRow label="Rejoint le" value={fmtD(entity.joined_date)} />
              <MetaRow label="Dernier scraping" value={fmt(entity.last_scraped_at)} />
              <MetaRow label="Score Sahel" value={entity.sahel_relevance_score ? `${(entity.sahel_relevance_score * 100).toFixed(0)}%` : "—"} />

              {entity.tags?.length > 0 && (
                <Box mt={2}>
                  <Typography variant="caption" fontWeight={700} color="text.disabled" letterSpacing={2}
                    fontFamily="monospace" sx={{ fontSize: 9 }} display="block" mb={1}>TAGS</Typography>
                  <Stack direction="row" spacing={0.7} flexWrap="wrap">
                    {entity.tags.map(t => (
                      <Chip key={t} label={t} size="small"
                        sx={{ bgcolor: theme.palette.action.hover, color: "text.disabled", fontFamily: "monospace", fontSize: 9, height: 18 }} />
                    ))}
                  </Stack>
                </Box>
              )}
            </Paper>

            {/* Stats */}
            {stats && (
              <Paper elevation={0} sx={{ ...paperSx, p: 2.5 }}>
                <Typography variant="caption" fontWeight={700} color="text.disabled" letterSpacing={2}
                  fontFamily="monospace" display="block" mb={2}>STATISTIQUES</Typography>
                <Grid container spacing={1} mb={2}>
                  <Grid size={{ xs: 6 }}><StatBox label="CONTENUS" value={stats.total_content} color="#22d3ee" /></Grid>
                  <Grid size={{ xs: 6 }}><StatBox label="SIGNALÉS" value={stats.flagged_content} color="#f87171" /></Grid>
                  <Grid size={{ xs: 6 }}><StatBox label="30 JOURS" value={stats.activity_last_30_days} color="#a78bfa" /></Grid>
                  <Grid size={{ xs: 6 }}><StatBox label="RISQUE" value={`${(risk * 100).toFixed(0)}%`} color={riskColor(risk)} /></Grid>
                </Grid>
                {stats.total_content > 0 && (
                  <>
                    <Stack direction="row" justifyContent="space-between" mb={0.75}>
                      <Typography variant="caption" color="text.disabled" fontFamily="monospace" sx={{ fontSize: 11 }}>Ratio signalé</Typography>
                      <Typography variant="caption" color="#f87171" fontWeight={700} fontFamily="monospace" sx={{ fontSize: 11 }}>
                        {(flaggedRatio * 100).toFixed(1)}%
                      </Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={flaggedRatio * 100}
                      sx={{ height: 4, borderRadius: 99, bgcolor: theme.palette.divider, "& .MuiLinearProgress-bar": { background: "linear-gradient(90deg,#fbbf24,#f87171)" } }}
                    />
                  </>
                )}
              </Paper>
            )}
          </Stack>
        </Grid>

        {/* RIGHT */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={2.5}>

            {/* Report */}
            {showReport && reportData && (
              <Paper elevation={0} sx={{ ...paperSx, p: 2.5, borderColor: `${alpha("#a78bfa", 0.2)} !important` }}>
                <Typography variant="caption" fontWeight={700} color="text.disabled" letterSpacing={2}
                  fontFamily="monospace" display="block" mb={2}>RAPPORT D'ANALYSE</Typography>
                <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                  <Chip label={reportData.recommended_action}
                    sx={{
                      fontFamily: "monospace", fontWeight: 700, fontSize: 11,
                      color: reportData.recommended_action?.includes("URGENT") ? "#f87171" : reportData.recommended_action?.includes("REVIEW") ? "#fbbf24" : "#4ade80",
                      bgcolor: alpha(reportData.recommended_action?.includes("URGENT") ? "#f87171" : reportData.recommended_action?.includes("REVIEW") ? "#fbbf24" : "#4ade80", 0.1),
                    }}
                  />
                  <Typography variant="caption" color="text.disabled" fontFamily="monospace">
                    Score: {((reportData.risk_score || 0) * 100).toFixed(0)}%
                  </Typography>
                </Stack>
                {reportData.risk_indicators?.map((ri, i) => (
                  <Alert key={i} severity={ri.severity === "high" ? "error" : "warning"}
                    sx={{ mb: 1, bgcolor: alpha(ri.severity === "high" ? "#f87171" : "#fbbf24", 0.05), border: "1px solid", borderColor: alpha(ri.severity === "high" ? "#f87171" : "#fbbf24", 0.2), color: "text.secondary", fontFamily: "monospace", fontSize: 12, "& .MuiAlert-icon": { color: ri.severity === "high" ? "#f87171" : "#fbbf24" } }}>
                    {ri.type?.replace(/_/g, " ")} {ri.value ? `— ${ri.value}` : ""}
                  </Alert>
                ))}
              </Paper>
            )}

            {/* Content Timeline */}
            <Paper elevation={0} sx={{ ...paperSx, overflow: "hidden" }}>
              <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" fontWeight={700} color="text.disabled" letterSpacing={2} fontFamily="monospace">CONTENUS</Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {["all", "flagged"].map(tab => (
                      <Button key={tab} size="small" variant={contentTab === tab ? "contained" : "outlined"} onClick={() => setContentTab(tab)}
                        sx={{
                          fontSize: 10, fontFamily: "monospace", fontWeight: 700, py: 0.5, minWidth: 0,
                          ...(contentTab === tab
                            ? { bgcolor: alpha(tab === "flagged" ? "#f87171" : "#22d3ee", 0.15), color: tab === "flagged" ? "#f87171" : "#22d3ee", border: "1px solid", borderColor: tab === "flagged" ? alpha("#f87171", 0.4) : alpha("#22d3ee", 0.4) }
                            : { borderColor: theme.palette.divider, color: "text.disabled" })
                        }}>
                        {tab === "all" ? "TOUS" : "SIGNALÉS"}
                      </Button>
                    ))}
                    <FormControl size="small">
                      <Select value={days} onChange={e => setDays(+e.target.value)}
                        sx={{ bgcolor: theme.palette.background.default, color: "text.secondary", fontSize: 11, fontFamily: "monospace", "& fieldset": { borderColor: theme.palette.divider }, height: 28 }}>
                        {[7, 14, 30, 90, 180, 365].map(d => <MenuItem key={d} value={d}>{d}j</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Stack>
                </Stack>
              </Box>
              <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
                {contentData?.data?.length === 0 ? (
                  <Box p={4} textAlign="center">
                    <Typography variant="caption" color="text.disabled" fontFamily="monospace">Aucun contenu dans cette période</Typography>
                  </Box>
                ) : (
                  contentData?.data?.map((item) => (
                    <Stack key={item._id} direction="row" spacing={1.5}
                      sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}`, alignItems: "flex-start" }}>
                      <Box sx={{ color: item.flagged ? "#f87171" : theme.palette.divider, mt: 0.5, fontSize: 12 }}>
                        {item.flagged ? "⚑" : "◦"}
                      </Box>
                      <Box flex={1} minWidth={0}>
                        <Typography variant="caption" color="text.primary" fontFamily="monospace" display="block" noWrap>
                          {item.title || item.text?.slice(0, 60) || "Sans titre"}
                        </Typography>
                        <Stack direction="row" spacing={1} mt={0.5}>
                          <Typography variant="caption" color="text.disabled" fontFamily="monospace" sx={{ fontSize: 10 }}>
                            {item.content_type || "post"}
                          </Typography>
                          {item.risk_score > 0 && (
                            <Typography variant="caption" sx={{ color: riskColor(item.risk_score), fontSize: 10, fontFamily: "monospace" }}>
                              risque {(item.risk_score * 100).toFixed(0)}%
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.disabled" fontFamily="monospace" sx={{ fontSize: 10 }}>
                            {item.scraped_at ? new Date(item.scraped_at).toLocaleDateString("fr-FR") : "—"}
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>
                  ))
                )}
              </Box>
              {contentData?.pagination?.total > 20 && (
                <Box sx={{ textAlign: "center", py: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}>
                  <Typography variant="caption" color="text.disabled" fontFamily="monospace">
                    +{contentData.pagination.total - 20} contenus supplémentaires
                  </Typography>
                </Box>
              )}
            </Paper>
          </Stack>
        </Grid>
      </Grid>
      {ToastComponent}
    </Box>
  );
}