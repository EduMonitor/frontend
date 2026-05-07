import React, { useCallback, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Badge from "@mui/material/Badge";
import { FaLock, FaPlus, FaEye, FaPencilAlt, FaKey, FaSearch, FaSync, FaTrash, FaUsers } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import { useQuery } from "@tanstack/react-query";
import { styled, keyframes, useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material";
import useToast from "../../components/toast/toast.toast";
import useAxiosPrivate from "../../utils/hooks/instance/axiosprivate.instance";
import InputField from "../../components/forms/input.forms";
import { passValidation } from "../../utils/validators/input.validators";
import CustomModal from "../../components/modal/Custome.modal";
import { stringAvatar } from "../../components/avatars/avatars.avatar";

// ─── Animations ───────────────────────────────────────────────────────────────
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
`;

// ─── Styled Components (theme-aware) ─────────────────────────────────────────

const PageWrapper = styled(Box)(({ theme }) => ({
    minHeight: "100vh",
    background: theme.palette.background.default,
    padding: 0,
}));

const HeaderBar = styled(Box)(({ theme }) => ({
    background: alpha(theme.palette.background.paper, 0.85),
    backdropFilter: "blur(20px)",
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
    padding: "20px 28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    position: "sticky",
    top: 0,
    zIndex: 10,
}));

const SearchBox = styled(TextField)(({ theme }) => ({
    "& .MuiOutlinedInput-root": {
        borderRadius: "14px",
        background: alpha(theme.palette.background.paper, 0.9),
        fontSize: "14px",
        color: theme.palette.text.primary,
        "& fieldset": { borderColor: alpha(theme.palette.primary.main, 0.2) },
        "&:hover fieldset": { borderColor: alpha(theme.palette.primary.main, 0.4) },
        "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main, borderWidth: "2px" },
    },
    "& .MuiOutlinedInput-input": {
        padding: "10px 14px",
        color: theme.palette.text.primary,
    },
}));

const UserCard = styled(Box)(({ theme, online }) => ({
    background: theme.palette.background.paper,
    borderRadius: "20px",
    border: `1px solid ${online === "true"
        ? alpha(theme.palette.success.main, 0.25)
        : alpha(theme.palette.divider, 0.6)}`,
    boxShadow: theme.shadows[2],
    padding: "24px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    animation: `${fadeUp} 0.5s ease-out both`,
    position: "relative",
    overflow: "hidden",
    "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: theme.shadows[8],
        border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
    },
    "&::before": {
        content: '""',
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: "3px",
        background: online === "true"
            ? `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.light})`
            : `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        borderRadius: "20px 20px 0 0",
    },
}));

const StatBadge = styled(Box)(({ theme, badgecolor }) => {
    const color = badgecolor || theme.palette.primary.main;
    return {
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: 600,
        background: alpha(color, 0.12),
        color: color,
        border: `1px solid ${alpha(color, 0.25)}`,
    };
});

const ActionBtn = styled(IconButton)(({ theme, btncolor }) => {
    const color = btncolor || theme.palette.primary.main;
    return {
        width: 34,
        height: 34,
        borderRadius: "10px",
        background: alpha(color, 0.08),
        color: color,
        border: `1px solid ${alpha(color, 0.2)}`,
        transition: "all 0.2s ease",
        "&:hover": {
            background: alpha(color, 0.18),
            transform: "scale(1.1)",
            boxShadow: `0 4px 12px ${alpha(color, 0.3)}`,
        },
        "&:disabled": { opacity: 0.3 },
    };
});

const StatPill = styled(Box)(({ theme, pillcolor }) => {
    const color = pillcolor || theme.palette.primary.main;
    return {
        px: 2.5, py: 1.5,
        borderRadius: "14px",
        background: alpha(theme.palette.background.paper, 0.8),
        border: `1px solid ${alpha(color, 0.2)}`,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
    };
});

const generateRandomPassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    return Array.from({ length: 12 }, () => charset[Math.floor(Math.random() * charset.length)]).join("");
};

// ─── Card Skeleton ─────────────────────────────────────────────────────────────
const CardSkeleton = () => {
    const theme = useTheme();
    return (
        <Box sx={{
            background: theme.palette.background.paper,
            borderRadius: "20px",
            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            padding: "24px",
            overflow: "hidden",
            position: "relative",
            "&::after": {
                content: '""',
                position: "absolute",
                inset: 0,
                background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.background.default, 0.6)}, transparent)`,
                backgroundSize: "400px 100%",
                animation: `${shimmer} 1.5s infinite`,
            }
        }}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Skeleton variant="circular" width={52} height={52} />
                <Box flex={1}>
                    <Skeleton variant="text" width="60%" height={20} sx={{ mb: 0.5 }} />
                    <Skeleton variant="text" width="80%" height={14} />
                </Box>
            </Box>
            <Box display="flex" gap={1} mb={2}>
                <Skeleton variant="rounded" width={70} height={22} sx={{ borderRadius: "20px" }} />
                <Skeleton variant="rounded" width={60} height={22} sx={{ borderRadius: "20px" }} />
            </Box>
            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Skeleton variant="text" width="40%" height={14} />
                <Box display="flex" gap={0.5}>
                    {[1,2,3,4].map(i => <Skeleton key={i} variant="circular" width={34} height={34} />)}
                </Box>
            </Box>
        </Box>
    );
};

// ─── User Card Component ───────────────────────────────────────────────────────
const UserCardItem = React.memo(({ user, onView, onEdit, onAdd, onDelete, index }) => {
    const theme = useTheme();
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Utilisateur";
    const isAdmin = user.role === "admin";

    const statusColor = user.accountStatus === "active" ? theme.palette.success.main : theme.palette.text.disabled;
    const roleColor = isAdmin ? theme.palette.warning.main : theme.palette.primary.main;

    return (
        <UserCard
            online={String(!!user.isOnline)}
            sx={{ animationDelay: `${index * 60}ms` }}
        >
            {/* Top: Avatar + Name */}
            <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
                <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    badgeContent={
                        <Box sx={{
                            width: 12, height: 12,
                            borderRadius: "50%",
                            bgcolor: user.isOnline ? theme.palette.success.main : theme.palette.text.disabled,
                            border: `2px solid ${theme.palette.background.paper}`,
                        }} />
                    }
                >
                    {user.profileImage ? (
                        <Avatar
                            src={user.profileImage}
                            alt={fullName}
                            sx={{ width: 52, height: 52, border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}` }}
                            onError={(e) => { e.currentTarget.src = ""; }}
                        />
                    ) : (
                        <Avatar
                            {...stringAvatar(fullName, 52, 52)}
                            sx={{
                                ...stringAvatar(fullName, 52, 52).sx,
                                width: 52, height: 52,
                                fontSize: 18, fontWeight: 700,
                                border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                            }}
                        />
                    )}
                </Badge>

                <Box flex={1} minWidth={0}>
                    <Typography
                        variant="subtitle1"
                        fontWeight={700}
                        color="text.primary"
                        noWrap
                        sx={{ fontSize: "15px", letterSpacing: "-0.3px" }}
                    >
                        {fullName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: "12px" }}>
                        {user.email}
                    </Typography>
                </Box>

                <Box sx={{
                    px: 1.5, py: 0.5,
                    borderRadius: "8px",
                    background: alpha(roleColor, 0.12),
                    border: `1px solid ${alpha(roleColor, 0.25)}`,
                }}>
                    <Typography sx={{ fontSize: "10px", fontWeight: 700, color: roleColor, letterSpacing: "0.5px" }}>
                        {isAdmin ? "ADMIN" : "STAFF"}
                    </Typography>
                </Box>
            </Box>

            {/* Status Badges */}
            <Box display="flex" flexWrap="wrap" gap={0.75} mb={2.5}>
                <StatBadge badgecolor={statusColor}>
                    <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: statusColor }} />
                    {user.accountStatus === "active" ? "Actif" : "Inactif"}
                </StatBadge>

                {user.isVerified && (
                    <StatBadge badgecolor={theme.palette.info.main}>✓ Vérifié</StatBadge>
                )}
                {user.isLocked && (
                    <StatBadge badgecolor={theme.palette.error.main}>⚠ Bloqué</StatBadge>
                )}
                {user.oauthProvider === "google" && (
                    <StatBadge badgecolor={theme.palette.error.main}>G Google</StatBadge>
                )}
                {user.twoFactorEnabled && (
                    <StatBadge badgecolor={theme.palette.secondary.main}>🔐 2FA</StatBadge>
                )}
                {user.loginAttempts > 3 && (
                    <StatBadge badgecolor={theme.palette.warning.main}>{user.loginAttempts} tentatives</StatBadge>
                )}
            </Box>

            {/* Footer: Last login + Actions */}
            <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: "11px" }}>
                    {user.lastLogin
                        ? `Vu ${new Date(user.lastLogin).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`
                        : "Jamais connecté"
                    }
                </Typography>

                <Box display="flex" gap={0.5}>
                    <Tooltip title="Voir détails" arrow>
                        <span>
                            <ActionBtn btncolor={theme.palette.info.main} onClick={() => onView(user)} disabled={isAdmin} size="small">
                                <FaEye size={13} />
                            </ActionBtn>
                        </span>
                    </Tooltip>
                    <Tooltip title="Modifier" arrow>
                        <span>
                            <ActionBtn btncolor={theme.palette.primary.main} onClick={() => onEdit(user)} disabled={isAdmin} size="small">
                                <FaPencilAlt size={13} />
                            </ActionBtn>
                        </span>
                    </Tooltip>
                    <Tooltip title="Changer mot de passe" arrow>
                        <span>
                            <ActionBtn btncolor={theme.palette.warning.main} onClick={() => onAdd(user)} disabled={isAdmin} size="small">
                                <FaKey size={13} />
                            </ActionBtn>
                        </span>
                    </Tooltip>
                    <Tooltip title="Supprimer" arrow>
                        <span>
                            <ActionBtn btncolor={theme.palette.error.main} onClick={() => onDelete(user)} disabled={isAdmin} size="small">
                                <FaTrash size={13} />
                            </ActionBtn>
                        </span>
                    </Tooltip>
                </Box>
            </Box>
        </UserCard>
    );
});

UserCardItem.displayName = "UserCardItem";

// ─── Main Component ────────────────────────────────────────────────────────────
const StaffLists = React.memo(() => {
    const navigate = useNavigate();
    const theme = useTheme();
    const [error, setError] = useState({});
    const [searchQuery, setSearchQuery] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedDeleteRow, setSelectedDeleteRow] = useState(null);
    const [showChangePassModal, setShowChangePassModal] = useState(false);
    const [selectedChangePassRow, setSelectedChangePassRow] = useState(null);
    const { showToast, ToastComponent } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ password: "" });

    const axiosPrivate = useAxiosPrivate();

    const { data: staffList, isLoading: loading, refetch } = useQuery({
        queryKey: ["staffData"],
        queryFn: async () => {
            const response = await axiosPrivate.get(`/api/v2/user/admin/users`);
            return response.data.data;
        },
        staleTime: 1000 * 60 * 5,
        retry: 3,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
        refetchOnWindowFocus: false,
    });

    const handleInputPasswordChange = useCallback((event) => {
        const { name, value } = event.target;
        const sanitizedValue = DOMPurify.sanitize(value);
        setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
        setError((prev) => ({ ...prev, [name]: undefined }));
    }, []);

    const handleGeneratePassword = useCallback(() => {
        setFormData((prev) => ({ ...prev, password: generateRandomPassword() }));
        setError((prev) => ({ ...prev, password: undefined }));
    }, []);

    const handleDelete = useCallback((row) => {
        setSelectedDeleteRow(row);
        setShowDeleteModal(true);
    }, []);

    const handleChangePassword = useCallback((row) => {
        setSelectedChangePassRow(row);
        setShowChangePassModal(true);
    }, []);

    const handleView = useCallback((row) => {
        navigate(`/ai/settings/users/${row.uuid}`);
    }, [navigate]);

    const handleEditClick = useCallback((row) => {
        navigate(`/ai/settings/edit-user/${row.uuid}`);
    }, [navigate]);

    const handleConfirmDelete = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axiosPrivate.delete(`/api/v2/auth/user/${selectedDeleteRow?.uuid}`);
            if (response.status === 200) {
                showToast({ description: response.data.message, status: "success" });
                refetch();
            }
        } catch (err) {
            showToast({ description: err.message, status: "error" });
        } finally {
            setShowDeleteModal(false);
            setSelectedDeleteRow(null);
            setIsLoading(false);
        }
    }, [axiosPrivate, refetch, selectedDeleteRow?.uuid, showToast]);

    const handleEditPassword = useCallback(async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await passValidation.validate(formData, { abortEarly: false });
            const response = await axiosPrivate.put(
                `/api/v2/auth/user/reset-pass/${selectedChangePassRow?.uuid}`,
                formData
            );
            if (response.status === 200) {
                showToast({ description: response.data.message, status: "success" });
                refetch();
                setFormData({ password: "" });
                setShowChangePassModal(false);
            }
        } catch (err) {
            if (err.inner) {
                const validationErrors = {};
                err.inner.forEach((e) => { validationErrors[e.path] = e.message; });
                setError(validationErrors);
            } else {
                showToast({ description: err.response?.data?.message || err.message || "Erreur", status: "error" });
            }
        } finally {
            setIsLoading(false);
        }
    }, [formData, axiosPrivate, selectedChangePassRow?.uuid, showToast, refetch]);

    const filteredData = useMemo(() =>
        Array.isArray(staffList)
            ? staffList.filter((item) =>
                Object.values(item || {}).some((val) =>
                    String(val || '').toLowerCase().includes(searchQuery.toLowerCase())
                )
            )
            : [],
        [searchQuery, staffList]
    );

    const stats = useMemo(() => ({
        total: filteredData.length,
        active: filteredData.filter(u => u.accountStatus === "active").length,
        online: filteredData.filter(u => u.isOnline).length,
        locked: filteredData.filter(u => u.isLocked).length,
    }), [filteredData]);

    const changePassForm = useMemo(() => (
        <Grid container spacing={2} my={2}>
            <Grid size={{ md: 12, sm: 12, xs: 12 }}>
                <Box display="flex" gap={1} alignItems="center">
                    <InputField
                        label="Mot de passe"
                        name="password"
                        type="password"
                        prefix={<FaLock />}
                        fullWidth
                        value={formData.password}
                        error={!!error.password}
                        errorMessage={error.password}
                        onChange={handleInputPasswordChange}
                    />
                    <Button onClick={handleGeneratePassword} variant="outlined" sx={{ borderRadius: "10px", whiteSpace: "nowrap" }}>
                        Générer
                    </Button>
                </Box>
            </Grid>
        </Grid>
    ), [error.password, formData.password, handleInputPasswordChange, handleGeneratePassword]);

    const statItems = [
        { label: "Total",     value: stats.total,  color: theme.palette.primary.main },
        { label: "Actifs",    value: stats.active, color: theme.palette.success.main },
        { label: "En ligne",  value: stats.online, color: theme.palette.info.main },
        { label: "Bloqués",   value: stats.locked, color: theme.palette.error.main },
    ];

    return (
        <PageWrapper>
            {ToastComponent}

            {/* ── Header ── */}
            <HeaderBar>
                <Box display="flex" alignItems="center" gap={2}>
                    <Box sx={{
                        width: 40, height: 40,
                        borderRadius: "12px",
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <FaUsers size={18} color="#fff" />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.2, letterSpacing: "-0.5px" }}>
                            Utilisateurs
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {stats.total} membre{stats.total !== 1 ? "s" : ""} · {stats.active} actif{stats.active !== 1 ? "s" : ""}
                            {stats.online > 0 && ` · ${stats.online} en ligne`}
                        </Typography>
                    </Box>
                </Box>

                <Box display="flex" gap={1.5} alignItems="center" flexWrap="wrap">
                    <SearchBox
                        placeholder="Rechercher..."
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ width: 240 }}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <FaSearch style={{ color: theme.palette.text.disabled, fontSize: 14 }} />
                                    </InputAdornment>
                                ),
                            }
                        }}
                    />
                    <Tooltip title="Actualiser" arrow>
                        <IconButton
                            onClick={() => refetch()}
                            sx={{
                                borderRadius: "10px",
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                background: alpha(theme.palette.primary.main, 0.05),
                                color: theme.palette.primary.main,
                            }}
                        >
                            <FaSync size={14} />
                        </IconButton>
                    </Tooltip>
                    <Button
                        startIcon={<FaPlus size={13} />}
                        variant="contained"
                        onClick={() => navigate(`/ai/settings/users/add`)}
                        sx={{
                            borderRadius: "12px",
                            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.3)}`,
                            fontWeight: 700,
                            fontSize: "13px",
                            textTransform: "none",
                            px: 2.5,
                            "&:hover": {
                                background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                                boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                            }
                        }}
                    >
                        Ajouter
                    </Button>
                </Box>
            </HeaderBar>

            {/* ── Stats Strip ── */}
            {!loading && (
                <Box sx={{ px: 3, pt: 2.5, pb: 0 }}>
                    <Box display="flex" gap={2} flexWrap="wrap">
                        {statItems.map((stat) => (
                            <Box key={stat.label} sx={{
                                px: 2.5, py: 1.5,
                                borderRadius: "14px",
                                background: alpha(theme.palette.background.paper, 0.8),
                                border: `1px solid ${alpha(stat.color, 0.2)}`,
                                display: "flex", alignItems: "center", gap: 1.5,
                            }}>
                                <Typography variant="h6" fontWeight={800} color={stat.color} sx={{ lineHeight: 1 }}>
                                    {stat.value}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    {stat.label}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}

            {/* ── Cards Grid ── */}
            <Box sx={{ p: 3 }}>
                {loading ? (
                    <Grid container spacing={2.5}>
                        {[...Array(8)].map((_, i) => (
                            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                                <CardSkeleton />
                            </Grid>
                        ))}
                    </Grid>
                ) : filteredData.length === 0 ? (
                    <Box sx={{
                        textAlign: "center",
                        py: 10,
                        background: alpha(theme.palette.background.paper, 0.6),
                        borderRadius: "20px",
                        border: `1px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}>
                        <Typography sx={{ fontSize: 48, mb: 1 }}>👤</Typography>
                        <Typography variant="h6" fontWeight={700} color="text.primary">
                            Aucun utilisateur trouvé
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={0.5}>
                            {searchQuery ? `Aucun résultat pour "${searchQuery}"` : "Aucun utilisateur enregistré"}
                        </Typography>
                    </Box>
                ) : (
                    <Grid container spacing={2.5}>
                        {filteredData.map((user, index) => (
                            <Grid key={user._id || user.uuid} size={{ xs: 12, sm: 6, md: 4 }}>
                                <UserCardItem
                                    user={user}
                                    index={index}
                                    onView={handleView}
                                    onEdit={handleEditClick}
                                    onAdd={handleChangePassword}
                                    onDelete={handleDelete}
                                />
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Box>

            {/* ── Delete Modal ── */}
            {showDeleteModal && (
                <CustomModal
                    open={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={handleConfirmDelete}
                    title="Supprimer l'utilisateur"
                    confirmText="Supprimer"
                    cancelText="Annuler"
                    maxWidth="xs"
                    isLoading={isLoading}
                    titleColor="error"
                    confirmColor="error"
                    cancelColor="secondary"
                >
                    <Typography align="center" color="text.secondary">
                        Voulez-vous vraiment supprimer
                        <Typography component="span" fontWeight={700} color="error.main" mx={0.5}>
                            {selectedDeleteRow ? `${selectedDeleteRow.firstName} ${selectedDeleteRow.lastName}` : ""}
                        </Typography>
                        ? Cette action est irréversible.
                    </Typography>
                </CustomModal>
            )}

            {/* ── Change Password Modal ── */}
            {selectedChangePassRow && (
                <CustomModal
                    open={showChangePassModal}
                    onClose={() => {
                        setShowChangePassModal(false);
                        setFormData({ password: "" });
                        setError({});
                    }}
                    onConfirm={handleEditPassword}
                    title={`Mot de passe — ${selectedChangePassRow.firstName} ${selectedChangePassRow.lastName}`}
                    confirmText="Changer"
                    cancelText="Annuler"
                    maxWidth="sm"
                    isLoading={isLoading}
                    titleColor="primary"
                    confirmColor="primary"
                    cancelColor="secondary"
                >
                    {changePassForm}
                </CustomModal>
            )}
        </PageWrapper>
    );
});

StaffLists.displayName = "StaffLists";
export default StaffLists;