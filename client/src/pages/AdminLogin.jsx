import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login, reset } from '../features/auth/authSlice';
import { ShieldCheck, Lock, Users, FileText, Activity, Server, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
function AdminLogin() {
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
        if (isSuccess && user) {
            if (user.role === 'admin') {
                toast.success("Welcome Admin");
                navigate('/dashboard');
            } else {
                toast.error("Access Denied: Not an Admin");
            }
        }
        if (user && !isSuccess) {
            if (user.role === 'admin') {
                navigate('/dashboard');
            }
        }
        return () => { dispatch(reset()); }
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
        <div className="min-h-screen flex bg-slate-900 font-mono text-slate-200">
            <div className="hidden lg:flex w-1/2 bg-slate-800 flex-col justify-between p-12 border-r border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5">
                    <ShieldCheck size={400} />
                </div>
                <div className="z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center text-white">
                            <Server size={20} />
                        </div>
                        <h1 className="text-2xl font-bold tracking-wider text-white">SYSTEM CONTROL</h1>
                    </div>
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-sm text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-700 pb-2">Administrative Capabilities</h2>
                            <ul className="space-y-4">
                                {[
                                    { icon: <Users size={18} className="text-blue-400" />, label: "User Management", desc: "Full access control for Patients & Doctors" },
                                    { icon: <Server size={18} className="text-green-400" />, label: "System Logs", desc: "Real-time audit trails & activity monitoring" },
                                    { icon: <FileText size={18} className="text-purple-400" />, label: "Report Oversight", desc: "Global view of medical data flow" },
                                    { icon: <Activity size={18} className="text-orange-400" />, label: "Device Inventory", desc: "Manage remote monitoring connections" },
                                ].map((item, idx) => (
                                    <motion.li
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 + (idx * 0.1) }}
                                        className="flex items-start gap-4"
                                    >
                                        <div className="mt-1">{item.icon}</div>
                                        <div>
                                            <p className="font-bold text-slate-200">{item.label}</p>
                                            <p className="text-xs text-slate-500">{item.desc}</p>
                                        </div>
                                    </motion.li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded border border-slate-700">
                            <div className="flex items-center gap-2 mb-2 text-yellow-500 text-xs font-bold uppercase">
                                <AlertTriangle size={14} /> System Status
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <span className="text-slate-500 block">Server</span>
                                    <span className="text-green-400">● Online</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Database</span>
                                    <span className="text-green-400">● Connected</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Security</span>
                                    <span className="text-blue-400">● Active</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Version</span>
                                    <span className="text-slate-300">v2.4.0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="text-xs text-slate-600 z-10">
                    <p>Authorized Personnel Only</p>
                    <p>Access is monitored and logged.</p>
                </div>
            </div>
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-900">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-2xl"
                >
                    <div className="text-center mb-8">
                        <ShieldCheck className="mx-auto h-12 w-12 text-blue-500 mb-4" />
                        <h2 className="text-2xl font-bold text-white">Security Clearance</h2>
                        <p className="text-slate-400 text-sm mt-1">Identify yourself to proceed</p>
                    </div>
                    <form onSubmit={onSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Admin Identifier</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Users className="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition" />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    value={email}
                                    onChange={onChange}
                                    className="w-full bg-slate-900 border border-slate-600 text-white rounded p-3 pl-10 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition placeholder-slate-600"
                                    placeholder="admin@meditrack.system"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Access Key</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={password}
                                    onChange={onChange}
                                    autoComplete="current-password"
                                    className="w-full bg-slate-900 border border-slate-600 text-white rounded p-3 pl-10 pr-12 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition placeholder-slate-600"
                                    placeholder="••••••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                        >
                            {isLoading ? (
                                <span className="animate-pulse">Authenticating...</span>
                            ) : (
                                <>
                                    <Lock size={18} /> Authenticate
                                </>
                            )}
                        </button>
                    </form>
                    <div className="mt-6 text-center border-t border-slate-700 pt-4">
                        <Link to="/" className="text-slate-500 hover:text-slate-300 text-xs transition">
                            ← Return to Public Portal
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
export default AdminLogin;
