// src/features/factcheck/Dossiers.jsx
//
// Stored dossiers from GET /api/v2/factcheck/dossiers, plus the live state of
// background collections from GET /api/v2/factcheck/jobs.
//
// Non-admins are scoped to their own dossiers by the backend regardless of the
// `mine_only` flag, so the toggle is only meaningful for admins.

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Grid, Chip, Stack, Button, Alert, Divider,
  LinearProgress, IconButton, Tooltip, Pagination, FormControlLabel,
  Checkbox, alpha,
} from '@mui/material';
import {
  FaSyncAlt, FaTrash, FaEye, FaBalanceScale, FaMapMarkerAlt, FaFileAlt,
  FaSearch, FaClock,
} from 'react-icons/fa';
import InputField from '../../components/forms/input.forms';
import useAxiosPrivate from '../../utils/hooks/instance/axiosprivate.instance';
import useAuth from '../../utils/hooks/contexts/useAth.contexts';
import useToast from '../../components/toast/toast.toast';
import CustomModal from '../../components/modal/Custome.modal';
import { formatDate } from '../../utils/functions/format-date.functions';
import { AdminRoutes } from '../../constants/routes.constant';
import factcheckApi from './api.factcheck';

const PAGE_SIZE = 12;
const JOB_POLL_MS = 8000;

const JOB_STATUS = {
  queued:    { color: 'default', label: 'En attente' },
  running:   { color: 'info',    label: 'En cours' },
  completed: { color: 'success', label: 'Terminé' },
  failed:    { color: 'error',   label: 'Échec' },
};

const Dossiers = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const isAdmin = ['admin', 'superadmin'].includes(auth?.role);

  const [dossiers, setDossiers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');          // what the user typed
  const [searchTerm, setSearchTerm] = useState('');   // what we query with
  const [mineOnly, setMineOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [jobs, setJobs] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const api = factcheckApi(axiosPrivate);

  const loadDossiers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listDossiers({
        page, pageSize: PAGE_SIZE, topic: searchTerm, mineOnly,
      });
      setDossiers(data.dossiers || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Chargement impossible');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axiosPrivate, page, searchTerm, mineOnly]);

  const loadJobs = useCallback(async () => {
    try {
      const data = await api.listJobs(10);
      setJobs(Array.isArray(data) ? data : []);
    } catch {
      // jobs are a convenience; never block the dossier list on them
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axiosPrivate]);

  // Debounce the topic filter: it hits a regex query, and firing one request
  // per keystroke is both slow and pointless.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { loadDossiers(); }, [loadDossiers]);
  useEffect(() => { loadJobs(); }, [loadJobs]);

  // Poll only while something is actually in flight.
  useEffect(() => {
    const active = jobs.some((j) => ['queued', 'running'].includes(j.status));
    if (!active) return undefined;
    const timer = setInterval(() => {
      loadJobs();
      loadDossiers();
    }, JOB_POLL_MS);
    return () => clearInterval(timer);
  }, [jobs, loadJobs, loadDossiers]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteDossier(deleteTarget.run_id);
      showToast({
        title: 'Dossier supprimé',
        description: deleteTarget.topic,
        status: 'success',
      });
      setDeleteTarget(null);
      loadDossiers();
    } catch (err) {
      showToast({
        title: 'Suppression impossible',
        description: err?.response?.data?.detail || err?.message,
        status: 'error',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteTarget, loadDossiers, showToast]);

  const openDossier = (runId) => navigate(
    `/ai/${AdminRoutes.FactCheck.DossierView.replace(':runId', runId)}`
  );

  return (
    <Box sx={{ width: '100%', p: { xs: 2, md: 3 } }}>
      {ToastComponent}

      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} mb={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          📁 Dossiers de vérification
          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1.5 }}>
            {total} au total
          </Typography>
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          {isAdmin && (
            <FormControlLabel
              control={(
                <Checkbox
                  checked={mineOnly}
                  onChange={(e) => { setMineOnly(e.target.checked); setPage(1); }}
                  size="small"
                />
              )}
              label="Les miens"
            />
          )}
          <Tooltip title="Rafraîchir">
            <IconButton onClick={() => { loadDossiers(); loadJobs(); }} disabled={loading}>
              <FaSyncAlt size={15} />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<FaSearch />}
            onClick={() => navigate(`/ai/${AdminRoutes.FactCheck.Collect}`)}
          >
            Nouvelle collecte
          </Button>
        </Stack>
      </Box>

      <Box mb={3} sx={{ maxWidth: 480 }}>
        <InputField
          fullWidth
          label="Filtrer par sujet"
          name="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher dans les sujets…"
          variant="outlined"
        />
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Background collections still in flight */}
      {jobs.filter((j) => ['queued', 'running'].includes(j.status)).length > 0 && (
        <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
            <FaClock style={{ marginRight: 6 }} /> Collectes en arrière-plan
          </Typography>
          <Stack spacing={1.5}>
            {jobs
              .filter((j) => ['queued', 'running'].includes(j.status))
              .map((job) => {
                const st = JOB_STATUS[job.status] || JOB_STATUS.queued;
                return (
                  <Box key={job.run_id || job.job_id}>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <Chip size="small" color={st.color} label={st.label} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {job.topic}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {job.stage} {job.done != null ? `${job.done}/${job.total}` : ''}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(job.progress || 0, 100)}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                );
              })}
          </Stack>
        </Paper>
      )}

      {!loading && dossiers.length === 0 && (
        <Alert severity="info">
          Aucun dossier pour le moment. Lancez une collecte pour en créer un.
        </Alert>
      )}

      <Grid container spacing={2}>
        {dossiers.map((d) => {
          const totals = d.totals || {};
          const assessment = d.assessment || {};
          const credible = assessment.independent_credible_domains || 0;
          return (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={d.run_id}>
              <Paper
                elevation={2}
                sx={{
                  p: 2, borderRadius: 3, height: '100%',
                  display: 'flex', flexDirection: 'column',
                  transition: 'all .2s',
                  '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' },
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700, mb: 0.5,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}
                >
                  {d.topic}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                  {d.started_at ? formatDate(d.started_at) : ''}
                  {d.duration_seconds ? ` · ${d.duration_seconds}s` : ''}
                </Typography>

                <Stack direction="row" flexWrap="wrap" gap={0.75} mb={1.5}>
                  <Chip
                    size="small"
                    color={credible >= 3 ? 'success' : credible >= 1 ? 'warning' : 'error'}
                    label={`${credible} domaine(s) crédible(s)`}
                  />
                  {assessment.dominant_verdict && (
                    <Chip size="small" variant="outlined"
                          label={`Verdict : ${assessment.dominant_verdict}`} />
                  )}
                  {d.plan?.depth && (
                    <Chip size="small" variant="outlined" label={d.plan.depth} />
                  )}
                </Stack>

                <Divider sx={{ mb: 1.5 }} />

                <Stack direction="row" spacing={2} mb={2} flexWrap="wrap">
                  <Tooltip title="Sources analysées">
                    <Typography variant="caption" color="text.secondary">
                      <FaFileAlt /> {totals.sources_extracted || 0}
                    </Typography>
                  </Tooltip>
                  <Tooltip title="Verdicts de fact-checkeurs">
                    <Typography variant="caption" color="text.secondary">
                      <FaBalanceScale /> {totals.claim_reviews || 0}
                    </Typography>
                  </Tooltip>
                  <Tooltip title="Adresses trouvées / vérifiées">
                    <Typography variant="caption" color="text.secondary">
                      <FaMapMarkerAlt /> {totals.addresses_found || 0}
                      {totals.addresses_verified ? ` (${totals.addresses_verified}✓)` : ''}
                    </Typography>
                  </Tooltip>
                </Stack>

                <Box sx={{ mt: 'auto' }} display="flex" gap={1}>
                  <Button
                    size="small"
                    variant="contained"
                    fullWidth
                    startIcon={<FaEye />}
                    onClick={() => openDossier(d.run_id)}
                  >
                    Consulter
                  </Button>
                  <Tooltip title="Supprimer">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteTarget(d)}
                      sx={{
                        border: (t) => `1px solid ${alpha(t.palette.error.main, 0.4)}`,
                      }}
                    >
                      <FaTrash size={13} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {total > PAGE_SIZE && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={Math.ceil(total / PAGE_SIZE)}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}

      <CustomModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer ce dossier ?"
        onConfirm={handleDelete}
        confirmText="Supprimer"
        confirmColor="error"
        cancelText="Annuler"
      >
        <Typography variant="body2">
          Le dossier « {deleteTarget?.topic} » et toutes ses preuves collectées
          seront définitivement supprimés. Cette action est irréversible.
        </Typography>
      </CustomModal>
    </Box>
  );
};

export default Dossiers;
