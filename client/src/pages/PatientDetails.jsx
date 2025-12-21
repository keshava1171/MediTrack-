import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { ArrowLeft, Activity, AlertCircle, FileText, MessageSquare, Heart, Thermometer, Droplet, ChevronLeft, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL);

function PatientDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const [patientData, setPatientData] = useState(null);
    const [healthHistory, setHealthHistory] = useState([]);
    const [latestVitals, setLatestVitals] = useState({});

    const [chartMetric, setChartMetric] = useState('Heart Rate');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    useEffect(() => {
        if (!user || (user.role !== 'doctor' && user.role !== 'admin')) {
            navigate('/login');
            return;
        }
        fetchPatientData();
        fetchHealthHistory();

        socket.emit('user_connected', user._id || user.id);

        socket.on('healthUpdate', (data) => {
            const incomingPatientId =
                data?.patientId ||
                data?.patient?._id ||
                data?.patient;

            if (!incomingPatientId) return;
            if (incomingPatientId?.toString() !== id?.toString()) return;

            setHealthHistory(prev => [data, ...prev]);
            setLatestVitals(prev => ({ ...prev, [data.type]: data }));
            setCurrentPage(1);
        });

        return () => {
            socket.off('healthUpdate');
        };
    }, [id, user, navigate]);

    const fetchPatientData = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/${id}`, { withCredentials: true });
            setPatientData(res.data);
        } catch (err) {
            console.error("Failed to fetch patient details");
            setPatientData({ name: 'Patient View', email: 'loading...' });
        }
    };

    const fetchHealthHistory = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/health/patient/${id}`, { withCredentials: true });

            const sortedHistory = res.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setHealthHistory(sortedHistory);
            setCurrentPage(1);

            const latest = {};
            sortedHistory.forEach(item => {
                if (!latest[item.type]) latest[item.type] = item;
            });
            setLatestVitals(latest);
        } catch (err) {
            console.error("Failed to fetch health history");
        }
    };

    const chartData = healthHistory
        .filter(r => r.type === chartMetric)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .map(r => ({
            time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            value: parseFloat(r.value),
            status: r.status
        }));

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

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentReadings = healthHistory.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(healthHistory.length / itemsPerPage);

    const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
    const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

    if (!patientData) return <div className="p-8">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-blue-600 mb-6">
                <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <div className='flex items-center gap-3 mb-1'>
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">
                                {patientData.name?.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{patientData.name}</h1>
                                <p className="text-gray-500 text-sm">Patient ID: {patientData.patientId || id}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100" onClick={() => navigate('/chat')}>
                            <MessageSquare size={18} className="mr-2" /> Message
                        </button>
                        <button className="flex items-center px-4 py-2 bg-gray-50 text-gray-700 rounded-lg font-medium hover:bg-gray-100">
                            <FileText size={18} className="mr-2" /> Reports
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {['Heart Rate', 'Blood Pressure', 'Temperature', 'SpO2', 'Glucose'].map((type) => {
                    const reading = latestVitals[type];

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
                                <span className="text-xs text-transparent select-none">.</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            { }
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <h3 className="text-lg font-bold text-gray-900">Health Trends (Pictorial View)</h3>
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

                <div className="h-80 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis
                                dataKey="time"
                                stroke="#9CA3AF"
                                fontSize={12}
                                tickMargin={10}
                                minTickGap={30}
                            />
                            <YAxis
                                stroke="#9CA3AF"
                                fontSize={12}
                                width={40}
                                domain={['auto', 'auto']}
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
                                animationDuration={1000}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                    {chartData.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none mt-20">
                            <Activity className="mr-2 opacity-50" /> No data available for {chartMetric}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">Complete History</h2>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{healthHistory.length} Records</span>
                </div>
                <div className="overflow-x-auto max-h-96">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
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
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                        {reading.type}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                                        {reading.value} <span className="text-gray-500 text-xs">{reading.unit}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs rounded-full font-medium border ${reading.status === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' :
                                            reading.status === 'Abnormal' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                'bg-green-50 text-green-700 border-green-200'
                                            }`}>
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
                            {healthHistory.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                        No health records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {healthHistory.length > itemsPerPage && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                        <p className="text-sm text-gray-500">
                            Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to <span className="font-medium">{Math.min(indexOfLastItem, healthHistory.length)}</span> of <span className="font-medium">{healthHistory.length}</span> results
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

            { }
            <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800">Alert History</h2>
                </div>
                <div className="p-6">
                    <PatientAlerts patientId={id} />
                </div>
            </div>
        </div>
    );
}

const PatientAlerts = ({ patientId }) => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        const onAlert = (alert) => {
            const incomingPatientId =
                alert?.patientId ||
                alert?.patient?._id ||
                alert?.patient;

            if (!incomingPatientId) return;
            if (incomingPatientId?.toString() !== patientId?.toString()) return;

            setAlerts(prev => {
                const normalizedIncomingId = alert?._id?.toString();
                if (normalizedIncomingId && prev.some(a => a?._id?.toString() === normalizedIncomingId)) {
                    return prev;
                }
                return [alert, ...prev];
            });
        };

        socket.on('healthAlert', onAlert);
        return () => {
            socket.off('healthAlert', onAlert);
        };
    }, [patientId]);

    useEffect(() => {
        const fetchAlerts = async () => {
            if (!patientId) return;

            setLoading(true);
            setError(null);

            try {
                console.log(`Fetching alerts for patient: ${patientId}`);
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/activities/alerts/patient/${patientId}`,
                    {
                        withCredentials: true,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );
                console.log('Alerts response:', res.data);
                setAlerts(Array.isArray(res.data) ? res.data : []);
                setCurrentPage(1);
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
    }, [patientId]);

    if (loading) {
        return <div className="text-center py-4">Loading alerts...</div>;
    }

    if (error) {
        return <div className="text-red-600 text-center py-4">{error}</div>;
    }

    if (alerts.length === 0) {
        return <div className="text-gray-500 text-center py-4">No alerts recorded for this patient.</div>;
    }

    const totalPages = Math.ceil(alerts.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentAlerts = alerts.slice(indexOfFirstItem, indexOfLastItem);

    const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
    const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

    return (
        <div className="space-y-3">
            {currentAlerts.map((alert) => (
                <div key={alert._id} className={`flex items-start p-4 rounded-lg border ${alert.severity === 'Critical' ? 'bg-red-50 border-red-100' : 'bg-yellow-50 border-yellow-100'}`}>
                    <div className="mr-3 mt-0.5">
                        {alert.severity === 'Critical' ? <span className="text-2xl">🚨</span> : <span className="text-2xl">⚠️</span>}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <h4 className={`font-bold ${alert.severity === 'Critical' ? 'text-red-800' : 'text-yellow-800'}`}>
                                {alert.message}
                            </h4>
                            <span className="text-xs text-gray-500">
                                {new Date(alert.timestamp).toLocaleString()}
                            </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">
                            Severity: <span className="font-medium">{alert.severity}</span>
                        </p>
                    </div>
                </div>
            ))}

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

export default PatientDetails;
