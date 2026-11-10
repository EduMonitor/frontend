// src/features/actors/api.actors.jsx
//
// All /api/v2/actors paths in one module (same reason as api.factcheck.jsx:
// inlined URLs are how the frontend drifted from the backend before).
//
// Mirrors app/routes/actor_monitor_route.py.

export const ACTORS_BASE = '/api/v2/actors';

export const actorPaths = {
  platforms:     () => `${ACTORS_BASE}/platforms`,
  watchlist:     () => `${ACTORS_BASE}/watchlist`,
  watchlistItem: (id) => `${ACTORS_BASE}/watchlist/${id}`,
  scan:          () => `${ACTORS_BASE}/scan`,
  scanStream:    () => `${ACTORS_BASE}/scan/stream`,
  job:           (id) => `${ACTORS_BASE}/jobs/${id}`,
  scans:         () => `${ACTORS_BASE}/scans`,
  scanReport:    (id) => `${ACTORS_BASE}/scans/${id}`,
  rankedActors:  () => `${ACTORS_BASE}/actors`,
};

export const buildScanStreamQuery = ({
  topicTerms = '', sinceDays = 30, limitPerActor = 40,
  analyze = true, useWatchlist = true,
}) => new URLSearchParams({
  since_days: String(sinceDays),
  limit_per_actor: String(limitPerActor),
  analyze: String(analyze),
  use_watchlist: String(useWatchlist),
  ...(topicTerms ? { topic_terms: topicTerms } : {}),
});

const actorsApi = (axiosPrivate) => ({
  getPlatforms: () =>
    axiosPrivate.get(actorPaths.platforms()).then((r) => r.data),

  getWatchlist: (platform = '') =>
    axiosPrivate.get(actorPaths.watchlist(), {
      params: platform ? { platform } : {},
    }).then((r) => r.data),

  addActor: ({ platform, handle, label = '', notes = '', verify = true }) =>
    axiosPrivate.post(actorPaths.watchlist(), {
      platform, handle, label, notes, verify,
    }).then((r) => r.data),

  removeActor: (id) =>
    axiosPrivate.delete(actorPaths.watchlistItem(id)).then((r) => r.data),

  startScan: ({
    topicTerms = '', sinceDays = 30, limitPerActor = 40,
    analyze = true, useWatchlist = true, actors = null,
  }) =>
    axiosPrivate.post(actorPaths.scan(), {
      ...(actors ? { actors } : {}),
      use_watchlist: useWatchlist,
      topic_terms: topicTerms,
      since_days: sinceDays,
      limit_per_actor: limitPerActor,
      analyze,
    }).then((r) => r.data),

  getJob: (jobId) =>
    axiosPrivate.get(actorPaths.job(jobId)).then((r) => r.data),

  listScans: ({ page = 1, pageSize = 20 } = {}) =>
    axiosPrivate.get(actorPaths.scans(), {
      params: { page, page_size: pageSize },
    }).then((r) => r.data),

  getScan: (scanId, minRisk = null) =>
    axiosPrivate.get(actorPaths.scanReport(scanId), {
      params: minRisk !== null ? { min_risk: minRisk } : {},
    }).then((r) => r.data),

  getRankedActors: ({ limit = 50, minRisk = 0 } = {}) =>
    axiosPrivate.get(actorPaths.rankedActors(), {
      params: { limit, min_risk: minRisk },
    }).then((r) => r.data),
});

export default actorsApi;
