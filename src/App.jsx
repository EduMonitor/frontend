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
import ControllerLayout from "./features/featuresLayoute";
import PrivateRoute from "./utils/hooks/keys/protected.key";
import Dashboard from "./features/dashboard/dashboard.dashbord";
import Profiles from "./features/profiles/profiles";
import MonitoringFeedPage from "./features/scappers/MonitorFeed.scapers";
import GoogleAuthRedirect from "./auth/googleRedirectec.auth";
import DorkingScrappers from "./features/scappers/Dorking.scrapers";
import OwnScrapper from "./features/scappers/Own.scrappers";
import UsersAdmin from "./features/users/Users.users";
import UserDetail from "./features/users/Details.users";
import OsintNewSearch from "./features/osint-search/OsintNewSearch";
import OsintResults from "./features/osint-search/OsintResult";
import EntityDetail from "./features/osint-search/EntityDetails";
import { ContentDetail, SessionDetail } from "./features/osint-search/ContentSessionDetails";
import OsintFilters from "./features/osint-search/FiltersOsint";
import AddUser from "./features/users/Add.users";
import EditUser from "./features/users/Edit.users";
import Analyser from "./features/analyser/Analyzer.analyser";

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
          <Route path={AuthRoutes.googleRedirect} element={<GoogleAuthRedirect />} />

          {/* Error Routes */}
          <Route path={PagesRoutes.errorPages.Error404} element={<NotFoundPage />} />
          <Route path={PagesRoutes.errorPages.Error403} element={<ForbiddenPage />} />

          {/* Features controller routes */}
          <Route path={"/ai"} element={<ControllerLayout/>}>
            <Route path={AdminRoutes.dashboard} element={<PrivateRoute element={<Dashboard/>} allowedRoles={['admin','user']}/> }/>
            <Route path={AdminRoutes.profiles} element={<PrivateRoute element={<Profiles/>} allowedRoles={['admin', 'user']}/> }/>
            <Route path={AdminRoutes.Monitoring.Feed} element={<PrivateRoute element={<MonitoringFeedPage/>} allowedRoles={['admin','user']}/> }/>
            <Route path={AdminRoutes.analystics} element={<PrivateRoute element={<Analyser/>} allowedRoles={['admin','user']}/> }/>

            <Route path={AdminRoutes.Monitoring.Keywords} element={<PrivateRoute element={<DorkingScrappers/>} allowedRoles={['admin','user']}/> }/>
            <Route path={AdminRoutes.Monitoring.Hashtags} element={<PrivateRoute element={<OwnScrapper/>} allowedRoles={['admin','user']}/> }/>
            <Route path={AdminRoutes.Settings.Users} element={<PrivateRoute element={<UsersAdmin/>} allowedRoles={['admin']}/> }/>
            <Route path={AdminRoutes.Settings.AddUsers} element={<PrivateRoute element={<AddUser/>} allowedRoles={['admin']}/> }/>
            <Route path={AdminRoutes.Settings.UserDetails} element={<PrivateRoute element={<UserDetail/>} allowedRoles={['admin']}/> }/>
            <Route path={AdminRoutes.Settings.EditUsers} element={<PrivateRoute element={<EditUser/>} allowedRoles={['admin']}/> }/>
            <Route path={AdminRoutes.Analysis.New} element={<PrivateRoute element={<OsintNewSearch/>} allowedRoles={['admin','user',]}/> }/>
            <Route path={AdminRoutes.Analysis.Results} element={<PrivateRoute element={<OsintResults/>} allowedRoles={['admin','user']}/> }/>
            <Route path={AdminRoutes.Analysis.Filters} element={<PrivateRoute element={<OsintFilters/>} allowedRoles={['admin','user']}/> }/>
            <Route path={AdminRoutes.Analysis.EntitiesView} element={<PrivateRoute element={<EntityDetail/>} allowedRoles={['admin','user']}/> }/>
            <Route path={AdminRoutes.Analysis.SessionContent} element={<PrivateRoute element={<SessionDetail/>} allowedRoles={['admin','user']}/> }/>
            <Route path={AdminRoutes.Analysis.ContentView} element={<PrivateRoute element={<ContentDetail/>} allowedRoles={['admin','user']}/> }/>

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