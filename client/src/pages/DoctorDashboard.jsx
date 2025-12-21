import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import axios from 'axios';
import { Users, Activity, LogOut, Search, User, AlertTriangle, ChevronLeft, ChevronRight, FileText, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import DashboardSidebar from '../components/DashboardSidebar';
import NotificationBell from '../components/NotificationBell';

const socket = io(import.meta.env.VITE_API_URL);

function DoctorDashboard() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const [patients, setPatients] = useState([]);
    const [filterText, setFilterText] = useState('');
    const [reportCount, setReportCount] = useState(0);

    useEffect(() => {
        if (!user || user.role !== 'doctor') {
            navigate('/login');
            return;
        }
        fetchPatients();
        fetchReportCount();


        socket.emit('user_connected', user._id || user.id);

        socket.on('healthUpdate', (data) => {
            const incomingPatientId =
                data?.patientId ||
                data?.patient?._id ||
                data?.patient;

            if (!incomingPatientId) return;

            setPatients(prevPatients => prevPatients.map(p => {
                if (p._id?.toString() === incomingPatientId?.toString()) {
                    const nextLastVitals = {
                        ...(p.lastVitals || {}),
                        status: data.status,
                        lastCheck: new Date(),
                    };

                    if (data.type === 'Heart Rate') {
                        nextLastVitals.heartRate = data.value;
                    }

                    if (data.type === 'Blood Pressure') {
                        const parts = (data.value || '').toString().split('/');
                        if (parts.length === 2) {
                            nextLastVitals.bpSystolic = parts[0];
                            nextLastVitals.bpDiastolic = parts[1];
                        }
                    }

                    if (data.type === 'SpO2') {
                        nextLastVitals.spo2 = data.value;
                    }

                    if (data.type === 'Temperature') {
                        nextLastVitals.temperature = data.value;
                    }

                    return {
                        ...p,
                        lastVitals: nextLastVitals
                    };
                }
                return p;
            }));
        });

        socket.on('user_status_update', (data) => {
            setPatients(prevPatients => prevPatients.map(p => {
                if (p._id === data.userId) {
                    return { ...p, isOnline: data.isOnline };
                }
                return p;
            }));
        });

        socket.on('newReport', (data) => {
            setReportCount(prev => prev + 1);
            toast.success(`New report shared: ${data.originalName}`);
        });

        return () => {
            socket.off('healthUpdate');
            socket.off('user_status_update');
            socket.off('newReport');
        };
    }, [user, navigate]);

    const fetchPatients = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/patients`, { withCredentials: true });
            setPatients(res.data);
        } catch (err) {
            console.error("Failed to fetch patients", err);
            toast.error("Failed to load patients");
        }
    };

    const fetchReportCount = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/reports/count`, { withCredentials: true });
            setReportCount(res.data.count);
        } catch (err) {
            console.error("Failed to fetch report count", err);
        }
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
    };

    const filteredPatients = (patients || []).filter(p => {
        const search = filterText.toLowerCase();
        return (
            (p.name && p.name.toLowerCase().includes(search)) ||
            (p.email && p.email.toLowerCase().includes(search)) ||
            (p.patientId && p.patientId.toLowerCase().includes(search)) ||
            (p.gender && p.gender.toLowerCase().includes(search))
        );
    });

    const HighlightText = ({ text = '', highlight = '' }) => {
        if (!highlight.trim() || !text) return <span>{text || ''}</span>;
        const regex = new RegExp(`(${highlight})`, 'gi');
        const parts = text.toString().split(regex);
        return (
            <span>
                {parts.map((part, i) =>
                    regex.test(part) ? <span key={i} className="bg-yellow-200 text-gray-900 font-semibold rounded-[2px] px-0.5">{part}</span> : <span key={i}>{part}</span>
                )}
            </span>
        );
    };

    return (
        <div className="min-h-screen flex font-sans">
            <DashboardSidebar role="doctor" />

            { }
            <div className="flex-1 p-8 w-full ml-20 transition-all duration-300">
                <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Patients</h1>
                        <p className="text-gray-500">Monitor patient health status and reports</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <NotificationBell />
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search patients..."
                                value={filterText}
                                onChange={(e) => setFilterText(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64"
                            />
                        </div>
                    </div>
                </header>

                { }
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                <Users size={24} />
                            </div>
                            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-lg">+12%</span>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium">Total Patients</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{patients.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                                <AlertTriangle size={24} />
                            </div>
                            <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-lg">Action Req</span>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium">Critical Alerts</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-1">
                            {patients.filter(p => p.lastVitals?.status === 'Critical').length}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                                <Activity size={24} />
                            </div>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium">Active Monitoring</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-1">
                            {patients.filter(p => p.isOnline).length}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                <FileText size={24} />
                            </div>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium">Report Requests</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{reportCount}</p>
                    </div>
                </div>

                { }
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800">Recent Patients</h2>
                        <button className="text-blue-600 text-sm font-semibold hover:bg-blue-50 px-3 py-1.5 rounded-lg transition">View All</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Check</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vitals</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredPatients.map((patient) => (
                                    <tr key={patient._id} className="hover:bg-gray-50/80 transition-colors group cursor-pointer" onClick={() => navigate(`/doctor/patient/${patient._id}`)}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0">
                                                    {patient.photoUrl ? (
                                                        <img className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm" src={patient.photoUrl} alt="" />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm">
                                                            {patient.name?.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-gray-900">
                                                        <HighlightText text={patient.name} highlight={filterText} />
                                                    </div>
                                                    <div className="text-xs text-gray-500">{patient.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-md bg-gray-100 text-gray-800 border border-gray-200">
                                                <HighlightText text={patient.patientId} highlight={filterText} />
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {patient.lastVitals?.status === 'Critical' ? (
                                                <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 animate-pulse">
                                                    Critical
                                                </span>
                                            ) : patient.isOnline ? (
                                                <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-600">
                                                    Offline
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {patient.lastVitals?.lastCheck ? new Date(patient.lastVitals.lastCheck).toLocaleTimeString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1 text-xs">
                                                <span className="text-gray-700 font-medium">HR: {patient.lastVitals?.heartRate || '--'} bpm</span>
                                                <span className="text-gray-500">BP: {patient.lastVitals?.bpSystolic || '--'}/{patient.lastVitals?.bpDiastolic || '--'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); navigate(`/doctor/patient/${patient._id}`); }}
                                                className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all hover:shadow-md"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredPatients.length === 0 && (
                        <div className="p-12 text-center">
                            <div className="inline-flex p-4 rounded-full bg-gray-50 mb-4">
                                <Search size={32} className="text-gray-300" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No patients found</h3>
                            <p className="text-gray-500 mt-1">Try adjusting your search criteria</p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}

export default DoctorDashboard;
