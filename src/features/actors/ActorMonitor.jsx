// src/features/actors/ActorMonitor.jsx
//
// Actor-centric disinformation monitoring.
//
// Three tabs, matching how the work actually goes:
//   Surveillance  maintain the watchlist (and see what each platform allows)
//   Analyse       run a scan, watch it stream, read the ranking
//   Acteurs       standing ranking across past scans
//
// The watchlist is central because no platform offers public topic search:
// you name the accounts, the app watches what they publish. The platform panel
// states that limitation outright rather than offering Facebook and silently
// returning nothing.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Paper, Typography, Grid, Chip, Stack, Divider, Alert, AlertTitle,
  Tabs, Tab, LinearProgress, Button, IconButton, Tooltip, Link, Collapse,
  FormControlLabel, Checkbox, alpha,
} from '@mui/material';
import {
  FaUserSecret, FaPlus, FaTrash, FaSyncAlt, FaRocket, FaStop, FaSpinner,
  FaExclamationTriangle, FaEye, FaVideo, FaImage, FaShareAlt, FaBolt,
  FaChevronDown, FaChevronUp, FaExternalLinkAlt, FaCheckCircle, FaBan,
} from 'react-icons/fa';
import InputField from '../../components/forms/input.forms';
import SelectField from '../../components/forms/select.forms';
import useAxiosPrivate from '../../utils/hooks/instance/axiosprivate.instance';
import useAuth from '../../utils/hooks/contexts/useAth.contexts';
import useToast from '../../components/toast/toast.toast';
import CustomModal from '../../components/modal/Custome.modal';
import { formatDate } from '../../utils/functions/format-date.functions';
import actorsApi, { buildScanStreamQuery, actorPaths } from './api.actors';

const RISK_BANDS = {
  critical: { color: 'error',   label: 'Critique' },
  high:     { color: 'error',   label: 'Élevé' },
  moderate: { color: 'warning', label: 'Modéré' },
  low:      { color: 'info',    label: 'Faible' },
  minimal:  { color: 'success', label: 'Minimal' },
};

const SINCE_OPTIONS = [
  { key: '7',   value: '7 derniers jours',  icon: '📆' },
  { key: '30',  value: '30 derniers jours', icon: '🗓️' },
  { key: '90',  value: '3 derniers mois',   icon: '📊' },
  { key: '365', value: '12 derniers mois',  icon: '📈' },
];

const STREAM_IDLE_TIMEOUT = 180000;

const ActorMonitor = () => {
  const axiosPrivate = useAxiosPrivate();
  const { auth } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const api = useMemo(() => actorsApi(axiosPrivate), [axiosPrivate]);
  const abortRef = useRef(null);

  const [tab, setTab] = useState(0);
  const [platforms, setPlatforms] = useState(null);
  const [showUnsupported, setShowUnsupported] = useState(false);

  // watchlist
  const [watchlist, setWatchlist] = useState([]);
  const [wlLoading, setWlLoading] = useState(false);
  const [newActor, setNewActor] = useState({ platform: 'telegram', handle: '', label: '' });
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // scan
  const [scanParams, setScanParams] = useState({
    topicTerms: '', sinceDays: '30', limitPerActor: 40, analyze: true,
  });
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState({ value: 0, message: '' });
  const [log, setLog] = useState([]);
  const [report, setReport] = useState(null);
  const [rankedActors, setRankedActors] = useState([]);
  const [error, setError] = useState(null);
  const [expandedActor, setExpandedActor] = useState(null);

  const addLog = useCallback((message, severity = 'info') => {
    setLog((prev) => [...prev.slice(-199), {
      message, severity, at: new Date().toLocaleTimeString('fr-FR'),
    }]);
  }, []);

  // ---------------------------------------------------------------- //

  const loadPlatforms = useCallback(async () => {
    try { setPlatforms(await api.getPlatforms()); } catch { /* panel is optional */ }
  }, [api]);

  const loadWatchlist = useCallback(async () => {
    setWlLoading(true);
    try {
      const data = await api.getWatchlist();
      setWatchlist(data.actors || []);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message);
    } finally {
      setWlLoading(false);
    }
  }, [api]);

  const loadRanked = useCallback(async () => {
    try {
      const data = await api.getRankedActors({ limit: 100 });
      setRankedActors(data.actors || []);
    } catch { /* empty until a scan has run */ }
  }, [api]);

  useEffect(() => { loadPlatforms(); loadWatchlist(); }, [loadPlatforms, loadWatchlist]);
  useEffect(() => { if (tab === 2) loadRanked(); }, [tab, loadRanked]);

  const platformOptions = useMemo(() => (
    (platforms?.supported || []).map((p) => ({
      key: p.platform, value: p.label, description: p.caveat,
    }))
  ), [platforms]);

  // ---------------------------------------------------------------- //

  const handleAdd = useCallback(async () => {
    if (!newActor.handle.trim()) {
      setError('Indiquez un identifiant de canal ou de chaîne');
      return;
    }
    setAdding(true);
    setError(null);
    try {
      const created = await api.addActor({
        platform: newActor.platform,
        handle: newActor.handle.trim(),
        label: newActor.label.trim(),
      });
      // The backend probes before saving, so say what it found.
      showToast({
        title: created.verified ? 'Acteur ajouté et vérifié' : 'Acteur ajouté',
        description: created.verified
          ? `${created.probe_posts} publication(s) récupérée(s) — ${created.resolved_actor || created.handle}`
          : (created.probe_note || 'Aucune publication récupérée pour le moment'),
        status: created.verified ? 'success' : 'warning',
      });
      setNewActor({ platform: newActor.platform, handle: '', label: '' });
      loadWatchlist();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Ajout impossible');
    } finally {
      setAdding(false);
    }
  }, [api, newActor, showToast, loadWatchlist]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await api.removeActor(deleteTarget._id || deleteTarget.id);
      showToast({ title: 'Acteur retiré', description: deleteTarget.label, status: 'success' });
      setDeleteTarget(null);
      loadWatchlist();
    } catch (err) {
      showToast({
        title: 'Suppression impossible',
        description: err?.response?.data?.detail || err?.message,
        status: 'error',
      });
    }
  }, [api, deleteTarget, showToast, loadWatchlist]);

  // ---------------------------------------------------------------- //

  const handleStop = useCallback(() => {
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    setIsScanning(false);
    addLog('Analyse interrompue', 'warning');
  }, [addLog]);

  const handleScan = useCallback(async () => {
    if (watchlist.length === 0) {
      setError('Ajoutez au moins un acteur à la surveillance');
      return;
    }
    if (!auth?.accessToken) {
      setError('🔐 Veuillez vous reconnecter');
      return;
    }

    setIsScanning(true);
    setError(null);
    setReport(null);
    setLog([]);
    setProgress({ value: 0, message: 'Initialisation…' });
    abortRef.current = new AbortController();

    try {
      const query = buildScanStreamQuery({
        topicTerms: scanParams.topicTerms,
        sinceDays: Number(scanParams.sinceDays),
        limitPerActor: Number(scanParams.limitPerActor),
        analyze: scanParams.analyze,
      });
      const url = `${import.meta.env.VITE_API_URL}${actorPaths.scanStream()}?${query}`;

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        signal: abortRef.current.signal,
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      });
      if (!response.ok) {
        let message = `HTTP ${response.status}`;
        try { message = (await response.text()) || message; } catch { /* keep status */ }
        throw new Error(message);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let lastActivity = Date.now();
      const idle = setInterval(() => {
        if (Date.now() - lastActivity > STREAM_IDLE_TIMEOUT) {
          clearInterval(idle);
          reader.cancel();
          setIsScanning(false);
          setError('Flux inactif — analyse interrompue');
        }
      }, 10000);

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) { clearInterval(idle); setIsScanning(false); break; }
          lastActivity = Date.now();
          buffer += decoder.decode(value, { stream: true });

          let nl;
          while ((nl = buffer.indexOf('\n')) !== -1) {
            const line = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);
            if (!line.startsWith('data: ')) continue;
            let data;
            try { data = JSON.parse(line.substring(6)); } catch { continue; }

            switch (data.type) {
              case 'scan_start':
                addLog(`Analyse de ${data.actors} acteur(s) sur ${data.since_days} jours`);
                break;
              case 'fetch_progress':
                setProgress({
                  value: data.progress || 0,
                  message: `Collecte ${data.done}/${data.total} — ${data.handle}`,
                });
                addLog(
                  data.supported
                    ? `${data.platform}/${data.handle} : ${data.posts} publication(s)`
                    : `${data.platform}/${data.handle} : plateforme non collectable`,
                  data.supported ? 'success' : 'warning',
                );
                break;
              case 'fetch_complete':
                setProgress({ value: data.progress || 50,
                              message: `${data.total_posts} publications collectées` });
                break;
              case 'actor_profiled':
                setProgress({
                  value: data.progress || 60,
                  message: `Profilage ${data.done}/${data.total} — ${data.handle}`,
                });
                addLog(
                  `${data.handle} : risque ${data.risk_score} (${data.risk_band}), `
                  + `${data.posts} publication(s)`,
                  ['critical', 'high'].includes(data.risk_band) ? 'error' : 'info',
                );
                break;
              case 'report':
                setReport({ ...data.report, actors: data.actors });
                setProgress({ value: 100, message: 'Analyse terminée' });
                showToast({
                  title: 'Analyse terminée',
                  description: `${data.report?.totals?.actors_flagged || 0} acteur(s) signalé(s)`,
                  status: 'success',
                });
                break;
              case 'scan_complete':
                setProgress({ value: 100, message: `Terminé en ${data.duration_s}s` });
                break;
              case 'error':
                setError(data.message);
                addLog(data.message, 'error');
                break;
              default:
                break;
            }
          }
        }
      } finally {
        clearInterval(idle);
      }
    } catch (err) {
      if (err?.name === 'AbortError') addLog('Flux fermé', 'warning');
      else { setError(err?.message || 'Erreur pendant l’analyse'); }
      setIsScanning(false);
    }
  }, [watchlist, auth, scanParams, addLog, showToast]);

  useEffect(() => () => { if (abortRef.current) abortRef.current.abort(); }, []);

  // ---------------------------------------------------------------- //

  const renderActorCard = (actor, key) => {
    const band = RISK_BANDS[actor.risk_band] || RISK_BANDS.minimal;
    const open = expandedActor === key;
    return (
      <Paper
        key={key}
        elevation={1}
        sx={{
          p: 2, mb: 1.5, borderRadius: 2,
          borderLeft: (t) => `4px solid ${t.palette[band.color]?.main || t.palette.grey[400]}`,
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
          <Chip color={band.color} label={`${band.label} ${actor.risk_score}`}
                sx={{ fontWeight: 700 }} />
          <Box flex={1} minWidth={180}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {actor.actor || actor.handle}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {actor.platform} · {actor.handle}
              {actor.actor_url && (
                <>
                  {' · '}
                  <Link href={actor.actor_url} target="_blank" rel="noopener noreferrer">
                    <FaExternalLinkAlt size={9} />
                  </Link>
                </>
              )}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            <Tooltip title="Publications collectées">
              <Typography variant="caption" color="text.secondary">
                {actor.posts_collected} pub.
              </Typography>
            </Tooltip>
            <Tooltip title="Images collectées">
              <Typography variant="caption" color="text.secondary">
                <FaImage size={10} /> {actor.media?.images ?? 0}
              </Typography>
            </Tooltip>
            <Tooltip title="Vidéos collectées">
              <Typography variant="caption" color="text.secondary">
                <FaVideo size={10} /> {actor.media?.videos ?? 0}
              </Typography>
            </Tooltip>
            {actor.amplification?.total_views != null && (
              <Tooltip title="Vues cumulées">
                <Typography variant="caption" color="text.secondary">
                  <FaEye size={10} /> {Number(actor.amplification.total_views).toLocaleString('fr-FR')}
                </Typography>
              </Tooltip>
            )}
            {actor.amplification?.forwarded_ratio > 0 && (
              <Tooltip title="Part de publications transférées — un relais plutôt qu'une source">
                <Typography variant="caption" color="warning.main">
                  <FaShareAlt size={10} /> {Math.round(actor.amplification.forwarded_ratio * 100)}%
                </Typography>
              </Tooltip>
            )}
            {actor.cadence?.posts_per_day >= 8 && (
              <Tooltip title="Cadence de publication élevée">
                <Typography variant="caption" color="warning.main">
                  <FaBolt size={10} /> {actor.cadence.posts_per_day}/j
                </Typography>
              </Tooltip>
            )}
          </Stack>
          <IconButton size="small" onClick={() => setExpandedActor(open ? null : key)}>
            {open ? <FaChevronUp size={13} /> : <FaChevronDown size={13} />}
          </IconButton>
        </Box>

        <Collapse in={open}>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="caption" sx={{ fontWeight: 700 }} display="block" mb={0.5}>
            Pourquoi ce score
          </Typography>
          {(actor.risk_reasons || []).map((r, i) => (
            <Typography key={i} variant="caption" color="text.secondary" display="block">
              • {r}
            </Typography>
          ))}

          {(actor.top_risk_factors || []).length > 0 && (
            <>
              <Typography variant="caption" sx={{ fontWeight: 700 }} display="block" mt={1.5} mb={0.5}>
                Facteurs récurrents
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.5}>
                {actor.top_risk_factors.map(([factor, count], i) => (
                  <Chip key={i} size="small" variant="outlined"
                        label={`${factor} (${count})`} />
                ))}
              </Stack>
            </>
          )}

          {(actor.worst_posts || []).length > 0 && (
            <>
              <Typography variant="caption" sx={{ fontWeight: 700 }} display="block" mt={1.5} mb={0.5}>
                Publications les plus à risque
              </Typography>
              {actor.worst_posts.map((post, i) => (
                <Box key={i} sx={{
                  p: 1, mb: 0.75, borderRadius: 1,
                  bgcolor: (t) => alpha(t.palette.error.main, 0.04),
                }}
                >
                  <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                    <Chip size="small" color="error" label={`risque ${post.risk_score}`} />
                    {post.is_toxic && <Chip size="small" color="error" label="toxique" />}
                    {post.is_forwarded && <Chip size="small" variant="outlined" label="transféré" />}
                    <Typography variant="caption" color="text.secondary">
                      {String(post.published_at || '').substring(0, 19)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                    {post.excerpt}
                  </Typography>
                  {post.post_url && (
                    <Link href={post.post_url} target="_blank" rel="noopener noreferrer"
                          variant="caption">
                      <FaExternalLinkAlt size={9} /> voir la publication
                    </Link>
                  )}
                </Box>
              ))}
            </>
          )}
        </Collapse>
      </Paper>
    );
  };

  return (
    <Box sx={{ width: '100%', p: { xs: 2, md: 3 } }}>
      {ToastComponent}

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        <FaUserSecret style={{ marginRight: 8 }} />
        Surveillance des acteurs
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Aucune plateforme n&apos;offre de recherche publique par sujet. La
        surveillance fonctionne donc par acteur : vous désignez les comptes, et
        l&apos;application analyse ce qu&apos;ils publient — texte, images et vidéos.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}
               icon={<FaExclamationTriangle />}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ borderRadius: 3, mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable"
              scrollButtons="auto" sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={`Surveillance (${watchlist.length})`} />
          <Tab label="Analyse" />
          <Tab label={`Acteurs (${rankedActors.length})`} />
        </Tabs>

        {/* ---------------- WATCHLIST ---------------- */}
        {tab === 0 && (
          <Box p={{ xs: 2, md: 3 }}>
            <Grid container spacing={2} alignItems="flex-start" mb={2}>
              <Grid size={{ xs: 12, sm: 3 }}>
                <SelectField
                  name="platform"
                  label="Plateforme"
                  value={newActor.platform}
                  onChange={(e) => setNewActor((p) => ({ ...p, platform: e.target.value }))}
                  options={platformOptions.length ? platformOptions : [
                    { key: 'telegram', value: 'Telegram' },
                    { key: 'youtube', value: 'YouTube' },
                  ]}
                  enableSearch={false}
                  disabled={adding}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <InputField
                  fullWidth
                  label="Identifiant du canal / chaîne"
                  name="handle"
                  value={newActor.handle}
                  onChange={(e) => setNewActor((p) => ({ ...p, handle: e.target.value }))}
                  placeholder={newActor.platform === 'telegram'
                    ? 'lefaso_net ou https://t.me/lefaso_net'
                    : 'UC… ou @chaine'}
                  variant="outlined"
                  disabled={adding}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <InputField
                  fullWidth
                  label="Libellé (optionnel)"
                  name="label"
                  value={newActor.label}
                  onChange={(e) => setNewActor((p) => ({ ...p, label: e.target.value }))}
                  variant="outlined"
                  disabled={adding}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 2 }}>
                <Button
                  fullWidth variant="contained" onClick={handleAdd}
                  disabled={adding} startIcon={<FaPlus />} sx={{ py: 1.6 }}
                >
                  Ajouter
                </Button>
              </Grid>
            </Grid>

            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
              L&apos;ajout vérifie d&apos;abord que le compte est accessible — un
              identifiant injoignable enregistré sans contrôle reste silencieux
              pendant des mois.
            </Typography>

            {wlLoading && <LinearProgress sx={{ mb: 2 }} />}

            {watchlist.length === 0 && !wlLoading && (
              <Alert severity="info">
                Aucun acteur surveillé. Ajoutez un canal Telegram public ou une
                chaîne YouTube pour commencer.
              </Alert>
            )}

            <Stack spacing={1}>
              {watchlist.map((row) => (
                <Box
                  key={row._id || row.id}
                  sx={{
                    p: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center',
                    gap: 1.5, flexWrap: 'wrap',
                    border: (t) => `1px solid ${t.palette.divider}`,
                  }}
                >
                  {row.verified
                    ? <FaCheckCircle color="#2e7d32" />
                    : <FaBan color="#ed6c02" />}
                  <Box flex={1} minWidth={200}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {row.label || row.handle}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.platform} · {row.handle}
                      {row.created_at ? ` · ajouté ${formatDate(row.created_at)}` : ''}
                    </Typography>
                    {!row.verified && row.probe_note && (
                      <Typography variant="caption" color="warning.main" display="block">
                        {row.probe_note}
                      </Typography>
                    )}
                  </Box>
                  {row.verified && (
                    <Chip size="small" color="success"
                          label={`${row.probe_posts} pub. au test`} />
                  )}
                  <Tooltip title="Retirer">
                    <IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}>
                      <FaTrash size={13} />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
            </Stack>

            {/* Platform capability, stated plainly. */}
            {platforms && (
              <Box mt={3}>
                <Button size="small" onClick={() => setShowUnsupported((v) => !v)}
                        endIcon={showUnsupported ? <FaChevronUp /> : <FaChevronDown />}>
                  Quelles plateformes sont collectables ?
                </Button>
                <Collapse in={showUnsupported}>
                  <Grid container spacing={2} mt={1}>
                    {(platforms.supported || []).map((p) => (
                      <Grid size={{ xs: 12, md: 6 }} key={p.platform}>
                        <Alert severity="success" sx={{ height: '100%' }}>
                          <AlertTitle>{p.label}</AlertTitle>
                          <Typography variant="caption" display="block">{p.how}</Typography>
                          <Typography variant="caption" display="block">
                            Collecte : {(p.collects || []).join(', ')}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            {p.caveat}
                          </Typography>
                        </Alert>
                      </Grid>
                    ))}
                    {(platforms.unsupported || []).map((p) => (
                      <Grid size={{ xs: 12, md: 6 }} key={p.platform}>
                        <Alert severity="warning" sx={{ height: '100%' }}>
                          <AlertTitle sx={{ textTransform: 'capitalize' }}>
                            {p.platform}
                          </AlertTitle>
                          <Typography variant="caption">{p.reason}</Typography>
                        </Alert>
                      </Grid>
                    ))}
                  </Grid>
                </Collapse>
              </Box>
            )}
          </Box>
        )}

        {/* ---------------- SCAN ---------------- */}
        {tab === 1 && (
          <Box p={{ xs: 2, md: 3 }}>
            <Grid container spacing={2} mb={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <InputField
                  fullWidth
                  label="Mots-clés du sujet (optionnel)"
                  name="topicTerms"
                  value={scanParams.topicTerms}
                  onChange={(e) => setScanParams((p) => ({ ...p, topicTerms: e.target.value }))}
                  placeholder="motos, douane, enchères"
                  variant="outlined"
                  disabled={isScanning}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <SelectField
                  name="sinceDays"
                  label="Période"
                  value={scanParams.sinceDays}
                  onChange={(e) => setScanParams((p) => ({ ...p, sinceDays: e.target.value }))}
                  options={SINCE_OPTIONS}
                  enableSearch={false}
                  disabled={isScanning}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 2 }}>
                <InputField
                  fullWidth type="number"
                  label="Pub. / acteur"
                  name="limitPerActor"
                  value={scanParams.limitPerActor}
                  onChange={(e) => setScanParams((p) => ({ ...p, limitPerActor: e.target.value }))}
                  inputProps={{ min: 1, max: 100 }}
                  variant="outlined"
                  disabled={isScanning}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <FormControlLabel
                  control={(
                    <Checkbox
                      checked={scanParams.analyze}
                      onChange={(e) => setScanParams((p) => ({ ...p, analyze: e.target.checked }))}
                      disabled={isScanning}
                    />
                  )}
                  label="Classification IA"
                />
              </Grid>
            </Grid>

            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
              Sans mots-clés, chaque acteur est profilé sur l&apos;ensemble de ses
              publications récentes. Avec mots-clés, seules les publications qui
              les mentionnent sont retenues.
            </Typography>

            <Stack direction="row" spacing={2} mb={2}>
              <Button
                variant="contained" size="large" onClick={handleScan}
                disabled={isScanning || watchlist.length === 0}
                startIcon={isScanning ? <FaSpinner /> : <FaRocket />}
                sx={{ flex: 1, py: 1.4, fontWeight: 700 }}
              >
                {isScanning ? 'Analyse en cours…' : `Analyser ${watchlist.length} acteur(s)`}
              </Button>
              {isScanning && (
                <Button variant="outlined" color="error" onClick={handleStop}
                        startIcon={<FaStop />}>
                  Arrêter
                </Button>
              )}
            </Stack>

            {(isScanning || progress.value > 0) && (
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {progress.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {Math.round(progress.value)}%
                  </Typography>
                </Box>
                <LinearProgress variant="determinate"
                                value={Math.min(progress.value, 100)}
                                sx={{ height: 7, borderRadius: 4 }} />
              </Box>
            )}

            {log.length > 0 && (
              <Box sx={{
                mb: 2, maxHeight: 180, overflowY: 'auto', p: 1.5, borderRadius: 2,
                bgcolor: (t) => alpha(t.palette.text.primary, 0.03),
              }}
              >
                {log.slice().reverse().map((e, i) => (
                  <Typography key={i} variant="caption" display="block"
                              sx={{
                                fontFamily: 'monospace',
                                color: e.severity === 'error' ? 'error.main'
                                  : e.severity === 'warning' ? 'warning.main'
                                    : e.severity === 'success' ? 'success.main'
                                      : 'text.secondary',
                              }}
                  >
                    {`${e.at}  ${e.message}`}
                  </Typography>
                ))}
              </Box>
            )}

            {report && (
              <>
                <Grid container spacing={2} mb={2}>
                  {[
                    ['Acteurs analysés', report.totals?.actors_scanned],
                    ['Signalés', report.totals?.actors_flagged],
                    ['Publications', report.totals?.posts_collected],
                    ['Images / Vidéos',
                      `${report.totals?.images_collected ?? 0} / ${report.totals?.videos_collected ?? 0}`],
                  ].map(([label, value]) => (
                    <Grid size={{ xs: 6, md: 3 }} key={label}>
                      <Box sx={{ p: 1.5, borderRadius: 2,
                                 border: (t) => `1px solid ${t.palette.divider}` }}
                      >
                        <Typography variant="caption" color="text.secondary" display="block">
                          {label}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {value ?? 0}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                {(report.notes || []).map((note, i) => (
                  <Alert key={i} severity="info" sx={{ mb: 1 }}>{note}</Alert>
                ))}

                <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 2, mb: 1.5 }}>
                  Classement par risque
                </Typography>
                {(report.actors || []).map((a, i) => renderActorCard(a, `scan-${i}`))}
              </>
            )}
          </Box>
        )}

        {/* ---------------- RANKED ---------------- */}
        {tab === 2 && (
          <Box p={{ xs: 2, md: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Dernier risque connu par acteur
              </Typography>
              <Tooltip title="Rafraîchir">
                <IconButton onClick={loadRanked}><FaSyncAlt size={14} /></IconButton>
              </Tooltip>
            </Box>
            {rankedActors.length === 0 && (
              <Alert severity="info">
                Aucune analyse enregistrée pour le moment.
              </Alert>
            )}
            {rankedActors.map((a, i) => renderActorCard(a, `ranked-${i}`))}
          </Box>
        )}
      </Paper>

      <CustomModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Retirer cet acteur ?"
        onConfirm={handleDelete}
        confirmText="Retirer"
        confirmColor="error"
        cancelText="Annuler"
      >
        <Typography variant="body2">
          « {deleteTarget?.label || deleteTarget?.handle} » ne sera plus analysé.
          Les analyses déjà enregistrées sont conservées.
        </Typography>
      </CustomModal>
    </Box>
  );
};

export default ActorMonitor;
