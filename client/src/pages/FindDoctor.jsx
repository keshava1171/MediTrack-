import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, UserPlus, ArrowLeft, Building, Stethoscope } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser } from '../features/auth/authSlice';
const FindDoctor = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [doctors, setDoctors] = useState([]);
    const [specialization, setSpecialization] = useState('');
    const [loading, setLoading] = useState(true);
    const specializations = [
        'General Physician', 'General Surgeon', 'Cardiologist', 'Neurologist',
        'Orthopedic', 'Pediatrician', 'Gynecologist', 'Dermatologist', 'Pulmonologist'
    ];
    const [assignedDoctors, setAssignedDoctors] = useState([]);
    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role !== 'patient') {
            const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/doctor-dashboard';
            navigate(redirectPath);
            return;
        }
        fetchDoctors();
        fetchAssignedDoctors();
    }, [specialization, user, navigate]);
    const fetchAssignedDoctors = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/my-doctors`, { withCredentials: true });
            setAssignedDoctors(res.data.map(d => d._id));
        } catch (err) {
            console.error('Failed to fetch assigned doctors', err);
        }
    };
    const fetchDoctors = async () => {
        try {
            setLoading(true);
            const query = specialization ? `?specialization=${specialization}` : '';
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/doctors${query}`, { withCredentials: true });
            setDoctors(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load doctors');
            setLoading(false);
        }
    };
    const toggleDoctorAssignment = async (doctorId, doctorName) => {
        const isAssigned = assignedDoctors.includes(doctorId);
        const endpoint = isAssigned ? '/unassign-doctor' : '/assign-doctor';
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/auth${endpoint}`,
                { doctorId },
                { withCredentials: true }
            );
            if (isAssigned) {
                toast.success(`Removed Dr. ${doctorName} from your list`);
                setAssignedDoctors(prev => prev.filter(id => id !== doctorId));
            } else {
                toast.success(`Selected Dr. ${doctorName}`);
                setAssignedDoctors(prev => [...prev, doctorId]);
            }
            const meRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/me`, { withCredentials: true });
            dispatch(updateUser(meRes.data));
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to update selection');
        }
    };
    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <div className="max-w-5xl mx-auto">
                <button
                    onClick={() => navigate('/health-dashboard')}
                    className="flex items-center text-gray-600 hover:text-blue-600 mb-6 transition"
                >
                    <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
                </button>
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Find Your Doctor</h1>
                        <p className="text-gray-500 mt-1">Select specialists for your primary care</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row items-center gap-4">
                    <div className="flex items-center gap-2 text-gray-500">
                        <Stethoscope size={20} />
                        <span className="font-medium">Filter by:</span>
                    </div>
                    <div className="flex-1 w-full md:w-auto overflow-x-auto flex gap-2 pb-2 md:pb-0">
                        <button
                            onClick={() => setSpecialization('')}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${!specialization ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            All Specialists
                        </button>
                        {specializations.map(spec => (
                            <button
                                key={spec}
                                onClick={() => setSpecialization(spec)}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${specialization === spec ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {spec}
                            </button>
                        ))}
                    </div>
                </div>
                {loading ? (
                    <div className="text-center py-20 text-gray-500">Loading doctors...</div>
                ) : doctors.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-gray-200">
                        <p className="text-lg">No doctors found for this specialization.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {doctors.map(doctor => {
                            const isAssigned = assignedDoctors.includes(doctor._id);
                            return (
                                <div key={doctor._id} className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition flex flex-col items-center text-center ${isAssigned ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                                    <div className={`w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl mb-4 ${isAssigned ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {doctor.name.charAt(0)}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">Dr. {doctor.name}</h3>
                                    <p className="text-blue-600 font-medium mb-1">{doctor.specialization}</p>
                                    <p className="text-gray-500 text-sm mb-6">{doctor.email}</p>
                                    <button
                                        onClick={() => toggleDoctorAssignment(doctor._id, doctor.name)}
                                        className={`w-full py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2 ${isAssigned
                                            ? 'bg-green-600 text-white hover:bg-green-700'
                                            : 'bg-gray-900 text-white hover:bg-gray-800'
                                            }`}
                                    >
                                        {isAssigned ? (
                                            <>
                                                <UserPlus size={18} /> Selected
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus size={18} /> Select as My Doctor
                                            </>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
export default FindDoctor;
