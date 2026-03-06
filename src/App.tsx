import { lazy, Suspense, useState, useEffect } from 'react';
import { useStore } from './store';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import { useCelebrations } from './hooks/useCelebrations';
import Onboarding from './components/Onboarding';
import { Shield } from 'lucide-react';

// Lazy load less-frequently visited pages
const DomainView = lazy(() => import('./components/DomainView'));
const ScenarioPlanner = lazy(() => import('./components/ScenarioPlanner'));
const Settings = lazy(() => import('./components/Settings'));

const ONBOARDING_KEY = 'readystate-onboarded';

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <Shield className="w-8 h-8 text-th-faint animate-pulse" />
    </div>
  );
}

function CelebrationWatcher() {
  useCelebrations();
  return null;
}

export default function App() {
  const { state } = useStore();
  const { currentView } = state;
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      setShowOnboarding(true);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    setShowOnboarding(false);
  };

  let content;
  if (currentView === 'dashboard') {
    content = <Dashboard />;
  } else if (currentView.startsWith('domain:')) {
    const domainId = currentView.split(':')[1];
    content = (
      <Suspense fallback={<LoadingFallback />}>
        <DomainView domainId={domainId} />
      </Suspense>
    );
  } else if (currentView === 'scenarios') {
    content = (
      <Suspense fallback={<LoadingFallback />}>
        <ScenarioPlanner />
      </Suspense>
    );
  } else if (currentView === 'settings') {
    content = (
      <Suspense fallback={<LoadingFallback />}>
        <Settings />
      </Suspense>
    );
  } else {
    content = <Dashboard />;
  }

  return (
    <>
      <CelebrationWatcher />
      {showOnboarding && <Onboarding onComplete={completeOnboarding} />}
      <Layout>{content}</Layout>
    </>
  );
}
