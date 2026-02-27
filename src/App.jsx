import { useStore } from './store';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DomainView from './components/DomainView';
import ScenarioPlanner from './components/ScenarioPlanner';
import Settings from './components/Settings';

export default function App() {
  const { state } = useStore();
  const { currentView } = state;

  let content;
  if (currentView === 'dashboard') {
    content = <Dashboard />;
  } else if (currentView.startsWith('domain:')) {
    const domainId = currentView.split(':')[1];
    content = <DomainView domainId={domainId} />;
  } else if (currentView === 'scenarios') {
    content = <ScenarioPlanner />;
  } else if (currentView === 'settings') {
    content = <Settings />;
  } else {
    content = <Dashboard />;
  }

  return <Layout>{content}</Layout>;
}
