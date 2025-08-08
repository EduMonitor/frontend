import { useState, useCallback } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

const useToast = () => {
  const [toast, setToast] = useState({
    open: false,
    title: '',
    description: '',
    severity: 'info', // 'success', 'error', 'warning', 'info'
  });

  const showToast = useCallback(({ title, description, status = 'info' }) => {
    setToast({ open: true, title, description, severity: status });
  }, []);

  const handleClose = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  const ToastComponent = (
    <Snackbar
      open={toast.open}
      autoHideDuration={3000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }} // Positioned at top-right
    >
      <Alert
        onClose={handleClose}
        severity={toast.severity}
        sx={{ width: '100%' }}
      >
        {toast.title && <AlertTitle>{toast.title}</AlertTitle>}
        {toast.description}
      </Alert>
    </Snackbar>
  );

  return { showToast, ToastComponent };
};

export default useToast;
