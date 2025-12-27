import { useState, useEffect, useReducer, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Trash2, Download, FileText, Filter, Upload, File, Image as ImageIcon, Eye, Pencil, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import FilePreviewModal from '../components/FilePreviewModal';
const uploadReducer = (state, action) => {
    switch (action.type) {
        case 'START':
            return { ...state, uploading: true, error: null, success: false };
        case 'SUCCESS':
            return { ...state, uploading: false, success: true, message: action.payload };
        case 'ERROR':
            return { ...state, uploading: false, error: action.payload };
        case 'RESET':
            return { ...state, uploading: false, success: false, error: null, message: '' };
        default:
            return state;
    }
};
function Reports() {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const fileInputRef = useRef(null);
    const [uploadState, dispatch] = useReducer(uploadReducer, {
        uploading: false,
        error: null,
        success: false,
        message: ''
    });
    const [reports, setReports] = useState([]);
    const [filterText, setFilterText] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [previewFile, setPreviewFile] = useState(null);
    const [editingReport, setEditingReport] = useState(null);
    const [patientName, setPatientName] = useState('');
    const [category, setCategory] = useState('General');
    const [notes, setNotes] = useState('');
    const [visibility, setVisibility] = useState('Private');
    useEffect(() => {
        if (!user) navigate('/login');
        fetchReports();
    }, [user, navigate]);
    const fetchReports = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/reports', { withCredentials: true });
            setReports(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load reports');
        }
    };
    const handleUpload = useCallback(async (e) => {
        e.preventDefault();
        if (!fileInputRef.current.files[0]) {
            dispatch({ type: 'ERROR', payload: 'Please select a file' });
            return;
        }
        const formData = new FormData();
        formData.append('file', fileInputRef.current.files[0]);
        formData.append('patientName', user?.name || 'Unknown'); 
        formData.append('category', category);
        formData.append('notes', notes);
        formData.append('visibility', visibility);
        dispatch({ type: 'START' });
        try {
            await axios.post('http://localhost:5000/api/reports', formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            dispatch({ type: 'SUCCESS', payload: 'Report uploaded successfully!' });
            toast.success('Report uploaded!');
            fetchReports();
            setCategory('General');
            setNotes('');
            setVisibility('Private');
            fileInputRef.current.value = '';
            if (window.confirm('Report Uploaded! Do you want to notify your assigned doctor?')) {
                handleNotifyDoctor();
            }
        } catch (err) {
            dispatch({ type: 'ERROR', payload: err.response?.data?.message || 'Upload failed' });
            toast.error('Upload failed');
        }
    }, [category, notes, visibility, user]);
    const handleNotifyDoctor = async () => {
        try {
            toast.success('Doctor notified (Simulated)');
        } catch (e) {
            toast.error('Failed to notify');
        }
    };
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this report?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/reports/${id}`, { withCredentials: true });
            setReports(reports.filter(r => r._id !== id));
            toast.success('Report deleted');
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete report');
        }
    };
    const handleUpdateReport = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.put(`http://localhost:5000/api/reports/${editingReport._id}`, {
                category: editingReport.category,
                notes: editingReport.notes,
                visibility: editingReport.visibility
            }, { withCredentials: true });
            setReports(reports.map(r => r._id === editingReport._id ? res.data : r));
            toast.success('Report updated');
            setEditingReport(null);
        } catch (err) {
            toast.error('Failed to update report');
        }
    };
    const handlePreview = (report) => {
        const fileUrl = `http://localhost:5000/api/reports/${report._id}/download`;
        const type = report.originalName.match(/\.(jpg|jpeg|png|gif)$/i) ? 'image' :
            report.originalName.match(/\.pdf$/i) ? 'application/pdf' : 'file';
        setPreviewFile({
            url: fileUrl,
            name: report.originalName,
            type: type
        });
    };
    const filteredReports = useMemo(() => {
        return reports.filter(r => {
            const matchesText =
                (r.originalName && r.originalName.toLowerCase().includes(filterText.toLowerCase())) ||
                (r.notes && r.notes.toLowerCase().includes(filterText.toLowerCase()));
            const matchesCategory = categoryFilter === 'All' || r.category === categoryFilter;
            return matchesText && matchesCategory;
        });
    }, [reports, filterText, categoryFilter]);
    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                if (user?.role === 'doctor') navigate('/doctor-dashboard');
                                else if (user?.role === 'admin') navigate('/admin/dashboard');
                                else navigate('/health-dashboard');
                            }}
                            className="bg-white p-2 rounded-full shadow-sm hover:shadow-md border border-gray-200 text-blue-600 hover:text-blue-800 transition"
                            title="Back to Dashboard"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Medical Records</h1>
                            <p className="text-gray-500 mt-1">Manage, upload, and track your medical reports</p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-24">
                            <h2 className="text-lg font-bold mb-4 flex items-center text-gray-700">
                                <Upload className="w-5 h-5 mr-2 text-blue-500" /> Upload New Report
                            </h2>
                            <form onSubmit={handleUpload} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    >
                                        <option value="General">General</option>
                                        <option value="Blood Test">Blood Test</option>
                                        <option value="Imaging">Imaging (X-Ray, MRI)</option>
                                        <option value="Discharge Summary">Discharge Summary</option>
                                        <option value="Lab Result">Lab Result</option>
                                        <option value="Diagnosis">Diagnosis</option>
                                        <option value="Prescription">Prescription (Scan)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                                    <select
                                        value={visibility}
                                        onChange={(e) => setVisibility(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    >
                                        <option value="Private">Private (Only Me)</option>
                                        <option value="Doctor">Shared with Doctor</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes </label>
                                    <textarea
                                        rows="3"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Add details..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                                    <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-50 transition text-center cursor-pointer" onClick={() => fileInputRef.current.click()}>
                                        <FileText className="mx-auto h-8 w-8 text-gray-400" />
                                        <span className="mt-2 block text-sm font-medium text-gray-600">Select PDF or Image</span>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            onChange={() => dispatch({ type: 'RESET' })}
                                        />
                                    </div>
                                    {fileInputRef.current?.files[0] && (
                                        <p className="text-sm text-green-600 mt-2 text-center truncate">Selected: {fileInputRef.current.files[0].name}</p>
                                    )}
                                </div>
                                {uploadState.error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{uploadState.error}</p>}
                                <button
                                    type="submit"
                                    disabled={uploadState.uploading}
                                    className={`w-full py-2.5 rounded-lg text-white font-medium shadow-sm transition ${uploadState.uploading
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'
                                        }`}
                                >
                                    {uploadState.uploading ? 'Uploading...' : 'Upload Securely'}
                                </button>
                            </form>
                        </div>
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
                            <div className="relative w-full sm:w-64">
                                <Filter className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search reports..."
                                    value={filterText}
                                    onChange={(e) => setFilterText(e.target.value)}
                                    className="pl-9 p-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                                {['All', 'Blood Test', 'Imaging', 'Discharge Summary'].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setCategoryFilter(cat)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${categoryFilter === cat
                                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded By</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor's Notes</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredReports.map((report) => (
                                            <tr key={report._id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => handlePreview(report)}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className={`p-2 rounded-lg mr-3 ${report.type === 'Image' ? 'bg-purple-100 text-purple-600' : 'bg-red-100 text-red-600'}`}>
                                                            {report.type === 'Image' ? <ImageIcon size={20} /> : <File size={20} />}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900 truncate max-w-[180px]">{report.originalName}</p>
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${report.category === 'Blood Test' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                                                                }`}>
                                                                {report.category}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {report.uploadedBy?.name || 'Unknown'}
                                                        </span>
                                                        <div className="flex items-center mt-1">
                                                            {(report.uploadedBy?._id?.toString() === user?.id || report.uploadedBy === user?.id) ? (
                                                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">You</span>
                                                            ) : (
                                                                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                                                                    {report.uploadedBy?.role === 'doctor' ? 'Doctor' : report.uploadedBy?.role}
                                                                </span>
                                                            )}
                                                            {report.uploadedBy?.role === 'doctor' && (
                                                                <span className="text-xs text-gray-500 ml-2">
                                                                    {report.uploadedBy?.specialization || `ID: ${report.uploadedBy?.doctorId || 'N/A'}`}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-gray-500 truncate max-w-[200px]" title={report.notes}>
                                                        {report.notes || '-'}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(report.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end items-center gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handlePreview(report); }}
                                                            className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all shadow-sm"
                                                            title="View Details"
                                                        >
                                                            <Download size={16} />
                                                        </button>
                                                        {(report.uploadedBy?._id?.toString() === user?.id || report.uploadedBy === user?.id) && (
                                                            <>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setEditingReport(report); }}
                                                                    className="w-8 h-8 flex items-center justify-center bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all shadow-sm"
                                                                    title="Edit Report"
                                                                >
                                                                    <Pencil size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDelete(report._id); }}
                                                                    className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-all shadow-sm"
                                                                    title="Delete Report"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredReports.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                                    <p>No reports found.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {editingReport && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">Edit Report Details</h3>
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
                                    className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                                >
                                    <option value="General">General</option>
                                    <option value="Blood Test">Blood Test</option>
                                    <option value="Imaging">Imaging (X-Ray, MRI)</option>
                                    <option value="Discharge Summary">Discharge Summary</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                                <select
                                    value={editingReport.visibility}
                                    onChange={(e) => setEditingReport({ ...editingReport, visibility: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                                >
                                    <option value="Private">Private (Only Me)</option>
                                    <option value="Doctor">Shared with Doctor</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    rows="3"
                                    value={editingReport.notes}
                                    onChange={(e) => setEditingReport({ ...editingReport, notes: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setEditingReport(null)}
                                    className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <FilePreviewModal
                isOpen={!!previewFile}
                onClose={() => setPreviewFile(null)}
                fileUrl={previewFile?.url}
                fileName={previewFile?.name}
                fileType={previewFile?.type}
            />
        </div>
    );
}
export default Reports;
