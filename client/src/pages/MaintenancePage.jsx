import { AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const MaintenancePage = () => {
    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-lg w-full border border-gray-700"
            >
                <div className="flex justify-center mb-6">
                    <div className="bg-yellow-100 p-4 rounded-full">
                        <AlertTriangle className="w-12 h-12 text-yellow-600" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-white mb-4">System Under Maintenance</h1>
                <p className="text-gray-400 mb-8">
                    We are currently performing scheduled maintenance to improve our services.
                    Access is temporarily restricted.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-gray-700/50 p-4 rounded-xl">
                        <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-300">Estimated Duration</p>
                        <p className="font-bold text-white">~1 Hour</p>
                    </div>
                    <div className="bg-gray-700/50 p-4 rounded-xl">
                        <RefreshCw className="w-6 h-6 text-green-400 mx-auto mb-2 animate-spin-slow" />
                        <p className="text-sm text-gray-300">Status</p>
                        <p className="font-bold text-white">Updating...</p>
                    </div>
                </div>

                <button
                    onClick={() => window.location.reload()}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
                >
                    Check Status
                </button>
            </motion.div>

            <div className="mt-8 text-gray-600 text-sm">
                &copy; {new Date().getFullYear()} MedPortal. All rights reserved.
            </div>
        </div>
    );
};

export default MaintenancePage;
