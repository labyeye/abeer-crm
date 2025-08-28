import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import LoadingSpinner from './components/ui/LoadingSpinner';

function AppContent() {
  const { user, loading } = useAuth();

  console.log('🎯 App: Current user state:', user);
  console.log('⏳ App: Loading state:', loading);

  if (loading) {
    console.log('🔄 App: Showing loading spinner');
    return <LoadingSpinner />;
  }

  if (!user) {
    console.log('🚪 App: No user found, showing login page');
    return <LoginPage />;
  }

  console.log('🏠 App: User found, showing dashboard for role:', user.role);
  return <DashboardLayout />;
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;