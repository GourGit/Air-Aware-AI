import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Spinner } from '@/components/ui/spinner';

// Lazy-loaded pages
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const AirQualityPage = lazy(() => import('@/pages/AirQualityPage'));
const AirMapPage = lazy(() => import('@/pages/AirMapPage'));
const AssistantPage = lazy(() => import('@/pages/AssistantPage'));
const RoutinePage = lazy(() => import('@/pages/RoutinePage'));
const IndoorAirPage = lazy(() => import('@/pages/IndoorAirPage'));
const MobilityPage = lazy(() => import('@/pages/MobilityPage'));
const ImpactPage = lazy(() => import('@/pages/ImpactPage'));
const CommunityPage = lazy(() => import('@/pages/CommunityPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner size="lg" />
    </div>
  );
}

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Product A — Public AQI Website Routes (No registration required) */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/air-quality" element={<AirQualityPage />} />
        <Route path="/map" element={<AirMapPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Personalized & Advanced Capabilities (Protected or Onboarding) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/routine" element={<RoutinePage />} />
          <Route path="/indoor" element={<IndoorAirPage />} />
          <Route path="/mobility" element={<MobilityPage />} />
          <Route path="/impact" element={<ImpactPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
