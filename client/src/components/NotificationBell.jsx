import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { markAllAsRead } from '../features/alerts/alertSlice';

const NotificationBell = () => {
    const { alerts, unreadCount } = useSelector((state) => state.alerts);
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const handleToggle = () => {
        if (!isOpen && unreadCount > 0) {
            dispatch(markAllAsRead());
        }
        setIsOpen(!isOpen);
    };

    const handleItemClick = (alert) => {
        setIsOpen(false);
        if (user.role === 'doctor' && alert.patient && (alert.patient._id || alert.patient)) {
            const pid = alert.patient._id || alert.patient;
            navigate(`/doctor/patient/${pid}`);
        } else if (user.role === 'patient') {
            navigate('/health-dashboard');
        }
    };

    return (
        <div className="relative">
            <button
                onClick={handleToggle}
                className="p-2 rounded-full hover:bg-gray-100 relative transition text-gray-600 hover:text-blue-600"
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="font-semibold text-gray-800">Notifications</h3>
                        {alerts.length > 0 && (
                            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border shadow-sm">{alerts.length} Total</span>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {alerts.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {alerts.map((alert, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleItemClick(alert)}
                                        className={`p-4 hover:bg-blue-50 transition cursor-pointer flex gap-3 items-start ${!alert.isRead ? 'bg-blue-50/50' : ''}`}
                                    >
                                        <div className="mt-1">
                                            {alert.severity === 'Critical' ? <span className="text-xl">🚨</span> : <span className="text-xl">⚠️</span>}
                                        </div>
                                        <div>
                                            <p className={`text-sm ${alert.severity === 'Critical' ? 'font-bold text-red-600' : 'font-semibold text-gray-800'}`}>
                                                {alert.message}
                                            </p>
                                            <div className="mt-1 flex flex-col gap-1">
                                                {alert.patient && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                                                            {alert.patient.name || 'Unknown Patient'}
                                                        </span>
                                                        {alert.patient.patientId && (
                                                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1 py-0.5 rounded border border-gray-200">
                                                                ID: {alert.patient.patientId}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center w-full">
                                                    <span className="text-[10px] text-gray-400">
                                                        {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : 'Just now'}
                                                    </span>
                                                    <span className="text-[10px] text-blue-500 hover:underline">
                                                        View Details
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
