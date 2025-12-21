import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { LayoutDashboard, FileText, MessageSquare, User, Activity, Clock, Shield, Pill } from 'lucide-react';
import { motion } from 'framer-motion';

const UserHome = () => {
    const { user } = useSelector((state) => state.auth);

    if (!user) return null; 

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 text-center"
                >
                    <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-teal-500 mb-2">
                        Welcome back, {user.name.split(' ')[0]}
                    </h1>
                    <div className="inline-flex items-center bg-yellow-100 px-4 py-1.5 rounded-full shadow-sm border border-yellow-200 mt-0">
                        <User size={16} className="text-yellow-600 mr-2" />
                        <span className="text-gray-700 font-medium mr-2">
                            {user.role === 'doctor' ? 'Doctor ID:' : user.role === 'admin' ? 'Admin ID:' : 'Patient ID:'}
                        </span>
                        <span className="text-blue-700 font-mono font-bold">
                            {user.role === 'doctor' ? (user.doctorId || 'Generating...') : user.role === 'admin' ? (user.adminId || 'ADM-001') : (user.patientId || 'Running Generation...')}
                        </span>
                    </div>

                    {}
                    {user?.assignedDoctors && user.assignedDoctors.length > 0 && (
                        <div className="mt-4 flex flex-wrap justify-center gap-3">
                            {user.assignedDoctors.map(doctor => (
                                <span key={doctor._id} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white border border-gray-200 shadow-sm text-gray-700">
                                    <User size={14} className="mr-1.5 text-blue-500" />
                                    Dr. {doctor.name}
                                </span>
                            ))}
                        </div>
                    )}
                </motion.div>

                {}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {}
                    {user.role !== 'admin' && (
                        <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100 group">
                            <Link to={user.role === 'doctor' ? "/doctor-dashboard" : "/health-dashboard"} className="block h-full">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition">
                                    <LayoutDashboard size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">My Dashboard</h3>
                                <p className="text-gray-500">View your comprehensive health overview, vitals, and trends.</p>
                            </Link>
                        </motion.div>
                    )}

                    {}
                    <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100 group">
                        <Link to={user.role === 'admin' ? "/admin/reports" : "/reports"} className="block h-full">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition">
                                <FileText size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Medical Reports</h3>
                            <p className="text-gray-500">Access and manage all your uploaded medical documents.</p>
                        </Link>
                    </motion.div>

                    {}
                    {(user.role === 'admin' || user.role === 'patient' || user.role === 'doctor') && (
                        <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100 group">
                            <Link
                                to={user.role === 'admin' ? "/admin/prescriptions" : user.role === 'doctor' ? "/doctor/prescriptions" : "/prescriptions"}
                                className="block h-full"
                            >
                                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-pink-600 mb-4 group-hover:scale-110 transition">
                                    <Pill size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Prescriptions</h3>
                                <p className="text-gray-500">View and manage prescriptions.</p>
                            </Link>
                        </motion.div>
                    )}

                    {}
                    <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100 group">
                        <Link to="/chat" className="block h-full">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-4 group-hover:scale-110 transition">
                                <MessageSquare size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Messages</h3>
                            <p className="text-gray-500">Chat with your doctors and healthcare providers.</p>
                        </Link>
                    </motion.div>

                    {}
                    <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100 group">
                        <Link to="/profile" className="block h-full">
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 mb-4 group-hover:scale-110 transition">
                                <User size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">My Profile</h3>
                            <p className="text-gray-500">Update your personal details, address, and photo.</p>
                        </Link>
                    </motion.div>

                    {}
                    {user.role === 'admin' && (
                        <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10">
                                <Shield size={100} />
                            </div>
                            <Link to="/admin/dashboard" className="block h-full relative z-10">
                                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600 mb-4 group-hover:scale-110 transition">
                                    <Shield size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Admin Control</h3>
                                <p className="text-gray-500">Manage users, generate reports, and system settings.</p>
                            </Link>
                        </motion.div>
                    )}
                </motion.div>
            </div >
        </div >
    );
};

export default UserHome;
