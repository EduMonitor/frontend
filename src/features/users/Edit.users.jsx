import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Button from "@mui/material/Button"
import Grid from "@mui/material/Grid"
import CircularProgress from "@mui/material/CircularProgress"
import Skeleton from "@mui/material/Skeleton"
import Alert from "@mui/material/Alert"

import React, { useCallback, useMemo, useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { useNavigate, useParams } from "react-router-dom"
import { FaArrowLeft, FaUserEdit, FaSave } from "react-icons/fa"

import useToast from "../../components/toast/toast.toast"
import useAxiosPrivate from "../../utils/hooks/instance/axiosprivate.instance"
import { userEditValidationSchema } from "../../utils/validators/input.validators"
import { StaffEditInputConfig } from "../../constants/forms.constant"
import {
    BackButton, CardContainer, FormContainer,
    HeaderBox, IconWrapper, PageContainer, SectionTitle
} from "../../components/styles/Styles.styles"
import InputField from "../../components/forms/input.forms"
import SelectField from "../../components/forms/select.forms"
import { useQuery } from "@tanstack/react-query"

// Fields allowed to be edited (no password here)
const EDITABLE_FIELDS = {
    firstName: "",
    lastName: "",
    email: "",
    accountStatus: "active",
    role: "user",
    isVerified: false,
    isLocked: false,
    twoFactorEnabled: false,
};

// ─── Field Skeleton ───────────────────────────────────────────────────────────
const FieldSkeleton = () => (
    <Grid container spacing={3} my={5}>
        {[...Array(6)].map((_, i) => (
            <Grid key={i} size={{ md: 6, sm: 6, xs: 12 }}>
                <Skeleton variant="rounded" height={56} sx={{ borderRadius: "8px" }} />
            </Grid>
        ))}
    </Grid>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const EditUser = React.memo(() => {
    const { uuid } = useParams();
    const { showToast, ToastComponent } = useToast();
    const [values, setValues] = useState(EDITABLE_FIELDS);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const axiosPrivate = useAxiosPrivate();
    const navigate = useNavigate();

    // ─── Fetch existing user data ─────────────────────────────────────────────
    const { data: userData, isLoading, isError } = useQuery({
        queryKey: ["user", uuid],
        queryFn: async () => {
            const response = await axiosPrivate.get(`/api/v2/user/admin/users/${uuid}`);
            return response.data.data;
        },
        enabled: !!uuid,
        staleTime: 1000 * 60 * 2,
        retry: 2,
    });

    // Populate form once data arrives
    useEffect(() => {
        if (userData) {
            setValues({
                firstName:        DOMPurify.sanitize(userData.firstName   || ""),
                lastName:         DOMPurify.sanitize(userData.lastName    || ""),
                email:            DOMPurify.sanitize(userData.email       || ""),
                accountStatus:    userData.accountStatus  || "active",
                role:             userData.role           || "user",
                isVerified:       userData.isVerified     ?? false,
                isLocked:         userData.isLocked       ?? false,
                twoFactorEnabled: userData.twoFactorEnabled ?? false,
            });
        }
    }, [userData]);

    // ─── Handlers ─────────────────────────────────────────────────────────────
    const handleInputChange = useCallback((event) => {
        const { name, value } = event.target;
        setValues((prev) => ({
            ...prev,
            [name]: Array.isArray(value) ? value : DOMPurify.sanitize(value),
        }));
        setErrors((prev) => ({ ...prev, [name]: undefined }));
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        try {
            await userEditValidationSchema.validate(values, { abortEarly: false });

            const response = await axiosPrivate.put(`/api/v2/user/admin/users/${uuid}`, values);

            if (response.status === 200) {
                showToast({
                    description: response.data.message || "Utilisateur mis à jour avec succès",
                    status: "success",
                });
                // Go back after short delay so toast is visible
                setTimeout(() => navigate(-1), 1200);
            }

        } catch (error) {
            if (error.inner) {
                // Yup frontend validation
                const validationErrors = {};
                error.inner.forEach((err) => {
                    validationErrors[err.path] = err.message;
                });
                setErrors(validationErrors);
                return;
            }

            const status = error.response?.status;
            const data   = error.response?.data;

            if (status === 400) {
                if (data?.errors) setErrors(data.errors);
                showToast({ description: data?.message || "Données invalides", status: "error" });
            } else if (status === 409) {
                setErrors({ email: "Cet e-mail est déjà utilisé" });
                showToast({ description: "Cet e-mail est déjà enregistré", status: "error" });
            } else if (status === 403) {
                showToast({ description: "Vous n'avez pas les permissions pour cette action", status: "error" });
            } else if (status === 404) {
                showToast({ description: "Utilisateur introuvable", status: "error" });
                navigate(-1);
            } else {
                showToast({ description: data?.message || "Une erreur inattendue est survenue", status: "error" });
            }
        } finally {
            setIsSubmitting(false);
        }
    }, [values, axiosPrivate, uuid, showToast, navigate]);

    // ─── Form Fields ──────────────────────────────────────────────────────────
    const renderedFormInputs = useMemo(() => (
        <Grid container spacing={3} my={5}>
            {StaffEditInputConfig.map(({ name, label, placeholder, type, options, icon, inputType, multiple }) => {
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
                            value={values[name] ?? ""}
                            error={!!errors[name]}
                            errorMessage={errors[name]}
                            onChange={handleInputChange}
                        />
                    </Grid>
                );
            })}
        </Grid>
    ), [values, errors, handleInputChange]);

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <PageContainer>
            {ToastComponent}

            <HeaderBox>
                <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: "center", gap: 2 }}>
                    <BackButton onClick={() => navigate(-1)}>
                        <FaArrowLeft />
                    </BackButton>
                    <Box display="flex" gap={5} alignItems="center">
                        <IconWrapper><FaUserEdit /></IconWrapper>
                        <Box>
                            <Typography
                                variant="h4"
                                sx={{
                                    fontWeight: 800,
                                    mb: 0.5,
                                    background: (theme) => theme.palette.mode === "dark"
                                        ? "linear-gradient(135deg, #4a56de, #222ac5)"
                                        : "linear-gradient(135deg, #1635a3, #2230c5)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                }}
                            >
                                Modifier l'utilisateur
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {isLoading
                                    ? "Chargement des informations..."
                                    : userData
                                    ? `${userData.firstName} ${userData.lastName} · ${userData.email}`
                                    : "Modification du compte utilisateur"
                                }
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </HeaderBox>

            <FormContainer>
                <CardContainer>
                    <SectionTitle>Informations du membre</SectionTitle>

                    {/* Error state */}
                    {isError && (
                        <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>
                            Impossible de charger les données de l'utilisateur. Veuillez réessayer.
                        </Alert>
                    )}

                    {/* Loading skeleton or form */}
                    {isLoading ? (
                        <FieldSkeleton />
                    ) : (
                        <form onSubmit={handleSubmit} noValidate>
                            {renderedFormInputs}
                            <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
                                <Button
                                    variant="outlined"
                                    color="inherit"
                                    onClick={() => navigate(-1)}
                                    disabled={isSubmitting}
                                    sx={{ flex: 1 }}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    disabled={isSubmitting}
                                    startIcon={!isSubmitting && <FaSave />}
                                    sx={{ flex: 2 }}
                                >
                                    {isSubmitting
                                        ? <CircularProgress size={22} color="inherit" />
                                        : "Enregistrer les modifications"
                                    }
                                </Button>
                            </Box>
                        </form>
                    )}
                </CardContainer>
            </FormContainer>
        </PageContainer>
    );
});

EditUser.displayName = "EditUser";
export default EditUser;