import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Pill, Printer, X, Calendar, User, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
function PatientPrescriptions() {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchPrescriptions();
    }, [user, navigate]);
    const fetchPrescriptions = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/prescriptions`, { withCredentials: true });
            setPrescriptions(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load prescriptions');
        } finally {
            setLoading(false);
        }
    };
    const openPrintModal = (prescription) => {
        setSelectedPrescription(prescription);
        setIsPrintModalOpen(true);
    };
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
            <style>
                {`
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
                `}
            </style>
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                            <Pill className="text-blue-600" size={32} /> My Prescriptions
                        </h1>
                        <p className="text-gray-500 mt-1">View and print your digital prescriptions details</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => navigate('/health-dashboard')}
                            className="text-gray-500 hover:text-blue-600 font-medium transition"
                        >
                            &larr; Back to Dashboard
                        </button>
                    </div>
                </div>
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : prescriptions.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <div className="inline-flex p-4 rounded-full bg-blue-50 text-blue-500 mb-4">
                            <Pill size={40} />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900">No Prescriptions Yet</h3>
                        <p className="text-gray-500 mt-2">You haven't been issued any digital prescriptions yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {prescriptions.map((pres) => (
                            <div key={pres._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                        Active
                                    </div>
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Calendar size={12} /> {new Date(pres.date).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="font-bold text-lg text-gray-900 mb-1">{pres.diagnosis}</h3>
                                <div className="mb-4 space-y-1">
                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                        <User size={14} className="text-blue-500" /> <span className="font-semibold">{pres.doctorId?.name || 'Unattributed'}</span>
                                    </p>
                                    <p className="text-xs text-gray-500 ml-5">
                                        Doctor ID: {pres.doctorId?.doctorId || 'N/A'}
                                    </p>
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Medicines ({pres.medicines.length})</p>
                                    <ul className="space-y-2 mb-4">
                                        {pres.medicines.slice(0, 3).map((med, idx) => (
                                            <li key={idx} className="text-sm text-gray-700 flex justify-between">
                                                <span>{med.name}</span>
                                                <span className="text-gray-400 text-xs">{med.dosage}</span>
                                            </li>
                                        ))}
                                        {pres.medicines.length > 3 && (
                                            <li className="text-xs text-blue-600 font-medium">+ {pres.medicines.length - 3} more medicines</li>
                                        )}
                                    </ul>
                                </div>
                                <div className="space-y-2 mt-auto">
                                    <button
                                        onClick={() => openPrintModal(pres)}
                                        className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                                    >
                                        <FileText size={18} /> View & Print
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {selectedPrescription && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 no-print">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Printer size={20} className="text-blue-600" /> Prescription Preview
                            </h3>
                            <button
                                onClick={() => setSelectedPrescription(null)}
                                className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-8 bg-gray-100">
                            <div
                                id="printable-prescription"
                                className="bg-white p-8 mx-auto shadow-sm max-w-[210mm] min-h-[297mm]" 
                                style={{ width: '100%', maxWidth: '800px' }}
                            >
                                <div className="border-b-2 border-blue-600 pb-6 mb-8 flex justify-between items-start">
                                    <div>
                                        <h1 className="text-3xl font-bold text-blue-900">MediTrack</h1>
                                        <p className="text-gray-500 text-sm mt-1">Digital Health Record System</p>
                                    </div>
                                    <div className="text-right">
                                        <h2 className="text-xl font-bold text-gray-900">{selectedPrescription.doctorId?.name || 'Unattributed'}</h2>
                                        <p className="text-gray-600 text-sm">{selectedPrescription.doctorId?.specialization || 'N/A'}</p>
                                        <p className="text-gray-500 text-xs mt-1">Doctor ID: {selectedPrescription.doctorId?.doctorId || 'N/A'}</p>
                                        <p className="text-gray-500 text-xs">Date: {new Date(selectedPrescription.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg mb-8 flex justify-between items-center border border-gray-100">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Patient Name</p>
                                        <p className="text-lg font-semibold text-gray-900">{selectedPrescription.patientId?.name || user?.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Diagnosis</p>
                                        <p className="text-lg font-medium text-gray-900">{selectedPrescription.diagnosis}</p>
                                    </div>
                                </div>
                                <div className="mb-8">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2 mb-4">Prescribed Medicines</h3>
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-xs text-gray-500 border-b border-gray-100">
                                                <th className="pb-2 font-medium">Medicine Name</th>
                                                <th className="pb-2 font-medium">Dosage</th>
                                                <th className="pb-2 font-medium">Frequency</th>
                                                <th className="pb-2 font-medium text-right">Duration</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            {selectedPrescription.medicines.map((med, idx) => (
                                                <tr key={idx} className="border-b border-gray-50 last:border-0">
                                                    <td className="py-3 font-medium text-gray-900">{med.name}</td>
                                                    <td className="py-3 text-gray-600">{med.dosage}</td>
                                                    <td className="py-3 text-gray-600">{med.frequency}</td>
                                                    <td className="py-3 text-gray-600 text-right">{med.duration}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {selectedPrescription.instructions && (
                                    <div className="mb-8 bg-amber-50 p-4 rounded-lg border border-amber-100">
                                        <h4 className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <FileText size={16} /> Doctor's Note / Instructions
                                        </h4>
                                        <p className="text-gray-700 text-sm leading-relaxed">
                                            {selectedPrescription.instructions}
                                        </p>
                                    </div>
                                )}
                                <div className="mt-12 pt-8 border-t border-gray-200 flex justify-between items-end">
                                    <div className="text-xs text-gray-400">
                                        <p>Generated by MediTrack Digital Health System</p>
                                        <p>{new Date().toLocaleString()}</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl text-blue-900 mb-1 font-bold italic" style={{ fontFamily: 'cursive' }}>
                                            {selectedPrescription.doctorId?.name || 'Unattributed'}
                                        </div>
                                        <div className="h-px w-32 bg-gray-300 mb-1"></div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Signature</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3 no-print">
                            <button
                                onClick={() => setSelectedPrescription(null)}
                                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition"
                            >
                                Close
                            </button>
                            <button
                                onClick={handlePrint}
                                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-200"
                            >
                                <Printer size={18} /> Print / Save as PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
export default PatientPrescriptions;
