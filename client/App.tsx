import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './src/components/LoginPage';
import SignUpForm from './src/components/SignUpForm';

// Admin Components
import AdminLayout from './src/components/Layout';
import AdminDashboard from './src/components/Dashboard';
import UserManagement from './src/components/UserManagement';
import EvaluationManagement from './src/components/EvaluationManagement';
import Reports from './src/components/Reports';
import Notifications from './src/components/Notifications';
import Settings from './src/components/Settings';
import FullEvaluationForm from './src/components/evaluation/FullEvaluationForm';
import FacultyEvaluationFlow from './src/components/evaluation/FacultyEvaluationFlow';
import ProfileEdit from './src/components/ProfileEdit';

// Student Components
import StudentLayout from './src/components/student/StudentLayout';
import MyEvaluations from './src/components/student/MyEvaluations';
// import EvaluateProfessors from './src/components/student/EvaluateProfessors';

// Professor Components
import ProfessorLayout from './src/components/professor/ProfessorLayout';
import ProfessorDashboard from './src/components/professor/ProfessorDashboard';
import SelfEvaluation from './src/components/professor/SelfEvaluation';
import PeerEvaluation from './src/components/professor/PeerEvaluation';
import ResultsReports from './src/components/professor/ResultsReports';

// Supervisor Components
import SupervisorLayout from './src/components/supervisor/SupervisorLayout';
import SupervisorDashboard from './src/components/supervisor/SupervisorDashboard';
import SupervisorResultsReports from './src/components/supervisor/ResultsReports';
import TemplateGenerator from './src/components/supervisor/TemplateGenerator';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          {/* Public Routes */}
          <Route path="/auth">
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignUpForm />} />
            <Route index element={<Navigate to="login" replace />} />
          </Route>
          <Route path="/" element={<Navigate to="/auth/login" replace />} />

          {/* Profile */}
          <Route path="/profile" element={<ProfileEdit />} />

          {/* Full Evaluation Route (rating-only, all categories) */}
          <Route path="/full-evaluation" element={<FullEvaluationForm />} />
          {/* Step-based Faculty Evaluation Flow */}
          <Route path="/evaluate/faculty" element={<FacultyEvaluationFlow />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="evaluations" element={<EvaluationManagement />} />
            <Route path="reports" element={<Reports />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Student Routes */}
          <Route path="/student" element={<StudentLayout />}>
            {/* Render the guided evaluation flow inside the Evaluate Professors page */}
            <Route index element={<FacultyEvaluationFlow />} />
            <Route path="my-evaluations" element={<MyEvaluations />} />
          </Route>

          {/* Professor/Faculty Routes */}
          <Route path="/professor" element={<ProfessorLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ProfessorDashboard />} />
            <Route path="self-evaluation" element={<SelfEvaluation />} />
            <Route path="peer-evaluation" element={<PeerEvaluation />} />
            <Route path="results" element={<ResultsReports />} />
          </Route>

          {/* Supervisor Routes */}
          <Route path="/supervisor" element={<SupervisorLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<SupervisorDashboard />} />
            {/* Use the guided 3-step flow (Department -> Faculty -> Evaluate) */}
            <Route path="evaluations/professors" element={<FacultyEvaluationFlow />} />
            <Route path="evaluations/templates" element={<TemplateGenerator />} />
            <Route path="results-reports" element={<SupervisorResultsReports />} />
          </Route>

          {/* Catch-all route for unmatched paths */}
          <Route path="*" element={<Navigate to="/auth/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}