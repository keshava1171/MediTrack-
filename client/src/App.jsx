import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import AdminSidebar from './components/AdminSidebar';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Reports from './pages/Reports';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminReports from './pages/AdminReports';
import AdminPrescriptions from './pages/AdminPrescriptions';
import AdminRoute from './components/AdminRoute';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDetails from './pages/PatientDetails';
import Profile from './pages/Profile';
import HealthDashboard from './pages/HealthDashboard';
import FindDoctor from './pages/FindDoctor';
import DoctorReports from './pages/DoctorReports';
import DoctorPrescriptions from './pages/DoctorPrescriptions';
import PatientPrescriptions from './pages/PatientPrescriptions';
import GlobalAlertListener from './components/GlobalAlertListener';
const Layout = ({ children }) => {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin';
  const isAuthPage = ['/login', '/register', '/admin/login'].includes(location.pathname);
  const showAdminSidebar = isAdmin && !isAuthPage && location.pathname !== '/admin/reports' && location.pathname !== '/profile';
  const hideStandardNavbar = location.pathname.startsWith('/doctor-dashboard') ||
    location.pathname.startsWith('/doctor/') ||
    location.pathname.startsWith('/health-dashboard') ||
    showAdminSidebar ||
    location.pathname === '/admin/login' ||
    location.pathname === '/chat' ||
    location.pathname === '/admin/reports' ||
    location.pathname === '/reports' ||
    location.pathname === '/prescriptions' ||
    location.pathname === '/profile';
  return (
    <>
      {!hideStandardNavbar && <Navbar />}
      {showAdminSidebar && <AdminSidebar />}
      <div className={`transition-all duration-300 ${!hideStandardNavbar ? 'pt-16' : ''} ${showAdminSidebar ? 'pl-20' : ''}`}>
        {children}
      </div>
    </>
  );
};
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
        <Toaster position="top-center" reverseOrder={false} />
        <GlobalAlertListener />
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/health-dashboard" element={<HealthDashboard />} />
            <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor/reports" element={<DoctorReports />} />
            <Route path="/doctor/reports/:patientId" element={<DoctorReports />} />
            <Route path="/doctor/prescriptions" element={<DoctorPrescriptions />} />
            <Route path="/find-doctor" element={<FindDoctor />} /> 
            <Route path="/doctor/patient/:id" element={<PatientDetails />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/prescriptions" element={<PatientPrescriptions />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
            <Route path="/admin/prescriptions" element={<AdminRoute><AdminPrescriptions /></AdminRoute>} />
          </Routes>
        </Layout>
      </div>
    </Router>
  );
}
export default App;
