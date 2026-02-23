import { useState } from 'react';
import AuditSidebar, { type Section } from '../components/audit/AuditSidebar';
import AuditOverview from '../components/audit/AuditOverview';
import AnomalyTable from '../components/audit/AnomalyTable';
import IntegrityView from '../components/audit/IntegrityView';
import ReportViewer from '../components/audit/ReportViewer';
import AgentControl from '../components/audit/AgentControl';
import AuditSettings from '../components/audit/AuditSettings';
import ErrorBoundary from '../components/shared/ErrorBoundary';

const SECTIONS: Record<Section, React.ComponentType> = {
  overview: AuditOverview,
  anomalies: AnomalyTable,
  integrity: IntegrityView,
  reports: ReportViewer,
  agents: AgentControl,
  settings: AuditSettings,
};

export default function AuditDashboard() {
  const [activeSection, setActiveSection] = useState<Section>('overview');

  const ActiveComponent = SECTIONS[activeSection];

  return (
    <div className="audit-dashboard-shell">
      <AuditSidebar activeSection={activeSection} onNavigate={setActiveSection} />

      <main className="audit-dashboard-content">
        <ErrorBoundary serviceName={`audit-${activeSection}`} onRetry={() => setActiveSection(activeSection)}>
          <ActiveComponent />
        </ErrorBoundary>
      </main>
    </div>
  );
}
