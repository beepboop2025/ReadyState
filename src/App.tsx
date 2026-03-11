import { lazy, Suspense, useState, useEffect } from 'react';
import { useStore } from './store';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import { useCelebrations } from './hooks/useCelebrations';
import Onboarding from './components/Onboarding';
// Shield icon used in Layout

// Lazy load less-frequently visited pages
const DomainView = lazy(() => import('./components/DomainView'));
const ScenarioPlanner = lazy(() => import('./components/ScenarioPlanner'));
const Settings = lazy(() => import('./components/Settings'));

const ONBOARDING_KEY = 'readystate-onboarded';

function LoadingFallback() {
  return (
    <div className="space-y-6 animate-fade">
      {/* Skeleton hero */}
      <div className="flex flex-col lg:flex-row items-center gap-8">
        <div className="skeleton w-[200px] h-[200px] rounded-full flex-shrink-0" />
        <div className="flex-1 w-full space-y-4">
          <div className="skeleton w-64 h-8 rounded-xl" />
          <div className="skeleton w-96 h-4 rounded-lg" />
          <div className="grid grid-cols-3 gap-3">
            <div className="skeleton h-20 rounded-2xl" />
            <div className="skeleton h-20 rounded-2xl" />
            <div className="skeleton h-20 rounded-2xl" />
          </div>
        </div>
      </div>
      {/* Skeleton cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-40 rounded-2xl" />
        ))}
      </div>
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
