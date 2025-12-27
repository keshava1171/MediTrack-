import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, reset } from '../features/auth/authSlice';
import authService from '../features/auth/authService';
import {
    LayoutDashboard, Users, FileText, Settings,
    Bell, Search, Activity, Pill
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
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
const AdminDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const searchParams = new URLSearchParams(location.search);
    const activeTab = searchParams.get('tab') || 'Overview';
    const setActiveTab = (tab) => navigate(`/admin/dashboard?tab=${tab}`);
    const [allUsers, setAllUsers] = useState([]);
    const [stats, setStats] = useState({
        patients: 0,
        doctors: 0,
        admins: 0,
        prescriptions: 0
    });
    const [systemSettings, setSystemSettings] = useState({ maintenanceMode: false, allowRegistrations: true });
    const [activities, setActivities] = useState([]);
    const [healthStatus, setHealthStatus] = useState({
        server: 'Online',
        database: 'Connected',
        lastBackup: 'Today, 04:00 AM',
        sync: 'Active'
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [doctorSpecTab, setDoctorSpecTab] = useState('All');
    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/admin/login');
        } else {
            fetchUsers();
            fetchSettings();
            fetchActivities();
            const socket = io(import.meta.env.VITE_API_URL);
            socket.on('connect', () => {
                console.log('Admin Dashboard connected to socket');
            });
            socket.on('new_activity', (newLog) => {
                setActivities(prev => [newLog, ...prev].slice(0, 10));
            });
            socket.on('system_health', (data) => {
                setHealthStatus(prev => ({
                    ...prev,
                    server: data.server,
                    database: data.database,
                }));
            });
            socket.on('new_user_registered', () => {
                console.log('🆕 New user registered - refreshing user list');
                fetchUsers();
            });
            socket.on('user_deleted', (data) => {
                console.log('🗑️  User deleted - refreshing user list:', data);
                fetchUsers();
            });
            socket.on('user_status_update', ({ userId, isOnline }) => {
                setAllUsers(prev => prev.map(u =>
                    u._id === userId ? { ...u, isOnline } : u
                ));
            });
            return () => {
                socket.disconnect();
            };
        }
    }, [user, navigate]);
    const fetchActivities = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/activities`, { credentials: 'include' });
            const data = await res.json();
            setActivities(data);
        } catch (err) { console.error('Failed to load activities'); }
    };
    const fetchSettings = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/settings`, { credentials: 'include' });
            const data = await res.json();
            setSystemSettings(data);
        } catch (err) { console.error('Failed to load settings'); }
    };
    const fetchUsers = async () => {
        try {
            const data = await authService.getAllUsers();
            setAllUsers(data);
            const patients = data.filter(u => u.role === 'patient').length;
            const doctors = data.filter(u => u.role === 'doctor').length;
            const admins = data.filter(u => u.role === 'admin').length;
            try {
                const pRes = await fetch(`${import.meta.env.VITE_API_URL}/api/prescriptions`, { credentials: 'include' });
                if (pRes.ok) {
                    const pData = await pRes.json();
                    setStats({ patients, doctors, admins, prescriptions: pData.length });
                } else {
                    setStats({ patients, doctors, admins, prescriptions: 0 });
                }
            } catch (e) {
                setStats({ patients, doctors, admins, prescriptions: 0 });
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    };
    const handleLogout = () => {
        dispatch(logout());
        navigate('/admin/login');
    };
    const loadingTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " mins ago";
        return Math.floor(seconds) + " seconds ago";
    };
    const HighlightText = ({ text = '', highlight = '' }) => {
        if (!highlight.trim()) {
            return <span>{text}</span>;
        }
        const regex = new RegExp(`(${highlight})`, 'gi');
        const parts = text.split(regex);
        return (
            <span>
                {parts.map((part, i) =>
                    regex.test(part) ? (
                        <span key={i} className="bg-yellow-200 font-semibold">{part}</span>
                    ) : (
                        <span key={i}>{part}</span>
                    )
                )}
            </span>
        );
    };
    const UserTable = ({ role, specialization }) => {
        const [currentPage, setCurrentPage] = useState(1);
        const usersPerPage = 10;
        const filteredUsers = allUsers.filter(u => {
            const matchesRole = u.role === role;
            const matchesSpec = !specialization || specialization === 'All' || u.specialization === specialization;
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
                u.name.toLowerCase().includes(searchLower) ||
                u.email.toLowerCase().includes(searchLower) ||
                (u.patientId && u.patientId.toLowerCase().includes(searchLower)) ||
                (u.doctorId && u.doctorId.toLowerCase().includes(searchLower));
            return matchesRole && matchesSearch && matchesSpec;
        });
        const indexOfLastUser = currentPage * usersPerPage;
        const indexOfFirstUser = indexOfLastUser - usersPerPage;
        const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
        const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
        const paginate = (pageNumber) => setCurrentPage(pageNumber);
        return (
            <div className="flex flex-col">
                <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    {role === 'patient' ? 'Patient ID' : role === 'doctor' ? 'Doctor ID' : 'ID'}
                                </th>
                                {role === 'doctor' && (
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Specialization</th>
                                )}
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentUsers.length > 0 ? currentUsers.map((u) => (
                                <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold uppercase">
                                                {u.name.charAt(0)}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    <HighlightText text={u.name} highlight={searchTerm} />
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    <HighlightText text={u.email} highlight={searchTerm} />
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                                        {role === 'patient' && u.patientId ? (
                                            <HighlightText text={u.patientId} highlight={searchTerm} />
                                        ) : role === 'doctor' && u.doctorId ? (
                                            <HighlightText text={u.doctorId} highlight={searchTerm} />
                                        ) : (
                                            <span className="text-gray-400 italic">--</span>
                                        )}
                                    </td>
                                    {role === 'doctor' && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {u.specialization || <span className="text-gray-400 italic">N/A</span>}
                                        </td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap capitalize">
                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(u.createdAt || Date.now()).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {u.isOnline ? (
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                <span className="w-2 h-2 rounded-full mr-1.5 self-center bg-green-500 animate-pulse"></span>
                                                Active
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-500">
                                                <span className="w-2 h-2 rounded-full mr-1.5 self-center bg-gray-400"></span>
                                                Inactive
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => setEditingUser(u)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(u._id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500 italic">
                                        No users found {searchTerm && `matching "${searchTerm}"`}.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {filteredUsers.length > usersPerPage && (
                    <div className="flex justify-between items-center mt-4 px-2">
                        <span className="text-sm text-gray-500">
                            Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} entries
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`px-3 py-1 rounded-md text-sm border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                            >
                                Previous
                            </button>
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => paginate(i + 1)}
                                    className={`px-3 py-1 rounded-md text-sm border ${currentPage === i + 1 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={`px-3 py-1 rounded-md text-sm border ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };
    const SettingsView = ({ settings, refreshSettings }) => {
        const toggleSetting = async (key, currentValue) => {
            const newValue = !currentValue;
            try {
                if (key === 'maintenanceMode' && newValue === true) {
                    setSettings(prev => ({ ...prev, maintenanceMode: true, allowRegistrations: false }));
                } else {
                    setSettings(prev => ({ ...prev, [key]: newValue }));
                }
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/settings`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ [key]: newValue }),
                });
            } catch (err) {
                console.error('Update failed');
                fetchSettings();
            }
        };
        const handleToggle = async (key) => {
            const newValue = !settings[key];
            const payload = { [key]: newValue };
            try {
                setSystemSettings(prev => {
                    if (key === 'maintenanceMode' && newValue === true) {
                        return { ...prev, maintenanceMode: true, allowRegistrations: false };
                    }
                    return { ...prev, [key]: newValue };
                });
                await fetch(`${import.meta.env.VITE_API_URL}/api/settings`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(payload)
                });
                toast.success('System configuration updated');
                refreshSettings();
            } catch (e) {
                toast.error('Failed to update');
                refreshSettings();
            }
        };
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center">
                            <Settings className="mr-2" size={20} /> System Configuration
                        </h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">System Maintenance Mode</p>
                                <p className="text-sm text-gray-500">Prevent new logins during maintenance</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.maintenanceMode}
                                    onChange={() => handleToggle('maintenanceMode')}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between opacity-100 transition-opacity">
                            <div>
                                <p className="font-medium text-gray-900">Allow New Registrations</p>
                                <p className="text-sm text-gray-500">Toggle new user sign-ups (Disabled if Maintenance is ON)</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.allowRegistrations}
                                    onChange={() => handleToggle('allowRegistrations')}
                                    disabled={settings.maintenanceMode}
                                    className="sr-only peer"
                                />
                                <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${settings.allowRegistrations ? 'peer-checked:bg-blue-600' : ''} ${settings.maintenanceMode ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({
        name: '', email: '', role: '',
        specialization: '', patientId: '', doctorId: '',
        age: '', gender: '', contact: ''
    });
    useEffect(() => {
        if (editingUser) {
            setEditForm({
                name: editingUser.name || '',
                email: editingUser.email || '',
                role: editingUser.role || '',
                specialization: editingUser.specialization || '',
                patientId: editingUser.patientId || '',
                doctorId: editingUser.doctorId || '',
                age: editingUser.age || '',
                gender: editingUser.gender || '',
                contact: editingUser.contact || ''
            });
        }
    }, [editingUser]);
    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (res.ok) {
                toast.success('User deleted successfully');
                fetchUsers();
            } else {
                toast.error('Failed to delete user');
            }
        } catch (error) {
            toast.error('Error deleting user');
        }
    };
    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${editingUser._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(editForm)
            });
            if (res.ok) {
                toast.success('User updated successfully');
                setEditingUser(null);
                fetchUsers();
            } else {
                toast.error('Failed to update user');
            }
        } catch (error) {
            toast.error('Error updating user');
        }
    };
    return (
        <div className="flex bg-gray-100 min-h-screen">
            <div className="flex-1 flex flex-col overflow-hidden relative">
                <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10">
                    <div className="flex items-center">
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 rounded-full bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                            />
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                                <p className="text-xs text-blue-600 font-mono">{user?.adminId || 'Admin'}</p>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                {user?.name?.charAt(0) || 'A'}
                            </div>
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-800">{activeTab}</h1>
                    </div>
                    {systemSettings.maintenanceMode && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-md mb-8 flex items-center justify-between"
                        >
                            <div className="flex items-center space-x-3">
                                <Activity className="animate-pulse" size={24} />
                                <div>
                                    <h3 className="font-bold text-lg">Server Maintenance Mode ON</h3>
                                    <p className="text-sm text-red-100">No new logins allowed. System is currently offline for users.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveTab('Settings')}
                                className="bg-white text-red-600 px-4 py-2 rounded font-bold text-sm hover:bg-gray-100 transition"
                            >
                                Change Settings
                            </button>
                        </motion.div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[
                            { label: 'Total Patients', value: stats.patients, change: 'Real-time', color: 'blue' },
                            { label: 'Total Doctors', value: stats.doctors, change: 'Real-time', color: 'purple' },
                            { label: 'Total Users', value: allUsers.length, change: 'Registered', color: 'green' },
                            { label: 'Prescriptions', value: stats.prescriptions, change: 'Total Issued', color: 'pink', link: '/admin/prescriptions' },
                        ].map((stat, i) => (
                            <motion.div
                                key={i} whileHover={{ y: -5 }}
                                onClick={() => stat.link && navigate(stat.link)}
                                className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 ${stat.link ? 'cursor-pointer hover:shadow-md' : ''}`}
                            >
                                <h3 className="text-gray-500 text-sm font-medium uppercase">{stat.label}</h3>
                                <div className="mt-2 flex items-baseline">
                                    <span className="text-3xl font-extrabold text-gray-900">{stat.value}</span>
                                    <span className={`ml-2 text-xs font-semibold text-${stat.color}-600 bg-${stat.color}-50 px-2 py-0.5 rounded`}>{stat.change}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
                        {activeTab === 'Patients' && <UserTable role="patient" />}
                        {activeTab === 'Doctors' && (
                            <div className="space-y-0">
                                <div className="flex gap-2 overflow-x-auto pb-0 border-b border-gray-200 px-6 pt-4 bg-gray-50/50">
                                    {['All', 'General Physician', 'Cardiologist', 'Neurologist', 'Pediatrician', 'Orthopedic', 'Gynecologist', 'Dermatologist', 'Pulmonologist'].map(spec => (
                                        <button
                                            key={spec}
                                            onClick={() => setDoctorSpecTab(spec)}
                                            className={`px-4 py-2 rounded-t-lg font-medium text-sm transition whitespace-nowrap ${doctorSpecTab === spec ? 'bg-white text-blue-600 border-t border-l border-r border-gray-200 shadow-sm translate-y-[1px] z-10' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                                        >
                                            {spec}
                                        </button>
                                    ))}
                                </div>
                                <div className="border-t border-gray-200">
                                    <UserTable role="doctor" specialization={doctorSpecTab} />
                                </div>
                            </div>
                        )}
                        {activeTab === 'Overview' && (
                            <div className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                                        <h3 className="font-bold text-lg text-blue-900 mb-4 flex items-center gap-2">
                                            <Activity size={20} /> System Health
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                                                <span className="text-gray-600 text-sm">Server Status</span>
                                                {systemSettings.maintenanceMode ? (
                                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full flex items-center gap-1">
                                                        <div className="w-2 h-2 rounded-full bg-red-500"></div> Offline
                                                    </span>
                                                ) : (
                                                    <span className={`px-2 py-0.5 bg-${healthStatus.server === 'Online' ? 'green' : 'red'}-100 text-${healthStatus.server === 'Online' ? 'green' : 'red'}-700 text-xs font-bold rounded-full flex items-center gap-1`}>
                                                        <div className={`w-2 h-2 rounded-full bg-${healthStatus.server === 'Online' ? 'green' : 'red'}-500 ${healthStatus.server === 'Online' ? 'animate-pulse' : ''}`}></div> {healthStatus.server}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                                                <span className="text-gray-600 text-sm">Database Connection</span>
                                                <span className={`px-2 py-0.5 bg-${healthStatus.database === 'Connected' ? 'green' : 'red'}-100 text-${healthStatus.database === 'Connected' ? 'green' : 'red'}-700 text-xs font-bold rounded-full`}>{healthStatus.database}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                                                <span className="text-gray-600 text-sm">Last Backup</span>
                                                <span className="text-gray-800 text-sm font-mono">{healthStatus.lastBackup}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                                                <span className="text-gray-600 text-sm">Sync Status</span>
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">{healthStatus.sync}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                        <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                                            <FileText size={20} /> Recent Activities
                                        </h3>
                                        <div className="space-y-3">
                                            {activities.length > 0 ? activities.map((activity, idx) => (
                                                <div key={idx} className="flex items-center gap-3 text-sm animate-fade-in-up">
                                                    <div className={`w-2 h-2 rounded-full bg-${activity.color}-500 flex-shrink-0`}></div>
                                                    <div>
                                                        <span className="font-medium text-gray-700 block">{activity.action}</span>
                                                        <span className="text-gray-500 text-xs">{activity.details}</span>
                                                    </div>
                                                    <span className="ml-auto text-gray-400 text-xs whitespace-nowrap">
                                                        {loadingTimeAgo(activity.timestamp)}
                                                    </span>
                                                </div>
                                            )) : (
                                                <p className="text-gray-400 text-sm italic">No recent activities.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'Settings' && (
                            <SettingsView
                                settings={systemSettings}
                                refreshSettings={fetchSettings}
                            />
                        )}
                    </div>
                </main>
            </div>
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
                    >
                        <h2 className="text-xl font-bold mb-4">Edit User</h2>
                        <form onSubmit={handleUpdateUser} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg p-2 mt-1"
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        type="email"
                                        className="w-full border rounded-lg p-2 mt-1"
                                        value={editForm.email}
                                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Role</label>
                                    <select
                                        className="w-full border rounded-lg p-2 mt-1"
                                        value={editForm.role}
                                        onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                    >
                                        <option value="patient">Patient</option>
                                        <option value="doctor">Doctor</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                            {editForm.role === 'doctor' && (
                                <div className="p-3 bg-blue-50 rounded-lg space-y-3">
                                    <h4 className="font-semibold text-blue-800 text-sm">Doctor Details</h4>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Doctor ID</label>
                                        <input
                                            type="text"
                                            className="w-full border rounded-lg p-2 mt-1 bg-white"
                                            value={editForm.doctorId || ''}
                                            onChange={e => setEditForm({ ...editForm, doctorId: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Specialization</label>
                                        <select
                                            className="w-full border rounded-lg p-2 mt-1 bg-white"
                                            value={editForm.specialization || ''}
                                            onChange={e => setEditForm({ ...editForm, specialization: e.target.value })}
                                        >
                                            <option value="">Select Specialization</option>
                                            {['General Physician', 'General Surgeon', 'Cardiologist', 'Neurologist', 'Orthopedic', 'Pediatrician', 'Gynecologist', 'Dermatologist', 'Pulmonologist'].map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                            {editForm.role === 'patient' && (
                                <div className="p-3 bg-green-50 rounded-lg space-y-3">
                                    <h4 className="font-semibold text-green-800 text-sm">Patient Details</h4>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Patient ID</label>
                                        <input
                                            type="text"
                                            className="w-full border rounded-lg p-2 mt-1 bg-white"
                                            value={editForm.patientId || ''}
                                            onChange={e => setEditForm({ ...editForm, patientId: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Age</label>
                                            <input
                                                type="number"
                                                className="w-full border rounded-lg p-2 mt-1 bg-white"
                                                value={editForm.age || ''}
                                                onChange={e => setEditForm({ ...editForm, age: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Gender</label>
                                            <select
                                                className="w-full border rounded-lg p-2 mt-1 bg-white"
                                                value={editForm.gender || ''}
                                                onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                                            >
                                                <option value="">Select</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Contact</label>
                                        <input
                                            type="text"
                                            className="w-full border rounded-lg p-2 mt-1 bg-white"
                                            value={editForm.contact || ''}
                                            onChange={e => setEditForm({ ...editForm, contact: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form >
                    </motion.div >
                </div >
            )
            }
        </div >
    );
};
export default AdminDashboard;
