export const PLATFORMS = [
  { id: 'facebook', label: 'Facebook', color: '#1877f2', emoji: '📘' },
  { id: 'twitter', label: 'Twitter/X', color: '#1da1f2', emoji: '🐦' },
  { id: 'linkedin', label: 'LinkedIn', color: '#0a66c2', emoji: '💼' },
  { id: 'instagram', label: 'Instagram', color: '#e4405f', emoji: '📸' },
  { id: 'youtube', label: 'YouTube', color: '#ff0000', emoji: '🎬' },
  { id: 'tiktok', label: 'TikTok', color: '#000000', emoji: '🎵' }
];

export const TIME_FILTERS = [
  { key: 'any', value: 'Any Time', icon: '🌐' },
  { key: 'day', value: 'Past 24 Hours', icon: '📅' },
  { key: 'week', value: 'Past Week', icon: '📆' },
  { key: 'month', value: 'Past Month', icon: '🗓️' }
];

export const BROWSERS = [
  { key: 'edge', value: 'Edge', icon: '🌊' },
  { key: 'chrome', value: 'Chrome', icon: '🌐' },
  { key: 'firefox', value: 'Firefox', icon: '🦊' },
];

export const LANGUAGES = [
  { key: '', value: 'Any Language', icon: '🌍' },
  { key: 'fr', value: 'French', icon: '🇫🇷' },
  { key: 'en', value: 'English', icon: '🇬🇧' },
  { key: 'mos', value: 'Mossi (Local)', icon: '🇧🇫' }
];

export const COUNTRIES = [
  { key: '', value: 'Any Country', icon: '🌍' },
  { key: 'BF', value: 'Burkina Faso', icon: '🇧🇫' },
  { key: 'US', value: 'United States', icon: '🇺🇸' },
  { key: 'FR', value: 'France', icon: '🇫🇷' }
];

// ===========================================================================
// FACT-CHECK COLLECTION  (backend: /api/v2/factcheck)
// Mirrors app/services/topic_collector.py — keep the keys identical to the
// values the API validates against, or the backend answers 400.
// ===========================================================================

// TopicCollector.DEPTH_BUDGETS
export const COLLECT_DEPTHS = [
  { key: 'quick',      value: 'Rapide (~25 requêtes)',       icon: '⚡', description: 'Triage — surtout les fournisseurs sans clé' },
  { key: 'standard',   value: 'Standard (~45 requêtes)',     icon: '🎯', description: 'Valeur par défaut' },
  { key: 'deep',       value: 'Approfondi (~70 requêtes)',   icon: '🔬', description: 'Enquête — ajoute entités et documents' },
  { key: 'exhaustive', value: 'Exhaustif (~110 requêtes)',   icon: '🛰️', description: 'Toutes les pistes, toutes les variantes' },
];

// Lane names accepted by the `lanes` parameter.
export const COLLECT_LANES = [
  { key: 'claim_review',   value: 'Verdicts existants',   icon: '⚖️', description: 'Google Fact Check Tools (ClaimReview)' },
  { key: 'factcheck',      value: 'Rédactions fact-check', icon: '✅', description: 'AFP Factuel, Africa Check, FasoCheck…' },
  { key: 'news',           value: 'Presse',                icon: '📰', description: 'Index mondial GDELT + moteurs web' },
  { key: 'official',       value: 'Sources officielles',   icon: '🏛️', description: 'gov.bf, présidence, ONU, CEDEAO…' },
  { key: 'local_media',    value: 'Médias locaux',         icon: '🇧🇫', description: 'Lefaso, Sidwaya, AIB, Wakatséra…' },
  { key: 'documents',      value: 'Documents (PDF)',       icon: '📄', description: 'Communiqués, décrets, rapports' },
  { key: 'reference',      value: 'Références',            icon: '📚', description: 'Wikipédia, Wikidata, OpenAlex, Crossref' },
  { key: 'entity',         value: 'Entités nommées',       icon: '👤', description: 'Chaque entité citée dans le sujet' },
  { key: 'entity_address', value: 'Adresses des entités',  icon: '📍', description: 'adresse / siège / contact / BP' },
  { key: 'debunk',         value: 'Démentis',              icon: '🚫', description: 'démenti / intox / fausse information' },
  { key: 'social',         value: 'Réseaux sociaux',       icon: '📱', description: 'Diffusion uniquement — jamais une corroboration' },
];

export const FRESHNESS_OPTIONS = [
  { key: '',    value: 'Toute période', icon: '🌐' },
  { key: '1',   value: 'Dernières 24h', icon: '📅' },
  { key: '7',   value: '7 derniers jours', icon: '📆' },
  { key: '30',  value: '30 derniers jours', icon: '🗓️' },
  { key: '90',  value: '3 derniers mois', icon: '📊' },
  { key: '365', value: '12 derniers mois', icon: '📈' },
];

// The collector plans per country (OFFICIAL_DOMAINS / BF_MEDIA), so offer the
// whole Sahel rather than only BF.
export const COLLECT_COUNTRIES = [
  { key: 'BF', value: 'Burkina Faso', icon: '🇧🇫' },
  { key: 'ML', value: 'Mali', icon: '🇲🇱' },
  { key: 'NE', value: 'Niger', icon: '🇳🇪' },
  { key: 'SN', value: 'Sénégal', icon: '🇸🇳' },
  { key: 'CI', value: "Côte d'Ivoire", icon: '🇨🇮' },
  { key: 'TG', value: 'Togo', icon: '🇹🇬' },
  { key: 'BJ', value: 'Bénin', icon: '🇧🇯' },
];

export const CREDIBILITY_COLORS = {
  high:        { color: 'success', label: 'Élevée' },
  medium:      { color: 'info',    label: 'Moyenne' },
  low:         { color: 'warning', label: 'Faible' },
  very_low:    { color: 'error',   label: 'Très faible' },
  unextracted: { color: 'default', label: 'Non extraite' },
};

export const VERDICT_COLORS = {
  false:      { color: 'error',   label: 'Faux' },
  misleading: { color: 'warning', label: 'Trompeur' },
  unproven:   { color: 'info',    label: 'Non prouvé' },
  true:       { color: 'success', label: 'Vrai' },
  unrated:    { color: 'default', label: 'Non évalué' },
};
