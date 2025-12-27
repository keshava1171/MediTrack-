import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, reset } from '../features/auth/authSlice';
import io from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, Heart, Wind, AlertTriangle, FileText, MessageSquare, Shield } from 'lucide-react';
const socket = io('http://localhost:5000');
function Dashboard() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [healthData, setHealthData] = useState(null);
    const [history, setHistory] = useState([]);
    const [alerts, setAlerts] = useState([]);
    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
        socket.on('healthUpdate', (data) => {
            if (data.patient === user._id || data.patient === user.id) {
                setHealthData(data);
                setHistory(prev => {
                    const newHistory = [...prev, { ...data, time: new Date().toLocaleTimeString('en-US', { hour12: false }) }];
                    return newHistory.slice(-20);
                });
            }
        });
        socket.on('healthAlert', (alert) => {
            setAlerts((prev) => [alert, ...prev].slice(0, 5));
        });
        return () => {
            socket.off('healthUpdate');
            socket.off('healthAlert');
        };
    }, [user, navigate]);
    const onLogout = () => {
        dispatch(logout());
        dispatch(reset());
        navigate('/');
    };
    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{user?.role === 'admin' ? 'System Overview' : 'Health Dashboard'}</h1>
                    <p className="text-gray-500">Welcome back, {user && user.name.split(' ')[0]} </p>
                </div>
                <div className="flex gap-3">
                    <Link to="/profile" className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm font-medium">
                        View Profile
                    </Link>
                    <button onClick={onLogout} className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition shadow-sm font-medium">
                        Logout
                    </button>
                </div>
            </div>
            {user?.role === 'admin' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link to="/admin/reports?tab=Reports" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group">
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition">
                            <FileText size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Medical Reports</h3>
                        <p className="text-gray-500 text-sm">Access and manage all uploaded medical documents.</p>
                    </Link>
                    <Link to="/chat" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition">
                            <MessageSquare size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Messages</h3>
                        <p className="text-gray-500 text-sm">Chat with doctors and healthcare providers.</p>
                    </Link>
                    <Link to="/profile" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group">
                        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-600 group-hover:text-white transition">
                            <span className="font-bold text-lg"><Heart size={24} /></span> 
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">My Profile</h3>
                        <p className="text-gray-500 text-sm">Update your personal details, address, and photo.</p>
                    </Link>
                    <Link to="/admin/dashboard" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group lg:col-span-3"> 
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-600 group-hover:text-white transition">
                                    <Shield size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Admin Control</h3>
                                <p className="text-gray-500 text-sm">Manage users, generate reports, and system settings.</p>
                            </div>
                            <Shield className="text-gray-200 group-hover:text-red-100 transition" size={64} />
                        </div>
                    </Link>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <button onClick={() => navigate('/chat')} className="flex items-center justify-center p-4 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition transform hover:-translate-y-1">
                            <MessageSquare className="mr-2" /> Live Chat
                        </button>
                        <button onClick={() => navigate('/reports')} className="flex items-center justify-center p-4 bg-teal-600 text-white rounded-xl shadow-lg hover:bg-teal-700 transition transform hover:-translate-y-1">
                            <FileText className="mr-2" /> Reports
                        </button>
                        <div className="bg-purple-600 text-white rounded-xl shadow-lg p-4 flex items-center justify-center opacity-90 cursor-default">
                            <span className="font-semibold">Patient ID: #{user?.id?.slice(-6) || '---'}</span>
                        </div>
                        <div className="bg-indigo-600 text-white rounded-xl shadow-lg p-4 flex items-center justify-center opacity-90 cursor-default">
                            <span className="font-semibold">{user?.bloodGroup || 'Blood Group: N/A'}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-lg font-bold flex items-center text-gray-800"><Heart className="w-5 h-5 mr-2 text-rose-500" /> Heart Rate History</h2>
                                    <span className={`text-2xl font-bold ${healthData?.heartRate > 100 ? 'text-rose-500' : 'text-gray-900'}`}>
                                        {healthData?.heartRate || '--'} <span className="text-sm text-gray-400 font-normal">bpm</span>
                                    </span>
                                </div>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={history}>
                                            <defs>
                                                <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis dataKey="time" hide />
                                            <YAxis domain={['auto', 'auto']} />
                                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                            <Area type="monotone" dataKey="heartRate" stroke="#f43f5e" fillOpacity={1} fill="url(#colorHr)" strokeWidth={3} isAnimationActive={false} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-lg font-bold flex items-center text-gray-800"><Wind className="w-5 h-5 mr-2 text-sky-500" /> SpO2 Levels</h2>
                                        <span className={`text-2xl font-bold ${healthData?.spo2 < 95 ? 'text-amber-500' : 'text-gray-900'}`}>
                                            {healthData?.spo2 || '--'} <span className="text-sm text-gray-400 font-normal">%</span>
                                        </span>
                                    </div>
                                    <div className="h-40 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={history}>
                                                <XAxis dataKey="time" hide />
                                                <YAxis domain={[80, 100]} hide />
                                                <Tooltip />
                                                <Line type="monotone" dataKey="spo2" stroke="#0ea5e9" strokeWidth={3} dot={false} isAnimationActive={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                                    <div>
                                        <h2 className="text-lg font-bold flex items-center text-gray-800 mb-1"><Activity className="w-5 h-5 mr-2 text-indigo-500" /> Blood Pressure</h2>
                                        <p className="text-sm text-gray-500">Systolic / Diastolic</p>
                                    </div>
                                    <div className="mt-4">
                                        <span className="text-4xl font-extrabold text-gray-900 tracking-tight">
                                            {healthData?.bpSystolic || '--'}/{healthData?.bpDiastolic || '--'}
                                        </span>
                                        <span className="ml-2 text-gray-400 font-medium">mmHg</span>
                                    </div>
                                    <div className="mt-4">
                                        {(healthData?.bpSystolic > 140 || healthData?.bpDiastolic > 90) ? (
                                            <div className="text-red-500 text-sm font-bold flex items-center bg-red-50 p-2 rounded">
                                                <AlertTriangle className="w-4 h-4 mr-2" /> High BP Detected
                                            </div>
                                        ) : (
                                            <div className="text-green-600 text-sm font-bold flex items-center bg-green-50 p-2 rounded">
                                                <Activity className="w-4 h-4 mr-2" /> Normal Range
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-8">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
                                <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
                                    <span className="relative flex h-3 w-3 mr-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                    </span>
                                    Live Alerts
                                </h2>
                                {alerts.length > 0 ? (
                                    <ul className="space-y-4">
                                        {alerts.map((alert, index) => (
                                            <li key={index} className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-start transform transition hover:scale-102">
                                                <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="font-bold text-red-800 text-sm">{alert.message}</p>
                                                    <p className="text-xs text-red-600 mt-1 uppercase font-semibold tracking-wider">{alert.type}: {alert.value}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-center py-10 text-gray-400">
                                        <div className="bg-gray-50 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                                            <Shield className="w-6 h-6 text-gray-300" />
                                        </div>
                                        <p>No Active Alerts</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
export default Dashboard;
