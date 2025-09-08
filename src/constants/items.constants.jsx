import {
  FaTachometerAlt, FaChartBar, FaSearch, FaBell, FaFileAlt, FaCog, FaUserShield, FaDatabase,
  FaUsers, FaFilter, FaExclamationTriangle, FaDownload, FaQuestionCircle, FaPalette, FaUser,
  FaShieldAlt, FaEye, FaFlag, FaHistory, FaBookmark, FaUserCog, FaKey, FaChartLine,
  FaExclamation, FaComments, FaHashtag, FaGlobe, FaClock, FaStar, FaLock, FaUnlock
} from "react-icons/fa";
import { AdminRoutes } from "./routes.constant";

export const sidebarMenuItems = (userRoles = [], userProfile = {}) => {
  const constant = AdminRoutes;
  
  const hasAccess = (allowRoles) => allowRoles.some(role => userRoles.includes(role));
  
  // Enhanced role definitions with hierarchy
  const roles = {
    all: ["admin", "analyst", "moderator", "user", "viewer"],
    standardUser: ["user"],
    verifiedUser: ["user", "verified_user"],
    moderator: ["admin", "analyst", "moderator"],
    analystTeam: ["admin", "analyst"],
    adminOnly: ["admin"],
    viewerTeam: ["admin", "analyst", "moderator", "viewer"],
    publicAccess: ["admin", "analyst", "moderator", "user", "viewer", "verified_user"]
  };

  const buildPath = (route) => `/ai/${route}`;

  const menuItems = [
    // Dashboard - Available to all users
    {
      path: buildPath(constant.dashboard),
      name: "Dashboard",
      icon: FaTachometerAlt,
      allowRoles: roles.all,
      description: "Overview of your activity and system status"
    },

    // Standard User Section - Content Monitoring & Reporting
    {
      name: "Content Monitoring",
      icon: FaEye,
      allowRoles: roles.publicAccess,
      children: [
        {
          path: buildPath(constant.Monitoring.Feed),
          name: "Live Feed Monitor",
          icon: FaGlobe,
          allowRoles: roles.standardUser,
          description: "Monitor social media content in real-time"
        },
        {
          path: buildPath(constant.Monitoring.Hashtags),
          name: "Hashtag Tracking",
          icon: FaHashtag,
          allowRoles: roles.standardUser,
          description: "Track specific hashtags for harmful content"
        },
        {
          path: buildPath(constant.Monitoring.Keywords),
          name: "Keyword Alerts",
          icon: FaSearch,
          allowRoles: roles.standardUser,
          description: "Set up alerts for specific keywords"
        }
      ]
    },

    // User Reporting System
    {
      name: "Report Content",
      icon: FaFlag,
      allowRoles: roles.publicAccess,
      children: [
        {
          path: buildPath(constant.Reports.Submit),
          name: "Submit Report",
          icon: FaExclamation,
          allowRoles: roles.standardUser,
          description: "Report suspicious or harmful content"
        },
        {
          path: buildPath(constant.Reports.MyReports),
          name: "My Reports",
          icon: FaFileAlt,
          allowRoles: roles.standardUser,
          description: "View your submitted reports and their status"
        },
        {
          path: buildPath(constant.Reports.Community),
          name: "Community Reports",
          icon: FaUsers,
          allowRoles: roles.verifiedUser,
          description: "View community-reported content (verified users only)"
        }
      ]
    },

    // Personal Dashboard for Users
    {
      name: "My Activity",
      icon: FaUser,
      allowRoles: roles.standardUser,
      children: [
        {
          path: buildPath(constant.User.Profile),
          name: "Profile",
          icon: FaUserCog,
          allowRoles: roles.standardUser,
          description: "Manage your profile and preferences"
        },
        {
          path: buildPath(constant.User.History),
          name: "Activity History",
          icon: FaHistory,
          allowRoles: roles.standardUser,
          description: "View your monitoring and reporting history"
        },
        {
          path: buildPath(constant.User.Bookmarks),
          name: "Saved Items",
          icon: FaBookmark,
          allowRoles: roles.standardUser,
          description: "Items you've bookmarked for later review"
        },
        {
          path: buildPath(constant.User.Notifications),
          name: "My Notifications",
          icon: FaBell,
          allowRoles: roles.standardUser,
          description: "Your personal notifications and alerts"
        }
      ]
    },

    // Basic Analytics for Users
    {
      name: "Insights",
      icon: FaChartLine,
      allowRoles: roles.publicAccess,
      children: [
        {
          path: buildPath(constant.Insights.Personal),
          name: "Personal Statistics",
          icon: FaChartBar,
          allowRoles: roles.standardUser,
          description: "Your contribution statistics and impact"
        },
        {
          path: buildPath(constant.Insights.Trends),
          name: "Public Trends",
          icon: FaChartBar,
          allowRoles: roles.publicAccess,
          description: "General trends in harmful content detection"
        },
        {
          path: buildPath(constant.Insights.Alerts),
          name: "Alert Overview",
          icon: FaExclamationTriangle,
          allowRoles: roles.verifiedUser,
          description: "Overview of current alerts and flags"
        }
      ]
    },

    // Professional Analysis Tools (Analyst+)
    {
      name: "Advanced Analysis",
      icon: FaSearch,
      allowRoles: roles.analystTeam,
      children: [
        {
          path: buildPath(constant.Analysis.New),
          name: "Run New Analysis",
          icon: FaDatabase,
          allowRoles: roles.analystTeam,
          description: "Perform deep analysis on content patterns"
        },
        {
          path: buildPath(constant.Analysis.Results),
          name: "Analysis Results",
          icon: FaFileAlt,
          allowRoles: roles.viewerTeam,
          description: "View detailed analysis results"
        },
        {
          path: buildPath(constant.Analysis.Filters),
          name: "Advanced Filters",
          icon: FaFilter,
          allowRoles: roles.analystTeam,
          description: "Configure advanced filtering criteria"
        },
        {
          path: buildPath(constant.Analysis.Models),
          name: "AI Model Performance",
          icon: FaShieldAlt,
          allowRoles: roles.analystTeam,
          description: "Monitor AI model accuracy and performance"
        }
      ]
    },

    // Moderation Tools (Moderator+)
    {
      name: "Moderation",
      icon: FaUserShield,
      allowRoles: roles.moderator,
      children: [
        {
          path: buildPath(constant.Moderation.Queue),
          name: "Review Queue",
          icon: FaClock,
          allowRoles: roles.moderator,
          description: "Review flagged content awaiting moderation"
        },
        {
          path: buildPath(constant.Moderation.Actions),
          name: "Moderation Actions",
          icon: FaLock,
          allowRoles: roles.moderator,
          description: "Take action on reported content"
        },
        {
          path: buildPath(constant.Moderation.Appeals),
          name: "Appeals Review",
          icon: FaUnlock,
          allowRoles: roles.moderator,
          description: "Review appeals from users"
        }
      ]
    },

    // System Notifications (All roles with different access levels)
    {
      name: "System Alerts",
      icon: FaBell,
      allowRoles: roles.all,
      children: [
        {
          path: buildPath(constant.Notifications.List),
          name: "All Notifications",
          icon: FaBell,
          allowRoles: roles.viewerTeam,
          description: "System-wide notifications and updates"
        },
        {
          path: buildPath(constant.Notifications.Critical),
          name: "Critical Alerts",
          icon: FaExclamationTriangle,
          allowRoles: roles.moderator,
          description: "High-priority security alerts"
        }
      ]
    },

    // Reports & Analytics (Role-based access)
    {
      name: "Reports & Analytics",
      icon: FaFileAlt,
      allowRoles: roles.viewerTeam,
      children: [
        {
          path: buildPath(constant.Reports.Generate),
          name: "Generate Report",
          icon: FaFileAlt,
          allowRoles: roles.analystTeam,
          description: "Create custom analysis reports"
        },
        {
          path: buildPath(constant.Reports.Download),
          name: "Download Reports",
          icon: FaDownload,
          allowRoles: roles.viewerTeam,
          description: "Download available reports"
        },
        {
          path: buildPath(constant.Reports.Performance),
          name: "System Performance",
          icon: FaChartLine,
          allowRoles: roles.analystTeam,
          description: "System and AI model performance metrics"
        }
      ]
    },

    // Admin Settings (Admin only)
    {
      name: "System Settings",
      icon: FaCog,
      allowRoles: roles.adminOnly,
      children: [
        {
          path: buildPath(constant.Settings.Users),
          name: "User Management",
          icon: FaUsers,
          allowRoles: roles.adminOnly,
          description: "Manage user accounts and permissions"
        },
        {
          path: buildPath(constant.Settings.Roles),
          name: "Role Management",
          icon: FaUserShield,
          allowRoles: roles.adminOnly,
          description: "Configure user roles and permissions"
        },
        {
          path: buildPath(constant.Settings.AIConfig),
          name: "AI Model Settings",
          icon: FaDatabase,
          allowRoles: roles.adminOnly,
          description: "Configure AI models and thresholds"
        },
        {
          path: buildPath(constant.Settings.Security),
          name: "Security Settings",
          icon: FaKey,
          allowRoles: roles.adminOnly,
          description: "System security configuration"
        },
        {
          path: buildPath(constant.Settings.Theme),
          name: "Theme Settings",
          icon: FaPalette,
          allowRoles: roles.adminOnly,
          description: "Customize system appearance"
        }
      ]
    },

    // Help & Support (Available to all)
    {
      name: "Help & Support",
      icon: FaQuestionCircle,
      allowRoles: roles.all,
      children: [
        {
          path: buildPath(constant.Help.Documentation),
          name: "User Guide",
          icon: FaFileAlt,
          allowRoles: roles.all,
          description: "Learn how to use the platform effectively"
        },
        {
          path: buildPath(constant.Help.Training),
          name: "Training Materials",
          icon: FaStar,
          allowRoles: roles.standardUser,
          description: "Learn to identify harmful content"
        },
        {
          path: buildPath(constant.Help.FAQ),
          name: "FAQ",
          icon: FaQuestionCircle,
          allowRoles: roles.all,
          description: "Frequently asked questions"
        },
        {
          path: buildPath(constant.Help.Contact),
          name: "Contact Support",
          icon: FaComments,
          allowRoles: roles.all,
          description: "Get help from our support team"
        }
      ]
    }
  ];

  // Filter menu items based on user roles and profile verification status
  return menuItems.filter(item => {
    if (item.children) {
      item.children = item.children.filter(child => {
        // Additional check for verified user features
        if (child.allowRoles.includes('verified_user') && !userProfile.isVerified) {
          return false;
        }
        return hasAccess(child.allowRoles);
      });
    }
    
    // Show parent item if user has access OR if any children are accessible
    const hasDirectAccess = hasAccess(item.allowRoles);
    const hasChildAccess = item.children && item.children.length > 0;
    
    return hasDirectAccess || hasChildAccess;
  });
};
