import Backdrop from "@mui/material/Backdrop"
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box"
export const Spinner =({isLoading, title="Initializing AI Systems...",subtitle='Connecting to neural networks'})=>{
    return(
        <Backdrop
                sx={{
                  color: '#fff',
                  zIndex: (theme) => theme.zIndex.drawer + 1,
                  background: 'rgba(0, 0, 0, 0.8)',
                  backdropFilter: 'blur(5px)',
                }}
                open={isLoading}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <CircularProgress size={60} sx={{ mb: 2 }} />
                  <Typography variant="h6">{title}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    {subtitle}
                  </Typography>
                </Box>
              </Backdrop>
    )
}