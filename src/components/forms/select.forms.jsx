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
  ...props
}) => {
  // Ensure value is always an array if multiple is true
  const valueToUse = multiple ? (Array.isArray(value) ? value : []) : value;

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
          value={multiple ? valueToUse : value} // Ensure correct value type
          onChange={handleChange}
          input={<OutlinedInput label={label} />}
          multiple={multiple}

          hidden={hidden}
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
          MenuProps={{
            PaperProps: {
              style: {
                maxHeight: 48 * 4.5 + 8,
                width: 250,
              },
            },
          }}
          native={native && !multiple}
          {...props}
        >
          {native && !multiple
            ? options?.map((option) => (
              <option key={option.key} value={option.key}>
                {option.value}
              </option>
            ))
            : options?.map((option) => (

              <MenuItem key={option.key} value={option.key}>
                <Tooltip title={option.description} arrow>
                  <Box display={'flex'} alignItems='center'>
                  {multiple && <Checkbox checked={valueToUse?.includes(option.key)} />}
                  <ListItemText primary={option.value} />
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
};

export default SelectField;
