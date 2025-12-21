import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { LayoutDashboard, Users, LogOut, FileText, MessageSquare, User, Activity, Shield, Home, Pill } from 'lucide-react';
import NotificationBell from './NotificationBell';

const DashboardSidebar = ({ role, onHoverChange }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    const [isHovered, setIsHovered] = useState(false);

    const handleHover = (status) => {
        setIsHovered(status);
        if (onHoverChange) onHoverChange(status);
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
    };

    const handleLogoClick = () => {
        if (role === 'doctor') navigate('/doctor-dashboard');
        else if (role === 'patient') navigate('/health-dashboard');
        else if (role === 'admin') navigate('/admin/dashboard');
        else navigate('/');
    };

    const isActive = (path) => location.pathname === path;

    const SidebarItem = ({ icon: Icon, label, path, onClick, danger }) => (
        <button
            onClick={onClick || (() => navigate(path))}
            className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 ${isHovered ? 'justify-start px-4' : 'justify-center'} ${isActive(path) && !danger
                ? 'bg-blue-600 text-white shadow-md'
                : danger
                    ? 'text-red-500 hover:bg-red-50'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
            title={!isHovered ? label : ''}
        >
            <Icon size={22} strokeWidth={2} />
            {isHovered && <span className="ml-3 font-medium whitespace-nowrap">{label}</span>}
        </button>
    );

    return (
        <aside
            className={`fixed inset-y-0 left-0 bg-white border-r border-gray-200 z-50 transition-all duration-300 ease-in-out ${isHovered ? 'w-64 shadow-xl' : 'w-20'}`}
            onMouseEnter={() => handleHover(true)}
            onMouseLeave={() => handleHover(false)}
        >
            <div className="h-full flex flex-col">
                { }
                <div className="h-20 flex items-center justify-center border-b border-gray-100 cursor-pointer" onClick={handleLogoClick}>
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                        M
                    </div>
                    {isHovered && (
                        <span className="ml-3 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-teal-500 whitespace-nowrap overflow-hidden">
                            MediTrack
                        </span>
                    )}
                </div>

                { }
                <div className="flex-1 py-8 px-3 space-y-2 overflow-y-auto">

                    {role === 'admin' && (
                        <>
                            <SidebarItem icon={LayoutDashboard} label="Overview" path="/admin/dashboard" />
                            <SidebarItem icon={FileText} label="Reports Audit" path="/admin/reports" />
                            <SidebarItem icon={Pill} label="Prescriptions" path="/admin/prescriptions" />
                        </>
                    )}

                    {role === 'doctor' && (
                        <>
                            <SidebarItem icon={Home} label="Home" path="/" />
                            <SidebarItem icon={LayoutDashboard} label="Overview" path="/doctor-dashboard" />
                            <SidebarItem icon={FileText} label="Reports" path="/doctor/reports" />
                            <SidebarItem icon={User} label="Prescriptions" path="/doctor/prescriptions" />
                            <SidebarItem icon={MessageSquare} label="Messages" path="/chat" />
                            <SidebarItem icon={User} label="Profile" path="/profile" />
                        </>
                    )}

                    {role === 'patient' && (
                        <>
                            <SidebarItem icon={Home} label="Home" path="/" />
                            <SidebarItem icon={Activity} label="Health Overview" path="/health-dashboard" />
                            <SidebarItem icon={Pill} label="Prescriptions" path="/prescriptions" />
                            <SidebarItem icon={FileText} label="Reports" path="/reports" />
                            <SidebarItem icon={MessageSquare} label="Messages" path="/chat" />
                            <SidebarItem icon={User} label="Profile" path="/profile" />
                        </>
                    )}

                    <div className="border-t border-gray-100 my-2 pt-2"></div>
                    <SidebarItem icon={LogOut} label="Sign Out" onClick={handleLogout} danger />
                </div>
            </div>
        </aside>
    );
};

export default DashboardSidebar;
