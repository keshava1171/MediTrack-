import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login, reset } from '../features/auth/authSlice';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout';

function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const { email, password } = formData;

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { user, isLoading, isError, isSuccess, message } = useSelector(
        (state) => state.auth
    );

    useEffect(() => {
        if (isError) {
            toast.error(message || "Login failed");
        }

        if (isSuccess || user) {
            if (user?.role === 'admin') {
                navigate('/dashboard');
            } else if (user?.role === 'doctor') {
                navigate('/doctor-dashboard');
            } else {
                navigate('/health-dashboard');
            }
        }

        dispatch(reset());
    }, [user, isError, isSuccess, message, navigate, dispatch]);

    const onChange = (e) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
    };

    const onSubmit = (e) => {
        e.preventDefault();
        dispatch(login({ email, password, rememberMe }));
    };

    return (
        <AuthLayout title="Welcome Back" subtitle="Access your health dashboard">
            <Toaster position="top-center" />
            <form onSubmit={onSubmit} className="space-y-5">
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
                            autoComplete="current-password"
                            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition"
                            placeholder="••••••••"
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

                <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center text-gray-600 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2">Remember me</span>
                    </label>
                    <Link to="/forgot-password" className="text-blue-600 hover:text-blue-500 font-medium">
                        Forgot Password?
                    </Link>
                </div>

                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg shadow hover:bg-blue-700 transition duration-200 flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <span className="animate-pulse">Signing In...</span>
                    ) : 'Sign In'}
                </motion.button>
            </form>

            <div className="mt-8 text-center text-sm">
                <p className="text-gray-600">
                    Don't have an account? {' '}
                    <Link to="/register" className="text-blue-600 font-bold hover:underline">
                        Create an account
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}

export default Login;
