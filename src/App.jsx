import { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { ThemeProvider } from '@/lib/ThemeContext';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { canAccessPage } from '@/lib/navConfig';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

// Shown while a lazy page chunk downloads. Inside the Layout, so the header and
// bottom nav stay put — only the content area blinks a small spinner.
const PageFallback = () => (
  <div className="min-h-[50vh] grid place-items-center" aria-busy="true">
    <div className="w-8 h-8 border-4 border-amber-400/70 border-t-transparent rounded-full animate-spin" />
  </div>
);

const LayoutWrapper = ({ children, currentPageName }) => Layout
  ? <Layout currentPageName={currentPageName}><Suspense fallback={<PageFallback />}>{children}</Suspense></Layout>
  : <Suspense fallback={<PageFallback />}>{children}</Suspense>;

// Blocks a page if the signed-in role isn't allowed to see it (per navConfig).
// This is a UX guard only — the real protection is RLS on the server. While auth
// is still initializing we render nothing to avoid a flash of denied content.
// Players hitting an admin-only page are bounced to their home; admins to theirs.
function RouteGuard({ pageKey, children }) {
  const { role, isInitializing } = useAuth();
  if (isInitializing) return null;
  if (!canAccessPage(pageKey, role)) {
    const home = role === 'player' ? '/PlayerHome' : '/Home';
    return <Navigate to={home} replace />;
  }
  return children;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <Routes>
              <Route path="/" element={
                <LayoutWrapper currentPageName={mainPageKey}>
                  <RouteGuard pageKey={mainPageKey}>
                    <MainPage />
                  </RouteGuard>
                </LayoutWrapper>
              } />
              {Object.entries(Pages).map(([path, Page]) => (
                <Route
                  key={path}
                  path={`/${path}`}
                  element={
                    <LayoutWrapper currentPageName={path}>
                      <RouteGuard pageKey={path}>
                        <Page />
                      </RouteGuard>
                    </LayoutWrapper>
                  }
                />
              ))}
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
