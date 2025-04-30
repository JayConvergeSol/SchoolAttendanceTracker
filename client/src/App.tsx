import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import TakeAttendance from "@/pages/TakeAttendance";
import Students from "@/pages/Students";
import AttendanceHistory from "@/pages/AttendanceHistory";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import Layout from "@/components/layout/Layout";
import { useAuth, AuthProvider } from "@/hooks/useAuth";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  return isAuthenticated ? <Component {...rest} /> : <Login />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login">
        <Login />
      </Route>
      <Route path="/">
        <ProtectedRoute component={Layout}>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/take-attendance">
        <ProtectedRoute component={Layout}>
          <TakeAttendance />
        </ProtectedRoute>
      </Route>
      <Route path="/students">
        <ProtectedRoute component={Layout}>
          <Students />
        </ProtectedRoute>
      </Route>
      <Route path="/attendance-history">
        <ProtectedRoute component={Layout}>
          <AttendanceHistory />
        </ProtectedRoute>
      </Route>
      <Route path="/reports">
        <ProtectedRoute component={Layout}>
          <Reports />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={Layout}>
          <Settings />
        </ProtectedRoute>
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
