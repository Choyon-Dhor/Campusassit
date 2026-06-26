// ============================================================
// src/App.js — Root Application with Routing
// ============================================================
import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';

// Auth
import LandingAuthPage from './components/auth/LandingAuthPage';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Profile from './components/auth/Profile';
import PasswordRecoveryPage from './components/auth/PasswordRecoveryPage';

// Pages
import Dashboard from './components/dashboard/Dashboard';
import Announcements from './components/announcements/Announcements';
import FreeClassrooms from './components/classrooms/FreeClassrooms';
import SmartClassrooms from './components/classrooms/SmartClassrooms';
import Resources from './components/resources/Resources';
import StudyGroups from './components/studygroups/StudyGroups';
import StudyGroupDetail from './components/studygroups/StudyGroupDetail';
import Deadlines from './components/deadlines/Deadlines';
import Consultations from './components/consultations/Consultations';
import ResultPortal from './components/results/ResultPortal';
import BatchRoutine from './components/routine/BatchRoutine';
import BusSchedule from './components/bus/BusSchedule';
import Notifications from './components/notifications/Notifications';
import UserManagement from './components/admin/UserManagement';

const theme = createTheme({
  palette: {
    primary: { main: '#1a73e8', light: '#4285f4', dark: '#0d5bba' },
    secondary: { main: '#34a853' },
    error: { main: '#ea4335' },
    warning: { main: '#fbbc04' },
    background: { default: '#f1f3f4', paper: '#ffffff' },
  },
  typography: {
    fontFamily: '"Google Sans", "Roboto", "Helvetica Neue", sans-serif',
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: { root: { textTransform: 'none', fontWeight: 500, borderRadius: 8 } },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 500 } } },
  },
});

const LoadingRoute = () => (
  <div className="d-flex align-items-center justify-content-center vh-100">
    <div className="spinner-border text-primary" />
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingRoute />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingRoute />;
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

const FallbackRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><LandingAuthPage initialTab="sign-in" /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><PasswordRecoveryPage /></PublicRoute>} />
      <Route path="/reset-password/:token" element={<PublicRoute><PasswordRecoveryPage /></PublicRoute>} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="classrooms" element={<FreeClassrooms />} />
        <Route path="smart-classrooms" element={<SmartClassrooms />} />
        <Route path="resources" element={<Resources />} />
        <Route path="study-groups" element={<StudyGroups />} />
        <Route path="study-groups/:id" element={<StudyGroupDetail />} />
        <Route path="deadlines" element={<Deadlines />} />
        <Route path="consultations" element={<Consultations />} />
        <Route path="results" element={<ResultPortal />} />
        <Route path="routine" element={<BatchRoutine />} />
        <Route path="bus" element={<BusSchedule />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
        <Route path="users" element={<UserManagement />} />
      </Route>

      <Route path="*" element={<FallbackRoute />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            toastStyle={{ borderRadius: 10 }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

