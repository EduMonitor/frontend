// src/features/factcheck/CapacityPanel.jsx
//
// Shows what request capacity actually exists before an analyst launches a run.
// Reads GET /api/v2/factcheck/capacity, which reports per-provider quota plus
// the Google key-pool breakdown (live vs parked credentials).
//
// This is the panel that makes a dead API key visible instead of silent: the
// backend parks a credential that answers 403/quotaExceeded, and that shows up
// here as "1/2 cles actives".

import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box, Paper, Typography, Grid, Chip, Stack, Divider, Tooltip,
  LinearProgress, IconButton, Collapse, Alert, alpha,
} from '@mui/material';
import {
  FaSyncAlt, FaKey, FaInfinity, FaChevronDown, FaChevronUp,
  FaCheckCircle, FaTimesCircle, FaDatabase,
} from 'react-icons/fa';
import useAxiosPrivate from '../../utils/hooks/instance/axiosprivate.instance';
import factcheckApi from './api.factcheck';

const TIER_LABELS = {
  0: { label: 'Sans clé', color: 'success' },
  1: { label: 'Gratuit', color: 'info' },
  2: { label: 'Payant', color: 'warning' },
};

const CapacityPanel = ({ compact = false, onLoaded }) => {
  const axiosPrivate = useAxiosPrivate();
  const [capacity, setCapacity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(!compact);

  // Held in a ref so a parent passing an inline arrow for `onLoaded` cannot
  // change `load`'s identity and send the mount effect into a fetch loop.
  const onLoadedRef = useRef(onLoaded);
  useEffect(() => { onLoadedRef.current = onLoaded; }, [onLoaded]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await factcheckApi(axiosPrivate).getCapacity();
      setCapacity(data);
      if (onLoadedRef.current) onLoadedRef.current(data);
    } catch (err) {
      setError(
        err?.response?.data?.detail || err?.message || 'Capacité indisponible'
      );
    } finally {
      setLoading(false);
    }
  }, [axiosPrivate]);

  useEffect(() => { load(); }, [load]);

  const providers = capacity?.providers || [];
  const cap = capacity?.capacity || {};
  const cache = capacity?.cache || {};

  // Providers we can actually call right now, split by how they are billed.
  const usable = providers.filter((p) => p.configured);
  const unmetered = usable.filter((p) => p.daily_limit === null);
  const metered = usable.filter((p) => p.daily_limit !== null);

  const hasParkedKey = providers.some(
    (p) => p.key_pool && p.key_pool.live_credentials < p.key_pool.total_credentials
  );

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2.5, mb: 3, borderRadius: 3,
        background: (theme) =>
          `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.04)} 0%, ${alpha(theme.palette.success.main, 0.04)} 100%)`,
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center" gap={1.5}>
          <FaDatabase size={18} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Capacité de collecte
          </Typography>
          {loading && <LinearProgress sx={{ width: 60 }} />}
        </Box>
        <Box>
          <Tooltip title="Rafraîchir">
            <IconButton size="small" onClick={load} disabled={loading}>
              <FaSyncAlt size={14} />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={() => setExpanded((v) => !v)}>
            {expanded ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
          </IconButton>
        </Box>
      </Box>

      {error && <Alert severity="warning" sx={{ mt: 1.5 }}>{error}</Alert>}

      {capacity && (
        <>
          <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1.5 }}>
            <Chip
              size="small"
              color="primary"
              icon={<FaKey size={11} />}
              label={`${cap.metered_requests_remaining_today ?? 0} requêtes mesurées restantes`}
            />
            <Chip
              size="small"
              color="success"
              icon={<FaInfinity size={11} />}
              label={`${cap.unmetered_providers ?? 0} fournisseurs sans quota`}
            />
            {cache.saved_requests > 0 && (
              <Tooltip title="Réponses servies depuis le cache — zéro quota consommé">
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${cache.saved_requests} requêtes économisées (cache)`}
                />
              </Tooltip>
            )}
          </Stack>

          <Collapse in={expanded}>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={1.5}>
              {[...metered, ...unmetered].map((p) => {
                const tier = TIER_LABELS[p.cost_tier] || TIER_LABELS[1];
                const pool = p.key_pool;
                return (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p.provider}>
                    <Box
                      sx={{
                        p: 1.5, borderRadius: 2, height: '100%',
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                        bgcolor: (theme) => (p.available
                          ? alpha(theme.palette.success.main, 0.05)
                          : alpha(theme.palette.error.main, 0.04)),
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        {p.available
                          ? <FaCheckCircle size={12} color="#2e7d32" />
                          : <FaTimesCircle size={12} color="#c62828" />}
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {p.provider}
                        </Typography>
                        <Chip
                          label={tier.label}
                          size="small"
                          color={tier.color}
                          sx={{ height: 18, fontSize: '0.65rem' }}
                        />
                      </Box>

                      <Typography variant="caption" color="text.secondary" display="block">
                        {p.daily_limit === null
                          ? `Illimité · ${p.used_today} appel(s) ce jour`
                          : `${p.remaining_today ?? 0} / ${p.daily_limit} restantes`}
                      </Typography>

                      {pool && (
                        <Typography
                          variant="caption"
                          display="block"
                          color={pool.live_credentials < pool.total_credentials
                            ? 'error.main' : 'text.secondary'}
                        >
                          {pool.live_credentials}/{pool.total_credentials} clés actives
                          {pool.theoretical_daily_capacity
                            ? ` · plafond ${pool.theoretical_daily_capacity}/jour` : ''}
                        </Typography>
                      )}

                      {p.disabled_reason && (
                        <Tooltip title={p.disabled_reason}>
                          <Typography
                            variant="caption"
                            color="error.main"
                            display="block"
                            sx={{
                              mt: 0.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {`⚠ ${p.disabled_reason}`}
                          </Typography>
                        </Tooltip>
                      )}
                    </Box>
                  </Grid>
                );
              })}
            </Grid>

            {/* A parked credential is the most common silent failure here, so
                state it plainly rather than hiding it in a tooltip. */}
            {hasParkedKey && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Une ou plusieurs clés API sont désactivées (quota épuisé, ou API
                non activée sur le projet Google). Les fournisseurs sans clé
                continuent de répondre — la collecte reste fonctionnelle.
              </Alert>
            )}
          </Collapse>
        </>
      )}
    </Paper>
  );
};

CapacityPanel.propTypes = {
  compact: PropTypes.bool,
  onLoaded: PropTypes.func,
};

export default CapacityPanel;
