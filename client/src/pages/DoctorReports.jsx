import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FileText, Upload, Download, Search, Filter, User, Calendar, Trash2, Pencil, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import DashboardSidebar from '../components/DashboardSidebar';
import FilePreviewModal from '../components/FilePreviewModal';

function DoctorReports() {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const fileInputRef = useRef(null);

    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [filterCategory, setFilterCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const [uploadCategory, setUploadCategory] = useState('General');
    const [uploadNotes, setUploadNotes] = useState('');

    const [previewFile, setPreviewFile] = useState(null);
    const [editingReport, setEditingReport] = useState(null);

    useEffect(() => {
        if (!user || user.role !== 'doctor') {
            navigate('/login');
            return;
        }
        fetchPatients();
    }, [user, navigate]);

    useEffect(() => {
        if (selectedPatientId) {
            fetchPatientReports(selectedPatientId);
        } else {
            setReports([]);
        }
    }, [selectedPatientId]);

    const fetchPatients = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/patients`, { withCredentials: true });
            setPatients(res.data);
            if (res.data.length > 0) setSelectedPatientId(res.data[0]._id);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load patients");
        }
    };

    const fetchPatientReports = async (patientId) => {
        setLoading(true);
        try {

            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/reports`, { withCredentials: true });
            const allReports = res.data;
            console.log('--- Debug DoctorReports ---');
            console.log('Selected Patient ID:', patientId);
            console.log('All Reports Fetched:', allReports.length);
            if (allReports.length > 0) {
                console.log('Sample Report PatientID:', allReports[0].patientId);
                console.log('Sample Report Type:', typeof allReports[0].patientId);
            }

            const patientReports = allReports.filter(r => {
                const pId = r.patientId?._id || r.patientId;
                return pId?.toString() === patientId?.toString();
            });

            console.log('Filtered Reports:', patientReports.length);
            setReports(patientReports);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load reports");
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!fileInputRef.current.files[0]) return toast.error("Please select a file");
        if (!selectedPatientId) return toast.error("Please select a patient");

        const formData = new FormData();
        formData.append('file', fileInputRef.current.files[0]);
        formData.append('patientId', selectedPatientId);
        formData.append('category', uploadCategory);
        formData.append('notes', uploadNotes);
        formData.append('visibility', 'Doctor');

        setUploading(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/reports`, formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Report uploaded");
            fetchPatientReports(selectedPatientId);
            setUploadNotes('');
            setUploadCategory('General');
            fileInputRef.current.value = '';
        } catch (err) {
            toast.error("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const getFilteredReports = () => {
        return reports.filter(r => {
            const matchesSearch = r.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.notes.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = filterCategory === 'All' || r.category === filterCategory;
            return matchesSearch && matchesCategory;
        });
    };

    const handlePreview = (report) => {
        const fileUrl = `${import.meta.env.VITE_API_URL}/api/reports/${report._id}/download`;
        const type = report.originalName.match(/\.(jpg|jpeg|png|gif)$/i) ? 'image' :
            report.originalName.match(/\.pdf$/i) ? 'application/pdf' : 'file';

        setPreviewFile({
            url: fileUrl,
            name: report.originalName,
            type: type
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this report?")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/reports/${id}`, { withCredentials: true });
            setReports(reports.filter(r => r._id !== id));
            toast.success("Report deleted");
        } catch (err) {
            toast.error("Failed to delete report");
        }
    };

    const handleUpdateReport = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/reports/${editingReport._id}`, {
                category: editingReport.category,
                notes: editingReport.notes
            }, { withCredentials: true });

            setReports(reports.map(r => r._id === editingReport._id ? res.data : r));
            toast.success("Report updated");
            setEditingReport(null);
        } catch (err) {
            toast.error("Failed to update report");
        }
    };

    const selectedPatient = patients.find(p => p._id === selectedPatientId);

    return (
        <div className="min-h-screen flex font-sans bg-gray-50">
            <DashboardSidebar role="doctor" />

            <div className="flex-1 p-8 ml-20 transition-all duration-300">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Patient Reports</h1>
                    <p className="text-gray-500">View and manage medical records for your patients</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    { }
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Patient</label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <select
                                    value={selectedPatientId}
                                    onChange={(e) => setSelectedPatientId(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
                                >
                                    <option value="" disabled>Choose a patient</option>
                                    {patients.map(p => (
                                        <option key={p._id} value={p._id}>{p.name} ({p.patientId})</option>
                                    ))}
                                </select>
                            </div>

                            {selectedPatient && (
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                            {selectedPatient.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{selectedPatient.name}</h3>
                                            <p className="text-xs text-gray-500">{selectedPatient.email}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                                        <div className="bg-gray-50 p-2 rounded">
                                            <span className="block text-gray-500">Gender</span>
                                            <span className="font-medium">{selectedPatient.gender || 'N/A'}</span>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded">
                                            <span className="block text-gray-500">Reports</span>
                                            <span className="font-medium">{reports.length}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate('/doctor/prescriptions?patientId=' + selectedPatientId)}
                                        className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg text-sm font-medium transition shadow-sm"
                                    >
                                        View Prescriptions
                                    </button>
                                </div>
                            )}
                        </div>

                        { }
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Upload size={18} className="text-blue-500" /> Upload Report
                            </h3>
                            <form onSubmit={handleUpload} className="space-y-3">
                                <select
                                    value={uploadCategory}
                                    onChange={(e) => setUploadCategory(e.target.value)}
                                    className="w-full text-sm p-2 border border-gray-300 rounded-lg outline-none"
                                >
                                    <option value="General">General Report</option>
                                    <option value="Lab Result">Lab Result</option>
                                    <option value="Diagnosis">Diagnosis</option>
                                    <option value="Prescription">Prescription</option>
                                    <option value="Imaging">Imaging</option>
                                    <option value="Blood Test">Blood Test</option>
                                    <option value="Discharge Summary">Discharge Summary</option>
                                </select>
                                <textarea
                                    placeholder="Doctor's notes..."
                                    value={uploadNotes}
                                    onChange={(e) => setUploadNotes(e.target.value)}
                                    className="w-full text-sm p-2 border border-gray-300 rounded-lg outline-none h-20 resize-none"
                                />
                                <div
                                    onClick={() => fileInputRef.current.click()}
                                    className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition"
                                >
                                    <span className="text-xs text-gray-500 block">Click to select file</span>
                                    {fileInputRef.current?.files[0] && <span className="text-xs text-blue-600 font-medium truncate">{fileInputRef.current.files[0].name}</span>}
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" onChange={() => setUploading(false)} /> { }

                                <button disabled={uploading} type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
                                    {uploading ? 'Uploading...' : 'Upload Report'}
                                </button>
                            </form>
                        </div>
                    </div>

                    { }
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            { }
                            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
                                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
                                    {['All', 'General', 'Lab Result', 'Diagnosis', 'Prescription', 'Imaging', 'Blood Test'].map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setFilterCategory(cat)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${filterCategory === cat ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:bg-gray-100'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                                <div className="relative w-full sm:w-64">
                                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search files..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            { }
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            <th className="px-6 py-3">Document</th>
                                            <th className="px-6 py-3">Uploaded By</th>
                                            <th className="px-6 py-3">Notes</th>
                                            <th className="px-6 py-3">Date</th>
                                            <th className="px-6 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {loading ? (
                                            <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400">Loading reports...</td></tr>
                                        ) : getFilteredReports().length === 0 ? (
                                            <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400">No reports found for this patient.</td></tr>
                                        ) : (
                                            getFilteredReports().map(report => (
                                                <tr key={report._id} className="hover:bg-gray-50/80 transition cursor-pointer" onClick={() => handlePreview(report)}>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg ${report.type === 'Image' ? 'bg-purple-100 text-purple-600' : 'bg-red-100 text-red-600'
                                                                }`}>
                                                                <FileText size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">{report.originalName}</p>
                                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium mt-1 inline-block">
                                                                    {report.category}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {report.uploadedBy?.name || 'Unknown'}
                                                            </span>
                                                            <div className="flex items-center mt-1">
                                                                {(report.uploadedBy?._id?.toString() === user?.id || report.uploadedBy === user?.id) ? (
                                                                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">You</span>
                                                                ) : (
                                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ${report.uploadedByRole === 'doctor' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                                                                        }`}>
                                                                        {report.uploadedByRole === 'doctor' ? 'Doctor' : 'Patient'}
                                                                    </span>
                                                                )}
                                                                { }
                                                                <span className="text-xs text-gray-400 ml-2 scale-90">
                                                                    ID: {(report.uploadedBy?.patientId || report.uploadedBy?.doctorId || 'N/A')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-xs text-gray-500 truncate max-w-[200px]" title={report.notes}>
                                                            {report.notes || '-'}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {new Date(report.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        { }
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handlePreview(report) }}
                                                                className="w-9 h-9 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all duration-300 shadow-sm"
                                                                title="Download Report"
                                                            >
                                                                <Download size={16} />
                                                            </button>
                                                            {(report.uploadedBy?._id?.toString() === user?.id || report.uploadedBy === user?.id) && (
                                                                <>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setEditingReport(report); }}
                                                                        className="w-9 h-9 flex items-center justify-center bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all duration-300 shadow-sm"
                                                                        title="Edit Details"
                                                                    >
                                                                        <Pencil size={16} />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleDelete(report._id); }}
                                                                        className="w-9 h-9 flex items-center justify-center bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all duration-300 shadow-sm"
                                                                        title="Delete Report"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <FilePreviewModal
                isOpen={!!previewFile}
                onClose={() => setPreviewFile(null)}
                fileUrl={previewFile?.url}
                fileName={previewFile?.name}
                fileType={previewFile?.type}
            />

            { }
            {editingReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">Edit Report Settings</h3>
                            <button onClick={() => setEditingReport(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateReport} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    value={editingReport.category}
                                    onChange={(e) => setEditingReport({ ...editingReport, category: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                >
                                    <option value="General">General Report</option>
                                    <option value="Lab Result">Lab Result</option>
                                    <option value="Diagnosis">Diagnosis</option>
                                    <option value="Prescription">Prescription</option>
                                    <option value="Imaging">Imaging</option>
                                    <option value="Blood Test">Blood Test</option>
                                    <option value="Discharge Summary">Discharge Summary</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor's Notes</label>
                                <textarea
                                    rows="4"
                                    value={editingReport.notes}
                                    onChange={(e) => setEditingReport({ ...editingReport, notes: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ring-0 resize-none"
                                    placeholder="Add refined medical notes..."
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingReport(null)}
                                    className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition shadow-sm hover:shadow-md"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DoctorReports;
