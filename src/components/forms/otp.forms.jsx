import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import PropTypes from "prop-types";
import { useRef } from "react";
import "./otps.input.css";
import { useThemeMode } from "../../utils/hooks/contexts/useTheme.context";
import { TextField } from "@mui/material";

const OTPInput = ({ length = 6, value, onChange, isLoading, errorMessage }) => {
  const inputRefs = useRef([]);
    const theme = useThemeMode()
  const focusInput = (index) => {
    if (inputRefs.current[index]) {
      inputRefs.current[index].focus();
    }
  };

  const handleInputChange = (e, index) => {
    const inputValue = e.target.value;

    if (/[^0-9]/.test(inputValue)) return;

    const otpArray = value.split('');
    otpArray[index] = inputValue;

    onChange(otpArray.join(''));

    if (inputValue && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (e, index) => {
    const otpArray = value.split('');

    switch (e.key) {
      case "Backspace":
        e.preventDefault();

        if (value[index]) {
          otpArray[index] = "";
          onChange(otpArray.join(""));
        } else if (index === length - 1 && value[index] === "") {
          // If last field and empty, clear all
          onChange("".padEnd(length, ""));
          focusInput(0);
        } else if (index > 0) {
          focusInput(index - 1);
          otpArray[index - 1] = "";
          onChange(otpArray.join(""));
        }
        break;

      case "ArrowLeft":
        if (index > 0) focusInput(index - 1);
        break;

      case "ArrowRight":
        if (index < length - 1) focusInput(index + 1);
        break;

      default:
        break;
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (paste.length === 0) return;

    const otpArray = value.split('');
    for (let i = 0; i < paste.length; i++) {
      otpArray[i] = paste[i];
    }

    onChange(otpArray.join(""));

    if (paste.length < length) {
      focusInput(paste.length);
    } else {
      inputRefs.current[length - 1].blur();
    }
  };

  return (
    <Box>
      <Grid container spacing={1} justifyContent="center">
        {Array.from({ length }).map((_, index) => (
          <Grid item key={index}>
         

            <TextField
                                        key={index}
                                        inputRef={el => inputRefs.current[index] = el}
                                        value={value[index] || ""}
                                        onChange={(e) => handleInputChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        onPaste={handlePaste}
                                        disabled={isLoading}
                                        sx={{
                                          width: 56,
                                          '& .MuiOutlinedInput-root': {
                                            height: 56,
                                            borderRadius: 2,
                                            fontSize: '1.5rem',
                                            fontWeight: 700,
                                            textAlign: 'center',
                                           
                                            '&.Mui-focused fieldset': {
                                              borderColor: theme.accent,
                                              boxShadow: `0 0 0 3px ${theme.accent}20`,
                                            },
                                            '& input': {
                                              color: theme.textPrimary,
                                              textAlign: 'center',
                                              padding: 0,
                                            },
                                          },
                                        }}
                                        inputProps={{
                                          maxLength: 1,
                                          style: { textAlign: 'center' }
                                        }}
                                      />
          </Grid>
        ))}

      </Grid>
        {errorMessage && (
                              <Alert 
                                severity="error" 
                                sx={{
                                  bgcolor: `${theme.error}20`,
                                  border: `1px solid ${theme.error}30`,
                                  color: theme.error,
                                  '& .MuiAlert-icon': {
                                    color: theme.error,
                                  },
                                }}
                              >
                                {errorMessage}
                              </Alert>
                            )}
    </Box>
  );
};

OTPInput.propTypes = {
  length: PropTypes.number,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

export default OTPInput;
