import * as Yup from 'yup'

export const signInValidator = () => {
    return Yup.object().shape({
        email: Yup.string().required("Email is empty").email("Invalide email format"),
        password: Yup.string().required("Password is empty"),
    });
}

export const resetValidator = () => {
    return Yup.object().shape({
        password: Yup.string()
            .matches(/\d/, "Password must contain a number")
            .matches(/[a-z]/, "Password must contain a lowercase letter")
            .matches(/[A-Z]/, "Password must contain an uppercase letter")
            .matches(/[!@#$%^&*(){}_<>|:;]/, "Password must contain a special character")
            .min(6, "Password must be at least 6 characters long")
            .required("Password is required"),
        passwordConfirm: Yup.string()
            .required("Confirm Password is empty")
            .oneOf([Yup.ref('password'), null], "Passwords must match"),
    });
}

export const forgotValidator = () => {
    return Yup.object().shape({
        email: Yup.string().required("Email is empty").email("Invalide email format"),
    });
}

export const keywordValidator = () => {
    return Yup.object().shape({
        query: Yup.string().required("This field couldn't be empty"),
    });
}

export const signUpValidator = () => {
    return Yup.object().shape({
        firstName: Yup.string().required("First Name is empty"),
        lastName: Yup.string().required("Last Name is empty"),
        email: Yup.string().required("Email is empty").email("Invalide email format"),
        password: Yup.string()
            .matches(/\d/, "Password must contain a number")
            .matches(/[a-z]/, "Password must contain a lowercase letter")
            .matches(/[A-Z]/, "Password must contain an uppercase letter")
            .matches(/[!@#$%^&*(){}_<>|:;]/, "Password must contain a special character")
            .min(6, "Password must be at least 6 characters long")
            .required("Password is required"),
        passwordConfirm: Yup.string()
            .required("Confirm Password is empty")
            .oneOf([Yup.ref('password'), null], "Passwords must match"),
    });
}

// ─── Create user (password required) ─────────────────────────────────────────
export const userValidationSchema = Yup.object().shape({
    firstName: Yup.string()
        .required('Le nom est requis')
        .min(2, 'Minimum 2 caractères'),
    lastName: Yup.string()
        .required('Le prénom est requis')
        .min(2, 'Minimum 2 caractères'),
    role: Yup.string()
        .required('Le rôle est requis'),
    email: Yup.string()
        .required('Email requis')
        .email('Email invalide'),
    password: Yup.string()
        .required('Mot de passe requis')
        .min(8, 'Minimum 8 caractères'),
});

// ─── Edit user (no password — changed separately via modal) ──────────────────
export const userEditValidationSchema = Yup.object().shape({
    firstName: Yup.string()
        .required('Le nom est requis')
        .min(2, 'Minimum 2 caractères'),
    lastName: Yup.string()
        .required('Le prénom est requis')
        .min(2, 'Minimum 2 caractères'),
    role: Yup.string()
        .required('Le rôle est requis'),
    email: Yup.string()
        .required('Email requis')
        .email('Email invalide'),
    accountStatus: Yup.string()
        .required('Le statut est requis')
        .oneOf(['active', 'suspended', 'deactivated'], 'Statut invalide'),
    isVerified: Yup.boolean().nullable(),
    isLocked: Yup.boolean().nullable(),
    twoFactorEnabled: Yup.boolean().nullable(),
});

// ─── Change password (modal) ──────────────────────────────────────────────────
export const passValidation = Yup.object().shape({
    password: Yup.string()
        .matches(/[a-z]/, "Minuscule requise pass")
        .matches(/[A-Z]/, "Majuscule requise pass")
        .min(6, "Pass trop court, minimum 6 la longueur")
        .required("Le champ est vide"),
});