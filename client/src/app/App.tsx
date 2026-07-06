import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { TodoDashboard } from '../features/todos/components/TodoDashboard';
import { queryClient } from '../lib/queryClient';
import { useThemeStore } from '../stores/themeStore';
import { Toaster } from '../components/ui/Toaster';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

const ThemeController = () => {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return null;
};

const AppRoutes = () => (
  <>
    <ThemeController />
    <Routes>
      <Route path="/" element={<TodoDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <Toaster position="top-right" closeButton />
  </>
);

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
