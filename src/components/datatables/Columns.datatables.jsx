// components/datatables/Columns.datatables.jsx
import { BsTrash } from "react-icons/bs";
import { FaEye, FaPencilAlt, FaKey } from "react-icons/fa";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import Badge from "@mui/material/Badge";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import PropTypes from "prop-types";
import { stringAvatar } from "../../components/avatars/avatars.avatar";

const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("fr-FR", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
};

// Returns a plain array of column definitions — NOT a React component.
// Call it as: UsersColumns({ onDelete, onView, onEdit, onAdd })
export const UsersColumns = ({ onDelete, onView, onEdit, onAdd } = {}) => [
    {
        name: "Avatar",
        cell: (row) => (
            <Badge
                color={row.isOnline ? "success" : "default"}
                variant="dot"
                overlap="circular"
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                {row?.profileImage ? (
                    <Avatar
                        sx={{ border: "2px solid", borderColor: "primary.main" }}
                        src={row.profileImage}
                        alt={`${String(row.firstName || '')} ${String(row.lastName || '')}`}
                    />
                ) : (
                    <Avatar {...stringAvatar(`${String(row.firstName || '')} ${String(row.lastName || '')}`)} />
                )}
            </Badge>
        ),
        sortable: false,
        width: "80px",
    },
    {
        name: "Nom Complet",
        selector: (row) => `${String(row.firstName || '')} ${String(row.lastName || '')}`,
        cell: (row) => (
            <Box>
                <Typography variant="body2" fontWeight="600">
                    {`${String(row.firstName || '')} ${String(row.lastName || '')}`}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {String(row.email || '')}
                </Typography>
            </Box>
        ),
        sortable: true,
        width: "250px",
    },
    {
        name: "Statut du Compte",
        selector: (row) => String(row.accountStatus || ''),
        cell: (row) => (
            <Chip
                label={row.accountStatus === "active" ? "Actif" : "Inactif"}
                color={row.accountStatus === "active" ? "success" : "default"}
                size="small"
                variant="outlined"
            />
        ),
        sortable: true,
        width: "150px",
    },
    {
        name: "Vérifié",
        selector: (row) => String(row.isVerified || false),
        cell: (row) => (
            <Chip
                label={row.isVerified ? "Vérifié" : "Non Vérifié"}
                color={row.isVerified ? "success" : "warning"}
                size="small"
            />
        ),
        sortable: true,
        width: "140px",
    },
    {
        name: "Bloqué",
        selector: (row) => String(row.isLocked || false),
        cell: (row) => (
            <Chip
                label={row.isLocked ? "Bloqué" : "Non Bloqué"}
                variant="outlined"
                color={row.isLocked ? "error" : "success"}
                size="small"
            />
        ),
        sortable: true,
        width: "140px",
    },
    {
        name: "Connexion OAuth",
        selector: (row) => String(row.oauthProvider || ''),
        cell: (row) => {
            if (row.oauthProvider === "google")
                return <Chip label="Google" color="error" size="small" />;
            if (row.oauthProvider === "facebook")
                return <Chip label="Facebook" color="primary" size="small" />;
            return <Chip label="Email" color="default" size="small" />;
        },
        sortable: true,
        width: "150px",
    },
    {
        name: "Dernière Connexion",
        selector: (row) => String(row.lastLogin || ''),
        cell: (row) => (
            <Typography variant="caption" color="text.secondary">
                {formatDate(row.lastLogin)}
            </Typography>
        ),
        sortable: true,
        width: "180px",
    },
    {
        name: "Tentatives",
        selector: (row) => String(row.loginAttempts || 0),
        cell: (row) => (
            <Chip
                label={String(row.loginAttempts || 0)}
                color={row.loginAttempts > 3 ? "error" : "default"}
                size="small"
            />
        ),
        sortable: true,
        width: "120px",
    },
    {
        name: "Actions",
        cell: (row) => (
            <Box display="flex" justifyContent="center" alignItems="center" gap={1}>
                <Tooltip title="Voir les détails" arrow>
                    <span>
                        <IconButton
                            color="info"
                            onClick={() => onView(row)}
                            disabled={row.role === "admin"}
                            size="small"
                        >
                            <FaEye />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title="Modifier" arrow>
                    <span>
                        <IconButton
                            color="primary"
                            onClick={() => onEdit(row)}
                            disabled={row.role === "admin"}
                            size="small"
                        >
                            <FaPencilAlt />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title="Changer le mot de passe" arrow>
                    <span>
                        <IconButton
                            color="warning"
                            onClick={() => onAdd(row)}
                            disabled={row.role === "admin"}
                            size="small"
                        >
                            <FaKey />
                        </IconButton>
                    </span>
                </Tooltip>
                <Tooltip title="Supprimer" arrow>
                    <span>
                        <IconButton
                            color="error"
                            onClick={() => onDelete(row)}
                            disabled={row.role === "admin"}
                            size="small"
                        >
                            <BsTrash />
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>
        ),
        width: "180px",
        center: true,
    },
];

UsersColumns.propTypes = {
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
    onView: PropTypes.func,
    onAdd: PropTypes.func,
};
