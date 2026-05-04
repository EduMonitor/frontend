import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Slide from '@mui/material/Slide';
import { alpha, useTheme } from '@mui/material/styles';
import { MdClose } from 'react-icons/md';
import { forwardRef } from 'react';

// Slide transition for modal
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const CustomModal = ({
  open,
  onClose,
  onConfirm,
  title = 'Modal Title',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  maxWidth = 'sm',
  fullWidth = true,
  titleColor = 'primary',
  confirmColor = 'primary',
  cancelColor = 'secondary',
  children,
  withButton = true,
  isLoading = false
}) => {
  const theme = useTheme();

  const handleClose = (event, reason) => {
    if (reason !== 'backdropClick' && !isLoading) {
      onClose(event, reason);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      TransitionComponent={Transition}
      keepMounted
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 4,
          boxShadow: theme.palette.mode === 'dark' ? theme.shadows[24] : theme.shadows[20],
          overflow: 'hidden',
          position: 'relative',
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`
            : theme.palette.background.paper,
          backdropFilter: 'blur(20px)',
        },
        '& .MuiBackdrop-root': {
          backgroundColor: alpha(theme.palette.common.black, 0.7),
          backdropFilter: 'blur(8px)',
        },
      }}
    >
      {/* Decorative Header Gradient */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        }}
      />

      {/* Title Section */}
      <DialogTitle
        sx={{
          pt: 3,
          pb: 2,
          px: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.1)} 0%, ${alpha(theme.palette.secondary.dark, 0.1)} 100%)`
            : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.08)} 0%, ${alpha(theme.palette.secondary.light, 0.08)} 100%)`,
        }}
      >
        <Box
          component="span"
          sx={{
            fontSize: '1.5rem',
            fontWeight: 700,
            background: `linear-gradient(135deg, ${theme.palette[titleColor]?.main || theme.palette.primary.main} 0%, ${theme.palette[titleColor]?.dark || theme.palette.primary.dark} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </Box>
        
        <IconButton
          onClick={onClose}
          disabled={isLoading}
          sx={{
            color: theme.palette.text.secondary,
            transition: 'all 0.2s',
            '&:hover': {
              color: theme.palette.error.main,
              bgcolor: alpha(theme.palette.error.main, 0.08),
              transform: 'rotate(90deg)',
            },
          }}
        >
          <MdClose size={24} />
        </IconButton>
      </DialogTitle>

      <Divider sx={{ opacity: 0.6 }} />

      {/* Content Section */}
      <DialogContent
        sx={{
          px: 3,
          py: 3,
          position: 'relative',
          '&::-webkit-scrollbar': {
            width: 8,
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: alpha(theme.palette.grey[500], 0.1),
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: alpha(theme.palette.primary.main, 0.5),
            borderRadius: 4,
            '&:hover': {
              bgcolor: theme.palette.primary.main,
            },
          },
        }}
      >
        {children}
      </DialogContent>

      <Divider sx={{ opacity: 0.6 }} />

      {/* Actions Section */}
      <DialogActions
        sx={{
          px: 3,
          py: 2.5,
          gap: 1.5,
          background: theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.default, 0.3)
            : alpha(theme.palette.grey[100], 0.5),
        }}
      >
        <Button
          onClick={onClose}
          disabled={isLoading}
          variant="outlined"
          color={cancelColor}
          sx={{
            minWidth: 100,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2,
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.2s',
          }}
        >
          {cancelText}
        </Button>
        
        {withButton && (
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            variant="contained"
            color={confirmColor}
            sx={{
              minWidth: 120,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: theme.shadows[8],
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[12],
              },
              '&:disabled': {
                bgcolor: alpha(theme.palette.grey[500], 0.3),
              },
              transition: 'all 0.2s',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.common.white, 0.3)}, transparent)`,
                transition: 'left 0.5s',
              },
              '&:hover::before': {
                left: '100%',
              },
            }}
          >
            {isLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress 
                  size={20} 
                  sx={{ 
                    color: theme.palette.common.white,
                  }} 
                />
                <span>Chargement...</span>
              </Box>
            ) : (
              confirmText
            )}
          </Button>
        )}
      </DialogActions>

      {/* Loading Overlay */}
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: alpha(theme.palette.background.paper, 0.7),
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <CircularProgress size={48} thickness={4} />
          </Box>
        </Box>
      )}
    </Dialog>
  );
};

CustomModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func,
  title: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  fullWidth: PropTypes.bool,
  isLoading: PropTypes.bool,
  titleColor: PropTypes.string,
  confirmColor: PropTypes.string,
  cancelColor: PropTypes.string,
  children: PropTypes.node,
  withButton: PropTypes.bool,
};

export default CustomModal;