// pages/admin/UserDetail.jsx
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Avatar,
    Chip,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Button,
    Paper,
    Stack,
    CircularProgress,
    Alert,
    Badge,
} from "@mui/material";
import {
    FaUser,
    FaEnvelope,
    FaCalendar,
    FaClock,
    FaShieldAlt,
    FaGlobe,
    FaLock,
    FaCheckCircle,
    FaTimesCircle,
    FaGoogle,
    FaFacebook,
    FaArrowLeft,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "../../utils/hooks/instance/axiosprivate.instance";
import { stringAvatar } from "../../components/avatars/avatars.avatar";

const UserDetail = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const axiosPrivate = useAxiosPrivate();

    // Fetch user details
    const { data: userData, isLoading, error } = useQuery({
        queryKey: ['user-detail', userId],
        queryFn: async () => {
            const response = await axiosPrivate.get(`/api/v2/user/admin/users/${userId}`);
            return response.data?.data;
        },
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString("fr-FR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getOAuthIcon = (provider) => {
        switch (provider) {
            case "google":
                return <FaGoogle style={{ color: "#DB4437" }} />;
            case "facebook":
                return <FaFacebook style={{ color: "#4267B2" }} />;
            default:
                return <FaEnvelope />;
        }
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={3}>
                <Alert severity="error">
                    Erreur lors du chargement des détails de l'utilisateur
                </Alert>
                <Button
                    startIcon={<FaArrowLeft />}
                    onClick={() => navigate("/admin/users")}
                    sx={{ mt: 2 }}
                >
                    Retour à la liste
                </Button>
            </Box>
        );
    }

    const user = userData;

    return (
        <Box p={3}>
            {/* Header */}
            <Box mb={3}>
                <Button
                    startIcon={<FaArrowLeft />}
                    onClick={() => navigate("/ai/settings/users")}
                    variant="outlined"
                    sx={{ mb: 2 }}
                >
                    Retour à la liste
                </Button>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Détails de l'utilisateur
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Profile Card */}
                <Grid size={{md:4,sm:12,xs:12}}>
                    <Card elevation={3}>
                        <CardContent>
                            <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                                <Badge
                                    color={user?.isOnline ? "success" : "default"}
                                    variant="dot"
                                    overlap="circular"
                                    anchorOrigin={{
                                        vertical: "bottom",
                                        horizontal: "right",
                                    }}
                                >
                                    {user?.profileImage ? (
                                        <Avatar
                                            src={user.profileImage}
                                            alt={`${user.firstName} ${user.lastName}`}
                                            sx={{ width: 120, height: 120 }}
                                        />
                                    ) : (
                                        <Avatar
                                            {...stringAvatar(`${user.firstName} ${user.lastName}`)}
                                            sx={{ width: 120, height: 120, fontSize: "2rem" }}
                                        />
                                    )}
                                </Badge>

                                <Box textAlign="center">
                                    <Typography variant="h5" fontWeight="bold">
                                        {user.firstName} {user.lastName}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {user.email}
                                    </Typography>
                                </Box>

                                <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
                                    <Chip
                                        label={user.accountStatus === "active" ? "Actif" : "Inactif"}
                                        color={user.accountStatus === "active" ? "success" : "default"}
                                        size="small"
                                    />
                                    <Chip
                                        label={user.isVerified ? "Vérifié" : "Non Vérifié"}
                                        color={user.isVerified ? "success" : "warning"}
                                        size="small"
                                    />
                                    {user.isLocked && (
                                        <Chip label="Bloqué" color="error" size="small" />
                                    )}
                                </Stack>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Details Cards */}
                <Grid size={{xs:12,md:8}}>
                    <Stack spacing={3}>
                        {/* Account Information */}
                        <Card elevation={3}>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    Informations du compte
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Grid container spacing={2}>
                                    <Grid size={{xs:12,md:6,sm:6}}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <FaUser color="#1976d2" />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Rôle
                                                </Typography>
                                                <Typography variant="body2" fontWeight="500">
                                                    {user.role}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                    <Grid size={{xs:12,md:6,sm:6}}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <FaEnvelope color="#1976d2" />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Email
                                                </Typography>
                                                <Typography variant="body2" fontWeight="500">
                                                    {user.email}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                    <Grid size={{xs:12,md:6,sm:6}}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            {getOAuthIcon(user.oauthProvider)}
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Méthode de connexion
                                                </Typography>
                                                <Typography variant="body2" fontWeight="500">
                                                    {user.oauthProvider === "google"
                                                        ? "Google"
                                                        : user.oauthProvider === "facebook"
                                                        ? "Facebook"
                                                        : "Email"}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                    <Grid size={{xs:12,md:6,sm:6}}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <FaShieldAlt color="#1976d2" />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Authentification 2FA
                                                </Typography>
                                                <Typography variant="body2" fontWeight="500">
                                                    {user.twoFactorEnabled ? "Activé" : "Désactivé"}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Activity Information */}
                        <Card elevation={3}>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    Activité
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Grid container spacing={2}>
                                    <Grid size={{xs:12,md:6,sm:6}}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <FaCalendar color="#1976d2" />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Dernière connexion
                                                </Typography>
                                                <Typography variant="body2" fontWeight="500">
                                                    {formatDate(user.lastLogin)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                    <Grid size={{xs:12,md:6,sm:6}}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <FaClock color="#1976d2" />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Dernier accès
                                                </Typography>
                                                <Typography variant="body2" fontWeight="500">
                                                    {formatDate(user.lastAccess)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                    <Grid size={{xs:12,md:6,sm:6}}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <FaGlobe color="#1976d2" />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    En ligne
                                                </Typography>
                                                <Typography variant="body2" fontWeight="500">
                                                    {user.isOnline ? "Oui" : "Non"}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                    <Grid size={{xs:12,md:6,sm:6}}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <FaLock color="#1976d2" />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Tentatives de connexion
                                                </Typography>
                                                <Chip
                                                    label={user.loginAttempts}
                                                    color={user.loginAttempts > 3 ? "error" : "default"}
                                                    size="small"
                                                />
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Account Dates */}
                        <Card elevation={3}>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    Dates importantes
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Grid container spacing={2}>
                                    <Grid size={{xs:12,md:6,sm:6}}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <FaCalendar color="#1976d2" />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Créé le
                                                </Typography>
                                                <Typography variant="body2" fontWeight="500">
                                                    {formatDate(user.createdAt)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                    <Grid size={{xs:12,md:6,sm:6}}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <FaClock color="#1976d2" />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Dernière mise à jour
                                                </Typography>
                                                <Typography variant="body2" fontWeight="500">
                                                    {formatDate(user.updatedAt)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Security Status */}
                        {(user.isLocked || user.twoFactorLocked) && (
                            <Card elevation={3}>
                                <CardContent>
                                    <Typography variant="h6" fontWeight="bold" gutterBottom color="error">
                                        Alertes de sécurité
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    <List>
                                        {user.isLocked && (
                                            <ListItem>
                                                <ListItemIcon>
                                                    <FaTimesCircle color="#d32f2f" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary="Compte bloqué"
                                                    secondary={
                                                        user.lockUntil
                                                            ? `Jusqu'à ${formatDate(user.lockUntil)}`
                                                            : "Bloqué indéfiniment"
                                                    }
                                                />
                                            </ListItem>
                                        )}
                                        {user.twoFactorLocked && (
                                            <ListItem>
                                                <ListItemIcon>
                                                    <FaTimesCircle color="#d32f2f" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary="2FA bloqué"
                                                    secondary={
                                                        user.twoFactorLockUntil
                                                            ? `Jusqu'à ${formatDate(user.twoFactorLockUntil)}`
                                                            : "Bloqué indéfiniment"
                                                    }
                                                />
                                            </ListItem>
                                        )}
                                    </List>
                                </CardContent>
                            </Card>
                        )}
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
};

export default UserDetail;