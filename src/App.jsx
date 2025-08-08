import { Route, Routes } from "react-router-dom";
import { AuthRoutes, PagesRoutes } from "./constants/routes.constant";
import { lazy, Suspense } from "react";
import ThemeToggleButton from "./components/theme/toggle.theme";
import { Spinner } from "./components/spinner/spinners.spinners";

// Only lazy load heavy/rare pages
const Error404 = lazy(() => import("./pages/errors/404.errors"));
const Error403 = lazy(() => import("./pages/errors/403.errors"));

// Direct import for lightweight/critical pages
import SignInAuth from "./auth/signin.auth";
import TwoFactorAuth from "./auth/2fA.auth";
import SignUpAuth from "./auth/signup.auth";
import ForgotPages from "./auth/forgot.auth";
import EmailVerifyPage from "./auth/verify.auth";

function App() {
  return (
    <>
      <Suspense fallback={<Spinner isLoading={true} />}>
        <Routes>
          <Route path={AuthRoutes.signIn} element={<SignInAuth />} />
          <Route path={AuthRoutes.signUp} element={<SignUpAuth />} />
           <Route path={AuthRoutes.forgotPassword} element={<ForgotPages />} />
           <Route path={AuthRoutes.verifyEmail} element={<EmailVerifyPage />} />
          <Route path={AuthRoutes.twoFactor} element={<TwoFactorAuth />} />
          <Route path={PagesRoutes.errorPages.Error404} element={<Error404 />} />
          <Route path={PagesRoutes.errorPages.Error403} element={<Error403 />} />
        </Routes>
        <ThemeToggleButton />
      </Suspense>
    </>
  );
}

export default App;
