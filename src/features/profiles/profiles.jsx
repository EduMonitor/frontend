// pages/profile/Profile.jsx
import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  Button,
  Chip,
  CircularProgress,
  TextField,
  Switch,
  FormControlLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert,
  Card,
  CardContent,
  Stack,
  Badge,
} from '@mui/material';
import {
  FaPen,
  FaCamera,
  FaLock,
  FaShieldAlt,
  FaUser,
  FaEnvelope,
  FaCalendar,
  FaClock,
  FaCheckCircle,
  FaGoogle,
  FaFacebook,
} from 'react-icons/fa';
import { useQueryClient } from '@tanstack/react-query';
import useCurrentUser from '../../utils/hooks/current/user.currents';
import useAxiosPrivate from '../../utils/hooks/instance/axiosprivate.instance';
import useToast from '../../components/toast/toast.toast';
import { formatDate, formatOnlyDate } from '../../utils/functions/format-date.functions';
import { stringAvatar } from '../../components/avatars/avatars.avatar';

export default function Profile() {
  const { currentUser, isLoading, isError, refetch } = useCurrentUser();
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();
  const { showToast, ToastComponent } = useToast();

  // Dialog states
  const [editDialog, setEditDialog] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [imageDialog, setImageDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [errors, setErrors] = useState({});

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (isError) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Impossible de charger le profil
        </Alert>
        <Button variant="contained" onClick={() => refetch()}>
          Réessayer
        </Button>
      </Box>
    );
  }

  const fullName = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 'Utilisateur';

  // Get OAuth icon
  const getOAuthIcon = () => {
    if (currentUser?.oauthProvider === 'google') {
      return <FaGoogle style={{ color: '#DB4437' }} />;
    }
    if (currentUser?.oauthProvider === 'facebook') {
      return <FaFacebook style={{ color: '#4267B2' }} />;
    }
    return <FaEnvelope />;
  };

  // ==================== HANDLERS ====================

  const handleEditOpen = () => {
    setFormData({
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
    });
    setErrors({});
    setEditDialog(true);
  };

  const validateProfileForm = () => {
    const newErrors = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = 'Le prénom doit contenir au moins 2 caractères';
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Le nom est requis';
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = 'Le nom doit contenir au moins 2 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateProfile = async () => {
    if (!validateProfileForm()) return;

    setLoading(true);
    try {
      const response = await axiosPrivate.patch('/api/v2/user/profile/info', {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
      });

      showToast({
        title: 'Succès',
        description: response.data?.message || 'Profil mis à jour avec succès',
        status: 'success',
      });

      await queryClient.invalidateQueries(['currentUser']);
      setEditDialog(false);
    } catch (error) {
      showToast({
        title: 'Erreur',
        description: error.response?.data?.detail || 'Échec de la mise à jour du profil',
        status: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const validatePasswordForm = () => {
    const newErrors = {};

    if (!passwords.currentPassword) {
      newErrors.currentPassword = 'Le mot de passe actuel est requis';
    }

    if (!passwords.newPassword) {
      newErrors.newPassword = 'Le nouveau mot de passe est requis';
    } else if (passwords.newPassword.length < 6) {
      newErrors.newPassword = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (!passwords.confirmNewPassword) {
      newErrors.confirmNewPassword = 'Veuillez confirmer le nouveau mot de passe';
    } else if (passwords.newPassword !== passwords.confirmNewPassword) {
      newErrors.confirmNewPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;

    setLoading(true);
    try {
      const response = await axiosPrivate.patch('/api/v2/user/profile/password', passwords);

      showToast({
        title: 'Succès',
        description: response.data?.message || 'Mot de passe mis à jour avec succès',
        status: 'success',
      });

      setPasswordDialog(false);
      setPasswords({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      setErrors({});
    } catch (error) {
      showToast({
        title: 'Erreur',
        description: error.response?.data?.detail || 'Échec de la modification du mot de passe',
        status: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast({
        title: 'Erreur',
        description: 'Seuls les fichiers JPEG, PNG et WebP sont autorisés',
        status: 'error',
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast({
        title: 'Erreur',
        description: 'La taille du fichier ne doit pas dépasser 5 Mo',
        status: 'error',
      });
      return;
    }

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleImageUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    const formDataImage = new FormData();
    formDataImage.append('file', selectedFile);
    formDataImage.append('field', 'profileImage');

    try {
      const response = await axiosPrivate.patch('/api/v2/user/profile/image', formDataImage, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      showToast({
        title: 'Succès',
        description: response.data?.message || 'Photo de profil mise à jour avec succès',
        status: 'success',
      });

      await queryClient.invalidateQueries(['currentUser']);
      setImageDialog(false);
      setImagePreview(null);
      setSelectedFile(null);
    } catch (error) {
      showToast({
        title: 'Erreur',
        description: error.response?.data?.detail || 'Échec du téléchargement de l\'image',
        status: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelImageUpload = () => {
    setImageDialog(false);
    setImagePreview(null);
    setSelectedFile(null);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Header Card */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Box sx={{ position: 'relative' }}>
              <Badge
                color={currentUser?.isOnline ? 'success' : 'default'}
                variant="dot"
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              >
                {currentUser?.profileImage ? (
                  <Avatar
                    src={currentUser.profileImage}
                    alt={fullName}
                    sx={{ width: 100, height: 100, border: '4px solid white' }}
                  />
                ) : (
                  <Avatar
                    {...stringAvatar(fullName, 100, 100)}
                    sx={{ width: 100, height: 100, border: '4px solid white' }}
                  />
                )}
              </Badge>
              <IconButton
                onClick={() => setImageDialog(true)}
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  bgcolor: 'white',
                  '&:hover': { bgcolor: 'grey.200' },
                  boxShadow: 2,
                }}
                size="small"
              >
                <FaCamera size={14} />
              </IconButton>
            </Box>
          </Grid>
          <Grid size={{ sm: 12, md: 12, xs: 12 }}>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
              {fullName}
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5 }}>
              {currentUser?.email}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap">
              <Chip
                label={currentUser?.role || 'user'}
                size="small"
                sx={{ bgcolor: 'white', color: 'primary.main', textTransform: 'capitalize' }}
              />
              {currentUser?.isVerified && (
                <Chip
                  icon={<FaCheckCircle />}
                  label="Vérifié"
                  size="small"
                  sx={{ bgcolor: 'success.main', color: 'white' }}
                />
              )}
              {currentUser?.isOnline && (
                <Chip label="En ligne" size="small" sx={{ bgcolor: 'success.light', color: 'white' }} />
              )}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* Profile Information */}
       <Grid size={{ sm: 12, md: 8, xs: 12 }}>
          <Card elevation={0} sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FaUser /> Informations du profil
                </Typography>
                <Button startIcon={<FaPen />} onClick={handleEditOpen} variant="outlined" size="small">
                  Modifier
                </Button>
              </Box>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={3}>
               <Grid size={{ sm: 6, md: 6, xs: 12 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    Prénom
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {currentUser?.firstName || '—'}
                  </Typography>
                </Grid>
               <Grid size={{ sm: 6, md: 6, xs: 12 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    Nom
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {currentUser?.lastName || '—'}
                  </Typography>
                </Grid>
               <Grid size={{ sm: 6, md: 6, xs: 12 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    Email
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {currentUser?.email}
                  </Typography>
                </Grid>
               <Grid size={{ sm: 6, md: 6, xs: 12 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    Rôle
                  </Typography>
                  <Chip
                    label={currentUser?.role || 'user'}
                    size="small"
                    color="primary"
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Grid>
               <Grid size={{ sm: 6, md: 6, xs: 12 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    Méthode de connexion
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getOAuthIcon()}
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {currentUser?.oauthProvider === 'google'
                        ? 'Google'
                        : currentUser?.oauthProvider === 'facebook'
                          ? 'Facebook'
                          : 'Email'}
                    </Typography>
                  </Box>
                </Grid>
               <Grid size={{ sm: 6, md: 6, xs: 12 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    Date d'inscription
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <FaCalendar size={14} color="#666" />
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {currentUser?.createdAt ? formatOnlyDate(currentUser.createdAt) : '—'}
                    </Typography>
                  </Box>
                </Grid>
               <Grid size={{ sm: 6, md: 6, xs: 12 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    Dernière mise à jour
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <FaClock size={14} color="#666" />
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {currentUser?.updatedAt ? formatDate(currentUser.updatedAt) : '—'}
                    </Typography>
                  </Box>
                </Grid>
               <Grid size={{ sm: 6, md: 6, xs: 12 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    Dernière connexion
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <FaClock size={14} color="#666" />
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {currentUser?.lastLogin ? formatDate(currentUser.lastLogin) : '—'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Security & Account Status */}
       <Grid size={{ sm: 12, md: 4, xs: 12 }}>
          <Stack spacing={3}>
            {/* Security Card */}
            <Card elevation={0} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <FaShieldAlt /> Sécurité
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <FormControlLabel
                  control={
                    <Switch checked={currentUser?.twoFactorEnabled || false} disabled />
                  }
                  label="Authentification à deux facteurs"
                  sx={{ mb: 2 }}
                />
                <Button
                  fullWidth
                  startIcon={<FaLock />}
                  onClick={() => {
                    setPasswordDialog(true);
                    setErrors({});
                  }}
                  variant="outlined"
                  color="primary"
                >
                  Changer le mot de passe
                </Button>
              </CardContent>
            </Card>

            {/* Account Status Card */}
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                bgcolor: currentUser?.accountStatus === 'active' ? 'success.light' : 'warning.light',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Statut du compte
                </Typography>
                <Chip
                  label={currentUser?.accountStatus === 'active' ? 'Actif' : 'En attente'}
                  color={currentUser?.accountStatus === 'active' ? 'success' : 'warning'}
                  sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                />
              </CardContent>
            </Card>

            {/* Account Info Card */}
            <Card elevation={0} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Statistiques
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                 <Grid size={{ sm: 6, md: 6, xs: 6 }}>
                    <Box textAlign="center">
                      <Typography variant="h5" fontWeight="bold" color="primary">
                        {currentUser?.loginAttempts || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tentatives
                      </Typography>
                    </Box>
                  </Grid>
                 <Grid size={{ sm: 6, md: 6, xs: 6 }}>
                    <Box textAlign="center">
                      <Typography variant="h5" fontWeight="bold" color={currentUser?.isVerified ? 'success.main' : 'warning.main'}>
                        {currentUser?.isVerified ? <FaCheckCircle /> : '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Vérifié
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* ==================== DIALOGS ==================== */}

      {/* Edit Profile Dialog */}
      <Dialog open={editDialog} onClose={() => !loading && setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier le profil</DialogTitle>
        <DialogContent>
          <TextField
            label="Prénom"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            fullWidth
            sx={{ mt: 2, mb: 2 }}
            error={!!errors.firstName}
            helperText={errors.firstName}
            disabled={loading}
          />
          <TextField
            label="Nom"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            fullWidth
            error={!!errors.lastName}
            helperText={errors.lastName}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)} disabled={loading}>
            Annuler
          </Button>
          <Button variant="contained" onClick={handleUpdateProfile} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialog} onClose={() => !loading && setPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Changer le mot de passe</DialogTitle>
        <DialogContent>
          <TextField
            label="Mot de passe actuel"
            type="password"
            value={passwords.currentPassword}
            onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
            fullWidth
            sx={{ mt: 2, mb: 2 }}
            error={!!errors.currentPassword}
            helperText={errors.currentPassword}
            disabled={loading}
          />
          <TextField
            label="Nouveau mot de passe"
            type="password"
            value={passwords.newPassword}
            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
            fullWidth
            sx={{ mb: 2 }}
            error={!!errors.newPassword}
            helperText={errors.newPassword}
            disabled={loading}
          />
          <TextField
            label="Confirmer le nouveau mot de passe"
            type="password"
            value={passwords.confirmNewPassword}
            onChange={(e) => setPasswords({ ...passwords, confirmNewPassword: e.target.value })}
            fullWidth
            error={!!errors.confirmNewPassword}
            helperText={errors.confirmNewPassword}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)} disabled={loading}>
            Annuler
          </Button>
          <Button variant="contained" onClick={handleChangePassword} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Mettre à jour'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Upload Dialog */}
      <Dialog open={imageDialog} onClose={() => !loading && handleCancelImageUpload()} maxWidth="xs" fullWidth>
        <DialogTitle>Mettre à jour la photo de profil</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            {imagePreview ? (
              <Avatar src={imagePreview} sx={{ width: 150, height: 150, margin: '0 auto', mb: 2 }} />
            ) : (
              <Avatar
                {...stringAvatar(fullName, 150, 150)}
                src={currentUser?.profileImage}
                sx={{ width: 150, height: 150, margin: '0 auto', mb: 2 }}
              />
            )}
            <Button variant="outlined" component="label" fullWidth disabled={loading}>
              {selectedFile ? 'Choisir une autre photo' : 'Choisir une photo'}
              <input type="file" hidden accept="image/*" onChange={handleImageSelect} />
            </Button>
            {selectedFile && (
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                {selectedFile.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelImageUpload} disabled={loading}>
            Annuler
          </Button>
          <Button variant="contained" onClick={handleImageUpload} disabled={!selectedFile || loading}>
            {loading ? <CircularProgress size={20} /> : 'Télécharger'}
          </Button>
        </DialogActions>
      </Dialog>

      {ToastComponent}
    </Box>
  );
}