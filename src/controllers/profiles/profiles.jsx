import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Divider from '@mui/material/Divider';
import { FaPen, FaCamera, FaLock, FaShieldAlt } from 'react-icons/fa';
import { useQueryClient } from '@tanstack/react-query';
import useCurrentUser from '../../utils/hooks/current/user.currents';
import useAxiosPrivate from '../../utils/hooks/instance/axiosprivate.instance';
import { formatDate, formatOnlyDate } from '../../utils/functions/format-date.functions';
import { stringAvatar } from '../../components/avatars/avatars.avatar';
import useAuthTheme from '../../auth/sections/themeHook.sections';

export default function Profiles() {
  const { currentUser, isLoading, isError, refetch } = useCurrentUser();
  const theme = useAuthTheme();
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();
  
  const [editDialog, setEditDialog] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [imageDialog, setImageDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6">Unable to load profile.</Typography>
        <Button variant="contained" onClick={() => refetch()} sx={{ mt: 2 }}>Retry</Button>
      </Box>
    );
  }

  const fullName = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || currentUser?.email || 'User';

  const handleEditOpen = () => {
    setFormData({
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      email: currentUser?.email || ''
    });
    setEditDialog(true);
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      await axiosPrivate.put('/api/v2/auth/update-profile', formData);
      // Invalidate and refetch
      await queryClient.invalidateQueries(['currentUser']);
      setEditDialog(false);
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      alert('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await axiosPrivate.put('/api/v2/auth/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      setPasswordDialog(false);
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error) {
      console.error('Password change failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle2FA = async () => {
    setLoading(true);
    try {
      await axiosPrivate.put('/api/v2/auth/toggle-2fa', {
        enabled: !currentUser?.twoFactorEnabled
      });
      await queryClient.invalidateQueries(['currentUser']);
    } catch (error) {
      console.error('2FA toggle failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append('profileImage', file);
    
    try {
      await axiosPrivate.put('/api/v2/auth/upload-photo', formData);
      await queryClient.invalidateQueries(['currentUser']);
      setImageDialog(false);
    } catch (error) {
      console.error('Image upload failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh', background: theme?.background || '#f5f7fa' }}>
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Box sx={{ position: 'relative' }}>
              <Avatar 
                {...stringAvatar(fullName, 100, 100)}
                sx={{ width: 100, height: 100, border: '4px solid white' }}
                src={currentUser?.profileImage}
              />
              <IconButton
                onClick={() => setImageDialog(true)}
                sx={{ position: 'absolute', bottom: 0, right: 0, bgcolor: 'white', '&:hover': { bgcolor: 'grey.200' }, boxShadow: 2 }}
                size="small"
              >
                <FaCamera size={14} />
              </IconButton>
            </Box>
          </Grid>
          <Grid item xs>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>{fullName}</Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>{currentUser?.email}</Typography>
            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
              <Chip label={currentUser?.role || 'user'} size="small" sx={{ bgcolor: 'white', color: 'primary.main', textTransform: 'capitalize' }} />
              {currentUser?.isVerified && <Chip label="Verified" size="small" sx={{ bgcolor: 'success.main', color: 'white' }} />}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Profile Information</Typography>
              <Button startIcon={<FaPen />} onClick={handleEditOpen} variant="outlined" size="small">Edit</Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">First Name</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{currentUser?.firstName || '—'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Last Name</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{currentUser?.lastName || '—'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Email</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{currentUser?.email}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Role</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, textTransform: 'capitalize' }}>{currentUser?.role || 'user'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Joined</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{currentUser?.createdAt ? formatOnlyDate(currentUser.createdAt) : '—'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Last Updated</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{currentUser?.updatedAt ? formatDate(currentUser.updatedAt) : '—'}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <FaShieldAlt /> Security
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <FormControlLabel
              control={<Switch checked={currentUser?.twoFactorEnabled || false} onChange={handleToggle2FA} disabled={loading} />}
              label="Two-Factor Auth"
            />
            <Button fullWidth startIcon={<FaLock />} onClick={() => setPasswordDialog(true)} variant="outlined" sx={{ mt: 2 }}>
              Change Password
            </Button>
          </Paper>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: currentUser?.accountStatus === 'active' ? 'success.light' : 'warning.light' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Account Status</Typography>
            <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>{currentUser?.accountStatus || 'pending'}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <TextField label="First Name" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} fullWidth sx={{ mt: 2, mb: 2 }} />
          <TextField label="Last Name" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} fullWidth sx={{ mb: 2 }} />
          <TextField label="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} fullWidth type="email" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateProfile} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField label="Current Password" type="password" value={passwords.current} onChange={(e) => setPasswords({...passwords, current: e.target.value})} fullWidth sx={{ mt: 2, mb: 2 }} />
          <TextField label="New Password" type="password" value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} fullWidth sx={{ mb: 2 }} />
          <TextField label="Confirm Password" type="password" value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleChangePassword} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialog} onClose={() => setImageDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Update Profile Photo</DialogTitle>
        <DialogContent>
          <Button variant="outlined" component="label" fullWidth sx={{ mt: 2 }} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Choose Photo'}
            <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}