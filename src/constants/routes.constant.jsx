export const AuthRoutes = {
  signIn: "/",
  signUp: "/auth/signup",
  twoFactor: "/auth/verify-factor/:uuid",
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password/:token",
  notifyAuth: "/auth/notifications/:uuid",
  emailVerify: "/auth/verify-email/:token",
  verifyEmail: "/auth/verify/:uuid",
  changePassword: "/auth/change-password",
  profile: "/auth/profile",
  googleRedirect: "/auth/google/callback",
  logout: "/auth/logout",
};

export const PagesRoutes = {
  errorPages: {
    Error403: "/forbiden",
    Error404: "*",
  }
}

// Enhanced route constants for AI-based disinformation detection platform
export const AdminRoutes = {
  dashboard: "dashboard",
  users: "users",
  settings: "settings",
  profiles: "profiles",
  
  // Analysis routes
  Analysis: {
    New: "analysis/new",
    Results: "analysis/results",
    Filters: "analysis/filters",
    Models: "analysis/models"
  },
  
  // Insights routes
  Insights: {
    Trends: "insights/trends",
    Alerts: "insights/alerts",
    Personal: "insights/personal"
  },
  
  // Notifications routes
  Notifications: {
    List: "notifications/list",
    Critical: "notifications/critical"
  },
  
  // Reports routes
  Reports: {
    Generate: "reports/generate",
    Download: "reports/download",
    Submit: "reports/submit",
    MyReports: "reports/my-reports",
    Community: "reports/community",
    Performance: "reports/performance"
  },
  
  // Content Monitoring routes (Standard Users)
  Monitoring: {
    Feed: "monitoring/feed",
    Hashtags: "monitoring/hashtags",
    Keywords: "monitoring/keywords"
  },
  
  // User Management routes
  User: {
    Profile: "user/profile",
    History: "user/history",
    Bookmarks: "user/bookmarks",
    Notifications: "user/notifications"
  },
  
  // Moderation routes
  Moderation: {
    Queue: "moderation/queue",
    Actions: "moderation/actions",
    Appeals: "moderation/appeals"
  },
  
  // Settings routes (expanded)
  Settings: {
    Users: "settings/users",
    Roles: "settings/roles",
    AIConfig: "settings/ai-config",
    Security: "settings/security",
    Theme: "settings/theme"
  },
  
  // Help & Support routes
  Help: {
    Documentation: "help/documentation",
    Training: "help/training",
    FAQ: "help/faq",
    Contact: "help/contact"
  }
};
// Dynamic route prefix based on user role
export const getRoutePrefix = (userRole) => {
  const rolePrefixes = {
    admin: "admin",
    user: "user",
    analyst: "analyst",
    viewer: "viewer"
  };

  return rolePrefixes[userRole] || "dashboard";
};

// Helper function to build complete route path
export const buildRoutePath = (route, userRole) => {
  const prefix = getRoutePrefix(userRole);
  return `/${prefix}/${route}`;
};