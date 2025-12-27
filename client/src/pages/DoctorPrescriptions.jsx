import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Plus, Search, User, Pill, X, Save, Clock, AlertCircle, Calendar, Download, Printer, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import DashboardSidebar from '../components/DashboardSidebar';
function DoctorPrescriptions() {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const [searchParams] = useSearchParams();
    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState(searchParams.get('patientId') || '');
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingPrescriptionId, setEditingPrescriptionId] = useState(null);
    const [prescriptions, setPrescriptions] = useState([]);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [diagnosis, setDiagnosis] = useState('');
    const [instructions, setInstructions] = useState('');
    const [medicines, setMedicines] = useState([
        { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ]);
    useEffect(() => {
        if (!user || user.role !== 'doctor') {
            navigate('/login');
            return;
        }
        fetchPatients();
        fetchPrescriptions();
    }, [user, navigate]);
    useEffect(() => {
        if (selectedPatientId) 
    }, [selectedPatientId]);
    const fetchPatients = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/patients`, { withCredentials: true });
            setPatients(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load patients");
        }
    };
    const fetchPrescriptions = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/prescriptions`, { withCredentials: true });
            setPrescriptions(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load prescriptions");
        }
    };
    const handleAddMedicine = () => {
        setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
    };
    const handleRemoveMedicine = (index) => {
        const newMeds = [...medicines];
        newMeds.splice(index, 1);
        setMedicines(newMeds);
    };
    const handleMedicineChange = (index, field, value) => {
        const newMeds = [...medicines];
        newMeds[index][field] = value;
        setMedicines(newMeds);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPatientId) return toast.error("Please select a patient");
        if (!diagnosis) return toast.error("Diagnosis is required");
        if (medicines.some(m => !m.name)) return toast.error("Medicine name is required");
        try {
            if (isEditing && editingPrescriptionId) {
                await axios.put(`${import.meta.env.VITE_API_URL}/api/prescriptions/${editingPrescriptionId}`, {
                    patientId: selectedPatientId,
                    diagnosis,
                    medicines,
                    instructions
                }, { withCredentials: true });
                toast.success("Prescription updated successfully");
                setIsEditing(false);
                setEditingPrescriptionId(null);
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/prescriptions`, {
                    patientId: selectedPatientId,
                    diagnosis,
                    medicines,
                    instructions
                }, { withCredentials: true });
                toast.success("Prescription created successfully");
            }
            setIsCreating(false);
            fetchPrescriptions();
            setDiagnosis('');
            setInstructions('');
            setMedicines([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
        } catch (error) {
            toast.error(isEditing ? "Failed to update prescription" : "Failed to create prescription");
        }
    };
    const handleEdit = (pres) => {
        setIsEditing(true);
        setEditingPrescriptionId(pres._id);
        setSelectedPatientId(pres.patientId?._id || pres.patientId);
        setDiagnosis(pres.diagnosis);
        setInstructions(pres.instructions || '');
        setMedicines(pres.medicines);
        setIsCreating(true);
    };
    const handleDelete = async (prescriptionId) => {
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/prescriptions/${prescriptionId}`, { withCredentials: true });
            toast.success("Prescription deleted successfully");
            setDeleteConfirmId(null);
            fetchPrescriptions();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete prescription");
        }
    };
    const handleCancelEdit = () => {
        setIsCreating(false);
        setIsEditing(false);
        setEditingPrescriptionId(null);
        setDiagnosis('');
        setInstructions('');
        setMedicines([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
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
    const filteredPrescriptions = selectedPatientId
        ? prescriptions.filter(p => p.patientId?._id === selectedPatientId || p.patientId === selectedPatientId)
        : [];
    const selectedPatient = patients.find(p => p._id === selectedPatientId);
    return (
        <div className="min-h-screen flex font-sans bg-gray-50">
            <DashboardSidebar role="doctor" />
            <div className="flex-1 p-8 ml-20 transition-all duration-300">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
                        <p className="text-gray-500">Manage patient prescriptions and history</p>
                    </div>
                    {selectedPatientId && !isCreating && (
                        <button
                            onClick={() => {
                                setIsEditing(false);
                                setEditingPrescriptionId(null);
                                setIsCreating(true);
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
                        >
                            <Plus size={18} /> New Prescription
                        </button>
                    )}
                </header>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Patient</label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <select
                                    value={selectedPatientId}
                                    onChange={(e) => {
                                        setSelectedPatientId(e.target.value);
                                        setIsCreating(false);
                                    }}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
                                >
                                    <option value="" disabled>Choose a patient</option>
                                    {patients.map(p => (
                                        <option key={p._id} value={p._id}>{p.name} ({p.patientId})</option>
                                    ))}
                                </select>
                            </div>
                            {selectedPatient && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <h3 className="font-bold text-gray-900 text-sm mb-2">{selectedPatient.name}</h3>
                                    <div className="text-xs text-gray-500 space-y-1">
                                        <p>ID: {selectedPatient.patientId}</p>
                                        <p>Email: {selectedPatient.email}</p>
                                        <p>Total Prescriptions: {filteredPrescriptions.length}</p>
                                    </div>
                                    <button
                                        onClick={() => navigate('/doctor/reports/' + selectedPatientId)}
                                        className="w-full mt-4 text-blue-600 border border-blue-200 hover:bg-blue-50 py-1.5 rounded-lg text-xs font-medium transition"
                                    >
                                        View All Reports
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="lg:col-span-3">
                        {!selectedPatientId ? (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
                                <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                                <p className="text-lg">Select a patient to manage prescriptions</p>
                            </div>
                        ) : isCreating ? (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-lg font-bold text-gray-900">{isEditing ? 'Edit' : 'New'} Prescription for {selectedPatient?.name}</h2>
                                    <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                                </div>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                                        <input
                                            type="text"
                                            value={diagnosis}
                                            onChange={(e) => setDiagnosis(e.target.value)}
                                            placeholder="e.g. Acute Bronchitis"
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-sm font-medium text-gray-700">Medicines</label>
                                            <button type="button" onClick={handleAddMedicine} className="text-blue-600 text-sm font-medium hover:underline flex items-center">
                                                <Plus size={16} className="mr-1" /> Add Medicine
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {medicines.map((med, idx) => (
                                                <div key={idx} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                    <div className="flex-1 w-full md:w-auto">
                                                        <input
                                                            type="text"
                                                            placeholder="Medicine Name (e.g. Amoxicillin)"
                                                            value={med.name}
                                                            onChange={(e) => handleMedicineChange(idx, 'name', e.target.value)}
                                                            className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="w-full md:w-24">
                                                        <input
                                                            type="text"
                                                            placeholder="Dosage (500mg)"
                                                            value={med.dosage}
                                                            onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                                                            className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    <div className="w-full md:w-32">
                                                        <input
                                                            type="text"
                                                            placeholder="Freq (1-0-1)"
                                                            value={med.frequency}
                                                            onChange={(e) => handleMedicineChange(idx, 'frequency', e.target.value)}
                                                            className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    <div className="w-full md:w-24">
                                                        <input
                                                            type="text"
                                                            placeholder="Duration (5 days)"
                                                            value={med.duration}
                                                            onChange={(e) => handleMedicineChange(idx, 'duration', e.target.value)}
                                                            className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    <div className="w-full md:w-auto">
                                                        <input
                                                            type="text"
                                                            placeholder="Instructions (after food)"
                                                            value={med.instructions}
                                                            onChange={(e) => handleMedicineChange(idx, 'instructions', e.target.value)}
                                                            className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    {medicines.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveMedicine(idx)}
                                                            className="text-red-400 hover:text-red-600 p-1"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">General Advice / Notes</label>
                                        <textarea
                                            value={instructions}
                                            onChange={(e) => setInstructions(e.target.value)}
                                            rows="3"
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                            placeholder="Rest, diet, follow-up..."
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm transition flex items-center"
                                        >
                                            <Save size={18} className="mr-2" /> {isEditing ? 'Update' : 'Issue'} Prescription
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredPrescriptions.length === 0 ? (
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                                        <Pill size={48} className="mx-auto text-blue-100 mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900">No prescriptions found</h3>
                                        <p className="text-gray-500 mt-1">Create the first prescription for this patient.</p>
                                        <button
                                            onClick={() => setIsCreating(true)}
                                            className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
                                        >
                                            Create Prescription
                                        </button>
                                    </div>
                                ) : (
                                    filteredPrescriptions.map(pres => (
                                        <div key={pres._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-900">{pres.diagnosis}</h3>
                                                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                                        <span className="flex items-center"><Calendar size={14} className="mr-1" /> {new Date(pres.date || pres.createdAt).toLocaleDateString()}</span>
                                                        <span className="flex items-center"><Clock size={14} className="mr-1" /> {new Date(pres.date || pres.createdAt).toLocaleTimeString()}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEdit(pres)}
                                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 bg-blue-50 rounded-lg flex items-center gap-1"
                                                        title="Edit Prescription"
                                                    >
                                                        <Edit2 size={14} /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirmId(pres._id)}
                                                        className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 bg-red-50 rounded-lg flex items-center gap-1"
                                                        title="Delete Prescription"
                                                    >
                                                        <Trash2 size={14} /> Delete
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedPrescription(pres); setIsPrintModalOpen(true); }}
                                                        className="text-gray-600 hover:text-gray-800 text-sm font-medium px-3 py-1 bg-gray-50 rounded-lg flex items-center gap-1"
                                                        title="View/Print Prescription"
                                                    >
                                                        <Printer size={14} /> Print
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-3 mb-4">
                                                {pres.medicines.map((med, idx) => (
                                                    <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                                            <span className="font-medium text-gray-900">{med.name}</span>
                                                            <span className="text-gray-500">({med.dosage})</span>
                                                        </div>
                                                        <div className="text-gray-600">
                                                            {med.frequency} • {med.duration}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {pres.instructions && (
                                                <div className="flex items-start text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
                                                    <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                                                    <p>{pres.instructions}</p>
                                                </div>
                                            )}
                                            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                                                <span>Doctor: {pres.doctorId?.name || 'Unknown'} (ID: {pres.doctorId?.doctorId || 'N/A'})</span>
                                                <span>Prescription ID: {pres._id.slice(-8)}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {isPrintModalOpen && selectedPrescription && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm no-print">
                    <div className="bg-gray-100 rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
                        <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-800">Prescription Details</h2>
                            <div className="flex gap-3">
                                <button
                                    onClick={handlePrint}
                                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                                >
                                    <Printer size={18} /> Print / Save PDF
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
                        <div className="overflow-y-auto flex-1 p-8 bg-gray-50">
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
                                        <h2 className="text-lg font-bold text-gray-900">{selectedPrescription.doctorId?.name || 'Unknown Doctor'}</h2>
                                        <p className="text-sm text-blue-600 font-medium">{selectedPrescription.doctorId?.specialization || 'N/A'}</p>
                                        <p className="text-xs text-gray-500 mt-1">{selectedPrescription.doctorId?.email || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-100">
                                    <div className="grid grid-cols-2 gap-y-4 text-sm">
                                        <div>
                                            <label className="block text-gray-500 text-xs uppercase font-semibold mb-1">Patient Name</label>
                                            <span className="font-bold text-gray-900 text-lg">{selectedPrescription.patientId?.name || 'N/A'}</span>
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
                                            {selectedPrescription?.doctorId?.name || 'Unknown Signature'}
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
                    </div>
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
            {deleteConfirmId && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="text-red-600" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Delete Prescription</h3>
                                <p className="text-sm text-gray-500">This action cannot be undone</p>
                            </div>
                        </div>
                        <p className="text-gray-700 mb-6">
                            Are you sure you want to delete this prescription? The patient will no longer have access to this prescription record.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirmId)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition flex items-center gap-2"
                            >
                                <Trash2 size={18} /> Delete Prescription
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
export default DoctorPrescriptions;
