import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Container, Typography } from "@mui/material";
import { FaCircleCheck, FaCircleXmark } from "react-icons/fa6";
import { FaSync } from "react-icons/fa";
import useAuth from "../utils/hooks/contexts/useAth.contexts";
import useToast from "../components/toast/toast.toast";

// Modern 3D animated text component
const AnimatedTitle = ({ text, success }) => (
  <Box
    sx={{
      position: "relative",
      fontSize: { xs: "2rem", sm: "3rem", md: "4rem" },
      fontWeight: 900,
      textAlign: "center",
      background: success
        ? "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)"
        : "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      textShadow: success
        ? "0 4px 20px rgba(102, 126, 234, 0.3)"
        : "0 4px 20px rgba(245, 87, 108, 0.3)",
      animation: "floatIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
      "@keyframes floatIn": {
        "0%": {
          opacity: 0,
          transform: "translateY(-30px) scale(0.8)",
        },
        "100%": {
          opacity: 1,
          transform: "translateY(0) scale(1)",
        },
      },
    }}
  >
    {text}
  </Box>
);

// Particle effect background
const ParticleBackground = ({ success }) => (
  <Box
    sx={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: "hidden",
      pointerEvents: "none",
      zIndex: 0,
    }}
  >
    {[...Array(20)].map((_, i) => (
      <Box
        key={i}
        sx={{
          position: "absolute",
          width: Math.random() * 100 + 50,
          height: Math.random() * 100 + 50,
          borderRadius: "50%",
          background: success
            ? `radial-gradient(circle, rgba(102, 126, 234, ${Math.random() * 0.3}) 0%, transparent 70%)`
            : `radial-gradient(circle, rgba(245, 87, 108, ${Math.random() * 0.3}) 0%, transparent 70%)`,
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 5}s`,
          "@keyframes float": {
            "0%, 100%": {
              transform: "translate(0, 0) scale(1)",
            },
            "50%": {
              transform: `translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) scale(1.2)`,
            },
          },
        }}
      />
    ))}
  </Box>
);

// Success icon with animation
const SuccessIcon = () => (
  <Box
    sx={{
      position: "relative",
      animation: "scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s backwards",
      "@keyframes scaleIn": {
        "0%": {
          transform: "scale(0) rotate(-180deg)",
          opacity: 0,
        },
        "100%": {
          transform: "scale(1) rotate(0deg)",
          opacity: 1,
        },
      },
    }}
  >
    <FaCircleCheck
      size={180}
      strokeWidth={2}
      style={{
        filter: "drop-shadow(0 10px 30px rgba(102, 126, 234, 0.4))",
        color: "#667eea",
      }}
    />
    <Box
      sx={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 140,
        height: 140,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(102, 126, 234, 0.2) 0%, transparent 70%)",
        animation: "pulse 2s ease-in-out infinite",
        "@keyframes pulse": {
          "0%, 100%": {
            transform: "translate(-50%, -50%) scale(1)",
            opacity: 0.5,
          },
          "50%": {
            transform: "translate(-50%, -50%) scale(1.3)",
            opacity: 0.2,
          },
        },
      }}
    />
  </Box>
);

// Error icon with animation
const ErrorIcon = () => (
  <Box
    sx={{
      position: "relative",
      animation: "shakeIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s backwards",
      "@keyframes shakeIn": {
        "0%": {
          transform: "scale(0) rotate(0deg)",
          opacity: 0,
        },
        "50%": {
          transform: "scale(1.1) rotate(10deg)",
        },
        "100%": {
          transform: "scale(1) rotate(0deg)",
          opacity: 1,
        },
      },
    }}
  >
    <FaCircleXmark
      size={180}
      strokeWidth={2}
      style={{
        filter: "drop-shadow(0 10px 30px rgba(245, 87, 108, 0.4))",
        color: "#f5576c",
      }}
    />
    <Box
      sx={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 140,
        height: 140,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(245, 87, 108, 0.2) 0%, transparent 70%)",
        animation: "pulse 2s ease-in-out infinite",
        "@keyframes pulse": {
          "0%, 100%": {
            transform: "translate(-50%, -50%) scale(1)",
            opacity: 0.5,
          },
          "50%": {
            transform: "translate(-50%, -50%) scale(1.3)",
            opacity: 0.2,
          },
        },
      }}
    />
  </Box>
);

// Loading spinner
const LoadingSpinner = () => (
  <Box
    sx={{
      animation: "spin 1s linear infinite",
      "@keyframes spin": {
        "0%": { transform: "rotate(0deg)" },
        "100%": { transform: "rotate(360deg)" },
      },
    }}
  >
    <FaSync
      size={180}
      strokeWidth={2}
      style={{
        filter: "drop-shadow(0 10px 30px rgba(102, 126, 234, 0.4))",
        color: "#667eea",
      }}
    />
  </Box>
);

const GoogleAuthRedirect = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Authenticating with Google...");

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const searchParams = new URLSearchParams(location.search);
        const loginStatus = searchParams.get("login");
        const token = searchParams.get("token");
        const error = searchParams.get("error");

        // Handle error case
        if (loginStatus === "error" || error) {
          console.error("❌ Google authentication failed:", error);
          setStatus("error");
          
          const errorMessages = {
            "Email permission is required": "Google email access is required to continue",
            "Please use a verified Google email": "Your Google email is not verified",
            "Authentication failed": "Unable to authenticate with Google",
            "Session configuration error": "Session error. Please try again.",
          };
          
          const errorMsg = errorMessages[error] || error || "Authentication failed";
          setMessage(errorMsg);
          
          showToast({
            title: "Google Login Failed",
            description: errorMsg,
            status: "error"
          });
          
          // Redirect to login after showing error
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 3000);
          return;
        }

        // Handle success case
        if (loginStatus === "success" && token) {
          console.log("🔄 Processing Google login success...");
          
          try {
            // Decode JWT token to get user info
            const tokenParts = token.split(".");
            if (tokenParts.length !== 3) {
              throw new Error("Invalid token format");
            }
            
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log("✅ Token decoded successfully:", payload);
            
            // Update UI
            setStatus("success");
            setMessage("Successfully authenticated with Google!");
            
            // Set authentication state
            setAuth({
              accessToken: token,
              role: payload.role || "user",
              uuid: payload.uuid,
              firstName: payload.firstName || "User",
              email: payload.email
            });
            
            // Persist login
            localStorage.setItem("persist", "true");
            
            showToast({
              title: "Welcome Back!",
              description: `Successfully logged in as ${payload.firstName || "User"}`,
              status: "success"
            });
            
            console.log("🎉 Google login successful! Redirecting to dashboard...");
            
            // Redirect to dashboard after animation
            setTimeout(() => {
              navigate("/ai/dashboard", { replace: true });
            }, 2000);
            
          } catch (decodeError) {
            console.error("Failed to decode token:", decodeError);
            throw new Error("Invalid authentication token received");
          }
          return;
        }

        // No valid parameters found
        console.warn("⚠️ No valid authentication parameters found");
        setStatus("error");
        setMessage("Invalid authentication callback");
        
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 2000);
        
      } catch (err) {
        console.error("❌ Auth redirect error:", err);
        setStatus("error");
        setMessage(err.message || "An error occurred during authentication");
        
        showToast({
          title: "Authentication Error",
          description: err.message || "An unexpected error occurred",
          status: "error"
        });
        
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 2000);
      }
    };

    handleAuth();
  }, [location.search, navigate, setAuth, showToast]);

  // ... Keep all your existing JSX return (animation components) ...
  
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)",
        },
      }}
    >
      <ParticleBackground success={status === "success"} />

      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
        <Box
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            borderRadius: 6,
            padding: { xs: 4, sm: 6 },
            boxShadow: "0 30px 60px rgba(0,0,0,0.3)",
            textAlign: "center",
            border: "1px solid rgba(255,255,255,0.3)",
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: -2,
              left: -2,
              right: -2,
              bottom: -2,
              background: status === "success"
                ? "linear-gradient(135deg, #667eea, #764ba2, #f093fb)"
                : "linear-gradient(135deg, #f093fb, #f5576c)",
              borderRadius: 6,
              zIndex: -1,
              opacity: 0.5,
              filter: "blur(10px)",
            },
          }}
        >
          <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
            {/* Icon */}
            <Box>
              {status === "loading" && <LoadingSpinner />}
              {status === "success" && <SuccessIcon />}
              {status === "error" && <ErrorIcon />}
            </Box>

            {/* Title */}
            <AnimatedTitle
              text={
                status === "loading"
                  ? "Authenticating"
                  : status === "success"
                  ? "Success!"
                  : "Oops!"
              }
              success={status === "success"}
            />

            {/* Message */}
            <Typography
              variant="h6"
              sx={{
                color: "#666",
                fontWeight: 500,
                maxWidth: 400,
                animation: "fadeIn 0.8s ease-out 0.5s backwards",
                "@keyframes fadeIn": {
                  "0%": { opacity: 0, transform: "translateY(10px)" },
                  "100%": { opacity: 1, transform: "translateY(0)" },
                },
              }}
            >
              {message}
            </Typography>

            {/* Progress indicator */}
            {status !== "loading" && (
              <Box
                sx={{
                  width: "100%",
                  maxWidth: 200,
                  height: 4,
                  backgroundColor: "rgba(102, 126, 234, 0.2)",
                  borderRadius: 2,
                  overflow: "hidden",
                  animation: "fadeIn 0.8s ease-out 0.7s backwards",
                }}
              >
                <Box
                  sx={{
                    height: "100%",
                    backgroundColor: status === "success" ? "#667eea" : "#f5576c",
                    animation: "progress 2s ease-out",
                    "@keyframes progress": {
                      "0%": { width: "0%" },
                      "100%": { width: "100%" },
                    },
                  }}
                />
              </Box>
            )}
          </Box>
        </Box>
        {ToastComponent}
      </Container>
    </Box>
  );
});

GoogleAuthRedirect.displayName = "GoogleAuthRedirect";
export default GoogleAuthRedirect;

