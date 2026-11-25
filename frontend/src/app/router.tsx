import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Spinner } from '@/components/ui/spinner';

// Lazy-loaded PUBLIC pages (no registration required)
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const AirQualityPage = lazy(() => import('@/pages/AirQualityPage'));
const AirMapPage = lazy(() => import('@/pages/AirMapPage'));

// Auth pages
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));

// Mobile App Promotion page for protected routes
const MobileAppPage = lazy(() => import('@/pages/MobileAppPage'));

// 404
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

        {/* Protected personalized features → Mobile App Promotion */}
        <Route path="/assistant" element={<MobileAppPage />} />
        <Route path="/routine" element={<MobileAppPage />} />
        <Route path="/indoor" element={<MobileAppPage />} />
        <Route path="/mobility" element={<MobileAppPage />} />
        <Route path="/impact" element={<MobileAppPage />} />
        <Route path="/community" element={<MobileAppPage />} />
        <Route path="/settings" element={<MobileAppPage />} />
        <Route path="/onboarding" element={<MobileAppPage />} />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}