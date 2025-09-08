import * as Yup from 'yup'
export const signInValidator = () => {
    return Yup.object().shape({
        email:
            Yup.string().required("Email is empty").email("Invalide email format"),
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
        passwordConfirm: Yup.string().required("Confirm Password is empty").oneOf([Yup.ref('password'), null], "Passwords must match"),
    });
}

export const forgotValidator = () => {
    return Yup.object().shape({
        email:
            Yup.string().required("Email is empty").email("Invalide email format"),
    });
}
export const signUpValidator = () => {
    return Yup.object().shape({
        firstName: Yup.string().required("First Name is empty"),
        lastName: Yup.string().required("Last Name is empty"),
        email:
            Yup.string().required("Email is empty").email("Invalide email format"),
        password: Yup.string()
            .matches(/\d/, "Password must contain a number")
            .matches(/[a-z]/, "Password must contain a lowercase letter")
            .matches(/[A-Z]/, "Password must contain an uppercase letter")
            .matches(/[!@#$%^&*(){}_<>|:;]/, "Password must contain a special character")
            .min(6, "Password must be at least 6 characters long")
            .required("Password is required"),
        passwordConfirm: Yup.string().required("Confirm Password is empty").oneOf([Yup.ref('password'), null], "Passwords must match"),
    });
}
