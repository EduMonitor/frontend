import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import PropTypes from 'prop-types';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import FormHelperText from '@mui/material/FormHelperText';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import { useState, useMemo } from 'react';

const SelectField = ({
  name,
  label,
  options,
  value,
  onChange,
  isRequired,
  helperText,
  error,
  hidden = false,
  native = false,
  multiple = false,
  enableSearch = true, // New prop to enable/disable search
  searchPlaceholder = "Search options...",
  ...props
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);

  // Ensure value is always an array if multiple is true
  const valueToUse = multiple ? (Array.isArray(value) ? value : []) : value;

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!enableSearch || !searchTerm.trim()) {
      return options || [];
    }
    
    const term = searchTerm.toLowerCase();
    return options?.filter((option) => 
      option.value.toLowerCase().includes(term) || 
      option.key.toLowerCase().includes(term) ||
      (option.description && option.description.toLowerCase().includes(term))
    ) || [];
  }, [options, searchTerm, enableSearch]);

  const handleChange = (event) => {
    const { value } = event.target;
    // Pass both name and value to onChange so handleInputChange receives them
    onChange({
      target: {
        name,
        value: multiple
          ? typeof value === 'string' ? value.split(',') : value
          : value,
      },
    });
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleOpen = () => {
    setOpen(true);
    setSearchTerm(''); // Reset search when opening
  };

  const handleClose = () => {
    setOpen(false);
    setSearchTerm(''); // Reset search when closing
  };

  // Custom MenuProps to include search input
  const menuProps = {
    PaperProps: {
      style: {
        maxHeight: enableSearch ? 48 * 4.5 + 8 + 56 : 48 * 4.5 + 8, // Extra height for search input
        width: 250,
      },
    },
    autoFocus: false,
    onClose: handleClose,
  };

  return (
    <Box sx={{ width: '100%' }}>
      <FormControl fullWidth variant="outlined" error={error}>
        {label && (
          <InputLabel sx={{ fontSize: "13px", display: 'flex', alignItems: 'center' }}>
            {label}
            {isRequired && (
              <span style={{ color: 'red', marginLeft: 2 }}>*</span>
            )}
          </InputLabel>
        )}
        <Select
          label={label}
          value={multiple ? valueToUse : value}
          onChange={handleChange}
          input={<OutlinedInput label={label} />}
          multiple={multiple}
          hidden={hidden}
          open={open}
          onOpen={handleOpen}
          onClose={handleClose}
          renderValue={(selected) => {
            if (multiple) {
              return selected
                .map((sel) => {
                  const option = options?.find((opt) => opt.key === sel);
                  return option ? option.value : sel;
                })
                .join(', ');
            } else {
              const selectedOption = options?.find((opt) => opt.key === selected);
              return selectedOption ? selectedOption.value : '';
            }
          }}
          MenuProps={menuProps}
          native={native && !multiple}
          {...props}
        >
          {/* Search Input - only show if enableSearch is true and not native */}
          {enableSearch && !native && (
            <Box sx={{ px: 2, py: 1, position: 'sticky', top: 0, backgroundColor: 'background.paper', zIndex: 1 }}>
              <TextField
                size="small"
                fullWidth
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={handleSearchChange}
                onClick={(e) => e.stopPropagation()} // Prevent menu from closing
                onKeyDown={(e) => e.stopPropagation()} // Prevent menu from closing
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
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
                  <Box display={'flex'} alignItems='center'>
                    {multiple && <Checkbox checked={valueToUse?.includes(option.key)} />}
                    <ListItemText 
                      primary={option.value}
                      primaryTypographyProps={{
                        sx: {
                          // Highlight search term
                          ...(enableSearch && searchTerm && {
                            '& mark': {
                              backgroundColor: 'primary.light',
                              color: 'primary.contrastText',
                              padding: '0 2px',
                              borderRadius: '2px',
                            }
                          })
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
      description: PropTypes.string, // Optional description for tooltip
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
  enableSearch: PropTypes.bool, // New prop
  searchPlaceholder: PropTypes.string, // New prop
};

export default SelectField;