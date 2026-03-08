import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

// Pages
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import TestSession from "@/pages/test-session";
import History from "@/pages/history";
import ExamHub from "@/pages/exams/index";
import DgnlNav from "@/pages/exams/dgnl";
import ThptqgNav from "@/pages/exams/thptqg";
import IeltsNav from "@/pages/exams/ielts";
import SatNav from "@/pages/exams/sat";
import NotificationsPage from "@/pages/notifications";
import SettingsIndex from "@/pages/settings/index";
import ProfileSettings from "@/pages/settings/profile";
import AppearanceSettings from "@/pages/settings/appearance";
import BillingSettings from "@/pages/settings/billing";
import SecuritySettings from "@/pages/settings/security";
import AccountSettings from "@/pages/settings/account";
import ProfilePage from "@/pages/profile/index";
import NotificationsSettings from "@/pages/settings/notifications";
import GoalsSettings from "@/pages/settings/goals";
import { useUserPreferences } from "@/hooks/use-user-preferences";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  return <Component {...rest} />;
}

function Router() {
  useUserPreferences();
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/practice/:id">
        {(params) => <ProtectedRoute component={TestSession} id={params.id} />}
      </Route>
      <Route path="/history">
        <ProtectedRoute component={History} />
      </Route>
      <Route path="/exams">
        <ProtectedRoute component={ExamHub} />
      </Route>
      <Route path="/exams/dgnl/:region?/:mode?">
        <ProtectedRoute component={DgnlNav} />
      </Route>
      <Route path="/exams/thptqg/:subject?">
        <ProtectedRoute component={ThptqgNav} />
      </Route>
      <Route path="/exams/ielts/:skill?">
        <ProtectedRoute component={IeltsNav} />
      </Route>
      <Route path="/exams/sat/:section?">
        <ProtectedRoute component={SatNav} />
      </Route>
      <Route path="/notifications">
        <ProtectedRoute component={NotificationsPage} />
      </Route>
      <Route path="/profile/:username">
        {(params: any) => <ProtectedRoute component={ProfilePage} username={params.username} />}
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={SettingsIndex} />
      </Route>
      <Route path="/settings/profile">
        <ProtectedRoute component={ProfileSettings} />
      </Route>
      <Route path="/settings/security">
        <ProtectedRoute component={SecuritySettings} />
      </Route>
      <Route path="/settings/notifications">
        <ProtectedRoute component={NotificationsSettings} />
      </Route>
      <Route path="/settings/appearance">
        <ProtectedRoute component={AppearanceSettings} />
      </Route>
      <Route path="/settings/goals">
        <ProtectedRoute component={GoalsSettings} />
      </Route>
      <Route path="/settings/billing">
        <ProtectedRoute component={BillingSettings} />
      </Route>
      <Route path="/settings/account">
        <ProtectedRoute component={AccountSettings} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
