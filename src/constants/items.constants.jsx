// constants/sidebar.constant.js
import {
  FaTachometerAlt,
  FaSearch,
  FaFileAlt,
  FaCog,
  FaUserShield,
  FaUsers,
  FaChartLine,
  FaEye,
  FaGlobe,
  FaBell,
  FaPlus,
  FaShieldAlt,
  FaLock,
} from "react-icons/fa";
import { AdminRoutes } from "./routes.constant";

export const sidebarMenuItems = (userRoles = []) => {
  const constant = AdminRoutes;

  const hasAccess = (allowRoles) =>
    allowRoles.some((role) => userRoles.includes(role));

  const roles = {
    all:   ["admin", "user"],
    admin: ["admin"],
  };

  const p = (route) => `/ai/${route}`;

  const menuItems = [

    // ── DASHBOARD ────────────────────────────────────────────────
    {
      path: p(constant.dashboard),
      name: "Dashboard",
      icon: FaTachometerAlt,
      allowRoles: roles.all,
    },

    // ── OSINT ────────────────────────────────────────────────────
    {
      path: p(constant.Analysis.New),
      name: "Nouvelle Recherche",
      icon: FaSearch,
      allowRoles: roles.all,
    },
    {
      path: p(constant.Analysis.Results),
      name: "Résultats",
      icon: FaFileAlt,
      allowRoles: roles.all,
    },
    {
      path: p(constant.Analysis.Filters),
      name: "Filtres",
      icon: FaShieldAlt,
      allowRoles: roles.all,
    },

    // ── MONITORING ───────────────────────────────────────────────
    {
      path: p(constant.Monitoring.Feed),
      name: "Live Feed",
      icon: FaGlobe,
      allowRoles: roles.all,
    },
    // ── MONITORING ───────────────────────────────────────────────
    {
      path: p(constant.analystics),
      name: "AI Insights",
      icon: FaChartLine,
      allowRoles: roles.all,
    },
    {
      path: p(constant.Monitoring.Keywords),
      name: "Alertes Mots-clés",
      icon: FaBell,
      allowRoles: roles.all,
    },

    // ── ADMIN ────────────────────────────────────────────────────
    {
      path: p(constant.Settings.Users),
      name: "Utilisateurs",
      icon: FaUsers,
      allowRoles: roles.admin,
    },
    {
      path: p(constant.Settings.AddUsers),
      name: "Ajouter Utilisateur",
      icon: FaPlus,
      allowRoles: roles.admin,
    },
    {
      path: p(constant.Settings.Roles),
      name: "Rôles",
      icon: FaUserShield,
      allowRoles: roles.admin,
    },
    {
      path: p(constant.Settings.AIConfig),
      name: "Paramètres IA",
      icon: FaCog,
      allowRoles: roles.admin,
    },
    {
      path: p(constant.Settings.Security),
      name: "Sécurité",
      icon: FaLock,
      allowRoles: roles.admin,
    },
  ];

  return menuItems.filter((item) => hasAccess(item.allowRoles));
};