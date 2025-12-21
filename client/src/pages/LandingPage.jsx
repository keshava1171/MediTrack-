import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Activity, Shield, FileText, MessageSquare, ChevronRight, Users, Database, AlertTriangle } from 'lucide-react';
import { useSelector } from 'react-redux';
import heroImg from '../assets/hero.png';
import UserHome from './UserHome';

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const LandingPage = () => {
    const { user } = useSelector((state) => state.auth);

    if (user) {
        return <UserHome />;
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            { }
            <section className="relative pt-20 pb-20 lg:pt-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col-reverse lg:flex-row items-center">
                    <div className="w-full lg:w-1/2 lg:pr-10 mt-10 lg:mt-0">
                        <motion.h1
                            initial="hidden" animate="visible" variants={fadeInUp} transition={{ duration: 0.5 }}
                            className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight"
                        >
                            Future of <span className="text-blue-600 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-400">Connected Healthcare</span>
                        </motion.h1>
                        <motion.p
                            initial="hidden" animate="visible" variants={fadeInUp} transition={{ duration: 0.5, delay: 0.2 }}
                            className="mt-6 text-xl text-gray-600 max-w-lg"
                        >
                            Monitor real-time vitals, securely manage medical records, and connect with specialists instantly.
                        </motion.p>
                        <motion.div
                            initial="hidden" animate="visible" variants={fadeInUp} transition={{ duration: 0.5, delay: 0.4 }}
                            className="mt-10 flex flex-col sm:flex-row gap-4"
                        >
                            <Link to="/register" className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl transition flex items-center justify-center">
                                Get Started <ChevronRight className="ml-2 w-5 h-5" />
                            </Link>
                            <Link to="/login" className="px-8 py-3 bg-white text-gray-700 font-semibold rounded-full shadow-md hover:bg-gray-100 transition flex items-center justify-center border border-gray-200">
                                Login
                            </Link>
                        </motion.div>
                    </div>
                    <div className="w-full lg:w-1/2 relative">
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                        <motion.img
                            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}
                            src={heroImg}
                            alt="Dashboard Preview"
                            className="relative rounded-2xl shadow-2xl border-4 border-white transform hover:scale-105 transition duration-500"
                        />
                    </div>
                </div>
            </section>

            { }
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900">Why MediTrack Pro?</h2>
                        <p className="mt-4 text-gray-600">Complete ecosystem for patients and healthcare providers.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { icon: <Activity className="w-8 h-8 text-blue-500" />, title: "Saves Time", desc: "Automated tracking eliminates manual logs, giving you more time for care." },
                            { icon: <Shield className="w-8 h-8 text-teal-500" />, title: "Improves Patient Safety", desc: "Instant alerts for critical changes ensure timely medical intervention." },
                            { icon: <FileText className="w-8 h-8 text-indigo-500" />, title: "Reduces Manual Work", desc: "Digitized records and reports streamline the entire workflow." },
                            { icon: <Users className="w-8 h-8 text-purple-500" />, title: "Enables Remote Healthcare", desc: "Connect with doctors from home, bridging the distance gap." },
                            { icon: <Database className="w-8 h-8 text-orange-500" />, title: "Digitizes Medical Data", desc: "Secure cloud storage keeps your history accessible anywhere." },
                            { icon: <AlertTriangle className="w-8 h-8 text-red-500" />, title: "Emergency Handling", desc: "Critical event triggers ensure rapid response when it matters most." },
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                whileHover={{ y: -5 }}
                                className="p-8 bg-gray-50 rounded-xl hover:shadow-lg transition border border-gray-100"
                            >
                                <div className="bg-white w-14 h-14 rounded-lg flex items-center justify-center shadow-sm mb-6">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-gray-600">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            { }
            <section className="py-20 bg-blue-900 text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    <div className="absolute right-0 top-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        <div className="w-full lg:w-1/2">
                            <span className="inline-block px-4 py-1.5 bg-blue-800 text-blue-200 rounded-full text-sm font-semibold mb-6 border border-blue-700">
                                Real-World Application
                            </span>
                            <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                                Remote Patient Monitoring <br />
                                <span className="text-blue-300">Reimagined for Home Care</span>
                            </h2>
                            <p className="text-blue-100 text-lg mb-8 leading-relaxed">
                                Empowering elderly and chronic patients to stay healthy at home while keeping doctors informed in real-time.
                            </p>

                            <ul className="space-y-4">
                                {[
                                    "Patients use connected devices at home.",
                                    "Doctors monitor vitals remotely via dashboard.",
                                    "Reduces unnecessary hospital visits.",
                                    "Instant alerts for critical health changes."
                                ].map((item, i) => (
                                    <motion.li
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-center gap-3"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="text-lg">{item}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </div>
                        <div className="w-full lg:w-1/2 bg-blue-800 rounded-2xl p-8 border border-blue-700 shadow-2xl">
                            { }
                            <div className="bg-gray-900 rounded-xl p-6 mb-4 border border-gray-700">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                                            <Users size={20} className="text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-sm">Patient at Home</p>
                                            <p className="text-xs text-gray-400">Wearing Smart Device</p>
                                        </div>
                                    </div>
                                    <div className="text-green-400 text-xs font-mono animate-pulse">Syncing...</div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-2 bg-gray-700 rounded-full w-3/4"></div>
                                    <div className="h-2 bg-gray-700 rounded-full w-1/2"></div>
                                </div>
                            </div>

                            <div className="flex justify-center -my-3 relative z-10">
                                <div className="bg-blue-600 rounded-full p-2 border-4 border-blue-800">
                                    <Activity className="text-white w-6 h-6" />
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-6 mt-4 border border-blue-200">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <Users size={20} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-gray-900 font-bold text-sm">Sarah (Remote Specialist)</p>
                                            <p className="text-xs text-gray-500">Reviewing Dashboard</p>
                                        </div>
                                    </div>
                                    <div className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">Normal</div>
                                </div>
                                <p className="text-gray-600 text-xs bg-gray-50 p-3 rounded border border-gray-100">
                                    "Vitals look stable. BP 120/80. No action needed."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
