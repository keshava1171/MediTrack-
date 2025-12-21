import { Link } from 'react-router-dom';
import heroImg from '../assets/hero_v2.png';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AuthLayout = ({ children, title, subtitle, isRegister = false }) => {

    return (
        <div className="min-h-screen bg-gray-50 flex overflow-hidden">

            {}
            <div className={`flex w-full h-screen ${isRegister ? 'flex-row-reverse' : 'flex-row'}`}>

                {}
                <motion.div
                    layoutId="auth-image-panel"
                    transition={{ duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }}
                    className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-700 to-indigo-800 relative flex-col justify-between p-12 text-white h-full z-10"
                >
                    {}
                    <div className="absolute inset-0 z-0">
                        <img src={heroImg} alt="Background" className="w-full h-full object-cover opacity-30" />
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/40 to-indigo-900/40 mix-blend-multiply"></div>
                    </div>

                    {}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="relative z-10"
                    >
                        <Link to="/" className="flex items-center text-blue-200 hover:text-white transition group mb-8">
                            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition" /> Back to Home
                        </Link>
                        <h1 className="text-5xl font-extrabold mb-6 tracking-tight drop-shadow-lg">MediTrack Pro</h1>
                        <p className="text-xl text-blue-100 max-w-md leading-relaxed drop-shadow-md">
                            Advanced healthcare monitoring system connecting patients, doctors, and devices in real-time.
                        </p>
                    </motion.div>

                    <div className="relative z-10 space-y-6">
                        {}
                        {[
                            { title: 'Saves Time', text: 'Automated tracking eliminates manual logs.' },
                            { title: 'Improves Patient Safety', text: 'Instant alerts for critical changes.' },
                            { title: 'Reduces Manual Work', text: 'Digitized records streamline workflow.' },
                            { title: 'Remote Healthcare', text: 'Connect with doctors from home.' },
                            { title: 'Digitized Data', text: 'Secure cloud storage for all records.' },
                            { title: 'Emergency Handling', text: 'Rapid response for critical triggers.' }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + (idx * 0.1) }}
                                className="flex items-start group"
                            >
                                <div className="bg-white/10 p-2 rounded-lg mr-4 backdrop-blur-sm group-hover:bg-white/20 transition">
                                    <div className="w-2 h-2 rounded-full bg-blue-300 group-hover:bg-white mt-1.5"></div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{feature.title}</h3>
                                    <p className="text-blue-100 opacity-70 text-sm">{feature.text}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {}
                <motion.div
                    layout
                    className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative bg-white h-full z-0"
                >
                    <div className="absolute top-6 left-6 lg:hidden">
                        <Link to="/" className="flex items-center text-gray-500 hover:text-blue-600 transition">
                            <ArrowLeft className="w-5 h-5 mr-1" /> Home
                        </Link>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="w-full max-w-md"
                    >
                        <div className="mb-8">
                            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{title}</h2>
                            {subtitle && <p className="mt-3 text-gray-500 font-medium">{subtitle}</p>}
                        </div>
                        {children}
                    </motion.div>
                </motion.div>

            </div>
        </div>
    );
};

export default AuthLayout;
