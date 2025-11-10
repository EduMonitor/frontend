import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Container, Typography } from "@mui/material";
import { FaCircleCheck, FaCircleXmark } from "react-icons/fa6";
import { FaSync } from "react-icons/fa";

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
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("Authenticating...");

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const searchParams = new URLSearchParams(location.search);
        const loginStatus = searchParams.get("login");
        const error = searchParams.get("error");

        if (loginStatus === "success") {
          setStatus("success");
          setMessage("Authentication Successful!");
          
          // Redirect to dashboard after animation
          setTimeout(() => {
            navigate("/ai/dashboard", { replace: true });
          }, 2000);
        } else if (error) {
          setStatus("error");
          const errorMessages = {
            invalid_state: "Security validation failed. Please try again.",
            state_reused: "This login link has already been used.",
            authentication_failed: "Authentication failed. Please try again.",
            unexpected_error: "An unexpected error occurred.",
          };
          setMessage(errorMessages[error] || "Authentication failed");
          
          // Redirect to login after showing error
          setTimeout(() => {
            navigate("/auth/signin", { replace: true });
          }, 3000);
        } else {
          // No parameters, redirect to login
          setStatus("error");
          setMessage("Invalid authentication callback");
          setTimeout(() => {
            navigate("/auth/signin", { replace: true });
          }, 2000);
        }
      } catch (err) {
        console.error("Auth redirect error:", err);
        setStatus("error");
        setMessage("An error occurred during authentication");
        setTimeout(() => {
          navigate("/auth/signin", { replace: true });
        }, 2000);
      }
    };

    handleAuth();
  }, [location.search, navigate]);

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

      <Container
        maxWidth="sm"
        sx={{
          position: "relative",
          zIndex: 1,
        }}
      >
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
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={3}
          >
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
                  "0%": {
                    opacity: 0,
                    transform: "translateY(10px)",
                  },
                  "100%": {
                    opacity: 1,
                    transform: "translateY(0)",
                  },
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
      </Container>
    </Box>
  );
});

GoogleAuthRedirect.displayName = "GoogleAuthRedirect";
export default GoogleAuthRedirect;