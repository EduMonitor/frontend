// src/features/factcheck/FactCheckCollect.jsx
//
// Launches a topic collection and streams progress from
// GET /api/v2/factcheck/collect/stream (SSE).
//
// Uses fetch + manual SSE parsing with an Authorization header, matching
// Dorking.scrapers.jsx. EventSource cannot send headers, which is why the
// older useSSE hook needed a separate stream-auth endpoint that no longer
// exists on the backend.
//
// Event types emitted by TopicCollector.collect():
//   plan | discovery_progress | discovery_complete | social_skipped
//   extraction_progress | extraction_complete | complete | dossier | error

import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Grid, Button, Chip, FormControlLabel, Checkbox, Alert,
  Typography, LinearProgress, Stack, Divider, Tooltip, alpha, AlertTitle,
} from '@mui/material';
import {
  FaStop, FaRocket, FaCheckCircle, FaExclamationTriangle, FaSpinner,
  FaListUl, FaBalanceScale, FaMapMarkerAlt, FaFileAlt, FaEye,
} from 'react-icons/fa';
import InputField from '../../components/forms/input.forms';
import SelectField from '../../components/forms/select.forms';
import useAxiosPrivate from '../../utils/hooks/instance/axiosprivate.instance';
import useAuth from '../../utils/hooks/contexts/useAth.contexts';
import useToast from '../../components/toast/toast.toast';
import {
  COLLECT_DEPTHS, COLLECT_LANES, COLLECT_COUNTRIES, FRESHNESS_OPTIONS,
  LANGUAGES, CREDIBILITY_COLORS,
} from '../../constants/Params.contants';
import { AdminRoutes } from '../../constants/routes.constant';
import factcheckApi, { buildCollectQuery, factcheckPaths } from './api.factcheck';
import CapacityPanel from './CapacityPanel';

const STREAM_IDLE_TIMEOUT = 180000; // a deep run can be quiet while fetching

const FactCheckCollect = () => {
  const abortControllerRef = useRef(null);
  const axiosPrivate = useAxiosPrivate();
  const { auth } = useAuth();
  const navigate = useNavigate();
  const { showToast, ToastComponent } = useToast();

  const [params, setParams] = useState({
    topic: '',
    depth: 'standard',
    language: 'fr',
    countries: ['BF'],
    freshnessDays: '',
    lanes: [],                 // empty = every lane
    maxExtract: 120,
    includeSocial: true,
    extract: true,
  });

  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [progress, setProgress] = useState({ value: 0, message: '', stage: '' });
  const [log, setLog] = useState([]);
  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [dossier, setDossier] = useState(null);
  const [topSources, setTopSources] = useState([]);

  const addLog = useCallback((message, severity = 'info') => {
    setLog((prev) => [
      ...prev.slice(-199),
      { message, severity, at: new Date().toLocaleTimeString('fr-FR') },
    ]);
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value, checked, type } = e.target;
    setParams((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }, []);

  const validate = useCallback(() => {
    const next = {};
    if (!params.topic || params.topic.trim().length < 3) {
      next.topic = 'Le sujet doit contenir au moins 3 caractères';
    }
    if (!params.countries || params.countries.length === 0) {
      next.countries = 'Choisissez au moins un pays';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [params]);

  // ------------------------------------------------------------------ //
  // PLAN PREVIEW — spends zero search requests
  // ------------------------------------------------------------------ //

  const handlePreviewPlan = useCallback(async () => {
    if (!validate()) return;
    setPlanLoading(true);
    setError(null);
    try {
      const data = await factcheckApi(axiosPrivate).previewPlan(params);
      setPlan(data);
      showToast({
        title: 'Plan généré',
        description: `${data.total_queries} requêtes prévues — aucune requête consommée`,
        status: 'success',
      });
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Échec du plan');
    } finally {
      setPlanLoading(false);
    }
  }, [axiosPrivate, params, validate, showToast]);

  // ------------------------------------------------------------------ //
  // BACKGROUND RUN — for deep/exhaustive, which outlive an HTTP timeout
  // ------------------------------------------------------------------ //

  const handleBackgroundRun = useCallback(async () => {
    if (!validate()) return;
    setError(null);
    try {
      const data = await factcheckApi(axiosPrivate).startBackgroundCollect(params);
      showToast({
        title: 'Collecte lancée en arrière-plan',
        description: `Job ${data.job_id} — suivez-la dans les dossiers`,
        status: 'info',
      });
      addLog(`Collecte en arrière-plan démarrée (job ${data.job_id})`, 'success');
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Échec du lancement');
    }
  }, [axiosPrivate, params, validate, showToast, addLog]);

  // ------------------------------------------------------------------ //
  // STREAMED RUN
  // ------------------------------------------------------------------ //

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsRunning(false);
    addLog('Collecte interrompue par l’analyste', 'warning');
  }, [addLog]);

  const handleCollect = useCallback(async (event) => {
    if (event) event.preventDefault();
    if (!validate()) return;

    if (!auth?.accessToken) {
      setError('🔐 Veuillez vous reconnecter pour lancer une collecte');
      return;
    }

    setIsRunning(true);
    setError(null);
    setDossier(null);
    setTopSources([]);
    setLog([]);
    setProgress({ value: 0, message: 'Initialisation…', stage: 'init' });

    abortControllerRef.current = new AbortController();

    try {
      const query = buildCollectQuery(params);
      const url = `${import.meta.env.VITE_API_URL}${factcheckPaths.collectStream()}?${query}`;

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        signal: abortControllerRef.current.signal,
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        let message = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const text = await response.text();
          if (text) message = text;
        } catch {
          // keep the status-line message
        }
        throw new Error(message);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let lastActivity = Date.now();

      const idleChecker = setInterval(() => {
        if (Date.now() - lastActivity > STREAM_IDLE_TIMEOUT) {
          clearInterval(idleChecker);
          reader.cancel();
          setIsRunning(false);
          setError('Flux inactif — collecte interrompue');
        }
      }, 10000);

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            clearInterval(idleChecker);
            setIsRunning(false);
            break;
          }
          lastActivity = Date.now();
          buffer += decoder.decode(value, { stream: true });

          let newlineIndex;
          while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
            const line = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);
            if (!line || !line.startsWith('data: ')) continue;

            let data;
            try {
              data = JSON.parse(line.substring(6));
            } catch {
              continue;   // partial frame; the next chunk completes it
            }

            switch (data.type) {
              case 'plan':
                setProgress({
                  value: 2,
                  message: `${data.total_queries} requêtes sur ${data.lanes?.length || 0} pistes`,
                  stage: 'plan',
                });
                addLog(
                  `Plan: ${data.total_queries} requêtes — pistes: ${(data.lanes || []).join(', ')}`
                );
                if (data.entities?.length) {
                  addLog(`Entités détectées: ${data.entities.join(', ')}`);
                }
                break;

              case 'discovery_progress':
                setProgress({
                  value: data.progress || 0,
                  message: `Recherche ${data.done}/${data.total} — ${data.hits_total} URL uniques`,
                  stage: 'discovery',
                });
                if (data.new_hits > 0) {
                  addLog(
                    `[${data.lane}] +${data.new_hits} résultat(s) · ${data.query?.substring(0, 70)}`,
                    'success'
                  );
                }
                break;

              case 'discovery_complete':
                setProgress({
                  value: data.progress || 45,
                  message: `${data.unique_urls} URL uniques découvertes`,
                  stage: 'discovery_done',
                });
                addLog(`Découverte terminée: ${data.unique_urls} URL uniques`, 'success');
                addLog(`Par fournisseur: ${JSON.stringify(data.by_provider)}`);
                break;

              case 'social_skipped':
                addLog(
                  `${data.count} URL de réseaux sociaux non extraites (${data.reason})`,
                  'warning'
                );
                break;

              case 'extraction_progress':
                setProgress({
                  value: data.progress || 50,
                  message: `Extraction ${data.done}/${data.total} — crédibilité ${data.credibility}`,
                  stage: 'extraction',
                });
                break;

              case 'extraction_complete':
                setProgress({
                  value: data.progress || 95,
                  message: `${data.extracted} pages analysées`,
                  stage: 'extraction_done',
                });
                addLog(`Extraction terminée: ${data.extracted} pages`, 'success');
                break;

              case 'complete':
                setProgress({
                  value: 100,
                  message: `Terminé en ${data.duration_s}s — ${data.sources} sources, `
                    + `${data.addresses} adresse(s), ${data.claim_reviews} verdict(s)`,
                  stage: 'complete',
                });
                addLog(
                  `Collecte terminée: ${data.sources} sources, ${data.addresses} adresses, `
                  + `${data.claim_reviews} verdicts`,
                  'success'
                );
                break;

              case 'dossier':
                setDossier(data.dossier);
                setTopSources(data.top_sources || []);
                showToast({
                  title: 'Dossier prêt',
                  description: `${data.dossier?.totals?.sources_extracted || 0} sources analysées`,
                  status: 'success',
                });
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
        clearInterval(idleChecker);
      }
    } catch (err) {
      if (err?.name === 'AbortError') {
        addLog('Flux fermé', 'warning');
      } else {
        setError(err?.message || 'Erreur inconnue pendant la collecte');
        addLog(err?.message || 'Erreur inconnue', 'error');
      }
      setIsRunning(false);
    }
  }, [auth, params, validate, addLog, showToast]);

  useEffect(() => () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
  }, []);

  const totals = dossier?.totals || {};
  const assessment = dossier?.assessment || {};

  return (
    <Box sx={{ width: '100%', p: { xs: 2, md: 3 } }}>
      {ToastComponent}

      <CapacityPanel compact />

      <Paper
        elevation={3}
        sx={{
          p: { xs: 2.5, md: 4 },
          mb: 3,
          borderRadius: 3,
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        }}
      >
        <form onSubmit={handleCollect}>
          <Stack spacing={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h4"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  background: (theme) =>
                    `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                ⚖️ Collecte de preuves
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Un sujet devient un plan de requêtes sur plusieurs pistes : verdicts
                existants, presse, sources officielles, médias locaux, documents,
                adresses réelles.
              </Typography>
            </Box>

            <Divider />

            <InputField
              fullWidth
              label="Sujet ou affirmation à vérifier"
              name="topic"
              value={params.topic}
              onChange={handleChange}
              error={!!errors.topic}
              errorMessage={errors.topic}
              placeholder="Ex : la douane burkinabè organise une vente aux enchères de motos"
              variant="outlined"
              isRequired
              disabled={isRunning}
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <SelectField
                  name="depth"
                  label="Profondeur"
                  value={params.depth}
                  onChange={handleChange}
                  options={COLLECT_DEPTHS}
                  enableSearch={false}
                  disabled={isRunning}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <SelectField
                  name="countries"
                  label="Pays"
                  value={params.countries}
                  onChange={handleChange}
                  options={COLLECT_COUNTRIES}
                  multiple
                  enableSearch={false}
                  error={!!errors.countries}
                  helperText={errors.countries}
                  disabled={isRunning}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <SelectField
                  name="language"
                  label="Langue"
                  value={params.language}
                  onChange={handleChange}
                  options={LANGUAGES}
                  enableSearch={false}
                  disabled={isRunning}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <SelectField
                  name="freshnessDays"
                  label="Période"
                  value={params.freshnessDays}
                  onChange={handleChange}
                  options={FRESHNESS_OPTIONS}
                  enableSearch={false}
                  disabled={isRunning}
                />
              </Grid>
            </Grid>

            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                🎯 Pistes de recherche
                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  (aucune sélection = toutes les pistes)
                </Typography>
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {COLLECT_LANES.map((lane) => {
                  const selected = params.lanes.includes(lane.key);
                  return (
                    <Tooltip key={lane.key} title={lane.description} arrow>
                      <Chip
                        label={`${lane.icon} ${lane.value}`}
                        onClick={() => setParams((prev) => ({
                          ...prev,
                          lanes: selected
                            ? prev.lanes.filter((l) => l !== lane.key)
                            : [...prev.lanes, lane.key],
                        }))}
                        color={selected ? 'primary' : 'default'}
                        variant={selected ? 'filled' : 'outlined'}
                        disabled={isRunning}
                        sx={{ fontWeight: 500 }}
                      />
                    </Tooltip>
                  );
                })}
              </Stack>
            </Box>

            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 4 }}>
                <InputField
                  fullWidth
                  type="number"
                  label="Pages à analyser (max)"
                  name="maxExtract"
                  value={params.maxExtract}
                  onChange={handleChange}
                  inputProps={{ min: 1, max: 400 }}
                  variant="outlined"
                  disabled={isRunning}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControlLabel
                  control={(
                    <Checkbox
                      checked={params.includeSocial}
                      name="includeSocial"
                      onChange={handleChange}
                      disabled={isRunning}
                    />
                  )}
                  label="Inclure les réseaux sociaux (diffusion)"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControlLabel
                  control={(
                    <Checkbox
                      checked={params.extract}
                      name="extract"
                      onChange={handleChange}
                      disabled={isRunning}
                    />
                  )}
                  label="Extraire le contenu des pages"
                />
              </Grid>
            </Grid>

            <Divider />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isRunning}
                startIcon={isRunning ? <FaSpinner className="fa-spin" /> : <FaRocket />}
                sx={{ flex: 1, py: 1.5, fontWeight: 700 }}
              >
                {isRunning ? 'Collecte en cours…' : 'Lancer la collecte'}
              </Button>

              <Button
                variant="outlined"
                size="large"
                onClick={handlePreviewPlan}
                disabled={isRunning || planLoading}
                startIcon={<FaListUl />}
                sx={{ py: 1.5 }}
              >
                Aperçu du plan
              </Button>

              <Tooltip title="Pour les profondeurs « approfondi » et « exhaustif » : la collecte continue même si vous quittez la page">
                <Button
                  variant="outlined"
                  color="secondary"
                  size="large"
                  onClick={handleBackgroundRun}
                  disabled={isRunning}
                  sx={{ py: 1.5 }}
                >
                  Arrière-plan
                </Button>
              </Tooltip>

              {isRunning && (
                <Button
                  variant="outlined"
                  color="error"
                  size="large"
                  onClick={handleStop}
                  startIcon={<FaStop />}
                  sx={{ py: 1.5 }}
                >
                  Arrêter
                </Button>
              )}
            </Stack>
          </Stack>
        </form>
      </Paper>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          icon={<FaExclamationTriangle />}
          onClose={() => setError(null)}
        >
          <AlertTitle>Erreur</AlertTitle>
          {error}
        </Alert>
      )}

      {(isRunning || progress.value > 0) && (
        <Paper elevation={2} sx={{ p: 2.5, mb: 3, borderRadius: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {progress.message || 'En cours…'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {Math.round(progress.value)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(progress.value, 100)}
            sx={{ height: 8, borderRadius: 4 }}
          />

          {log.length > 0 && (
            <Box
              sx={{
                mt: 2, maxHeight: 220, overflowY: 'auto',
                bgcolor: (theme) => alpha(theme.palette.text.primary, 0.03),
                borderRadius: 2, p: 1.5,
              }}
            >
              {log.slice().reverse().map((entry, i) => (
                <Typography
                  key={`${entry.at}-${i}`}
                  variant="caption"
                  display="block"
                  sx={{
                    fontFamily: 'monospace',
                    color: entry.severity === 'error' ? 'error.main'
                      : entry.severity === 'warning' ? 'warning.main'
                        : entry.severity === 'success' ? 'success.main'
                          : 'text.secondary',
                  }}
                >
                  {`${entry.at}  ${entry.message}`}
                </Typography>
              ))}
            </Box>
          )}
        </Paper>
      )}

      {plan && (
        <Paper elevation={2} sx={{ p: 2.5, mb: 3, borderRadius: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            📋 Plan — {plan.total_queries} requêtes, aucune consommée
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
            Langue : {plan.language} · Pays : {(plan.countries || []).join(', ')}
            {plan.entities?.length ? ` · Entités : ${plan.entities.join(', ')}` : ''}
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {Object.entries(plan.queries_by_lane || {}).map(([lane, count]) => (
              <Chip key={lane} size="small" variant="outlined" label={`${lane}: ${count}`} />
            ))}
          </Stack>
        </Paper>
      )}

      {dossier && (
        <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} mb={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              <FaCheckCircle style={{ marginRight: 8, color: '#2e7d32' }} />
              Dossier {dossier.run_id}
            </Typography>
            <Button
              variant="contained"
              startIcon={<FaEye />}
              onClick={() => navigate(`/ai/${AdminRoutes.FactCheck.DossierView.replace(':runId', dossier.run_id)}`)}
            >
              Ouvrir le dossier complet
            </Button>
          </Box>

          <Grid container spacing={2} mb={2}>
            {[
              { icon: <FaFileAlt />, label: 'Sources analysées', value: `${totals.sources_extracted || 0} (${totals.sources_reachable || 0} actives)` },
              { icon: <FaBalanceScale />, label: 'Verdicts existants', value: totals.claim_reviews || 0 },
              { icon: <FaMapMarkerAlt />, label: 'Adresses', value: `${totals.addresses_found || 0} (${totals.addresses_verified || 0} vérifiées)` },
              { icon: <FaListUl />, label: 'Mots collectés', value: (totals.total_words_collected || 0).toLocaleString('fr-FR') },
            ].map((stat) => (
              <Grid size={{ xs: 6, md: 3 }} key={stat.label}>
                <Box sx={{ p: 1.5, borderRadius: 2, border: (t) => `1px solid ${t.palette.divider}` }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {stat.icon} {stat.label}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{stat.value}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Freshness up front: "did this sweep find current reporting?" is
              the first question, and the collector now answers it. */}
          {(assessment.recency?.dated_sources > 0) && (
            <Stack direction="row" flexWrap="wrap" gap={1} mb={2}>
              <Chip
                size="small"
                color={assessment.recency.within_7_days > 0 ? 'success' : 'default'}
                label={`${assessment.recency.within_7_days || 0} source(s) · 7 derniers jours`}
              />
              <Chip
                size="small"
                color={assessment.recency.within_30_days > 0 ? 'success' : 'warning'}
                label={`${assessment.recency.within_30_days || 0} · 30 derniers jours`}
              />
              <Chip
                size="small"
                variant="outlined"
                label={`âge médian ${assessment.recency.median_age_days} j`}
              />
              {assessment.recency.undated_sources > 0 && (
                <Chip
                  size="small"
                  color="error"
                  variant="outlined"
                  label={`${assessment.recency.undated_sources} sans date`}
                />
              )}
            </Stack>
          )}

          {assessment.corroboration && (
            <Alert
              severity={
                (assessment.independent_credible_domains || 0) >= 3 ? 'success'
                  : (assessment.independent_credible_domains || 0) >= 1 ? 'warning' : 'error'
              }
              sx={{ mb: 2 }}
            >
              <AlertTitle>Corroboration : {assessment.corroboration}</AlertTitle>
              {assessment.dominant_verdict
                && `Verdict dominant des fact-checkeurs : ${assessment.dominant_verdict}`}
            </Alert>
          )}

          {(assessment.notes || []).length > 0 && (
            <Box mb={2}>
              {assessment.notes.map((note, i) => (
                <Typography key={i} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  • {note}
                </Typography>
              ))}
            </Box>
          )}

          {topSources.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                Meilleures sources
              </Typography>
              <Stack spacing={1.5}>
                {topSources.slice(0, 10).map((src) => {
                  const cred = CREDIBILITY_COLORS[src.credibility_label]
                    || CREDIBILITY_COLORS.unextracted;
                  return (
                    <Box
                      key={src.url}
                      sx={{
                        p: 1.5, borderRadius: 2,
                        border: (t) => `1px solid ${t.palette.divider}`,
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={0.5}>
                        <Chip
                          size="small"
                          color={cred.color}
                          label={`${cred.label}${src.credibility_score != null ? ` ${src.credibility_score}` : ''}`}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {src.domain}
                        </Typography>
                        <Chip size="small" variant="outlined" label={src.lane} />
                        <Chip size="small" variant="outlined" label={`via ${src.found_by}`} />
                      </Box>
                      <Typography variant="body2">{src.title}</Typography>
                      <Typography
                        variant="caption"
                        component="a"
                        href={src.final_url || src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: 'primary.main', wordBreak: 'break-all' }}
                      >
                        {src.final_url || src.url}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {[
                          src.authors?.length ? `par ${src.authors.slice(0, 2).join(', ')}` : null,
                          src.published_at ? String(src.published_at).substring(0, 19) : null,
                          src.word_count ? `${src.word_count} mots` : null,
                        ].filter(Boolean).join(' · ')}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            </>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default FactCheckCollect;
