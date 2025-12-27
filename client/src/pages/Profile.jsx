import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { User, Mail, Phone, Camera, Save, CheckCircle, Shield, AlertCircle, MapPin, Edit2, X, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { updateUser } from '../features/auth/authSlice';
const Profile = () => {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        address: '',
        password: ''
    });
    const [uploading, setUploading] = useState(false);
    const [updating, setUpdating] = useState(false);
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                mobile: user.mobile || user.contact || '',
                address: user.address || ''
            });
        } else {
            navigate('/login');
        }
    }, [user, navigate]);
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const uploadData = new FormData();
        uploadData.append('photo', file);
        setUploading(true);
        try {
            const res = await fetch('http://localhost:5000/api/auth/profile-photo', {
                method: 'PUT',
                credentials: 'include',
                body: uploadData
            });
            if (!res.ok) {
                const text = await res.text();
                let errorMessage = 'Upload failed';
                try {
                    const errorData = JSON.parse(text);
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    errorMessage = text || errorMessage;
                }
                toast.error(errorMessage);
                return;
            }
            const data = await res.json();
            dispatch(updateUser(data));
            toast.success('Profile photo updated!');
        } catch (error) {
            console.error(error);
            toast.error('Error uploading photo');
        } finally {
            setUploading(false);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const res = await fetch('http://localhost:5000/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                dispatch(updateUser(data));
                toast.success('Profile updated successfully!');
                setIsEditing(false);
            } else {
                toast.error(data.message || 'Update failed');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error updating profile');
        } finally {
            setUpdating(false);
        }
    };
    if (!user) return null;
    return (
        <div className="min-h-screen pt-4 pb-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="max-w-full mx-auto">
                <button
                    onClick={() => {
                        if (user?.role === 'doctor') navigate('/doctor-dashboard');
                        else if (user?.role === 'admin') navigate('/admin/dashboard');
                        else navigate('/health-dashboard');
                    }}
                    className="mb-6 flex items-center text-gray-600 hover:text-blue-600 transition"
                >
                    <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
                </button>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white rounded-2xl shadow-xl overflow-hidden"
                >
                    <div className="h-32 bg-gradient-to-r from-blue-600 to-teal-500 relative">
                        <div className="absolute top-4 right-4">
                            <div className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                <Shield size={12} /> {user.role.toUpperCase()}
                            </div>
                        </div>
                    </div>
                    <div className="px-8 pb-8">
                        <div className="relative -mt-16 mb-6 flex justify-between items-end">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white flex items-center justify-center">
                                    {user.photoUrl ? (
                                        <img src={user.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-12 h-12 text-gray-400" />
                                    )}
                                </div>
                                {isEditing && (
                                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition shadow-md group-hover:scale-110">
                                        <Camera size={16} />
                                        <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
                                    </label>
                                )}
                                {uploading && (
                                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                    </div>
                                )}
                            </div>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-100 transition"
                                >
                                    <Edit2 size={16} /> Edit Profile
                                </button>
                            )}
                        </div>
                        <div className="text-center sm:text-left mb-8">
                            <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                            <p className="text-gray-500">{user.email}</p>
                            {user.patientId && (
                                <p className="text-xs text-gray-400 font-mono mt-1">ID: {user.patientId}</p>
                            )}
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User size={18} className="text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 transition ${isEditing ? 'border-gray-300 bg-white' : 'border-transparent bg-gray-50'}`}
                                            placeholder="Your full name"
                                        />
                                    </div>
                                </div>
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail size={18} className="text-gray-400" />
                                        </div>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            className={`block w-full pl-10 pr-24 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 transition ${isEditing ? 'border-gray-300 bg-white' : 'border-transparent bg-gray-50'}`}
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                </div>
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Phone size={18} className="text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="mobile"
                                            value={formData.mobile}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 transition ${isEditing ? 'border-gray-300 bg-white' : 'border-transparent bg-gray-50'}`}
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>
                                </div>
                                <div className="relative sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <MapPin size={18} className="text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 transition ${isEditing ? 'border-gray-300 bg-white' : 'border-transparent bg-gray-50'}`}
                                            placeholder="Your residential address"
                                        />
                                    </div>
                                </div>
                                {isEditing && (
                                    <div className="relative sm:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Change Password (Optional)</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Shield size={18} className="text-gray-400" />
                                            </div>
                                            <input
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                                                placeholder="Enter new password to change"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            {isEditing && (
                                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setFormData({
                                                name: user.name || '',
                                                email: user.email || '',
                                                mobile: user.mobile || user.contact || '',
                                                address: user.address || ''
                                            });
                                        }}
                                        className="flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
                                    >
                                        <X size={18} /> Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={updating}
                                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-teal-600 focus:ring-4 focus:ring-blue-200 transition disabled:opacity-70 transform hover:-translate-y-0.5"
                                    >
                                        {updating ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        ) : (
                                            <Save size={18} />
                                        )}
                                        Save Changes
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
export default Profile;
