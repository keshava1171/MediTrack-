import { useState, useEffect } from 'react';
import { FileText, Search, Filter, Calendar, Download, Trash2, Flag, Archive, AlertCircle, Eye, CheckCircle, BarChart2, HardDrive, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const AdminReports = () => {
    const { user } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    const [reports, setReports] = useState([]);
    const [stats, setStats] = useState({ global: { totalSize: 0, count: 0 }, topPatients: [] });
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(''); 
    const [typeFilter, setTypeFilter] = useState(''); 

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8; 

    const [selectedReport, setSelectedReport] = useState(null);
    const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
    const [flagReason, setFlagReason] = useState('');
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/admin/login');
            return;
        }
        fetchReports();
        fetchStats();
    }, [user, navigate]);

    const fetchReports = async () => {
        try {
            
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (statusFilter) params.append('status', statusFilter);
            if (typeFilter) params.append('type', typeFilter);

            const res = await fetch(`http://localhost:5000/api/reports/admin/all?${params.toString()}`, {
                credentials: 'include' 
            });

            if (res.status === 401) {
                toast.error('Session expired. Please login again.');
                navigate('/admin/login');
                return;
            }

            if (!res.ok) throw new Error('Failed to fetch reports');

            const data = await res.json();
            if (Array.isArray(data)) {
                setReports(data);
            } else {
                setReports([]);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load reports');
            setReports([]); 
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/reports/admin/stats', {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleFlag = async () => {
        if (!selectedReport) return;
        try {
            const res = await fetch(`http://localhost:5000/api/reports/admin/${selectedReport._id}/flag`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ reason: flagReason })
            });

            if (res.ok) {
                toast.success('Report updated');
                setIsFlagModalOpen(false);
                fetchReports();
            }
        } catch (error) {
            toast.error('Action failed');
        }
    };

    const handleUnflag = async (id) => {
        try {
            const res = await fetch(`http://localhost:5000/api/reports/admin/${id}/flag`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ reason: null }) 
            });

            if (res.ok) {
                toast.success('Report unflagged (Active)');
                fetchReports();
            }
        } catch (error) {
            toast.error('Action failed');
        }
    };

    const handleArchive = async (id, currentStatus) => {
        const isArchiving = currentStatus !== 'Archived';
        const action = isArchiving ? 'Archive' : 'Unarchive';

        if (!window.confirm(`${action} this report? ${isArchiving ? 'It will be hidden from normal views.' : 'It will be visible again.'}`)) return;

        try {
            const res = await fetch(`http://localhost:5000/api/reports/admin/${id}/archive`, {
                method: 'PATCH',
                credentials: 'include'
            });
            if (res.ok) {
                toast.success(`Report ${isArchiving ? 'archived' : 'unarchived'}`);
                fetchReports();
            }
        } catch (error) {
            toast.error('Action failed');
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchReports();
        }, 500);
        return () => clearTimeout(timeout);
    }, [searchTerm, statusFilter, typeFilter]);

    const totalPages = Math.ceil(reports.length / itemsPerPage);
    const displayedReports = reports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const formatBytes = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-2 transition-colors"
                        >
                            <ChevronLeft size={20} />
                            <span>Back to Dashboard</span>
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <FileText className="text-blue-600" /> Medical Reports Audit
                        </h1>
                        <p className="text-gray-500 mt-1">Monitor, audit, and manage system-wide medical archives.</p>
                    </div>
                </div>

                {}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <HardDrive size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Storage Used</p>
                            <h3 className="text-2xl font-bold text-gray-900">{formatBytes(stats?.global?.totalSize || 0)}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                            <FileText size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Files Active</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats?.global?.count || 0}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                            <BarChart2 size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Top Uploader</p>
                            <h3 className="text-lg font-bold text-gray-900 truncate max-w-[150px]">
                                {stats?.topPatients?.[0]?._id || 'N/A'}
                            </h3>
                        </div>
                    </div>
                </div>

                {}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Report Status Guide</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
                            <span className="mt-1 w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm"></span>
                            <div>
                                <span className="block font-medium text-green-800">Active</span>
                                <p className="text-xs text-green-600 mt-1">
                                    Normal, visible to all (Patient, Doctor, Admin). Ready for download.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
                            <span className="mt-1 w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm"></span>
                            <div>
                                <span className="block font-medium text-red-800">Flagged</span>
                                <p className="text-xs text-red-600 mt-1">
                                    Marked as suspicious. Use this for incorrect data or policy violations.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                            <span className="mt-1 w-2.5 h-2.5 rounded-full bg-gray-500 shadow-sm"></span>
                            <div>
                                <span className="block font-medium text-gray-800">Archived</span>
                                <p className="text-xs text-gray-600 mt-1">
                                    Soft-deleted/Hidden from normal view but kept for audit trails.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {}
                    <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50">
                        <div className="relative flex-1 w-full md:w-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by patient, filename..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            <select
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">All Status</option>
                                <option value="Active">Active</option>
                                <option value="Flagged">Flagged</option>
                                <option value="Archived">Archived</option>
                            </select>
                            <select
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                            >
                                <option value="">All Types</option>
                                <option value="PDF">PDF Documents</option>
                                <option value="Image">Images</option>
                            </select>
                        </div>
                    </div>

                    {}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-4 font-semibold">Report Name</th>
                                    <th className="px-6 py-4 font-semibold">Patient</th>
                                    <th className="px-6 py-4 font-semibold">Type</th>
                                    <th className="px-6 py-4 font-semibold">Date</th>
                                    <th className="px-6 py-4 font-semibold">Size</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center">
                                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                        </td>
                                    </tr>
                                ) : displayedReports.length > 0 ? (
                                    displayedReports.map((report) => (
                                        <tr key={report._id} className="hover:bg-gray-50/50 transition duration-150">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${report.type === 'Image' ? 'bg-purple-50 text-purple-600' : 'bg-red-50 text-red-600'}`}>
                                                        <FileText size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 truncate max-w-[180px]" title={report.originalName}>{report.originalName}</p>
                                                        <p className="text-xs text-gray-400">{report.category}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <User size={14} className="text-gray-400" />
                                                    <div>
                                                        <span className="block text-sm text-gray-900 font-medium">{report.patientName}</span>
                                                        {report.uploadedBy && (
                                                            <span className="block text-xs text-gray-500">
                                                                ID: {report.uploadedBy._id?.slice(-6).toUpperCase()} • {report.uploadedBy.role}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{report.type || 'Doc'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{new Date(report.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 font-mono">{formatBytes(report.size)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${report.status === 'Flagged' ? 'bg-red-100 text-red-800' :
                                                    report.status === 'Archived' ? 'bg-gray-100 text-gray-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                    {report.status || 'Active'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end items-center gap-2">
                                                    {}
                                                    <button
                                                        onClick={() => { setSelectedReport(report); setIsPreviewModalOpen(true); }}
                                                        className="p-1 text-gray-500 hover:text-blue-600 transition"
                                                        title="Preview & Download"
                                                    >
                                                        <Eye size={18} />
                                                    </button>

                                                    {}
                                                    <button
                                                        onClick={() => {
                                                            if (report.status === 'Flagged') {
                                                                
                                                                if (window.confirm('Unflag this report? It will become active again.')) {
                                                                    setSelectedReport(report); 

                                                                    handleUnflag(report._id);
                                                                }
                                                            } else {
                                                                setSelectedReport(report);
                                                                setIsFlagModalOpen(true);
                                                            }
                                                        }}
                                                        className={`p-1 transition ${report.status === 'Flagged' ? 'text-orange-600 hover:text-orange-800' : 'text-gray-500 hover:text-orange-500'}`}
                                                        title={report.status === 'Flagged' ? "Unflag" : "Flag Suspicious"}
                                                    >
                                                        <Flag size={18} className={report.status === 'Flagged' ? "fill-current" : ""} />
                                                    </button>

                                                    {}
                                                    <button
                                                        onClick={() => handleArchive(report._id, report.status)}
                                                        className={`p-1 transition ${report.status === 'Archived' ? 'text-blue-500 hover:text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                                                        title={report.status === 'Archived' ? "Unarchive" : "Archive"}
                                                    >
                                                        <Archive size={18} className={report.status === 'Archived' ? "fill-current" : ""} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                            No reports found matching criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {}
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                        <span className="text-sm text-gray-500">Showing {displayedReports.length} of {reports.length} reports</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {}
            <AnimatePresence>
                {isFlagModalOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6"
                        >
                            <div className="flex items-center gap-3 mb-4 text-red-600">
                                <AlertCircle size={24} />
                                <h3 className="text-lg font-bold">Flag Report</h3>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                                Why is report <strong>{selectedReport?.originalName}</strong> suspicious?
                            </p>
                            <textarea
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                                rows="3"
                                placeholder="Enter reason (e.g. Wrong file type, corrupted, PHI violation...)"
                                value={flagReason}
                                onChange={(e) => setFlagReason(e.target.value)}
                            ></textarea>
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    onClick={() => setIsFlagModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleFlag}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                                >
                                    Flag Report
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {}
            <AnimatePresence>
                {isPreviewModalOpen && selectedReport && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
                        >
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <div>
                                    <h3 className="font-bold text-gray-900">{selectedReport.originalName}</h3>
                                    <p className="text-xs text-gray-500">ID: {selectedReport._id}</p>
                                </div>
                                <div className="flex gap-2">
                                    {}
                                    <a
                                        href={`http://localhost:5000/api/reports/${selectedReport._id}/download`}
                                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                                    >
                                        <Download size={16} /> Download
                                    </a>
                                    <button onClick={() => setIsPreviewModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
                                        <span className="text-2xl leading-none">&times;</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 bg-gray-100 p-4 overflow-auto flex items-center justify-center">
                                {selectedReport.mimeType?.startsWith('image') ? (
                                    <img
                                        src={`http://localhost:5000/api/reports/${selectedReport._id}/download`}
                                        alt="Preview"
                                        className="max-w-full max-h-full shadow-lg"
                                    />
                                ) : selectedReport.mimeType === 'application/pdf' ? (
                                    <iframe
                                        src={`http://localhost:5000/api/reports/${selectedReport._id}/download`}
                                        className="w-full h-full min-h-[500px] border-none shadow-lg"
                                        title="PDF Preview"
                                    />
                                ) : (
                                    <div className="text-center flex flex-col items-center justify-center h-64">
                                        <FileText size={64} className="mx-auto text-gray-400 mb-4" />
                                        <p className="text-gray-500 mb-4">No preview available for <strong>{selectedReport.type}</strong> files.</p>
                                        <a
                                            href={`http://localhost:5000/api/reports/${selectedReport._id}/download`}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                                        >
                                            <Download size={18} /> Download to View
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-gray-100 bg-white">
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Audit Metadata</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600">
                                    <div>
                                        <span className="block text-gray-400">Uploaded By</span>
                                        {selectedReport.uploadedBy?.name || 'Unknown'} ({selectedReport.uploadedBy?.role || 'N/A'})
                                    </div>
                                    <div>
                                        <span className="block text-gray-400">Date</span>
                                        {new Date(selectedReport.createdAt).toLocaleString()}
                                    </div>
                                    <div>
                                        <span className="block text-gray-400">Status</span>
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${selectedReport.status === 'Flagged' ? 'bg-red-100 text-red-800' :
                                            selectedReport.status === 'Archived' ? 'bg-gray-100 text-gray-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                            {selectedReport.status}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-400">Flag Reason</span>
                                        {selectedReport.flaggedReason || '-'}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminReports;
