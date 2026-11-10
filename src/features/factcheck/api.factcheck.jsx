// src/features/factcheck/api.factcheck.jsx
//
// Every /api/v2/factcheck path in one place.
//
// The rest of this app inlines its URLs in each component, which is how
// `/api/v2/auth/user/{uuid}` ended up being called when the backend only ever
// served `/api/v2/user/admin/users/{uuid}`. Routing the whole feature through
// one module means a backend rename is a one-line change here.
//
// Mirrors app/routes/topic_collect_route.py (prefix /api/v2/factcheck).

export const FACTCHECK_BASE = '/api/v2/factcheck';

export const factcheckPaths = {
  capacity:        () => `${FACTCHECK_BASE}/capacity`,
  plan:            () => `${FACTCHECK_BASE}/plan`,
  collectStream:   () => `${FACTCHECK_BASE}/collect/stream`,
  collect:         () => `${FACTCHECK_BASE}/collect`,
  jobs:            () => `${FACTCHECK_BASE}/jobs`,
  job:          (id) => `${FACTCHECK_BASE}/jobs/${id}`,
  dossiers:        () => `${FACTCHECK_BASE}/dossiers`,
  dossier:      (id) => `${FACTCHECK_BASE}/dossiers/${id}`,
  sources:      (id) => `${FACTCHECK_BASE}/dossiers/${id}/sources`,
  addresses:    (id) => `${FACTCHECK_BASE}/dossiers/${id}/addresses`,
  verdicts:     (id) => `${FACTCHECK_BASE}/dossiers/${id}/verdicts`,
};

/**
 * Build the query string for a collection run.
 * Snake_case keys because that is what FastAPI declares; sending camelCase
 * silently falls back to the endpoint defaults instead of erroring, which is
 * the worst kind of bug to chase.
 */
export const buildCollectQuery = ({
  topic,
  depth = 'standard',
  countries = ['BF'],
  language = '',
  freshnessDays = '',
  lanes = [],
  maxExtract = 120,
  includeSocial = true,
  extract = true,
  persist = true,
}) => new URLSearchParams({
  topic,
  depth,
  countries: (countries || []).join(','),
  include_social: String(includeSocial),
  max_extract: String(maxExtract),
  extract: String(extract),
  persist: String(persist),
  ...(language ? { language } : {}),
  ...(freshnessDays ? { freshness_days: String(freshnessDays) } : {}),
  // An empty `lanes` means "all lanes" server-side, so only send a subset.
  ...(lanes && lanes.length ? { lanes: lanes.join(',') } : {}),
});

/** Request body for POST /plan and POST /collect (both read a JSON body). */
export const buildCollectBody = ({
  topic,
  depth = 'standard',
  countries = ['BF'],
  language = '',
  freshnessDays = '',
  lanes = [],
  maxExtract = 120,
  includeSocial = true,
  extract = true,
}) => ({
  topic,
  depth,
  countries: (countries || []).join(','),
  include_social: includeSocial,
  max_extract: maxExtract,
  extract,
  ...(language ? { language } : {}),
  ...(freshnessDays ? { freshness_days: Number(freshnessDays) } : {}),
  ...(lanes && lanes.length ? { lanes: lanes.join(',') } : {}),
});

const factcheckApi = (axiosPrivate) => ({
  getCapacity: () =>
    axiosPrivate.get(factcheckPaths.capacity()).then((r) => r.data),

  previewPlan: (params) =>
    axiosPrivate.post(factcheckPaths.plan(), buildCollectBody(params))
      .then((r) => r.data),

  startBackgroundCollect: (params) =>
    axiosPrivate.post(factcheckPaths.collect(), buildCollectBody(params))
      .then((r) => r.data),

  getJob: (jobId) =>
    axiosPrivate.get(factcheckPaths.job(jobId)).then((r) => r.data),

  listJobs: (limit = 25) =>
    axiosPrivate.get(factcheckPaths.jobs(), { params: { limit } })
      .then((r) => r.data),

  listDossiers: ({ page = 1, pageSize = 20, topic = '', mineOnly = false } = {}) =>
    axiosPrivate.get(factcheckPaths.dossiers(), {
      params: {
        page,
        page_size: pageSize,
        ...(topic ? { topic } : {}),
        mine_only: mineOnly,
      },
    }).then((r) => r.data),

  getDossier: (runId, includeSources = false) =>
    axiosPrivate.get(factcheckPaths.dossier(runId), {
      params: { include_sources: includeSources },
    }).then((r) => r.data),

  getSources: (runId, {
    page = 1, pageSize = 25, lane = '', minCredibility = null,
    reachableOnly = false, excludeSocial = false,
  } = {}) =>
    axiosPrivate.get(factcheckPaths.sources(runId), {
      params: {
        page,
        page_size: pageSize,
        ...(lane ? { lane } : {}),
        ...(minCredibility !== null && minCredibility !== ''
          ? { min_credibility: minCredibility } : {}),
        reachable_only: reachableOnly,
        exclude_social: excludeSocial,
      },
    }).then((r) => r.data),

  getAddresses: (runId, verifiedOnly = false) =>
    axiosPrivate.get(factcheckPaths.addresses(runId), {
      params: { verified_only: verifiedOnly },
    }).then((r) => r.data),

  getVerdicts: (runId) =>
    axiosPrivate.get(factcheckPaths.verdicts(runId)).then((r) => r.data),

  deleteDossier: (runId) =>
    axiosPrivate.delete(factcheckPaths.dossier(runId)).then((r) => r.data),
});

export default factcheckApi;
