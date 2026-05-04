import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Button from "@mui/material/Button"
import Grid from "@mui/material/Grid"
import CircularProgress from "@mui/material/CircularProgress"
import Tooltip from "@mui/material/Tooltip"

import React, { useCallback, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { useNavigate } from "react-router-dom"
import { FaArrowLeft, FaUserPlus, FaDice } from "react-icons/fa"

import useToast from "../../components/toast/toast.toast"
import useAxiosPrivate from "../../utils/hooks/instance/axiosprivate.instance"
import { userValidationSchema } from "../../utils/validators/input.validators"
import { StaffInputConfig } from "../../constants/forms.constant"
import {
    BackButton, CardContainer, FormContainer,
    HeaderBox, IconWrapper, PageContainer, SectionTitle
} from "../../components/styles/Styles.styles"
import InputField from "../../components/forms/input.forms"
import SelectField from "../../components/forms/select.forms"

const INITIAL_VALUES = {
    firstName: "",
    lastName: "",
    email: "",
    accountStatus: "active",
    role: "user",
    password: "",
};

const generateRandomPassword = () => {
    // Ensure at least one of each required character type
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const digits = "0123456789";
    const special = "!@#$%^&*()_+";
    const all = lower + upper + digits + special;

    // Guarantee at least 1 of each type, fill the rest randomly
    let password = [
        lower[Math.floor(Math.random() * lower.length)],
        upper[Math.floor(Math.random() * upper.length)],
        digits[Math.floor(Math.random() * digits.length)],
        special[Math.floor(Math.random() * special.length)],
    ];
    for (let i = password.length; i < 12; i++) {
        password.push(all[Math.floor(Math.random() * all.length)]);
    }

    // Shuffle to avoid predictable pattern
    return password.sort(() => Math.random() - 0.5).join("");
};

const AddUser = React.memo(() => {
    const { showToast, ToastComponent } = useToast();
    const [values, setValues] = useState(INITIAL_VALUES);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const axiosPrivate = useAxiosPrivate();
    const navigate = useNavigate();

    const handleInputChange = useCallback((event) => {
        const { name, value } = event.target;
        setValues((prev) => ({
            ...prev,
            [name]: Array.isArray(value) ? value : DOMPurify.sanitize(value),
        }));
        setErrors((prev) => ({ ...prev, [name]: undefined }));
    }, []);

    const handleGeneratePassword = useCallback(() => {
        const newPassword = generateRandomPassword();
        setValues((prev) => ({ ...prev, password: newPassword }));
        setErrors((prev) => ({ ...prev, password: undefined }));
        showToast({
            title: "",
            description: "Mot de passe généré automatiquement",
            status: "info"
        });
    }, [showToast]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});

        try {
            await userValidationSchema.validate(values, { abortEarly: false });

            // ← Point to your admin route, not the public auth route
            const response = await axiosPrivate.post("/api/v2/users", values);

            if (response.status === 201) {
                showToast({
                    title: "",
                    description: response.data.message,
                    status: "success"
                });
                setValues(INITIAL_VALUES);
            }

        } catch (error) {
            // Yup frontend validation errors
            if (error.inner) {
                const validationErrors = {};
                error.inner.forEach((err) => {
                    validationErrors[err.path] = err.message;
                });
                setErrors(validationErrors);
                return;
            }

            const status = error.response?.status;
            const data = error.response?.data;

            if (status === 400) {
                // Backend field-level validation errors
                if (data?.errors) setErrors(data.errors);
                showToast({
                    title: "Erreur de validation",
                    description: data?.message || "Données invalides",
                    status: "error",
                });
            } else if (status === 409) {
                // Email already exists
                setErrors({ email: "Cet e-mail est déjà utilisé" });
                showToast({
                    title: "Conflit",
                    description: data?.message || "Cet e-mail est déjà enregistré",
                    status: "error",
                });
            } else if (status === 403) {
                showToast({
                    title: "Accès refusé",
                    description: "Vous n'avez pas les permissions pour effectuer cette action",
                    status: "error",
                });
            } else {
                showToast({
                    title: "Erreur",
                    description: data?.message || "Une erreur inattendue est survenue",
                    status: "error",
                });
            }
        } finally {
            setIsLoading(false);
        }
    }, [values, axiosPrivate, showToast]);

    const renderedFormInputs = useMemo(() => (
        <Grid container spacing={3} my={5}>
            {StaffInputConfig.map(({ name, label, placeholder, type, options, icon, inputType, multiple }) => {
                if (type === "select") {
                    return (
                        <Grid key={name} size={{ md: 6, sm: 6, xs: 12 }}>
                            <SelectField
                                label={label}
                                placeholder={placeholder}
                                name={name}
                                options={options}
                                value={values[name]}
                                error={!!errors[name]}
                                helperText={errors[name]}
                                multiple={multiple}
                                onChange={handleInputChange}
                            />
                        </Grid>
                    );
                }

                if (name === "password") {
                    return (
                        <Grid key={name} size={{ md: 6, sm: 6, xs: 12 }}>
                            <Box display="flex" gap={1} alignItems="flex-start">
                                <Box flex={1}>
                                    <InputField
                                        label={label}
                                        placeholder={placeholder}
                                        name={name}
                                        type={type}
                                        inputType={inputType}
                                        prefix={icon}
                                        fullWidth
                                        value={values[name]}
                                        error={!!errors[name]}
                                        errorMessage={errors[name]}
                                        onChange={handleInputChange}
                                    />
                                </Box>
                                <Tooltip title="Générer un mot de passe fort">
                                    <Button
                                        onClick={handleGeneratePassword}
                                        variant="outlined"
                                        sx={{ mt: "24px", minWidth: "44px", px: 1.5 }}
                                    >
                                        <FaDice />
                                    </Button>
                                </Tooltip>
                            </Box>
                        </Grid>
                    );
                }

                return (
                    <Grid key={name} size={{ md: 6, sm: 6, xs: 12 }}>
                        <InputField
                            label={label}
                            placeholder={placeholder}
                            name={name}
                            type={type}
                            inputType={inputType}
                            prefix={icon}
                            fullWidth
                            value={values[name]}
                            error={!!errors[name]}
                            errorMessage={errors[name]}
                            onChange={handleInputChange}
                        />
                    </Grid>
                );
            })}
        </Grid>
    ), [values, errors, handleInputChange, handleGeneratePassword]);

    return (
        <PageContainer>
            {ToastComponent}
            <HeaderBox>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 2 }}>
                    <BackButton onClick={() => navigate(-1)}>
                        <FaArrowLeft />
                    </BackButton>
                    <Box display={"flex"} gap={5} alignItems={"center"} >
                        <IconWrapper><FaUserPlus /></IconWrapper>
                        <Box>
                            <Typography
                                variant="h4"
                                sx={{
                                    fontWeight: 800,
                                    mb: 0.5,
                                    background: (theme) => theme.palette.mode === 'dark'
                                        ? 'linear-gradient(135deg, #4a56de, #222ac5)'
                                        : 'linear-gradient(135deg, #1635a3, #2230c5)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >
                                Ajouter un membre du personnel
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Le compte sera actif et vérifié immédiatement. La double authentification sera activée.
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </HeaderBox>

            <FormContainer>
                <CardContainer>
                    <SectionTitle>Informations du membre</SectionTitle>
                    <form onSubmit={handleSubmit} noValidate>
                        {renderedFormInputs}
                        <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
                            <Button
                                variant="outlined"
                                color="inherit"
                                onClick={() => navigate(-1)}
                                disabled={isLoading}
                                sx={{ flex: 1 }}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={isLoading}
                                sx={{ flex: 2 }}
                            >
                                {isLoading
                                    ? <CircularProgress size={22} color="inherit" />
                                    : "Créer le compte"
                                }
                            </Button>
                        </Box>
                    </form>
                </CardContainer>
            </FormContainer>
            {ToastComponent}
        </PageContainer>
    );
});

AddUser.displayName = "AddUser";
export default AddUser;