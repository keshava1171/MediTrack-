import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Activity, Heart, Thermometer, Droplet, FileText, MessageCircle, AlertTriangle, Wifi, ChevronLeft, ChevronRight, User, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardSidebar from '../components/DashboardSidebar';
import NotificationBell from '../components/NotificationBell';
function HealthDashboard() {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const [readings, setReadings] = useState([]);
    const [latest, setLatest] = useState();
    const [loading, setLoading] = useState(true);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [chartMetric, setChartMetric] = useState('Heart Rate');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role === 'admin') {
            navigate('/admin/dashboard');
            return;
        }
        if (user.role === 'doctor') {
            navigate('/doctor-dashboard');
            return;
        }
        fetchHealthData();
    }, [user, navigate]);
    const fetchHealthData = async () => {
        try {
            const [historyRes, latestRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/health`, { withCredentials: true }),
                axios.get(`${import.meta.env.VITE_API_URL}/api/health/latest`, { withCredentials: true })
            ]);
            setReadings(historyRes.data);
            let latestObj = ;
            if (latestRes.data.length === 0 && historyRes.data.length > 0) {
                historyRes.data.forEach(item => {
                    if (!latestObj[item.type] || new Date(item.timestamp) > new Date(latestObj[item.type].timestamp)) {
                        latestObj[item.type] = item;
                    }
                });
            } else {
                latestRes.data.forEach(item => {
                    latestObj[item.type] = item;
                });
            }
            setLatest(latestObj);
            setLoading(false);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load health data');
            setLoading(false);
        }
    };
    const getIcon = (type) => {
        switch (type) {
            case 'Heart Rate': return <Heart className="text-red-500" />;
            case 'Temperature': return <Thermometer className="text-orange-500" />;
            case 'SpO2': return <Activity className="text-blue-500" />;
            case 'Glucose': return <Droplet className="text-purple-500" />;
            default: return <Activity className="text-gray-500" />;
        }
    };
    const getStatusColor = (status) => {
        if (status === 'Critical') return 'bg-red-100 text-red-700 border-red-200';
        if (status === 'Abnormal') return 'bg-orange-100 text-orange-700 border-orange-200';
        return 'bg-green-100 text-green-700 border-green-200';
    };
    const addSimulatedReading = async (type) => {
        let value, unit;
        if (type === 'Heart Rate') { value = Math.floor(Math.random() * (110 - 60) + 60).toString(); unit = 'bpm'; }
        else if (type === 'Temperature') { value = (Math.random() * (38 - 36) + 36).toFixed(1); unit = '°C'; }
        else if (type === 'SpO2') { value = Math.floor(Math.random() * (100 - 92) + 92).toString(); unit = '%'; }
        else if (type === 'Glucose') { value = Math.floor(Math.random() * (160 - 70) + 70).toString(); unit = 'mg/dL'; }
        else if (type === 'Blood Pressure') {
            const sys = Math.floor(Math.random() * (150 - 100) + 100);
            const dia = Math.floor(Math.random() * (95 - 60) + 60);
            value = `${sys}/${dia}`;
            unit = 'mmHg';
        }
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/health`, {
                type, value, unit, notes: 'Manual Entry'
            }, { withCredentials: true });
            toast.success(`${type} Reading added`);
            fetchHealthData();
        } catch (err) {
            toast.error('Failed to add reading');
        }
    };
    const chartData = readings
        .filter(r => r.type === chartMetric)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .map(r => ({
            time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            value: parseFloat(r.value),
            status: r.status
        }));
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentReadings = readings.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(readings.length / itemsPerPage);
    const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
    const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            <DashboardSidebar role="patient" onHoverChange={setIsSidebarExpanded} />
            <div className={`flex-1 pb-12 p-4 sm:p-8 transition-all duration-300 ${isSidebarExpanded ? 'ml-64' : 'ml-20'}`}>
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">My Health</h1>
                            <p className="text-gray-500 mt-1 flex items-center gap-2">
                                Monitor your vitals and manage your health records
                                {user?.patientId && (
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-mono font-medium">
                                        ID: {user.patientId}
                                    </span>
                                )}
                                {user?.assignedDoctors && user.assignedDoctors.length > 0 && (
                                    <span className="flex gap-2">
                                        {user.assignedDoctors.map(doctor => (
                                            <span key={doctor._id} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                                <User size={12} /> Dr. {doctor.name} ({doctor.specialization || 'General'})
                                            </span>
                                        ))}
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="flex gap-3 items-center">
                            <NotificationBell />
                            <button onClick={() => navigate('/find-doctor')} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 font-medium transition">
                                <User size={18} /> Find Doctor
                            </button>
                            <button onClick={() => navigate('/reports')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-gray-700 font-medium transition">
                                <FileText size={18} /> Reports
                            </button>
                            <button onClick={() => navigate('/chat')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 font-medium transition">
                                <MessageCircle size={18} /> Chat with Doctor
                            </button>
                        </div>
                    </div>
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                            <Wifi className="text-green-600" size={24} />
                            <p className="text-green-800 font-medium">Remote Monitoring Active</p>
                            <div className="hidden sm:block">
                                <span className="px-3 py-1 bg-white text-green-700 text-xs font-bold rounded-full border border-green-200">Signal: Strong</span>
                            </div>
                        </div>
                    </div>
                    {readings.length > 0 && ['Critical', 'Abnormal'].includes(readings[0].status) && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm flex items-start justify-between">
                            <div className="flex gap-4">
                                <div className="p-2 bg-red-100 rounded-full h-fit">
                                    <AlertTriangle className="text-red-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-red-800 text-lg">Health Alert</h3>
                                    <p className="text-red-700 mt-1">
                                        Some of your recent vitals are outside the normal range. Please consult your doctor.
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {readings.slice(0, 3).filter(r => r.status !== 'Normal').map((r, i) => (
                                            <span key={i} className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded border border-red-200">
                                                {r.type}: {r.value} {r.unit}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {['Heart Rate', 'Blood Pressure', 'Temperature', 'SpO2', 'Glucose'].map((type) => {
                            const reading = latest[type];
                            let safeRange = '';
                            if (type === 'Heart Rate') safeRange = '60-100 bpm';
                            else if (type === 'Blood Pressure') safeRange = '90/60 - 120/80';
                            else if (type === 'Temperature') safeRange = '36.5 - 37.5 °C';
                            else if (type === 'SpO2') safeRange = '95 - 100 %';
                            else if (type === 'Glucose') safeRange = '70 - 140 mg/dL';
                            return (
                                <div key={type} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition duration-300">
                                            {getIcon(type)}
                                        </div>
                                        {reading && (
                                            <span className={`px-2 py-1 text-xs rounded-full font-bold ${getStatusColor(reading.status)}`}>
                                                {reading.status}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">{type}</h3>
                                    <div className="flex items-baseline mt-1">
                                        <span className="text-3xl font-bold text-gray-800">
                                            {reading ? reading.value : '--'}
                                        </span>
                                        <span className="ml-1 text-sm text-gray-500 font-medium">
                                            {reading ? reading.unit : ''}
                                        </span>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                                        <p className="text-xs text-gray-400">
                                            {reading ? new Date(reading.timestamp).toLocaleTimeString() : 'No data yet'}
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            Safe: {safeRange}
                                        </p>
                                        <button
                                            onClick={() => addSimulatedReading(type)}
                                            className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                                        >
                                            + Add Reading
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                            <h2 className="text-lg font-bold text-gray-800">Health Trends (Pictorial View)</h2>
                            <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto w-full sm:w-auto">
                                {['Heart Rate', 'Blood Pressure', 'Temperature', 'SpO2', 'Glucose'].map(metric => (
                                    <button
                                        key={metric}
                                        onClick={() => setChartMetric(metric)}
                                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition whitespace-nowrap ${chartMetric === metric
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {metric}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div style={{ width: '100%', height: '256px' }}>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={256}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis
                                            dataKey="time"
                                            stroke="#9CA3AF"
                                            fontSize={12}
                                            tickMargin={10}
                                            minTickGap={30}
                                            label={{ value: 'Time', position: 'insideBottomRight', offset: -5 }}
                                        />
                                        <YAxis
                                            stroke="#9CA3AF"
                                            fontSize={12}
                                            width={40}
                                            domain={['auto', 'auto']}
                                            label={{
                                                value: chartMetric === 'Heart Rate' ? 'bpm' : chartMetric === 'Temperature' ? '°C' : chartMetric === 'SpO2' ? '%' : 'mg/dL',
                                                angle: -90,
                                                position: 'insideLeft',
                                                style: { textAnchor: 'middle' }
                                            }}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            stroke={chartMetric === 'Heart Rate' ? '#EF4444' : chartMetric === 'Temperature' ? '#F97316' : '#3B82F6'}
                                            strokeWidth={3}
                                            dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                            activeDot={{ r: 6 }}
                                            animationDuration={1500}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400 flex-col">
                                    <Activity size={48} className="mb-2 opacity-20" />
                                    <p>No data available for chart</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-800">Complete History</h2>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{readings.length} Records</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentReadings.map((reading) => (
                                        <tr key={reading._id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 flex items-center gap-2">
                                                {getIcon(reading.type)} {reading.type}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                                                {reading.value} <span className="text-gray-500 text-xs">{reading.unit}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded-full font-medium border ${getStatusColor(reading.status)}`}>
                                                    {reading.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(reading.timestamp).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 italic">
                                                {reading.notes || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {readings.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center">
                                                    <Activity className="w-12 h-12 text-gray-300 mb-3" />
                                                    <p>No health records found yet.</p>
                                                    <p className="text-sm">Start adding manual readings above!</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {readings.length > itemsPerPage && (
                            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                                <p className="text-sm text-gray-500">
                                    Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to <span className="font-medium">{Math.min(indexOfLastItem, readings.length)}</span> of <span className="font-medium">{readings.length}</span> results
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={prevPage}
                                        disabled={currentPage === 1}
                                        className="p-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 transition"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <button
                                        onClick={nextPage}
                                        disabled={currentPage === totalPages}
                                        className="p-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 transition"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800">Alert History</h2>
                        </div>
                        <div className="p-6">
                            <MyAlerts key={readings.length} /> 
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
const MyAlerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    useEffect(() => {
        const fetchAlerts = async () => {
            setLoading(true);
            setError(null);
            try {
                console.log('Fetching all alerts...');
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/activities/alerts`,
                    {
                        withCredentials: true,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );
                console.log('Alerts response:', res.data);
                const sortedAlerts = Array.isArray(res.data)
                    ? res.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    : [];
                setAlerts(sortedAlerts);
            } catch (e) {
                console.error('Error fetching alerts:', e);
                console.error('Error details:', {
                    message: e.message,
                    response: e.response?.data,
                    status: e.response?.status
                });
                setError('Failed to load alerts. Please try again later.');
                setAlerts([]);
            } finally {
                setLoading(false);
            }
        };
        fetchAlerts();
    }, []);
    if (loading) {
        return <div className="text-center py-4">Loading alerts...</div>;
    }
    if (error) {
        return <div className="text-red-600 text-center py-4">{error}</div>;
    }
    if (alerts.length === 0) {
        return <p className="text-gray-500 italic text-center py-4">No alerts found. Your health is in good standing!</p>;
    }
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentAlerts = alerts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(alerts.length / itemsPerPage);
    const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
    const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
    return (
        <div>
            <ul className="divide-y divide-gray-100 mb-4">
                {currentAlerts.map(alert => (
                    <li key={alert._id} className="py-3 flex items-start gap-3 hover:bg-gray-50 transition p-2 rounded-lg">
                        <AlertTriangle size={18} className={alert.severity === 'Critical' ? 'text-red-500 mt-0.5' : 'text-yellow-500 mt-0.5'} />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{alert.message}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{new Date(alert.timestamp).toLocaleString()}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${alert.severity === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                            {alert.severity}
                        </span>
                    </li>
                ))}
            </ul>
            {alerts.length > itemsPerPage && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                        Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={prevPage}
                            disabled={currentPage === 1}
                            className="p-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 transition"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <button
                            onClick={nextPage}
                            disabled={currentPage === totalPages}
                            className="p-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 transition"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
export default HealthDashboard;
