import React from 'react';
import { X, Download, FileText, Image as ImageIcon, ExternalLink } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const FilePreviewModal = ({ isOpen, onClose, fileUrl, fileName, fileType, useBlobDownload = false }) => {
    if (!isOpen) return null;

    const isImage = fileType?.startsWith('image') || fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const isPdf = fileType === 'application/pdf' || fileName?.match(/\.pdf$/i);

    const handleDownload = async () => {
        if (!useBlobDownload) {
                        const link = document.createElement('a');
            link.href = `${fileUrl}?type=download`;
            link.download = fileName || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }

                try {
            toast.loading('Downloading...');
            const response = await axios.get(fileUrl, {
                responseType: 'blob',
                withCredentials: true
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName || 'download');
            document.body.appendChild(link);
            link.click();

            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.dismiss();
            toast.success('Download started');
        } catch (error) {
            console.error("Download failed:", error);
            toast.dismiss();
                        const link = document.createElement('a');
            link.href = fileUrl;
            link.target = '_blank';
            link.download = fileName || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden relative" onClick={(e) => e.stopPropagation()}>

                { }
                <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
                    <div className="flex items-center space-x-3 overflow-hidden">
                        {isImage ? <ImageIcon className="text-blue-500" size={24} /> : <FileText className="text-blue-500" size={24} />}
                        <h3 className="text-lg font-semibold text-gray-800 truncate" title={fileName}>
                            {fileName}
                        </h3>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleDownload}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm text-sm font-medium"
                        >
                            <Download size={16} className="mr-2" />
                            Download
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                { }
                <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
                    {isImage ? (
                        <img
                            src={fileUrl}
                            alt={fileName}
                            className="max-w-full max-h-full object-contain shadow-md rounded-lg"
                        />
                    ) : isPdf ? (
                        <iframe
                            src={`${fileUrl}#toolbar=0`}
                            className="w-full h-full rounded-lg shadow-md bg-white"
                            title="PDF Preview"
                        />
                    ) : (
                        <div className="text-center">
                            <div className="bg-white p-8 rounded-2xl shadow-sm inline-block">
                                <FileText size={64} className="mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-500 font-medium mb-2">No preview available for this file type.</p>
                                <p className="text-sm text-gray-400 mb-6">{fileName}</p>
                                <button
                                    onClick={handleDownload}
                                    className="px-6 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium"
                                >
                                    Download File
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FilePreviewModal;
