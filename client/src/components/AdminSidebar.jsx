import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, reset } from '../features/auth/authSlice';
import {
    LayoutDashboard, Users, FileText, Settings,
    LogOut, Home, Menu, ArrowLeft, Shield, Pill
} from 'lucide-react';
import { motion } from 'framer-motion';

const SidebarItem = ({ icon: Icon, label, active, onClick, expanded }) => (
    <div
        onClick={onClick}
        className={`flex items-center ${expanded ? 'px-6' : 'px-0 justify-center'} py-3 cursor-pointer transition-colors duration-200 
        ${active ? 'bg-blue-600 text-white border-r-4 border-blue-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
        title={!expanded ? label : ''}
    >
        <Icon size={20} className={`${expanded ? '' : ''}`} />
        {expanded && (
            <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                className="font-medium ml-3 whitespace-nowrap overflow-hidden"
            >
                {label}
            </motion.span>
        )}
    </div>
);

const AdminSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

    const searchParams = new URLSearchParams(location.search);
    const currentTab = searchParams.get('tab') || 'Overview';
    const isDashboard = location.pathname === '/admin/dashboard';
    const isReports = location.pathname === '/admin/reports';

    const handleNavigation = (path, tab) => {
        if (tab) {
            navigate(`${path}?tab=${tab}`);
        } else {
            navigate(path);
        }
    };

    const onLogout = () => {
        dispatch(logout());
        dispatch(reset());
        navigate('/admin/login');
    };

    return (
        <motion.div
            initial={{ width: 80 }}
            animate={{ width: isSidebarExpanded ? 260 : 80 }}
            onMouseEnter={() => setIsSidebarExpanded(true)}
            onMouseLeave={() => setIsSidebarExpanded(false)}
            className="fixed left-0 top-0 h-full bg-gray-900 text-white flex-shrink-0 flex flex-col transition-all duration-300 shadow-xl z-50 pointer-events-auto"
        >
            <div className={`h-16 flex items-center ${isSidebarExpanded ? 'px-6' : 'justify-center'} border-b border-gray-800 font-bold text-xl tracking-wider overflow-hidden shrink-0`}>
                <span className="text-blue-500 mr-2">M</span>
                {isSidebarExpanded && <span>MEDADMIN</span>}
            </div>

            <div className="flex-1 py-6 overflow-y-auto overflow-x-hidden">
                <div className="px-4 mb-2">
                    <button
                        onClick={() => navigate('/')}
                        className={`flex items-center ${isSidebarExpanded ? 'justify-start space-x-2 px-4' : 'justify-center'} w-full py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300 transition`}
                    >
                        <Home size={16} /> {isSidebarExpanded && <span>Home</span>}
                    </button>
                </div>

                <div className={`px-6 mt-6 mb-2 text-xs font-semibold text-gray-500 uppercase ${!isSidebarExpanded && 'hidden'}`}>Main Menu</div>

                <SidebarItem
                    icon={LayoutDashboard}
                    label="Overview"
                    active={isDashboard && currentTab === 'Overview'}
                    onClick={() => handleNavigation('/admin/dashboard', 'Overview')}
                    expanded={isSidebarExpanded}
                />

                <SidebarItem
                    icon={Users}
                    label="Patients"
                    active={isDashboard && currentTab === 'Patients'}
                    onClick={() => handleNavigation('/admin/dashboard', 'Patients')}
                    expanded={isSidebarExpanded}
                />

                <SidebarItem
                    icon={Users}
                    label="Doctors"
                    active={isDashboard && currentTab === 'Doctors'}
                    onClick={() => handleNavigation('/admin/dashboard', 'Doctors')}
                    expanded={isSidebarExpanded}
                />

                <SidebarItem
                    icon={FileText}
                    label="Medical Reports"
                    active={isReports}
                    onClick={() => handleNavigation('/admin/reports')}
                    expanded={isSidebarExpanded}
                />

                <SidebarItem
                    icon={Pill}
                    label="Prescriptions"
                    active={location.pathname === '/admin/prescriptions'}
                    onClick={() => handleNavigation('/admin/prescriptions')}
                    expanded={isSidebarExpanded}
                />

                <div className={`px-6 mt-8 mb-6 text-xs font-semibold text-gray-500 uppercase ${!isSidebarExpanded && 'hidden'}`}>System</div>

                <SidebarItem
                    icon={Settings}
                    label="Settings"
                    active={isDashboard && currentTab === 'Settings'}
                    onClick={() => handleNavigation('/admin/dashboard', 'Settings')}
                    expanded={isSidebarExpanded}
                />
            </div>

            <div className="p-4 border-t border-gray-800 shrink-0">
                <button
                    onClick={onLogout}
                    className={`flex items-center justify-center w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition ${!isSidebarExpanded && 'px-0'}`}
                    title="Logout"
                >
                    <LogOut size={16} className={isSidebarExpanded ? 'mr-2' : ''} />
                    {isSidebarExpanded && 'Logout'}
                </button>
            </div>
        </motion.div>
    );
};

export default AdminSidebar;
