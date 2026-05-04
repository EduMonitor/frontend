import { FaEnvelope, FaFingerprint, FaLock, FaUser } from "react-icons/fa"

export const loginForm = () => {
    return [
        {
            name: "email",
            label: "Email",
            placeholder: "Enter the emails",
            type: "text",
            icon: <FaEnvelope />,
            isRequired: true,
            inputType: "email",
        },
        {
            name: "password",
            label: "Password",
            placeholder: "Enter the password",
            type: "password",
            icon: <FaLock />,
            isRequired: true,
        },
    ]
}

export const forgotForm = () => {
    return [
        {
            name: "email",
            label: "Email",
            placeholder: "Enter the emails",
            type: "text",
            icon: <FaEnvelope />,
            isRequired: true,
            inputType: "email",
        },
    ]
}

export const resetForm = () => {
    return [
        {
            name: "password",
            label: "Password",
            placeholder: "Enter the password",
            type: "password",
            icon: <FaLock />,
            isRequired: true,
        },
        {
            name: "passwordConfirm",
            label: "Confirm Password",
            placeholder: "Confirm Password",
            type: "password",
            icon: <FaLock />,
            isRequired: true,
        },
    ]
}

export const registerForm = () => {
    return [
        {
            name: "firstName",
            label: "First Name",
            placeholder: "Enter the First Name",
            type: "text",
            icon: <FaUser />,
            isRequired: true,
            inputType: "text",
        },
        {
            name: "lastName",
            label: "Last Name",
            placeholder: "Enter the Last Name",
            type: "text",
            icon: <FaUser />,
            isRequired: true,
            inputType: "text",
        },
        {
            name: "email",
            label: "Email",
            placeholder: "Enter the emails",
            type: "text",
            icon: <FaEnvelope />,
            isRequired: true,
            inputType: "email",
        },
        {
            name: "password",
            label: "Password",
            placeholder: "Enter the password",
            type: "password",
            icon: <FaLock />,
            isRequired: true,
        },
        {
            name: "passwordConfirm",
            label: "Confirm Password",
            placeholder: "Confirm Password",
            type: "password",
            icon: <FaLock />,
            isRequired: true,
        },
    ]
}

// ─── Staff Create Config (with password) ─────────────────────────────────────
export const StaffInputConfig = [
    {
        name: "firstName",
        label: "Nom",
        placeholder: "Entrez le nom",
        type: "text",
        icon: <FaUser />,
        isRequired: true,
    },
    {
        name: "lastName",
        label: "Prénom(s)",
        placeholder: "Entrez le(s) prénom(s)",
        type: "text",
        icon: <FaUser />,
        isRequired: true,
    },
    {
        name: "email",
        label: "Adresse e-mail",
        placeholder: "exemple@domaine.com",
        type: "text",
        icon: <FaEnvelope />,
        isRequired: true,
    },
    {
        name: "role",
        label: "Rôle",
        placeholder: "Sélectionner un rôle",
        type: "select",
        isRequired: true,
        options: [
            { key: "user", value: "Utilisateur" },
            { key: "admin", value: "Administrateur" },
        ],
    },
    {
        name: "accountStatus",
        label: "Statut du compte",
        placeholder: "Sélectionner un statut",
        type: "select",
        isRequired: true,
        options: [
            { key: "active", value: "Actif" },
            { key: "suspended", value: "Suspendu" },
            { key: "deactivated", value: "Désactivé" },
        ],
    },
    {
        name: "password",
        label: "Mot de passe",
        placeholder: "Mot de passe (ou générer)",
        type: "password",
        inputType: "password",
        icon: <FaFingerprint />,
        isRequired: true,
    },
];

// ─── Staff Edit Config (no password — changed separately via modal) ───────────
export const StaffEditInputConfig = [
    {
        name: "firstName",
        label: "Nom",
        placeholder: "Entrez le nom",
        type: "text",
        icon: <FaUser />,
        isRequired: true,
    },
    {
        name: "lastName",
        label: "Prénom(s)",
        placeholder: "Entrez le(s) prénom(s)",
        type: "text",
        icon: <FaUser />,
        isRequired: true,
    },
    {
        name: "email",
        label: "Adresse e-mail",
        placeholder: "exemple@domaine.com",
        type: "text",
        icon: <FaEnvelope />,
        isRequired: true,
    },
    {
        name: "role",
        label: "Rôle",
        placeholder: "Sélectionner un rôle",
        type: "select",
        isRequired: true,
        options: [
            { key: "user", value: "Utilisateur" },
            { key: "admin", value: "Administrateur" },
        ],
    },
    {
        name: "accountStatus",
        label: "Statut du compte",
        placeholder: "Sélectionner un statut",
        type: "select",
        isRequired: true,
        options: [
            { key: "active", value: "Actif" },
            { key: "suspended", value: "Suspendu" },
            { key: "deactivated", value: "Désactivé" },
        ],
    },
    {
        name: "isVerified",
        label: "Compte vérifié",
        placeholder: "Statut de vérification",
        type: "select",
        isRequired: false,
        options: [
            { key: true, value: "Vérifié" },
            { key: false, value: "Non vérifié" },
        ],
    },
    {
        name: "isLocked",
        label: "Compte bloqué",
        placeholder: "Statut de blocage",
        type: "select",
        isRequired: false,
        options: [
            { key: false, value: "Non bloqué" },
            { key: true, value: "Bloqué" },
        ],
    },
    {
        name: "twoFactorEnabled",
        label: "Double authentification",
        placeholder: "Statut 2FA",
        type: "select",
        isRequired: false,
        options: [
            { key: true, value: "Activée" },
            { key: false, value: "Désactivée" },
        ],
    },
];