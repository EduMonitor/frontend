export const AuthRoutes={
    signIn: "/",
    signUp: "/auth/signup",
    twoFactor:"/auth/verify-factor",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
    verifyEmail: "/auth/verify-email",
    changePassword: "/auth/change-password",
    profile: "/auth/profile",
    logout: "/auth/logout",
};

export const PagesRoutes={
    errorPages:{
        Error403:"/forbiden",
        Error404:"*",
    }
}