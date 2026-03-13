import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Route, Switch, useLocation, Link } from 'wouter';
import { useEffect, useState } from 'react';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Landing from './pages/Landing';
import AboutUs from './pages/AboutUs';

import axios from 'axios';

// Globals
axios.defaults.baseURL = 'http://localhost:5000/api';
axios.defaults.withCredentials = true;

const queryClient = new QueryClient();

// A component that handles conditional UI
function AppContent() {
  const [theme, setTheme] = useState<'dark'|'light'>('dark');
  const [location] = useLocation();

  // System detect theme
  useEffect(() => {
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(isDark ? 'dark' : 'light');
    
    // Listen for changes
    const matcher = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: any) => setTheme(e.matches ? 'dark' : 'light');
    matcher.addEventListener('change', onChange);
    return () => matcher.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  const { data: user } = useQuery<any, any>({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const res = await axios.get('/auth/me');
        return res.data.user;
      } catch (err) {
        return null;
      }
    },
    retry: false
  });

  const isPublicPage = location === '/' || location === '/about' || location === '/auth';
  const isAdmin = user?.role === 'admin' || user?.role === 'operator';

  return (
    <div className={`min-h-screen bg-background text-foreground flex flex-col items-center ${isPublicPage ? '' : 'p-4'}`}>
      {!isPublicPage && (
        <nav className="sticky top-4 z-50 w-full max-w-lg glass-effect rounded-full px-6 py-3 flex justify-around items-center mb-8">
          <Link href="/" className="hover:text-primary transition-colors duration-200 text-sm font-semibold">
            Home
          </Link>
          <Link href="/dashboard" className="hover:text-primary transition-colors duration-200 text-sm font-semibold">
            Dashboard
          </Link>
          {isAdmin && (
            <Link href="/admin" className="hover:text-primary transition-colors duration-200 text-sm font-semibold">
              Admin
            </Link>
          )}
          {!user && (
            <Link href="/auth" className="hover:text-primary transition-colors duration-200 text-sm font-semibold">
              Auth
            </Link>
          )}
        </nav>
      )}

      <main className={`w-full flex-1 relative overflow-hidden ${isPublicPage ? 'max-w-full' : 'max-w-4xl glass-effect rounded-3xl p-6 sm:p-12'}`}>
        {!isPublicPage && (
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />
        )}
        
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/about" component={AboutUs} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/auth" component={Auth} />
          <Route path="/admin" component={Admin} />
          <Route>
            <div className="text-center">404 - Not Found</div>
          </Route>
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
