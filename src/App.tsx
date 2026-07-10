
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Institutions from "./pages/Institutions";
import Families from "./pages/Families";
import Reports from "./pages/Reports";
import DeliveryManagement from "./pages/DeliveryManagement";
import InstitutionDashboard from "./pages/institution/InstitutionDashboard";
import InstitutionFamilies from "./pages/institution/InstitutionFamilies";
import InstitutionReports from "./pages/institution/InstitutionReports";
import InstitutionDelivery from "./pages/institution/InstitutionDelivery";
import InstitutionSuppliers from "./pages/institution/InstitutionSuppliers";
import ResetPassword from "./pages/ResetPassword";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TitularPortal from "./pages/TitularPortal";
import NotFound from "./pages/NotFound";
import { OfflineBanner } from "./components/pwa/OfflineBanner";
import { InstallPWA } from "./components/pwa/InstallPWA";
import { PwaUpdatePrompt } from "./components/pwa/PwaUpdatePrompt";
import { QueryProvider } from "./components/QueryProvider";
import { ScrollToTop } from "./components/ScrollToTop";

const App = () => {
  return (
    <React.StrictMode>
      <QueryProvider>
        <BrowserRouter>
          <ScrollToTop />
          <TooltipProvider>
            <AuthProvider>
              <OfflineBanner />
              <PwaUpdatePrompt />
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/politica-privacidade" element={<PrivacyPolicy />} />
                <Route path="/portal-titular" element={<TitularPortal />} />
                <Route 
                  path="/" 
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Admin Routes */}
                <Route 
                  path="/institutions" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Institutions />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/families" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Families />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/reports" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Reports />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/delivery" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <DeliveryManagement />
                    </ProtectedRoute>
                  } 
                />

                {/* Institution Routes */}
                <Route 
                  path="/institution/dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={['institution']}>
                      <InstitutionDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/institution/families" 
                  element={
                    <ProtectedRoute allowedRoles={['institution']}>
                      <InstitutionFamilies />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/institution/reports" 
                  element={
                    <ProtectedRoute allowedRoles={['institution']}>
                      <InstitutionReports />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/institution/delivery" 
                  element={
                    <ProtectedRoute allowedRoles={['institution']}>
                      <InstitutionDelivery />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/institution/suppliers" 
                  element={
                    <ProtectedRoute allowedRoles={['institution', 'admin']}>
                      <InstitutionSuppliers />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/suppliers" 
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <InstitutionSuppliers />
                    </ProtectedRoute>
                  } 
                />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
              <InstallPWA />
            </AuthProvider>
          </TooltipProvider>
        </BrowserRouter>
      </QueryProvider>
    </React.StrictMode>
  );
};

export default App;
