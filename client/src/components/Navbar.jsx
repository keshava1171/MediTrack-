import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, reset } from '../features/auth/authSlice';
import { LogOut, LayoutDashboard, User, MessageSquare, FileText, Menu, X, Home, Shield } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBell from './NotificationBell';

function Navbar() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [isOpen, setIsOpen] = useState(false);

    const onLogout = () => {
        dispatch(logout());
        dispatch(reset());
        navigate('/');
        setIsOpen(false);
    };

    return (
        <>
            {}
            <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 w-full z-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-4">
                            {}
                            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 hover:text-gray-900 focus:outline-none p-2 rounded-md hover:bg-gray-100 transition">
                                {isOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>

                            <Link to="/" className="flex items-center space-x-2 group">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg group-hover:bg-blue-700 transition">
                                    <Home size={20} />
                                </div>
                                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-teal-500">MediTrack</span>
                            </Link>
                        </div>

                        {}
                        <div className="flex items-center space-x-4">
                            {user ? (
                                <div className="flex items-center gap-3">
                                    <NotificationBell />
                                    <span className="text-sm font-medium text-gray-700 hidden sm:block">Welcome, {user.name}</span>

                                    <Link to="/profile" className="relative cursor-pointer group">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-teal-400 p-[2px] transition-transform group-hover:scale-105">
                                            <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                                {user.photoUrl ? (
                                                    <img src={user.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-5 h-5 text-gray-600" />
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                    <button onClick={onLogout} title="Logout" className="hidden lg:block text-gray-400 hover:text-red-500 transition">
                                        <LogOut size={20} />
                                    </button>
                                </div>
                            ) : (
                                <div className="hidden sm:flex items-center gap-3">
                                    <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition">Login</Link>
                                    <Link to="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-600/20">Get Started</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-white border-t border-gray-100 overflow-hidden shadow-lg"
                        >
                            <div className="px-4 pt-2 pb-6 space-y-2">
                                <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition">
                                    <Home size={18} /> Home
                                </Link>
                                {user ? (
                                    <>
                                        {user.role === 'admin' && (
                                            <Link to="/admin/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition">
                                                <Shield size={18} /> Admin Panel
                                            </Link>
                                        )}
                                        {user.role === 'doctor' && (
                                            <Link to="/doctor-dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition">
                                                <LayoutDashboard size={18} /> Doctor Dashboard
                                            </Link>
                                        )}
                                        {user.role !== 'admin' && (
                                            <Link to="/reports" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition">
                                                <FileText size={18} /> Medical Reports
                                            </Link>
                                        )}
                                        <Link to="/chat" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition">
                                            <MessageSquare size={18} /> Messages
                                        </Link>
                                        <button onClick={onLogout} className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-red-600 hover:bg-red-50 transition">
                                            <LogOut size={18} /> Sign Out
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="border-t border-gray-100 my-2 pt-2">
                                            <Link to="/admin/login" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50">Admin Portal</Link>
                                            <Link to="/login" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50">Login</Link>
                                            <Link to="/register" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-blue-600 hover:bg-blue-50 font-bold">Create Account</Link>
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        </>
    );
}

export default Navbar;
