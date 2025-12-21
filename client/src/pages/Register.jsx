import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register, reset } from '../features/auth/authSlice';
import { User, Mail, Lock, CheckCircle, Eye, EyeOff, Stethoscope } from 'lucide-react';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout';

function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'patient',
        specialization: ''
    });
    const [showPassword, setShowPassword] = useState(false);

    const { name, email, password, role } = formData;

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { user, isLoading, isError, isSuccess, message } = useSelector(
        (state) => state.auth
    );

    useEffect(() => {
        if (isError) {
            toast.error(message || "Registration failed");
        }

        if (isSuccess && !user) {
            toast.success("Account Created Successfully! Please login.");
            setTimeout(() => navigate('/login'), 2000);
        } else if (user) {
            if (user.role === 'admin') navigate('/admin/dashboard');
            else if (user.role === 'doctor') navigate('/doctor-dashboard');
            else navigate('/health-dashboard');
        }

        dispatch(reset());
    }, [user, isError, isSuccess, message, navigate, dispatch]);

    const onChange = (e) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        dispatch(register(formData));
    };

    return (
        <AuthLayout title="Create Account" subtitle="Join thousands improving their health" isRegister>
            <Toaster position="top-center" />
            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition" />
                        </div>
                        <input
                            type="text"
                            name="name"
                            value={name}
                            onChange={onChange}
                            autoComplete="name"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition"
                            placeholder="John Doe"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition" />
                        </div>
                        <input
                            type="email"
                            name="email"
                            value={email}
                            onChange={onChange}
                            autoComplete="username"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition" />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={password}
                            onChange={onChange}
                            autoComplete="new-password"
                            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition"
                            placeholder="Create a password"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                { }
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">I am a...</label>
                    <div className="grid grid-cols-2 gap-3">
                        <motion.button
                            type="button"
                            onClick={() => onChange({ target: { name: 'role', value: 'patient' } })}
                            className={`p-4 rounded-xl border-2 transition-all ${formData.role === 'patient' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <User className="mx-auto mb-2 text-blue-600" size={24} />
                            <p className="font-semibold text-gray-900">Patient</p>
                        </motion.button>

                        <motion.button
                            type="button"
                            onClick={() => onChange({ target: { name: 'role', value: 'doctor' } })}
                            className={`p-4 rounded-xl border-2 transition-all ${formData.role === 'doctor' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Stethoscope className="mx-auto mb-2 text-blue-600" size={24} />
                            <p className="font-semibold text-gray-900">Doctor</p>
                        </motion.button>
                    </div>
                </div>

                { }
                {formData.role === 'doctor' && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                        <select
                            name="specialization"
                            value={formData.specialization || ''}
                            onChange={onChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition"
                            required
                        >
                            <option value="">Select Specialization</option>
                            <option value="General Physician">General Physician</option>
                            <option value="General Surgeon">General Surgeon</option>
                            <option value="Cardiologist">Cardiologist</option>
                            <option value="Neurologist">Neurologist</option>
                            <option value="Orthopedic">Orthopedic</option>
                            <option value="Pediatrician">Pediatrician</option>
                            <option value="Gynecologist">Gynecologist</option>
                            <option value="Dermatologist">Dermatologist</option>
                            <option value="Pulmonologist">Pulmonologist</option>
                        </select>
                    </div>
                )}

                <div className="flex items-center mt-2">
                    <input type="checkbox" required className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-gray-600">I agree to the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a></span>
                </div>

                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg shadow hover:bg-blue-700 transition duration-200 flex items-center justify-center gap-2 mt-4"
                >
                    {isLoading ? (
                        <span className="animate-pulse">Creating Account...</span>
                    ) : 'Create Account'}
                </motion.button>

                <p className="text-center text-gray-600 text-sm mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-600 font-bold hover:underline">
                        Sign In
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}

export default Register;
