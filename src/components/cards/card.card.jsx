import CardContent from "@mui/material/CardContent";
import Card from "@mui/material/Card";
import { useThemeMode } from "../../utils/hooks/contexts/useTheme.context";

export const CardBox = ({ children, step = 'verify', ...props }) => {
  const { currentTheme } = useThemeMode(); // ✅ Destructure correctly
  const { palette, shadows } = currentTheme;
  return (
    <Card
      sx={{
        background: palette.background.paper,
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: 4,
        overflow: "visible",
        position: "relative",
        boxShadow: `0 20px 40px ${shadows[2]}`, // pick the appropriate one
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background:
            step === "success"
              ? `linear-gradient(90deg, ${palette.success.main}, ${palette.success.main})`
              : step === "error"
                ? `linear-gradient(90deg, ${palette.error.main}, ${palette.error.main})`
                : "linear-gradient(90deg, #4A90E2, #50C878, #9B59B6, #F39C12)",
          borderRadius: "16px 16px 0 0",
        },
      }}
      {...props}
    >
      <CardContent sx={{ p: 4 }}>{children}</CardContent>
    </Card>
  );
};
