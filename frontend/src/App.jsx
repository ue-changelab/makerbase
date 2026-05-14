import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import { useIdleTimeout } from './hooks/useIdleTimeout'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/common/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import TripList from './pages/TripList'
import TripDetails from './pages/TripDetails'
import CreateTrip from './pages/CreateTrip'
import EditTrip from './pages/EditTrip'
import Profile from './pages/Profile'
import LessonsLearned from './pages/LessonsLearned'
import VendorDirectory from './pages/VendorDirectory'
import EquipmentAvailability from './pages/EquipmentAvailability'
import CheckoutHistory from './pages/CheckoutHistory'
import GearRequests from './pages/GearRequests'
import ResetPassword from './pages/ResetPassword'
import Gallery from './pages/Gallery'
import UserManagement from './pages/UserManagement'
import Storage from './pages/Storage'

function AppRoutes() {
    const { defaultLandingPage } = useAuth()
    useIdleTimeout()
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Routes */}
            <Route path="/" element={
                <ProtectedRoute>
                    <Layout><Dashboard /></Layout>
                </ProtectedRoute>
            } />

            <Route path="/trips" element={
                <ProtectedRoute>
                    <Layout><TripList /></Layout>
                </ProtectedRoute>
            } />

            <Route path="/lessons" element={
                <ProtectedRoute>
                    <Layout><LessonsLearned /></Layout>
                </ProtectedRoute>
            } />

            <Route path="/vendors" element={
                <ProtectedRoute>
                    <Layout><VendorDirectory /></Layout>
                </ProtectedRoute>
            } />

            <Route path="/equipment" element={
                <ProtectedRoute>
                    <Layout><EquipmentAvailability /></Layout>
                </ProtectedRoute>
            } />

            <Route path="/checkout-history" element={
                <ProtectedRoute>
                    <Layout><CheckoutHistory /></Layout>
                </ProtectedRoute>
            } />

            <Route path="/gear-requests" element={
                <ProtectedRoute requiredRole={['Admin', 'Officer']}>
                    <Layout><GearRequests /></Layout>
                </ProtectedRoute>
            } />

            <Route path="/trips/create" element={
                <ProtectedRoute requiredRole={['Admin', 'Officer']}>
                    <Layout><CreateTrip /></Layout>
                </ProtectedRoute>
            } />

            <Route path="/trips/:id/edit" element={
                <ProtectedRoute requiredRole={['Admin', 'Officer']}>
                    <Layout><EditTrip /></Layout>
                </ProtectedRoute>
            } />

            <Route path="/trips/:id" element={
                <ProtectedRoute>
                    <Layout><TripDetails /></Layout>
                </ProtectedRoute>
            } />

            <Route path="/profile" element={
                <ProtectedRoute>
                    <Layout><Profile /></Layout>
                </ProtectedRoute>
            } />

            <Route path="/gallery" element={
                <ProtectedRoute>
                    <Layout><Gallery /></Layout>
                </ProtectedRoute>
            } />

            {/* FIXED: /users route now exists — was missing, wildcard redirected to / */}
            <Route path="/users" element={
                <ProtectedRoute requiredRole={['Admin']}>
                    <Layout><UserManagement /></Layout>
                </ProtectedRoute>
            } />

	    <Route path="/storage" element={
    <ProtectedRoute>
        <Layout><Storage /></Layout>
    </ProtectedRoute>
} />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </ErrorBoundary>
    )
}

export default App
