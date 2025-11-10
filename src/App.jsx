import { Route, Routes } from "react-router-dom";
import { AdminRoutes, AuthRoutes,PagesRoutes } from "./constants/routes.constant";
import { lazy, Suspense, memo } from "react";

// Lazy load ALL non-critical components for maximum optimization
const SignInAuth = lazy(() => import("./auth/signin.auth"));
const TwoFactorAuth = lazy(() => import("./auth/2fA.auth"));
const SignUpAuth = lazy(() => import("./auth/signup.auth"));
const NotifyAuth = lazy(() => import("./auth/notifications.auth"));
const EmailVerification = lazy(() => import("./auth/emailVerification.auth"));
const ForgotPages = lazy(() => import("./auth/forgot.auth"));
const ResetPages = lazy(() => import("./auth/reset.auth"));
const NotFoundPage = lazy(() => import("./pages/errors/404.errors"));
const ForbiddenPage = lazy(() => import("./pages/errors/403.errors"));

// Lightweight components that can be direct imports
import ThemeToggleButton from "./components/theme/toggle.theme";
import { Spinner } from "./components/spinner/spinners.spinners";
import ScrollToTopButton from "./components/theme/Topdown.theme";
import ControllerLayout from "./controllers/controllersLayoute";
import PrivateRoute from "./utils/hooks/keys/protected.key";
import Dashboard from "./controllers/dashboard/dashboard.dashbord";
import Profiles from "./controllers/profiles/profiles";
import MonitoringFeedPages from "./controllers/scappers/monitor.scrapers";
import MonitoringFeedPage from "./controllers/scappers/MonitorFeed.scapers";

// Single optimized loading component for all routes
const LoadingFallback = memo(() => (
  <Spinner
    isLoading={true}
    appName="EduMonitor"
    title="Loading..."
    subtitle="Please wait"
    variant="loading"
    showAppName={false} // Hide for faster route transitions
  />
));
LoadingFallback.displayName = 'LoadingFallback';

// Main App component - clean and efficient
const App = memo(() => {


  return (
    <>
      {/* Single Suspense boundary for all lazy routes - OPTIMAL */}
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Authentication Routes */}
          <Route path={AuthRoutes.signIn} element={<SignInAuth />} />
          <Route path={AuthRoutes.signUp} element={<SignUpAuth />} />
          <Route path={AuthRoutes.forgotPassword} element={<ForgotPages />} />
          <Route path={AuthRoutes.notifyAuth} element={<NotifyAuth />} />
          <Route path={AuthRoutes.resetPassword} element={<ResetPages />} />
          <Route path={AuthRoutes.emailVerify} element={<EmailVerification />} />
          <Route path={AuthRoutes.twoFactor} element={<TwoFactorAuth />} />

          {/* Error Routes */}
          <Route path={PagesRoutes.errorPages.Error404} element={<NotFoundPage />} />
          <Route path={PagesRoutes.errorPages.Error403} element={<ForbiddenPage />} />

          {/* Features controller routes */}
          <Route path={"/ai"} element={<ControllerLayout/>}>
            <Route path={AdminRoutes.dashboard} element={<PrivateRoute element={<Dashboard/>} allowedRoles={['admin','user','analys','view']}/> }/>
            <Route path={AdminRoutes.profiles} element={<PrivateRoute element={<Profiles/>} allowedRoles={['admin','user','analys','view']}/> }/>
            <Route path={AdminRoutes.Monitoring.Feed} element={<PrivateRoute element={<MonitoringFeedPages/>} allowedRoles={['admin','user','analys','view']}/> }/>
            <Route path={AdminRoutes.Monitoring.Keywords} element={<PrivateRoute element={<MonitoringFeedPage/>} allowedRoles={['admin','user','analys','view']}/> }/>

          </Route>
        </Routes>
      </Suspense>

      {/* Always-available lightweight components */}
      <ThemeToggleButton />
      <ScrollToTopButton />
    </>
  );
});

App.displayName = 'App';
export default App;