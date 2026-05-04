// pages/osint/SessionDetail.jsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box, Typography, Grid, Chip, Button, Stack, Paper, Alert,
  Divider, CircularProgress, FormControlLabel, Checkbox, LinearProgress,
} from "@mui/material";
import {  alpha, useTheme } from "@mui/material/styles";
import { FaArrowLeft, FaTrash, FaFlag, FaExternalLinkAlt } from "react-icons/fa";
import useAxiosPrivate from "../../utils/hooks/instance/axiosprivate.instance";
import useToast from "../../components/toast/toast.toast";

const PLT_COLORS = { facebook: "#4267B2", twitter: "#1DA1F2", linkedin: "#0077B5", instagram: "#E4405F", youtube: "#FF0000", tiktok: "#69C9D0", reddit: "#FF4500" };
const STATUS_COLORS = { completed: "#4ade80", running: "#22d3ee", failed: "#f87171" };
const fmt = (d) => d ? new Date(d).toLocaleString("fr-FR") : "—";

// ── MetaRow ────────────────────────────────────────────────────────────────────

const MetaRow = ({ label, value, mono }) => {
  const theme = useTheme();
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start"
      sx={{ py: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
      <Typography variant="caption" color="text.disabled" fontFamily="monospace" sx={{ flexShrink: 0 }}>{label}</Typography>
      <Typography variant="caption" color="text.secondary"
        sx={{ textAlign: "right", maxWidth: "55%", wordBreak: "break-all", fontFamily: mono ? "monospace" : "sans-serif", fontSize: 11 }}>
        {value || "—"}
      </Typography>
    </Stack>
  );
};

// ── SessionDetail ──────────────────────────────────────────────────────────────

export function SessionDetail() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const { showToast, ToastComponent } = useToast();
  const theme = useTheme();

  const [showContent, setShowContent] = useState(false);
  const [deleteRelated, setDeleteRelated] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["session", sessionId, showContent],
    queryFn: async () =>
      (await axiosPrivate.get(`/api/v2/scraper/sessions/${sessionId}?populate_entities=true&populate_content=${showContent}`)).data,
    staleTime: 30000,
  });

  const handleDelete = async () => {
    if (!window.confirm("Supprimer cette session ?")) return;
    await axiosPrivate.delete(`/api/v2/scraper/sessions/${sessionId}?delete_related=${deleteRelated}`);
    showToast({ description: "Session supprimée", status: "success" });
    navigate("/ai/analysis/results");
  };

  if (isLoading) return (
    <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
      <CircularProgress sx={{ color: "primary.main" }} />
    </Box>
  );

  const session = data?.session;
  const entities = data?.entities || [];
  const content = data?.content || [];
  if (!session) return <Box p={4}><Alert severity="error">Session introuvable</Alert></Box>;

  const sc = STATUS_COLORS[session.status] || "#64748b";
  const errors = session.errors || [];

  const paperSx = {
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 3,
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", color: "text.primary" }}>

      {/* Nav */}
      <Box sx={{ bgcolor: "background.paper", borderBottom: `1px solid ${theme.palette.divider}`, px: 4, py: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Button startIcon={<FaArrowLeft size={12} />} onClick={() => navigate("/ai/analysis/results")}
            sx={{ color: "text.disabled", fontFamily: "monospace", fontSize: 12, letterSpacing: 1 }}>RETOUR</Button>
          <Button size="small" variant="outlined" startIcon={<FaTrash size={11} />} onClick={handleDelete}
            sx={{ borderColor: alpha("#f87171", 0.3), color: "#f87171", fontFamily: "monospace", fontWeight: 700, fontSize: 11 }}>
            SUPPRIMER
          </Button>
        </Stack>
      </Box>

      {/* Header */}
      <Box sx={{ bgcolor: "background.paper", borderBottom: `1px solid ${theme.palette.divider}`, px: 4, py: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: sc, flexShrink: 0, boxShadow: `0 0 8px ${sc}` }} />
            <Box>
              <Typography variant="h6" fontWeight={800} color="text.primary" fontFamily="monospace">"{session.query}"</Typography>
              <Typography variant="caption" color="text.disabled">{session.search_type || "standard"} · {fmt(session.created_at)}</Typography>
            </Box>
          </Stack>
          <Chip label={session.status?.toUpperCase() || "COMPLETED"}
            sx={{ fontFamily: "monospace", fontWeight: 700, fontSize: 11, color: sc, bgcolor: alpha(sc, 0.1), border: "1px solid", borderColor: alpha(sc, 0.3) }} />
        </Stack>
      </Box>

      <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
        <Stack spacing={2.5}>

          {/* Stats */}
          <Grid container spacing={2}>
            {[
              { label: "ENTITÉS", val: data?.entities_count ?? session.entities_found ?? 0, color: "#22d3ee" },
              { label: "CONTENUS", val: data?.content_count ?? session.content_found ?? 0, color: "#a78bfa" },
              { label: "DURÉE", val: session.duration_seconds ? `${session.duration_seconds}s` : "—", color: "#4ade80" },
              { label: "ERREURS", val: errors.length, color: errors.length > 0 ? "#f87171" : theme.palette.divider },
            ].map((st) => (
              <Grid size={{ md: 3, sm: 6, xs: 6 }} key={st.label}>
                <Paper sx={{ bgcolor: "background.paper", border: `1px solid ${alpha(st.color, 0.2)}`, borderRadius: 3, p: 2, textAlign: "center" }}>
                  <Typography variant="h4" fontWeight={800} color={st.color} fontFamily="monospace">{st.val}</Typography>
                  <Typography variant="caption" color="text.disabled" fontFamily="monospace" letterSpacing={1.5} sx={{ fontSize: 9 }}>{st.label}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Meta */}
          <Paper elevation={0} sx={{ ...paperSx, p: 2.5 }}>
            <Typography variant="caption" fontWeight={700} color="text.disabled" letterSpacing={2} fontFamily="monospace" display="block" mb={1.5}>
              DÉTAILS DE SESSION
            </Typography>
            <MetaRow label="ID" value={session._id} mono />
            <MetaRow label="Requête" value={session.query} />
            <MetaRow label="Type" value={session.search_type || "standard"} />
            <MetaRow label="Source" value={session.source || "—"} />
            <MetaRow label="Démarré" value={fmt(session.created_at)} />
            <MetaRow label="Terminé" value={fmt(session.completed_at)} />
            {session.filters && <>
              <MetaRow label="Langue" value={session.filters.language || "—"} />
              <MetaRow label="Période" value={session.filters.time_filter || "—"} />
            </>}
            {session.platforms?.length > 0 && (
              <Box mt={1.5}>
                <Typography variant="caption" color="text.disabled" fontFamily="monospace" sx={{ fontSize: 9, letterSpacing: 2 }} display="block" mb={1}>
                  PLATEFORMES
                </Typography>
                <Stack direction="row" spacing={0.7} flexWrap="wrap">
                  {(Array.isArray(session.platforms) ? session.platforms : []).map(p => (
                    <Chip key={p} label={p} size="small"
                      sx={{ fontSize: 10, height: 20, fontFamily: "monospace", color: PLT_COLORS[p] || "text.disabled", bgcolor: alpha(PLT_COLORS[p] || "#64748b", 0.1), border: "1px solid", borderColor: alpha(PLT_COLORS[p] || "#64748b", 0.3) }} />
                  ))}
                </Stack>
              </Box>
            )}
          </Paper>

          {/* Entities */}
          <Paper elevation={0} sx={{ ...paperSx, overflow: "hidden" }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="caption" fontWeight={700} color="text.disabled" letterSpacing={2} fontFamily="monospace">
                ENTITÉS COLLECTÉES ({data?.entities_count ?? 0})
              </Typography>
            </Box>
            {entities.length === 0 ? (
              <Box p={3} textAlign="center">
                <Typography variant="caption" color="text.disabled" fontFamily="monospace">Aucune entité dans cette session</Typography>
              </Box>
            ) : (
              entities.map((e) => (
                <Stack key={e._id} direction="row" alignItems="center" spacing={1.5}
                  sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}`, cursor: "pointer", "&:hover": { bgcolor: theme.palette.action.hover } }}
                  onClick={() => navigate(`/ai/analysis/entities/${e._id}`)}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: PLT_COLORS[e.platform] || theme.palette.divider, flexShrink: 0 }} />
                  <Box flex={1}>
                    <Typography variant="caption" fontWeight={700} color="text.primary" fontFamily="monospace">{e.name || e.username || "Inconnu"}</Typography>
                    <Stack direction="row" spacing={1} mt={0.3}>
                      <Typography variant="caption" sx={{ color: PLT_COLORS[e.platform] || "text.disabled", fontSize: 10, fontFamily: "monospace" }}>{e.platform}</Typography>
                      {e.flagged && <Typography variant="caption" sx={{ color: "#f87171", fontSize: 10 }}>⚑</Typography>}
                      {e.followers_count && <Typography variant="caption" color="text.disabled" fontFamily="monospace" sx={{ fontSize: 10 }}>{e.followers_count.toLocaleString()} ab.</Typography>}
                    </Stack>
                  </Box>
                  <Typography variant="caption" color="text.disabled">→</Typography>
                </Stack>
              ))
            )}
          </Paper>

          {/* Content toggle */}
          <Paper elevation={0} sx={{ ...paperSx, overflow: "hidden" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center"
              sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="caption" fontWeight={700} color="text.disabled" letterSpacing={2} fontFamily="monospace">
                CONTENUS ({data?.content_count ?? 0})
              </Typography>
              <Button size="small" variant="outlined" onClick={() => setShowContent(!showContent)}
                sx={{ fontSize: 10, fontFamily: "monospace", fontWeight: 700, borderColor: theme.palette.divider, color: "text.disabled", "&:hover": { borderColor: "text.disabled" } }}>
                {showContent ? "MASQUER" : "CHARGER"}
              </Button>
            </Stack>
            {showContent && content.length === 0 && (
              <Box p={3} textAlign="center">
                <Typography variant="caption" color="text.disabled" fontFamily="monospace">Aucun contenu</Typography>
              </Box>
            )}
            {showContent && content.map((c) => (
              <Stack key={c._id} direction="row" spacing={1.5}
                sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Box sx={{ color: c.flagged ? "#f87171" : theme.palette.divider, fontSize: 11, mt: 0.3 }}>{c.flagged ? "⚑" : "◦"}</Box>
                <Box flex={1} minWidth={0}>
                  <Typography variant="caption" color="text.primary" fontFamily="monospace" display="block" noWrap>
                    {c.title || c.text?.slice(0, 60) || "Sans titre"}
                  </Typography>
                  <Stack direction="row" spacing={1} mt={0.3}>
                    <Typography variant="caption" sx={{ color: PLT_COLORS[c.platform] || "text.disabled", fontSize: 10, fontFamily: "monospace" }}>{c.platform}</Typography>
                    <Typography variant="caption" color="text.disabled" fontFamily="monospace" sx={{ fontSize: 10 }}>{c.content_type}</Typography>
                    {c.risk_score > 0 && <Typography variant="caption" sx={{ color: "#fbbf24", fontSize: 10, fontFamily: "monospace" }}>risque {(c.risk_score * 100).toFixed(0)}%</Typography>}
                  </Stack>
                </Box>
              </Stack>
            ))}
          </Paper>

          {/* Errors */}
          {errors.length > 0 && (
            <Paper elevation={0} sx={{ ...paperSx, p: 2.5, borderColor: `${alpha("#f87171", 0.2)} !important` }}>
              <Typography variant="caption" fontWeight={700} color="#f87171" letterSpacing={2} fontFamily="monospace" display="block" mb={1.5}>
                ERREURS ({errors.length})
              </Typography>
              <Stack spacing={0.75}>
                {errors.map((e, i) => (
                  <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start">
                    <Typography variant="caption" color="#7f1d1d" sx={{ fontSize: 12, flexShrink: 0 }}>✗</Typography>
                    <Typography variant="caption" color="#f87171" sx={{ fontSize: 11, lineHeight: 1.5 }}>{e}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          )}

          {/* Danger Zone */}
          <Paper elevation={0} sx={{ ...paperSx, p: 2.5, borderColor: `${alpha("#f87171", 0.15)} !important` }}>
            <Typography variant="caption" fontWeight={700} color="text.disabled" letterSpacing={2} fontFamily="monospace" display="block" mb={1.5}>
              ZONE DE DANGER
            </Typography>
            <FormControlLabel
              control={<Checkbox checked={deleteRelated} onChange={e => setDeleteRelated(e.target.checked)} size="small"
                sx={{ color: "#f87171", "&.Mui-checked": { color: "#f87171" } }} />}
              label={<Typography variant="caption" color="text.secondary">Supprimer aussi les entités et contenus liés</Typography>}
              sx={{ mb: 2, display: "flex" }}
            />
            <Button fullWidth variant="outlined" startIcon={<FaTrash size={12} />} onClick={handleDelete}
              sx={{ borderColor: alpha("#f87171", 0.3), color: "#f87171", bgcolor: alpha("#f87171", 0.05), fontFamily: "monospace", fontWeight: 700, fontSize: 12, "&:hover": { bgcolor: alpha("#f87171", 0.12), borderColor: "#f87171" } }}>
              SUPPRIMER LA SESSION {deleteRelated ? "+ DONNÉES LIÉES" : ""}
            </Button>
          </Paper>
        </Stack>
      </Box>
      {ToastComponent}
    </Box>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// pages/osint/ContentDetail.jsx
// ═══════════════════════════════════════════════════════════════════════════════

export function ContentDetail() {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();
  const { showToast, ToastComponent } = useToast();
  const theme = useTheme();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["content", contentId],
    queryFn: async () => (await axiosPrivate.get(`/api/v2/scraper/content/${contentId}`)).data,
    staleTime: 60000,
  });

  const handleFlag = async () => {
    await axiosPrivate.patch(`/api/v2/scraper/content/${contentId}/flag`, { flagged: !content.flagged, risk_score: content.risk_score });
    showToast({ description: content.flagged ? "Signal retiré" : "Contenu signalé", status: "success" });
    refetch(); queryClient.invalidateQueries(["osint-stats"]);
  };

  const handleDelete = async () => {
    if (!window.confirm("Supprimer ce contenu ?")) return;
    await axiosPrivate.delete(`/api/v2/scraper/content/${contentId}`);
    navigate("/ai/analysis/results");
  };

  if (isLoading) return (
    <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
      <CircularProgress sx={{ color: "primary.main" }} />
    </Box>
  );

  const content = data?.data;
  const entity = data?.entity;
  if (!content) return <Box p={4}><Alert severity="error">Contenu introuvable</Alert></Box>;

  const pltColor = PLT_COLORS[content.platform] || "#64748b";
  const risk = content.risk_score || 0;
  const rc = risk >= 0.7 ? "#f87171" : risk >= 0.4 ? "#fbbf24" : "#4ade80";
  const meta = content.metadata || {};

  const paperSx = {
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 3,
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", color: "text.primary" }}>

      {/* Nav */}
      <Box sx={{ bgcolor: "background.paper", borderBottom: `1px solid ${theme.palette.divider}`, px: 4, py: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap">
          <Button startIcon={<FaArrowLeft size={12} />} onClick={() => navigate("/ai/analysis/results")}
            sx={{ color: "text.disabled", fontFamily: "monospace", fontSize: 12, letterSpacing: 1 }}>RETOUR</Button>
          <Stack direction="row" spacing={1}>
            {[
              { label: content.flagged ? "RETIRER SIGNAL" : "SIGNALER", color: content.flagged ? "#f87171" : "#fbbf24", onClick: handleFlag },
              { label: "OUVRIR URL", color: "#22d3ee", onClick: () => window.open(content.url, "_blank") },
              ...(entity ? [{ label: "VOIR ENTITÉ", color: "#a78bfa", onClick: () => navigate(`/ai/osint/entities/${entity._id}`) }] : []),
              { label: "SUPPRIMER", color: "#f87171", onClick: handleDelete },
            ].map((btn) => (
              <Button key={btn.label} size="small" variant="outlined" onClick={btn.onClick}
                sx={{ borderColor: alpha(btn.color, 0.3), color: btn.color, fontFamily: "monospace", fontWeight: 700, fontSize: 11, "&:hover": { borderColor: btn.color, bgcolor: alpha(btn.color, 0.08) } }}>
                {btn.label}
              </Button>
            ))}
          </Stack>
        </Stack>
      </Box>

      {content.flagged && (
        <Alert severity="error" sx={{ borderRadius: 0, bgcolor: alpha("#f87171", 0.08), color: "#fca5a5", fontFamily: "monospace", "& .MuiAlert-icon": { color: "#f87171" } }}>
          CONTENU SIGNALÉ — {content.flag_reason || "Raison non spécifiée"}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ maxWidth: 1400, mx: "auto", p: 3 }}>

        {/* LEFT */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={2.5}>
            <Paper elevation={0} sx={{ ...paperSx, p: 3, borderColor: `${alpha(pltColor, 0.2)} !important` }}>
              <Stack direction="row" spacing={0.8} flexWrap="wrap" mb={2} useFlexGap>
                <Chip label={content.platform || "—"} size="small"
                  sx={{ fontSize: 10, height: 22, fontFamily: "monospace", fontWeight: 700, color: pltColor, bgcolor: alpha(pltColor, 0.1), border: "1px solid", borderColor: alpha(pltColor, 0.3) }} />
                {content.content_type && (
                  <Chip label={content.content_type} size="small"
                    sx={{ fontSize: 10, height: 22, fontFamily: "monospace", color: "text.secondary", bgcolor: theme.palette.action.hover }} />
                )}
                {risk > 0 && (
                  <Chip label={`RISQUE ${(risk * 100).toFixed(0)}%`} size="small"
                    sx={{ fontSize: 10, height: 22, fontFamily: "monospace", fontWeight: 700, color: rc, bgcolor: alpha(rc, 0.1), border: "1px solid", borderColor: alpha(rc, 0.3) }} />
                )}
              </Stack>

              <Typography variant="h6" fontWeight={800} color="text.primary" mb={2} sx={{ fontFamily: "monospace", lineHeight: 1.4 }}>
                {content.title || "Sans titre"}
              </Typography>

              {content.text && (
                <Typography variant="body2" color="text.secondary" mb={2} sx={{ lineHeight: 1.7 }}>{content.text}</Typography>
              )}
              {content.description && content.description !== content.text && (
                <Typography variant="body2" color="text.disabled" mb={2} sx={{ lineHeight: 1.7 }}>{content.description}</Typography>
              )}

              {risk > 0 && (
                <Box mb={2.5} p={2} sx={{ bgcolor: theme.palette.background.default, borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
                  <Stack direction="row" justifyContent="space-between" mb={1}>
                    <Typography variant="caption" color="text.disabled" fontFamily="monospace">Score de risque</Typography>
                    <Typography variant="caption" color={rc} fontWeight={800} fontFamily="monospace">{(risk * 100).toFixed(0)}%</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={risk * 100}
                    sx={{ height: 5, borderRadius: 99, bgcolor: theme.palette.divider, "& .MuiLinearProgress-bar": { background: `linear-gradient(90deg,${alpha(rc, 0.6)},${rc})` } }}
                  />
                </Box>
              )}

              <Box sx={{ bgcolor: theme.palette.background.default, borderRadius: 2, p: 2 }}>
                <Typography variant="caption" color="text.disabled" fontFamily="monospace" letterSpacing={2} sx={{ fontSize: 9 }} display="block" mb={1}>URL</Typography>
                <Typography variant="caption" component="a" href={content.url} target="_blank"
                  sx={{ color: "#22d3ee", textDecoration: "none", wordBreak: "break-all", fontFamily: "monospace", fontSize: 11 }}>
                  {content.url}
                </Typography>
              </Box>
            </Paper>

            {/* Engagement */}
            {(content.likes_count != null || content.comments_count != null || content.shares_count != null) && (
              <Paper elevation={0} sx={{ ...paperSx, p: 2.5 }}>
                <Typography variant="caption" fontWeight={700} color="text.disabled" letterSpacing={2} fontFamily="monospace" display="block" mb={2}>
                  ENGAGEMENT
                </Typography>
                <Grid container spacing={1.5}>
                  {[
                    { icon: "♥", label: "Likes", val: content.likes_count, color: "#f87171" },
                    { icon: "⌘", label: "Commentaires", val: content.comments_count, color: "#22d3ee" },
                    { icon: "↗", label: "Partages", val: content.shares_count, color: "#4ade80" },
                  ].map((eng) => (
                    <Grid size={{ xs: 4 }} key={eng.label}>
                      <Box sx={{ textAlign: "center", bgcolor: theme.palette.background.default, borderRadius: 2, py: 2 }}>
                        <Typography sx={{ fontSize: 18, color: eng.color, mb: 0.5 }}>{eng.icon}</Typography>
                        <Typography variant="h6" fontWeight={800} color={eng.color} fontFamily="monospace">{eng.val?.toLocaleString() ?? "—"}</Typography>
                        <Typography variant="caption" color="text.disabled" fontFamily="monospace" sx={{ fontSize: 9, letterSpacing: 1 }}>{eng.label}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}

            {/* Metadata */}
            {Object.keys(meta).length > 0 && (
              <Paper elevation={0} sx={{ ...paperSx, p: 2.5 }}>
                <Typography variant="caption" fontWeight={700} color="text.disabled" letterSpacing={2} fontFamily="monospace" display="block" mb={2}>
                  MÉTADONNÉES
                </Typography>
                {meta.page_title && <MetaRow label="Titre page" value={meta.page_title} />}
                {meta.last_modified && <MetaRow label="Modifié le" value={fmt(meta.last_modified)} />}
                {meta.keywords?.length > 0 && (
                  <Box py={1} sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="caption" color="text.disabled" fontFamily="monospace" display="block" mb={1}>Mots-clés</Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {meta.keywords.map(k => (
                        <Chip key={k} label={k} size="small" sx={{ height: 18, fontSize: 9, fontFamily: "monospace", bgcolor: theme.palette.action.hover, color: "text.secondary" }} />
                      ))}
                    </Stack>
                  </Box>
                )}
                {meta.hashtags?.length > 0 && (
                  <Box py={1}>
                    <Typography variant="caption" color="text.disabled" fontFamily="monospace" display="block" mb={1}>Hashtags</Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {meta.hashtags.map(h => (
                        <Chip key={h} label={`#${h}`} size="small" sx={{ height: 18, fontSize: 9, fontFamily: "monospace", bgcolor: alpha("#22d3ee", 0.08), color: "#22d3ee" }} />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Paper>
            )}
          </Stack>
        </Grid>

        {/* RIGHT */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={2.5}>
            <Paper elevation={0} sx={{ ...paperSx, p: 2.5 }}>
              <Typography variant="caption" fontWeight={700} color="text.disabled" letterSpacing={2} fontFamily="monospace" display="block" mb={1.5}>
                INFORMATIONS
              </Typography>
              <MetaRow label="ID" value={content._id} mono />
              <MetaRow label="Entité ID" value={content.entity_id} mono />
              <MetaRow label="Publié le" value={fmt(content.published_at)} />
              <MetaRow label="Scrapé le" value={fmt(content.scraped_at)} />
              <MetaRow label="Requête" value={content.search_query} />
              <MetaRow label="Pertinence" value={content.relevance_score ? `${(content.relevance_score * 100).toFixed(0)}%` : "—"} />
              {content.media_credibility && <MetaRow label="Crédibilité" value={`${content.media_credibility}/5`} />}
            </Paper>

            {entity && (
              <Paper elevation={0}
                sx={{ ...paperSx, p: 2.5, cursor: "pointer", "&:hover": { borderColor: alpha("#a78bfa", 0.3) } }}
                onClick={() => navigate(`/ai/osint/entities/${entity._id}`)}>
                <Typography variant="caption" fontWeight={700} color="text.disabled" letterSpacing={2} fontFamily="monospace" display="block" mb={2}>
                  ENTITÉ SOURCE
                </Typography>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ width: 44, height: 44, borderRadius: "50%", border: `2px solid ${PLT_COLORS[entity.platform] || theme.palette.divider}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", bgcolor: alpha(PLT_COLORS[entity.platform] || "#64748b", 0.1), flexShrink: 0 }}>
                    {entity.profile_image_url
                      ? <Box component="img" src={entity.profile_image_url} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <Typography sx={{ fontSize: 18, color: PLT_COLORS[entity.platform] || "text.disabled" }}>◉</Typography>
                    }
                  </Box>
                  <Box flex={1} minWidth={0}>
                    <Typography variant="subtitle2" fontWeight={700} color="text.primary" fontFamily="monospace" noWrap>
                      {entity.name || entity.username || "Inconnu"}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" fontFamily="monospace">
                      @{entity.username || "—"} · {entity.platform}
                    </Typography>
                    {entity.followers_count && (
                      <Typography variant="caption" color="text.disabled" fontFamily="monospace" display="block">
                        {entity.followers_count.toLocaleString()} abonnés
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="caption" color="text.disabled">→</Typography>
                </Stack>
                {entity.flagged && (
                  <Alert severity="error" sx={{ mt: 1.5, py: 0.5, bgcolor: alpha("#f87171", 0.08), color: "#fca5a5", fontSize: 11, fontFamily: "monospace", "& .MuiAlert-icon": { color: "#f87171", fontSize: 14 } }}>
                    Cette entité est également signalée
                  </Alert>
                )}
              </Paper>
            )}

            {content.flagged && content.ai_analysis && (
              <Paper elevation={0} sx={{ ...paperSx, p: 2.5, borderColor: `${alpha("#f87171", 0.2)} !important` }}>
                <Typography variant="caption" fontWeight={700} color="#f87171" letterSpacing={2} fontFamily="monospace" display="block" mb={1.5}>
                  ANALYSE IA
                </Typography>
                {Object.entries(content.ai_analysis).map(([k, v]) => <MetaRow key={k} label={k} value={String(v)} />)}
              </Paper>
            )}
          </Stack>
        </Grid>
      </Grid>
      {ToastComponent}
    </Box>
  );
}