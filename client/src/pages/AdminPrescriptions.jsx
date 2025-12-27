import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Pill, Search, Calendar, User, FileText, Trash2, ChevronLeft, ChevronRight, Download, Activity, Eye, Stethoscope, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
const AdminPrescriptions = () => {
    const { user } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/admin/login');
            return;
        }
        fetchPrescriptions();
    }, [user, navigate]);
    const fetchPrescriptions = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/prescriptions', {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setPrescriptions(data);
            } else {
                toast.error('Failed to fetch prescriptions');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error loading data');
        } finally {
            setLoading(false);
        }
    };
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this prescription? This action cannot be undone.')) return;
        try {
            const res = await fetch(`http://localhost:5000/api/prescriptions/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (res.ok) {
                toast.success('Prescription deleted');
                setPrescriptions(prev => prev.filter(p => p._id !== id));
            } else {
                toast.error('Failed to delete');
            }
        } catch (error) {
            toast.error('Server error');
        }
    };
    const filteredPrescriptions = prescriptions.filter(p => {
        const searchLower = searchTerm.toLowerCase();
        return (
            (p.diagnosis?.toLowerCase() || '').includes(searchLower) ||
            (p.patientId?.name?.toLowerCase() || '').includes(searchLower) ||
            (p.doctorId?.name?.toLowerCase() || '').includes(searchLower) ||
            (p.patientId?.patientId?.toLowerCase() || '').includes(searchLower)
        );
    });
    const totalPages = Math.ceil(filteredPrescriptions.length / itemsPerPage);
    const displayedPrescriptions = filteredPrescriptions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const handlePrint = () => {
        const prescription = document.getElementById('printable-prescription');
        if (!prescription) return;
        const existingContainer = document.getElementById('print-container');
        if (existingContainer) {
            existingContainer.remove();
        }
        const printContainer = document.createElement('div');
        printContainer.id = 'print-container';
        printContainer.style.display = 'none';
        printContainer.innerHTML = prescription.innerHTML;
        document.body.appendChild(printContainer);
        window.print();
        setTimeout(() => {
            const container = document.getElementById('print-container');
            if (container) container.remove();
        }, 100);
    };
    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-2 transition-colors"
                        >
                            <ChevronLeft size={20} />
                            <span>Back to Dashboard</span>
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Pill className="text-blue-600" /> Prescription Management
                        </h1>
                        <p className="text-gray-500 mt-1">View, audit, and manage patient prescriptions.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <Activity size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Prescriptions</p>
                            <h3 className="text-2xl font-bold text-gray-900">{prescriptions.length}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50">
                        <div className="relative flex-1 w-full md:w-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search diagnosis, doctor, or patient..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-4 font-semibold">Diagnosis</th>
                                    <th className="px-6 py-4 font-semibold">Doctor</th>
                                    <th className="px-6 py-4 font-semibold">Patient</th>
                                    <th className="px-6 py-4 font-semibold">Date</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center">
                                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                        </td>
                                    </tr>
                                ) : displayedPrescriptions.length > 0 ? (
                                    displayedPrescriptions.map((pres) => (
                                        <tr key={pres._id} className="hover:bg-gray-50/50 transition duration-150">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{pres.diagnosis}</div>
                                                <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                                    {pres.medicines?.length || 0} medicines prescribed
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Stethoscope size={16} className="text-blue-500" />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{(pres.doctorId?.name || 'Unknown').replace(/^Dr\.?\s+/i, '')}</div>
                                                        <div className="text-xs text-gray-500">{pres.doctorId?.specialization || 'General'} | ID: {pres.doctorId?.doctorId || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <User size={16} className="text-green-500" />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{pres.patientId?.name || 'Unknown'}</div>
                                                        <div className="text-xs text-gray-500">ID: {pres.patientId?.patientId || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(pres.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    <button
                                                        onClick={() => { setSelectedPrescription(pres); setIsPrintModalOpen(true); }}
                                                        className="p-1 text-gray-500 hover:text-blue-600 transition"
                                                        title="View Details"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(pres._id)}
                                                        className="p-1 text-gray-500 hover:text-red-600 transition"
                                                        title="Delete Prescription"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                            No prescriptions found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                        <span className="text-sm text-gray-500">Showing {displayedPrescriptions.length} of {filteredPrescriptions.length} entries</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 transition"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 transition"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <AnimatePresence>
                {isPrintModalOpen && selectedPrescription && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm no-print">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-gray-100 rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden"
                        >
                            <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center">
                                <h2 className="text-lg font-bold text-gray-800">Prescription Details</h2>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handlePrint}
                                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                                    >
                                        <Download size={18} /> Print / Save PDF
                                    </button>
                                    <button
                                        onClick={() => setIsPrintModalOpen(false)}
                                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition"
                                        title="Close"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-y-auto flex-1 p-8">
                                <div
                                    id="printable-prescription"
                                    className="bg-white p-8 mx-auto shadow-sm max-w-[210mm] min-h-[297mm]"
                                    style={{ width: '100%', maxWidth: '800px' }}
                                >
                                    <div className="flex justify-between items-start border-b-2 border-blue-600 pb-6 mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">M</div>
                                            <div>
                                                <h1 className="text-2xl font-bold text-gray-900">MediTrack</h1>
                                                <p className="text-xs text-gray-500 tracking-wider uppercase">Digital Healthcare System</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <h2 className="text-lg font-bold text-gray-900">{(selectedPrescription.doctorId?.name || 'Unknown').replace(/^Dr\.?\s+/i, '')}</h2>
                                            <p className="text-sm text-blue-600 font-medium">{selectedPrescription.doctorId?.specialization || 'General Physician'}</p>
                                            <p className="text-xs text-gray-500 mt-1">Doctor ID: {selectedPrescription.doctorId?.doctorId || 'N/A'}</p>
                                            <p className="text-xs text-gray-500">{selectedPrescription.doctorId?.contact || '+1 234 567 890'}</p>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-100">
                                        <div className="grid grid-cols-2 gap-y-4 text-sm">
                                            <div>
                                                <label className="block text-gray-500 text-xs uppercase font-semibold mb-1">Patient Name</label>
                                                <span className="font-bold text-gray-900 text-lg">{selectedPrescription.patientId?.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <label className="block text-gray-500 text-xs uppercase font-semibold mb-1">Date</label>
                                                <span className="font-medium text-gray-900">{new Date(selectedPrescription.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div>
                                                <label className="block text-gray-500 text-xs uppercase font-semibold mb-1">Age / Gender</label>
                                                <span className="font-medium text-gray-900">{selectedPrescription.patientId?.age || 'N/A'} Yrs / {selectedPrescription.patientId?.gender || 'N/A'}</span>
                                            </div>
                                            <div className="text-right">
                                                <label className="block text-gray-500 text-xs uppercase font-semibold mb-1">Diagnosis</label>
                                                <span className="font-medium text-gray-900">{selectedPrescription.diagnosis}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mb-8">
                                        <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-200 pb-2 mb-4 flex items-center gap-2">
                                            <Pill size={16} /> Prescribed Medicines
                                        </h3>
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase text-left">
                                                <tr>
                                                    <th className="py-2 px-3 pl-4 rounded-l-md">Medicine</th>
                                                    <th className="py-2 px-3">Dosage</th>
                                                    <th className="py-2 px-3">Frequency</th>
                                                    <th className="py-2 px-3 rounded-r-md">Duration</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {selectedPrescription.medicines.map((med, idx) => (
                                                    <tr key={idx}>
                                                        <td className="py-3 px-3 pl-4 font-semibold text-gray-900">{med.name}</td>
                                                        <td className="py-3 px-3 text-gray-600">{med.dosage}</td>
                                                        <td className="py-3 px-3 text-gray-600">{med.frequency}</td>
                                                        <td className="py-3 px-3 text-gray-600">{med.duration}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {selectedPrescription.instructions && (
                                        <div className="mb-12">
                                            <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-200 pb-2 mb-4 flex items-center gap-2">
                                                <FileText size={16} /> Additional Instructions
                                            </h3>
                                            <div className="p-4 bg-yellow-50 text-gray-800 rounded-lg text-sm border border-yellow-100">
                                                {selectedPrescription.instructions}
                                            </div>
                                        </div>
                                    )}
                                    <div className="mt-12 pt-8 border-t border-gray-200 flex justify-between items-end">
                                        <div className="text-xs text-gray-400">
                                            <p>Generated by MediTrack Digital Health System</p>
                                            <p>{new Date(selectedPrescription.createdAt).toLocaleString()}</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl text-blue-900 mb-1 font-bold italic" style={{ fontFamily: 'cursive' }}>
                                                {(selectedPrescription.doctorId?.name || 'Unknown').replace(/^Dr\.?\s+/i, '')}
                                            </div>
                                            <div className="h-px w-32 bg-gray-300 mb-1 mx-auto"></div>
                                            <p className="text-xs text-gray-500 uppercase font-bold">Signature</p>
                                        </div>
                                    </div>
                                    <div className="mt-8 pt-4 border-t border-gray-100 text-center">
                                        <p className="text-xs text-gray-400">This is a digitally generated prescription. Valid without physical signature in accordance with IT Act.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                        <style>{`
                            @media print {
                                @page {
                                    margin: 0;
                                    size: A4 portrait;
                                }
                                body {
                                    margin: 0;
                                    padding: 0;
                                }
                                body > * {
                                    display: none !important;
                                }
                                #print-container {
                                    display: block !important;
                                    position: relative !important;
                                    width: 100% !important;
                                    max-width: 210mm !important;
                                    margin: 0 auto !important;
                                    padding: 20px !important;
                                    background: white !important;
                                }
                                * {
                                    -webkit-print-color-adjust: exact !important;
                                    print-color-adjust: exact !important;
                                    color-adjust: exact !important;
                                }
                            }
                        `}</style>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
export default AdminPrescriptions;
