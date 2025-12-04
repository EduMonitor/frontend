import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import PropTypes from 'prop-types';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import FormHelperText from '@mui/material/FormHelperText';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import DOMPurify from 'dompurify';

import { FaSearch as SearchIcon } from 'react-icons/fa';

const SelectField = ({
  name,
  label,
  options,
  value,
  onChange,
  isRequired,
  helperText,
  error,
  disabled = false,
  hidden = false,
  native = false,
  multiple = false,
  enableSearch = true,
  searchPlaceholder = "Search options...",
  prefixIcon = null,
  showIconInValue = true,
  ...props
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);

  // Ensure value is always an array if multiple is true
  const valueToUse = multiple ? (Array.isArray(value) ? value : []) : value;

  // Helper function to normalize values for comparison
  const normalizeValue = (val) => {
    if (val === null || val === undefined) return '';
    return String(val);
  };

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!enableSearch || !searchTerm.trim()) {
      return options || [];
    }

    const term = searchTerm.toLowerCase();
    return options?.filter((option) =>
      option.value.toLowerCase().includes(term) ||
      normalizeValue(option.key).toLowerCase().includes(term) ||
      (option.description && option.description.toLowerCase().includes(term))
    ) || [];
  }, [options, searchTerm, enableSearch]);

  const handleChange = (event) => {
    const { value } = event.target;
    const sensitizeValue = DOMPurify.sanitize(value);

    onChange({
      target: {
        name,
        value: multiple
          ? typeof sensitizeValue === 'string' ? value.split(',') : sensitizeValue
          : sensitizeValue,
      },
    });
  };

  const handleSearchChange = (event) => {
    const sensitizeValue = DOMPurify.sanitize(event.target.value);
    setSearchTerm(sensitizeValue);
  };

  const handleOpen = () => {
    setOpen(true);
    setSearchTerm('');
  };

  const handleClose = () => {
    setOpen(false);
    setSearchTerm('');
  };

  // Helper function to render option content with icon
  const renderOptionContent = (option, showIcon = true) => (
    <Box display="flex" alignItems="center" gap={1}>
      {showIcon && option.icon && (
        <Box
          component="span"
          sx={{
            display: 'flex',
            alignItems: 'center',
            minWidth: '20px',
            '& > *': {
              fontSize: '1.2rem'
            }
          }}
        >
          {option.icon}
        </Box>
      )}
      <span>{option.value}</span>
    </Box>
  );

  // Custom MenuProps
  const menuProps = {
    PaperProps: {
      style: {
        maxHeight: enableSearch ? 48 * 4.5 + 8 + 56 : 48 * 4.5 + 8,
        width: 250,
      },
    },
    autoFocus: false,
    onClose: handleClose,
  };

  return (
    <Box sx={{ width: '100%' }}>
      <FormControl fullWidth variant="outlined" error={error} disabled={disabled}>
        {label && (
          <InputLabel sx={{ fontSize: "15px", display: 'flex', alignItems: 'center' }}>
            {label}
            {isRequired && (
              <span style={{ color: 'red', marginLeft: 2, fontSize: "12px" }}>*</span>
            )}
          </InputLabel>
        )}
        <Select
          label={label}
          // FIX: Ensure the value is properly set for both single and multiple
          value={multiple ? valueToUse : (value || '')}
          onChange={handleChange}
          sx={{ borderRadius: 1, fontSize: "15px" }}
          input={
            <OutlinedInput
              label={label}
              startAdornment={prefixIcon && (
                <InputAdornment position="start">
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      color: 'action.active',
                      '& > *': {
                        fontSize: '1.25rem'
                      }
                    }}
                  >
                    {prefixIcon}
                  </Box>
                </InputAdornment>
              )}
            />
          }
          multiple={multiple}
          hidden={hidden}
          open={open}
          onOpen={handleOpen}
          onClose={handleClose}
          renderValue={(selected) => {
            // FIX: Handle empty/null values properly
            if (!selected || (Array.isArray(selected) && selected.length === 0)) {
              return '';
            }

            if (multiple) {
              const selectedOptions = selected
                .map((sel) => {
                  // FIX: Use normalized comparison for finding options
                  const option = options?.find((opt) => normalizeValue(opt.key) === normalizeValue(sel));
                  return option;
                })
                .filter(Boolean);

              return (
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {selectedOptions?.map((option) => (
                    <Chip
                      key={option.key}
                      size="small"
                      label={
                        <Box display="flex" alignItems="center" gap={0.5}>
                          {showIconInValue && option.icon && (
                            <Box
                              component="span"
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                '& > *': {
                                  fontSize: '0.875rem'
                                }
                              }}
                            >
                              {option.icon}
                            </Box>
                          )}
                          <span>{option.value}</span>
                        </Box>
                      }
                      variant="outlined"
                    />
                  ))}
                </Box>
              );
            } else {
              // FIX: Use normalized comparison for single select
              const selectedOption = options?.find((opt) => normalizeValue(opt.key) === normalizeValue(selected));
              if (!selectedOption) {
                // If option not found, return empty string or the selected value as fallback
                return selected || '';
              }
              return renderOptionContent(selectedOption, showIconInValue);
            }
          }}
          MenuProps={menuProps}
          native={native && !multiple}
          {...props}
        >
          {/* Search Input */}
          {enableSearch && !native && (
            <Box sx={{ px: 2, py: 1, position: 'sticky', top: 0, backgroundColor: 'background.paper', zIndex: 1 }}>
              <TextField
                size="small"
                fullWidth
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={handleSearchChange}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.default',
                  }
                }}
              />
            </Box>
          )}

          {/* No results message */}
          {enableSearch && !native && filteredOptions.length === 0 && searchTerm && (
            <MenuItem disabled>
              <ListItemText primary="No options found" />
            </MenuItem>
          )}

          {/* Render options */}
          {native && !multiple
            ? options?.map((option) => (
              <option key={option.key} value={option.key}>
                {option.value}
              </option>
            ))
            : filteredOptions?.map((option) => (
              <MenuItem key={option.key} value={option.key}>
                <Tooltip title={option.description} arrow>
                  <Box display={'flex'} alignItems='center' width="100%">
                    {multiple && <Checkbox checked={valueToUse?.some(val => normalizeValue(val) === normalizeValue(option.key))} />}
                    <ListItemText
                      primary={renderOptionContent(option)}
                      slotProps={{
                        primary: {
                          sx: {
                            ...(enableSearch && searchTerm && {
                              '& mark': {
                                backgroundColor: 'primary.light',
                                color: 'primary.contrastText',
                                padding: '0 2px',
                                borderRadius: '2px',
                              }
                            })
                          }
                        }
                      }}
                    />
                  </Box>
                </Tooltip>
              </MenuItem>
            ))}
        </Select>
        {error && helperText && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>
    </Box>
  );
};

SelectField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      value: PropTypes.string,
      description: PropTypes.string,
      icon: PropTypes.node,
    })
  ),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
  onChange: PropTypes.func,
  helperText: PropTypes.string,
  native: PropTypes.bool,
  error: PropTypes.bool,
  multiple: PropTypes.bool,
  hidden: PropTypes.bool,
  isRequired: PropTypes.bool,
  enableSearch: PropTypes.bool,
  searchPlaceholder: PropTypes.string,
  prefixIcon: PropTypes.node,
  showIconInValue: PropTypes.bool,
};

export default SelectField;