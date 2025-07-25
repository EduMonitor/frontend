import { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { FaCloudUploadAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import DOMPurify from 'dompurify';
import { countryCode } from '../../constants/object.constant';


const InputField = ({
    inputType,
    isRequired,
    label,
    type = 'text',
    value = "",
    name,
    minDate,
    maxDate,
    prefix,
    suffix,
    fullWidth = false,
    error = false,
    hidden = false,
    errorMessage,
    onChange,
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const [selectedCode, setSelectedCode] = useState('+226');
    const [fileName, setFileName] = useState(null);

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const handlePhoneChange = useCallback((e) => {
        const sanitizedPhone = DOMPurify.sanitize(e.target.value.replace(/[^0-9]/g, ''));
        const event = {
            target: {
                name: name,
                value: `${selectedCode}${sanitizedPhone}`,
            }
        };
        onChange(event);
    }, [onChange, selectedCode, name]);

    const handleCountryCodeChange = useCallback((event) => {
        setSelectedCode(event.target.value);
        const eventObject = {
            target: {
                name: name,
                value: `${event.target.value}${value.replace(selectedCode, '')}`,
            }
        };
        onChange(eventObject);
    }, [onChange, selectedCode, value, name]);

    const handleFileChange = useCallback((e) => {
        const file = e.target.files[0];
        if (file) {
            setFileName(DOMPurify.sanitize(file.name));
            onChange(e);
        }
    }, [onChange]);

    return (
        <FormControl variant="outlined" fullWidth={fullWidth} error={error}>
            {label && (
                <InputLabel sx={{ fontSize: "13px", display: 'flex', alignItems: 'center' }}>
                    {label}
                    {isRequired && (
                        <span style={{ color: 'red', marginLeft: 2 }}>*</span>
                    )}
                </InputLabel>
            )}

            {inputType === 'file' ? (
                <>
                    <OutlinedInput
                        startAdornment={<InputAdornment position='start'><FaCloudUploadAlt /></InputAdornment>}
                        type='file'
                        label={label}
                        id={name}
                        name={name}
                        hidden={hidden}
                        onChange={handleFileChange}
                        {...props}
                    />
                    {/* Display file name for user reference */}
                    {fileName && (
                        <FormHelperText sx={{ display: "none" }} >{fileName}</FormHelperText>
                    )}
                </>
            ) : (
                <OutlinedInput
                    type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
                    value={inputType === 'phone' ? value.replace(selectedCode, '') : value}
                    onChange={inputType === 'phone' ? handlePhoneChange : onChange}
                    name={name}
                    inputProps={type === 'date' ? { min: minDate, max: maxDate } : {}} startAdornment={
                        inputType === 'phone' ? (
                            <InputAdornment position="start">
                                <Select
                                    variant="standard"
                                    value={selectedCode}
                                    onChange={handleCountryCodeChange}
                                    displayEmpty
                                    inputProps={{ 'aria-label': 'Country Code' }}
                                    sx={{ minWidth: 80 }}
                                >
                                    {countryCode.map((country) => (
                                        <MenuItem key={country.code} value={country.code}>
                                            {`${country.flag} ${country.code} ${country.label}`}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </InputAdornment>
                        ) : (
                            prefix && <InputAdornment position="start">{prefix}</InputAdornment>
                        )
                    }
                    endAdornment={
                        suffix ? (
                            <InputAdornment position="end">{suffix}</InputAdornment>
                        ) : (
                            type === 'password' && (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={handleClickShowPassword}
                                        edge="end"
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        )
                    }
                    label={label}
                    {...props}
                />
            )}
            {error && errorMessage && <FormHelperText>{errorMessage}</FormHelperText>}
        </FormControl>
    );
};

InputField.propTypes = {
    inputType: PropTypes.oneOf(['phone', 'email', 'file']),
    label: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.oneOf(['text', 'email', 'password', 'file', 'date', 'number', 'time']),
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    prefix: PropTypes.node,
    suffix: PropTypes.node,
    fullWidth: PropTypes.bool,
    error: PropTypes.bool,
    errorMessage: PropTypes.string,
    onChange: PropTypes.func,
    hidden: PropTypes.bool,
    minDate: PropTypes.string,
    maxDate: PropTypes.string,
    isRequired: PropTypes.bool,
};
export default InputField;