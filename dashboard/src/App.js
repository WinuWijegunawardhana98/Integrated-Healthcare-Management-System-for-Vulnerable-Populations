import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import './App.css';
import Home from './pages/Home';
import SignUp from './pages/forms/SignUp';
import SignIn from './pages/forms/SignIn';
import ProfilePictureUpload from './pages/forms/ProfilePictureUpload';
import DrugSuggetions from './pages/DrugSuggetions';
import ExcerciseMonitor from './pages/ExcerciseMonitor';
import DrugAddhrence from './pages/DrugAddherence';
import Prescriptions from './pages/Prescriptions';
import ExcerciseSchedule from './pages/ExcerciseSchedule';
import AdminUser from './pages/AdminUser';
import DrugSchedule from './pages/DrugSchedule';
import Profile from './pages/Profile';
import PatientsSection from './pages/PatientsSection';
import HealthcareSection from './components/HealthcareSection';
import ActivityList from './components/ActivityList';
import ExcerciseSchedulesList from './components/ExerciseSchedulesList';
import LifePathSuggestions from './components/LifePathSuggetions';
import MedicineManagement from './pages/MedicineManagement';
import PatientManagement from './components/PatientsManagement';
import PrescriptionNotes from './components/PrescriptioNotes';
import PatientPrescriptionNotes from './components/PatientPrescriptioNotes';
import PatientMedicationSchedule from './components/PatientMedicationsList';
import NutritionSuggestions from './components/NutritionSuggetions';
import Chatbot from './pages/chatbot';

const ProtectedRoute = ({ element, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    return <Navigate to="/sign-in" />;
  }
  if (!user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/home" />;
  }
  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/logged/dashboard" />;
  }

  return element;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/home" element={<Home />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/profile-upload" element={<ProfilePictureUpload />} />

        {/* Protected routes */}
        <Route path="/logged/profile/*" element={<ProtectedRoute element={<Profile />} allowedRoles={['Patient', 'Doctor', 'Care Giver', 'Administrator']} />}>
          <Route index element={<HealthcareSection />} />
          <Route path="suggest-exercise" element={<ActivityList />} />
          <Route path="exercise-schedule" element={<ExcerciseSchedulesList />} />
          <Route path="life-path" element={<LifePathSuggestions />} />
          <Route path="nutritions" element={<NutritionSuggestions />} />
        </Route>
        <Route path="/logged/patients-section" element={<ProtectedRoute element={<PatientsSection />} allowedRoles={['Doctor', 'Care Giver', 'Administrator']} />}>
          <Route index element={<PatientManagement />} />
          <Route path="add-prescription" element={<PatientPrescriptionNotes />} />
          <Route path="medication-schedule" element={<PatientMedicationSchedule />} />
        </Route>
        <Route path="/logged/dashboard" element={<ProtectedRoute element={<Dashboard />} allowedRoles={['Patient', 'Doctor', 'Care Giver', 'Administrator']} />} />
        <Route path="/logged/drugs-sugetion" element={<ProtectedRoute element={<DrugSuggetions />} allowedRoles={['Patient', 'Doctor', 'Care Giver', 'Administrator']} />} />
        <Route path="/logged/drugs-addherence" element={<ProtectedRoute element={<DrugAddhrence />} allowedRoles={['Patient', 'Doctor', 'Care Giver', 'Administrator']} />} />
        <Route path="/logged/drugs-management" element={<ProtectedRoute element={<MedicineManagement />} allowedRoles={['Patient', 'Doctor', 'Care Giver', 'Administrator']} />} />
        <Route path="/logged/drugs-addherence/schedule" element={<ProtectedRoute element={<DrugSchedule />} allowedRoles={['Patient', 'Doctor', 'Care Giver', 'Administrator']} />} />
        <Route path="/logged/drugs-addherence/:prescription" element={<ProtectedRoute element={<Prescriptions />} allowedRoles={['Patient', 'Doctor', 'Care Giver', 'Administrator']} />} />
        <Route path="/logged/excercise-monitor" element={<ProtectedRoute element={<ExcerciseMonitor />} allowedRoles={['Patient', 'Administrator']} />} />
        <Route path="/logged/excercise-schedule" element={<ProtectedRoute element={<ExcerciseSchedule />} allowedRoles={['Patient', 'Administrator']} />} />
        <Route path="/logged/user-management" element={<ProtectedRoute element={<AdminUser />} allowedRoles={['Administrator']} />} />

        {/* Catch-all route */}
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;
