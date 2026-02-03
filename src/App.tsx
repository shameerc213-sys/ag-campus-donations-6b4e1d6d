import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { DonorAuthProvider } from "@/contexts/DonorAuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import DonorsList from "./pages/DonorsList";
import AddDonor from "./pages/AddDonor";
import DonorProfile from "./pages/DonorProfile";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import PublicDonorView from "./pages/PublicDonorView";
import DonorLogin from "./pages/donor-portal/DonorLogin";
import DonorHome from "./pages/donor-portal/DonorHome";
import DonorAbout from "./pages/donor-portal/DonorAbout";
import DonorGallery from "./pages/donor-portal/DonorGallery";
import PortalInstall from "./pages/donor-portal/PortalInstall";
import AdminInstall from "./pages/AdminInstall";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

const queryClient = new QueryClient();

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/portal" replace />;
  }

  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/admin/install" element={<AdminInstall />} />
      <Route path="/" element={<Navigate to="/portal" replace />} />
      <Route path="/my-donations/:id" element={<PublicDonorView />} />
      
      {/* Donor Portal Routes */}
      <Route path="/portal" element={<DonorLogin />} />
      <Route path="/portal/install" element={<PortalInstall />} />
      <Route path="/portal/home" element={<DonorHome />} />
      <Route path="/portal/about" element={<DonorAbout />} />
      <Route path="/portal/gallery" element={<DonorGallery />} />
      
      <Route
        path="/donors"
        element={
          <ProtectedRoute>
            <DonorsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-donor"
        element={
          <ProtectedRoute>
            <AddDonor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/donor/:id"
        element={
          <ProtectedRoute>
            <DonorProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <DonorAuthProvider>
              <AppRoutes />
            </DonorAuthProvider>
          </AuthProvider>
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
