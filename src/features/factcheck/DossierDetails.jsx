// src/features/factcheck/DossierDetails.jsx
//
// One dossier in full. Each tab maps to its own backend endpoint so a dossier
// with hundreds of sources never arrives in a single payload:
//
//   Synthèse  GET /dossiers/{run_id}                 (sources excluded)
//   Sources   GET /dossiers/{run_id}/sources         (paginated + filters)
//   Adresses  GET /dossiers/{run_id}/addresses       (+ entity profiles)
//   Verdicts  GET /dossiers/{run_id}/verdicts        (+ attention timeline)

import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Grid, Chip, Stack, Divider, Alert, AlertTitle,
  Tabs, Tab, LinearProgress, Button, Pagination, Tooltip, Link,
  FormControlLabel, Checkbox, IconButton, alpha,
} from '@mui/material';
import {
  FaArrowLeft, FaSyncAlt, FaExternalLinkAlt, FaMapMarkerAlt, FaBalanceScale,
  FaFileAlt, FaGlobe, FaArchive, FaUser, FaCalendarAlt, FaBuilding,
  FaExclamationTriangle,
} from 'react-icons/fa';
import SelectField from '../../components/forms/select.forms';
import useAxiosPrivate from '../../utils/hooks/instance/axiosprivate.instance';
import { formatDate } from '../../utils/functions/format-date.functions';
import {
  CREDIBILITY_COLORS, VERDICT_COLORS, COLLECT_LANES,
} from '../../constants/Params.contants';
import { AdminRoutes } from '../../constants/routes.constant';
import factcheckApi from './api.factcheck';

const SOURCES_PAGE_SIZE = 20;

const LANE_OPTIONS = [
  { key: '', value: 'Toutes les pistes', icon: '🌐' },
  ...COLLECT_LANES.map((l) => ({ key: l.key, value: l.value, icon: l.icon })),
];

const CREDIBILITY_FILTER = [
  { key: '', value: 'Toute crédibilité' },
  { key: '70', value: 'Élevée (≥ 70)' },
  { key: '50', value: 'Moyenne ou + (≥ 50)' },
  { key: '30', value: 'Faible ou + (≥ 30)' },
];

const DossierDetails = () => {
  const { runId } = useParams();
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const api = factcheckApi(axiosPrivate);

  const [tab, setTab] = useState(0);
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sources tab
  const [sources, setSources] = useState([]);
  const [sourcesTotal, setSourcesTotal] = useState(0);
  const [sourcesPage, setSourcesPage] = useState(1);
  const [laneFilter, setLaneFilter] = useState('');
  const [credFilter, setCredFilter] = useState('');
  const [reachableOnly, setReachableOnly] = useState(false);
  const [excludeSocial, setExcludeSocial] = useState(false);
  const [sourcesLoading, setSourcesLoading] = useState(false);

  // Addresses + verdicts tabs
  const [addressData, setAddressData] = useState(null);
  const [verdictData, setVerdictData] = useState(null);

  const loadDossier = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDossier(await api.getDossier(runId, false));
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Dossier introuvable');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, axiosPrivate]);

  const loadSources = useCallback(async () => {
    setSourcesLoading(true);
    try {
      const data = await api.getSources(runId, {
        page: sourcesPage,
        pageSize: SOURCES_PAGE_SIZE,
        lane: laneFilter,
        minCredibility: credFilter,
        reachableOnly,
        excludeSocial,
      });
      setSources(data.sources || []);
      setSourcesTotal(data.total || 0);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Sources indisponibles');
    } finally {
      setSourcesLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, sourcesPage, laneFilter, credFilter, reachableOnly, excludeSocial, axiosPrivate]);

  useEffect(() => { loadDossier(); }, [loadDossier]);

  useEffect(() => {
    if (tab === 1) loadSources();
    if (tab === 2 && !addressData) {
      api.getAddresses(runId).then(setAddressData).catch(() => {});
    }
    if (tab === 3 && !verdictData) {
      api.getVerdicts(runId).then(setVerdictData).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, loadSources, runId]);

  if (loading) return <Box p={3}><LinearProgress /></Box>;

  if (error && !dossier) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button startIcon={<FaArrowLeft />} onClick={() => navigate(-1)}>
          Retour
        </Button>
      </Box>
    );
  }

  const totals = dossier?.totals || {};
  const assessment = dossier?.assessment || {};
  const coverage = dossier?.coverage || {};
  const credible = assessment.independent_credible_domains || 0;
  const recency = assessment.recency || {};
  const bridge = dossier?.osint_bridge || {};

  const statCards = [
    { label: 'Requêtes', value: totals.queries_run || 0, icon: <FaGlobe /> },
    { label: 'URL découvertes', value: totals.urls_discovered || 0, icon: <FaGlobe /> },
    {
      label: 'Sources analysées',
      value: `${totals.sources_extracted || 0} / ${totals.sources_reachable || 0} actives`,
      icon: <FaFileAlt />,
    },
    { label: 'Verdicts', value: totals.claim_reviews || 0, icon: <FaBalanceScale /> },
    {
      label: 'Adresses',
      value: `${totals.addresses_found || 0} (${totals.addresses_verified || 0} ✓)`,
      icon: <FaMapMarkerAlt />,
    },
    { label: 'Documents PDF', value: totals.documents || 0, icon: <FaFileAlt /> },
    { label: 'Organisations', value: totals.organizations || 0, icon: <FaBuilding /> },
    {
      label: 'Mots collectés',
      value: (totals.total_words_collected || 0).toLocaleString('fr-FR'),
      icon: <FaFileAlt />,
    },
  ];

  return (
    <Box sx={{ width: '100%', p: { xs: 2, md: 3 } }}>
      <Box display="flex" alignItems="center" gap={1.5} mb={2} flexWrap="wrap">
        <IconButton onClick={() => navigate(`/ai/${AdminRoutes.FactCheck.Dossiers}`)}>
          <FaArrowLeft size={16} />
        </IconButton>
        <Box flex={1} minWidth={200}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{dossier?.topic}</Typography>
          <Typography variant="caption" color="text.secondary">
            {dossier?.run_id}
            {dossier?.started_at ? ` · ${formatDate(dossier.started_at)}` : ''}
            {dossier?.duration_seconds ? ` · ${dossier.duration_seconds}s` : ''}
            {dossier?.analyst_email ? ` · ${dossier.analyst_email}` : ''}
          </Typography>
        </Box>
        <Tooltip title="Rafraîchir">
          <IconButton onClick={loadDossier}><FaSyncAlt size={15} /></IconButton>
        </Tooltip>
      </Box>

      <Alert
        severity={credible >= 3 ? 'success' : credible >= 1 ? 'warning' : 'error'}
        sx={{ mb: 3 }}
      >
        <AlertTitle sx={{ fontWeight: 700 }}>
          Corroboration : {assessment.corroboration || 'non évaluée'}
        </AlertTitle>
        {assessment.dominant_verdict && (
          <Typography variant="body2">
            Verdict dominant des fact-checkeurs : <strong>{assessment.dominant_verdict}</strong>
          </Typography>
        )}
        {assessment.earliest_publication && (
          <Typography variant="body2">
            Fenêtre de publication : {String(assessment.earliest_publication).substring(0, 10)}
            {' → '}
            {String(assessment.latest_publication || '').substring(0, 10)}
          </Typography>
        )}
      </Alert>

      <Paper elevation={2} sx={{ borderRadius: 3, mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Synthèse" />
          <Tab label={`Sources (${totals.sources_extracted || 0})`} />
          <Tab label={`Adresses (${totals.addresses_found || 0})`} />
          <Tab label={`Verdicts (${totals.claim_reviews || 0})`} />
        </Tabs>

        {/* ---------------- SYNTHÈSE ---------------- */}
        {tab === 0 && (
          <Box p={{ xs: 2, md: 3 }}>
            <Grid container spacing={2} mb={3}>
              {statCards.map((s) => (
                <Grid size={{ xs: 6, sm: 4, md: 3 }} key={s.label}>
                  <Box sx={{ p: 1.5, borderRadius: 2, border: (t) => `1px solid ${t.palette.divider}` }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {s.icon} {s.label}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {s.value}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* Freshness — the collector reports the real age distribution of
                the evidence, so an analyst can tell "no recent coverage
                exists" from "the search window was wrong". */}
            {recency.dated_sources > 0 && (
              <Box
                sx={{
                  p: 2, mb: 3, borderRadius: 2,
                  border: (t) => `1px solid ${t.palette.divider}`,
                  bgcolor: (t) => alpha(
                    recency.within_30_days > 0
                      ? t.palette.success.main
                      : t.palette.warning.main,
                    0.05,
                  ),
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  <FaCalendarAlt style={{ marginRight: 6 }} />
                  Fraîcheur des sources
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1} mb={1}>
                  <Chip
                    size="small"
                    color={recency.within_7_days > 0 ? 'success' : 'default'}
                    label={`${recency.within_7_days || 0} · 7 derniers jours`}
                  />
                  <Chip
                    size="small"
                    color={recency.within_30_days > 0 ? 'success' : 'warning'}
                    label={`${recency.within_30_days || 0} · 30 derniers jours`}
                  />
                  <Chip size="small" variant="outlined"
                        label={`${recency.within_90_days || 0} · 90 jours`} />
                  {recency.older_than_year > 0 && (
                    <Chip size="small" color="warning" variant="outlined"
                          label={`${recency.older_than_year} · plus d'un an`} />
                  )}
                  {recency.undated_sources > 0 && (
                    <Chip size="small" color="error" variant="outlined"
                          label={`${recency.undated_sources} · sans date`} />
                  )}
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Source la plus récente : {recency.newest_age_days} jour(s) ·
                  âge médian : {recency.median_age_days} jour(s) ·
                  plus ancienne : {recency.oldest_age_days} jour(s)
                </Typography>
              </Box>
            )}

            {/* Where this dossier landed in the OSINT collections, so the
                analyst can jump to the existing entity/session screens. */}
            {bridge.published && (
              <Alert severity="success" sx={{ mb: 3 }} icon={<FaBuilding />}>
                <AlertTitle>Intégré aux données OSINT</AlertTitle>
                <Typography variant="body2">
                  {bridge.entities} éditeur(s) enregistré(s) comme entités et{' '}
                  {bridge.content} page(s) comme contenus, rattachés à une session
                  de collecte — visibles dans Résultats, Entités et l&apos;analyseur.
                  {bridge.social_excluded
                    ? ` ${bridge.social_excluded} URL de réseaux sociaux exclues des contenus.`
                    : ''}
                </Typography>
              </Alert>
            )}
            {bridge.published === false && bridge.error && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                <AlertTitle>Non intégré aux données OSINT</AlertTitle>
                {bridge.error}
              </Alert>
            )}

            {(assessment.notes || []).length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Observations de l&apos;analyse
                </Typography>
                <Box mb={3}>
                  {assessment.notes.map((note, i) => (
                    <Typography key={i} variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                      • {note}
                    </Typography>
                  ))}
                </Box>
              </>
            )}

            {(assessment.young_domains || []).length > 0 && (
              <Alert severity="warning" icon={<FaExclamationTriangle />} sx={{ mb: 3 }}>
                <AlertTitle>Domaines récemment enregistrés</AlertTitle>
                {assessment.young_domains.map((d) => (
                  <Typography key={d.domain} variant="body2">
                    {d.domain} — {d.age_days} jours
                  </Typography>
                ))}
              </Alert>
            )}

            {(assessment.credible_domain_list || []).length > 0 && (
              <Box mb={3}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Domaines crédibles indépendants
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.75}>
                  {assessment.credible_domain_list.map((d) => (
                    <Chip key={d} size="small" color="success" variant="outlined" label={d} />
                  ))}
                </Stack>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={3}>
              {[
                { title: 'Par piste', data: coverage.by_lane },
                { title: 'Par fournisseur', data: coverage.by_provider },
                { title: 'Par crédibilité', data: coverage.by_credibility },
              ].map((block) => (
                <Grid size={{ xs: 12, md: 4 }} key={block.title}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    {block.title}
                  </Typography>
                  <Stack spacing={0.5}>
                    {Object.entries(block.data || {})
                      .sort((a, b) => b[1] - a[1])
                      .map(([key, count]) => (
                        <Box key={key} display="flex" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">{key}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{count}</Typography>
                        </Box>
                      ))}
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* ---------------- SOURCES ---------------- */}
        {tab === 1 && (
          <Box p={{ xs: 2, md: 3 }}>
            <Grid container spacing={2} mb={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 4 }}>
                <SelectField
                  name="lane"
                  label="Piste"
                  value={laneFilter}
                  onChange={(e) => { setLaneFilter(e.target.value); setSourcesPage(1); }}
                  options={LANE_OPTIONS}
                  enableSearch={false}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <SelectField
                  name="credibility"
                  label="Crédibilité minimale"
                  value={credFilter}
                  onChange={(e) => { setCredFilter(e.target.value); setSourcesPage(1); }}
                  options={CREDIBILITY_FILTER}
                  enableSearch={false}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Stack>
                  <FormControlLabel
                    control={(
                      <Checkbox
                        size="small"
                        checked={reachableOnly}
                        onChange={(e) => { setReachableOnly(e.target.checked); setSourcesPage(1); }}
                      />
                    )}
                    label="Liens actifs uniquement"
                  />
                  <FormControlLabel
                    control={(
                      <Checkbox
                        size="small"
                        checked={excludeSocial}
                        onChange={(e) => { setExcludeSocial(e.target.checked); setSourcesPage(1); }}
                      />
                    )}
                    label="Exclure les réseaux sociaux"
                  />
                </Stack>
              </Grid>
            </Grid>

            {sourcesLoading && <LinearProgress sx={{ mb: 2 }} />}

            <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
              {sourcesTotal} source(s) correspondant aux filtres
            </Typography>

            <Stack spacing={1.5}>
              {sources.map((src) => {
                const cred = CREDIBILITY_COLORS[src.credibility_label]
                  || CREDIBILITY_COLORS.unextracted;
                return (
                  <Box
                    key={src.url}
                    sx={{
                      p: 2, borderRadius: 2,
                      border: (t) => `1px solid ${t.palette.divider}`,
                      bgcolor: (t) => (src.reachable === false
                        ? alpha(t.palette.error.main, 0.03) : 'transparent'),
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={0.75}>
                      <Chip
                        size="small"
                        color={cred.color}
                        label={`${cred.label}${src.credibility_score != null ? ` ${src.credibility_score}` : ''}`}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {src.domain}
                      </Typography>
                      <Chip size="small" variant="outlined" label={src.lane} />
                      <Chip size="small" variant="outlined" label={`via ${src.found_by}`} />
                      {src.is_social && <Chip size="small" color="warning" label="réseau social" />}
                      {src.is_document && <Chip size="small" color="info" label="PDF" />}
                      {src.reachable === false && (
                        <Chip
                          size="small"
                          color="error"
                          label={`lien mort${src.http_status ? ` (${src.http_status})` : ''}`}
                        />
                      )}
                    </Box>

                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {src.title || '(sans titre)'}
                    </Typography>

                    {src.excerpt && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{
                          mb: 0.75, display: '-webkit-box', WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}
                      >
                        {src.excerpt}
                      </Typography>
                    )}

                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                      {[
                        src.authors?.length ? `${src.authors.slice(0, 3).join(', ')}` : null,
                        src.publisher,
                        src.published_at ? String(src.published_at).substring(0, 19) : null,
                        src.word_count ? `${src.word_count} mots` : null,
                        src.domain_age_days != null ? `domaine ${src.domain_age_days} j` : null,
                      ].filter(Boolean).join(' · ')}
                    </Typography>

                    <Stack direction="row" spacing={1.5} flexWrap="wrap">
                      <Link
                        href={src.final_url || src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="caption"
                        sx={{ wordBreak: 'break-all' }}
                      >
                        <FaExternalLinkAlt size={10} /> {src.final_url || src.url}
                      </Link>
                      {src.archive_url && (
                        <Link
                          href={src.archive_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="caption"
                        >
                          <FaArchive size={10} /> Copie archivée
                        </Link>
                      )}
                    </Stack>

                    {/* Everything else the extractor pulled off this page.
                        These were collected but never shown, which is what
                        made the dossier look thinner than it was. */}
                    {(() => {
                      const extras = [];
                      if ((src.claim_reviews || []).length) {
                        extras.push(
                          <Chip
                            key="cr"
                            size="small"
                            color="secondary"
                            label={`${src.claim_reviews.length} verdict(s) ClaimReview`}
                          />
                        );
                      }
                      (src.addresses || []).slice(0, 2).forEach((a, ai) => extras.push(
                        <Tooltip
                          key={`addr-${ai}`}
                          title={a.canonical_address || a.formatted || ''}
                        >
                          <Chip
                            size="small"
                            variant="outlined"
                            color={a.verified ? 'success' : 'default'}
                            icon={<FaMapMarkerAlt size={9} />}
                            label={a.verified ? 'adresse vérifiée' : 'adresse'}
                          />
                        </Tooltip>
                      ));
                      if ((src.emails || []).length) {
                        extras.push(
                          <Tooltip key="em" title={src.emails.join(', ')}>
                            <Chip size="small" variant="outlined"
                                  label={`${src.emails.length} email(s)`} />
                          </Tooltip>
                        );
                      }
                      if ((src.phones || []).length) {
                        extras.push(
                          <Tooltip key="ph" title={src.phones.join(', ')}>
                            <Chip size="small" variant="outlined"
                                  label={`${src.phones.length} tél.`} />
                          </Tooltip>
                        );
                      }
                      const socials = Object.keys(src.social_links || {});
                      if (socials.length) {
                        extras.push(
                          <Tooltip key="sl" title={socials.join(', ')}>
                            <Chip size="small" variant="outlined"
                                  label={`${socials.length} compte(s) social`} />
                          </Tooltip>
                        );
                      }
                      return extras.length ? (
                        <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1 }}>
                          {extras}
                        </Stack>
                      ) : null;
                    })()}

                    {(src.credibility_reasons || []).length > 0 && (
                      <Tooltip title={src.credibility_reasons.join(' · ')}>
                        <Typography
                          variant="caption"
                          color="text.disabled"
                          display="block"
                          sx={{ mt: 0.5, cursor: 'help' }}
                        >
                          Pourquoi ce score ? ({src.credibility_reasons.length} critères)
                        </Typography>
                      </Tooltip>
                    )}
                  </Box>
                );
              })}
            </Stack>

            {sourcesTotal > SOURCES_PAGE_SIZE && (
              <Box display="flex" justifyContent="center" mt={3}>
                <Pagination
                  count={Math.ceil(sourcesTotal / SOURCES_PAGE_SIZE)}
                  page={sourcesPage}
                  onChange={(_, v) => setSourcesPage(v)}
                  color="primary"
                />
              </Box>
            )}
          </Box>
        )}

        {/* ---------------- ADRESSES ---------------- */}
        {tab === 2 && (
          <Box p={{ xs: 2, md: 3 }}>
            {!addressData && <LinearProgress />}

            {addressData && (addressData.addresses || []).length === 0 && (
              <Alert severity="info">Aucune adresse détectée dans ce dossier.</Alert>
            )}

            <Stack spacing={1.5}>
              {(addressData?.addresses || []).map((addr, i) => (
                <Box
                  key={`${addr.formatted || addr.canonical_address}-${i}`}
                  sx={{
                    p: 2, borderRadius: 2,
                    border: (t) => `1px solid ${t.palette.divider}`,
                    bgcolor: (t) => (addr.verified
                      ? alpha(t.palette.success.main, 0.04) : 'transparent'),
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1} mb={0.5} flexWrap="wrap">
                    <FaMapMarkerAlt color={addr.verified ? '#2e7d32' : '#757575'} />
                    <Chip
                      size="small"
                      color={addr.verified ? 'success' : 'default'}
                      label={addr.verified ? 'Vérifiée (OpenStreetMap)' : 'Non vérifiée'}
                    />
                    {addr.source && <Chip size="small" variant="outlined" label={addr.source} />}
                  </Box>

                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {addr.canonical_address || addr.formatted}
                  </Typography>

                  {addr.lat != null && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {addr.lat}, {addr.lon}
                      {addr.osm_url && (
                        <>
                          {' · '}
                          <Link href={addr.osm_url} target="_blank" rel="noopener noreferrer">
                            Voir sur OpenStreetMap
                          </Link>
                        </>
                      )}
                    </Typography>
                  )}

                  <Typography variant="caption" color="text.secondary" display="block">
                    Trouvée sur {addr.found_on_domain}
                    {addr.organization ? ` · ${addr.organization}` : ''}
                  </Typography>
                </Box>
              ))}
            </Stack>

            {(addressData?.entity_profiles || []).length > 0 && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                  <FaBuilding style={{ marginRight: 6 }} />
                  Fiches d&apos;entités (Wikidata)
                </Typography>
                <Grid container spacing={2}>
                  {addressData.entity_profiles.map((prof) => (
                    <Grid size={{ xs: 12, md: 6 }} key={prof.qid || prof.queried_name}>
                      <Box sx={{ p: 2, borderRadius: 2, border: (t) => `1px solid ${t.palette.divider}` }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {prof.label || prof.queried_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                          {prof.description}
                        </Typography>
                        {[
                          ['Site officiel', prof.official_website],
                          ['Adresse', prof.street_address],
                          ['Siège', prof.headquarters_location],
                          ['Téléphone', prof.phone],
                          ['Email', prof.email],
                          ['Création', prof.inception],
                        ].filter(([, v]) => v).map(([label, value]) => (
                          <Typography key={label} variant="caption" display="block">
                            <strong>{label} :</strong>{' '}
                            {String(value).startsWith('http')
                              ? (
                                <Link href={value} target="_blank" rel="noopener noreferrer">
                                  {value}
                                </Link>
                              )
                              : value}
                          </Typography>
                        ))}
                        {prof.coordinates && (
                          <Typography variant="caption" display="block">
                            <strong>Coordonnées :</strong> {prof.coordinates.lat}, {prof.coordinates.lon}
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}

            {addressData?.contacts && (
              (addressData.contacts.emails?.length > 0
                || addressData.contacts.phones?.length > 0) && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                    Contacts collectés
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.75}>
                    {(addressData.contacts.emails || []).map((e) => (
                      <Chip key={e} size="small" variant="outlined" label={e} />
                    ))}
                    {(addressData.contacts.phones || []).map((p) => (
                      <Chip key={p} size="small" variant="outlined" color="info" label={p} />
                    ))}
                  </Stack>
                </>
              )
            )}
          </Box>
        )}

        {/* ---------------- VERDICTS ---------------- */}
        {tab === 3 && (
          <Box p={{ xs: 2, md: 3 }}>
            {!verdictData && <LinearProgress />}

            {verdictData && (verdictData.claim_reviews || []).length === 0 && (
              <Alert severity="info">
                Aucun verdict de fact-checkeur trouvé — ce sujet semble ne pas
                encore avoir été vérifié.
              </Alert>
            )}

            {Object.keys(verdictData?.assessment?.verdict_tally || {}).length > 0 && (
              <Stack direction="row" flexWrap="wrap" gap={1} mb={3}>
                {Object.entries(verdictData.assessment.verdict_tally).map(([verdict, count]) => {
                  const v = VERDICT_COLORS[verdict] || VERDICT_COLORS.unrated;
                  return (
                    <Chip
                      key={verdict}
                      color={v.color}
                      label={`${v.label} : ${count}`}
                      sx={{ fontWeight: 600 }}
                    />
                  );
                })}
              </Stack>
            )}

            <Stack spacing={2}>
              {(verdictData?.claim_reviews || []).map((review, i) => {
                const normalized = String(review.verdict || '').toLowerCase();
                const matched = Object.keys(VERDICT_COLORS)
                  .find((k) => normalized.includes(k)) || 'unrated';
                const v = VERDICT_COLORS[matched];
                return (
                  <Box
                    key={`${review.review_url}-${i}`}
                    sx={{
                      p: 2, borderRadius: 2,
                      borderLeft: (t) => `4px solid ${t.palette[v.color === 'default' ? 'grey' : v.color]?.main || t.palette.grey[400]}`,
                      border: (t) => `1px solid ${t.palette.divider}`,
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} mb={1} flexWrap="wrap">
                      <Chip
                        color={v.color}
                        label={review.verdict || v.label}
                        sx={{ fontWeight: 700 }}
                      />
                      {review.reviewer && (
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {review.reviewer}
                        </Typography>
                      )}
                      {review.source_domain && (
                        <Chip size="small" variant="outlined" label={review.source_domain} />
                      )}
                    </Box>

                    {review.claim && (
                      <Typography variant="body2" sx={{ mb: 1, fontStyle: 'italic' }}>
                        « {review.claim} »
                      </Typography>
                    )}

                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                      {review.claimant && (
                        <>
                          <FaUser size={9} />
                          {` ${review.claimant}`}
                        </>
                      )}
                      {review.review_date && (
                        <>
                          {review.claimant ? ' · ' : ''}
                          <FaCalendarAlt size={9} />
                          {` ${String(review.review_date).substring(0, 10)}`}
                        </>
                      )}
                    </Typography>

                    {review.review_url && (
                      <Link
                        href={review.review_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="caption"
                        sx={{ wordBreak: 'break-all' }}
                      >
                        <FaExternalLinkAlt size={10} /> Lire la vérification
                      </Link>
                    )}
                  </Box>
                );
              })}
            </Stack>

            {verdictData?.attention_timeline?.points?.length > 0 && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Courbe d&apos;attention médiatique (GDELT)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Pic :{' '}
                  {verdictData.attention_timeline.peak?.date
                    ? String(verdictData.attention_timeline.peak.date).substring(0, 10)
                    : '—'}{' '}
                  · moyenne {verdictData.attention_timeline.mean}
                  {' · fenêtre '}
                  {verdictData.attention_timeline.window_days} jours
                </Typography>
              </>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default DossierDetails;
