import React, { useState } from 'react';
import { BASE_URL } from '../../services/api';
import { Paperclip, Upload, FileText, Image as ImageIcon, Download, X } from 'lucide-react';

export const TaskModalAttachments = ({ attachments, onUpload, onRequestDelete, isUploading }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            onUpload(files[0]);
        }
    };

    const handleChange = (e) => {
        if (e.target.files.length > 0) {
            onUpload(e.target.files[0]);
        }
    };

    const handleDownload = async (e, file) => {
        // Only intercept for text-based files to fix encoding
        const isTextFile = file.name.match(/\.(txt|csv|log|md|json|xml|html|css|js)$/i) || 
                          file.type?.includes('text') || 
                          file.type?.includes('json');

        if (!isTextFile) return; // Let default behavior handle binary files

        e.preventDefault();
        
        try {
            const fileUrl = file.url?.startsWith('http') ? file.url : `${BASE_URL}${file.url}`;
            const response = await fetch(fileUrl);
            const blob = await response.blob();
            
            // Add BOM for UTF-8 (EF BB BF)
            const newBlob = new Blob(['\uFEFF', blob], { type: blob.type || 'text/plain;charset=utf-8' });
            
            const url = window.URL.createObjectURL(newBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback to default behavior if fetch fails
            window.open(file.url?.startsWith('http') ? file.url : `${BASE_URL}${file.url}`, '_blank');
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2">
                <Paperclip size={16} /> Dosyalar
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group overflow-hidden
            ${isDragging
                            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 scale-[1.02]'
                            : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                        }
            ${isUploading ? 'pointer-events-none opacity-80' : ''}
          `}
                >
                    <input type="file" className="hidden" onChange={handleChange} disabled={isUploading} />

                    {isUploading ? (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            <span className="text-sm font-medium text-indigo-600">Yükleniyor...</span>
                        </div>
                    ) : (
                        <>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                ${isDragging ? 'bg-indigo-100 text-indigo-600 scale-110' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-slate-800 dark:group-hover:text-indigo-400'}
              `}>
                                <Upload size={24} />
                            </div>
                            <div className="text-center">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">
                                    Dosya Seç veya Sürükle
                                </span>
                                <p className="text-xs text-slate-400 mt-1">
                                    Max 10MB (PNG, JPG, PDF)
                                </p>
                            </div>
                        </>
                    )}
                </label>

                {attachments.map(file => (
                    <div key={file.id} className="relative group p-4 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-3 hover:shadow-md transition-all bg-white dark:bg-slate-900 overflow-hidden">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0
              ${file.type?.includes('image') ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20'}
            `}>
                            {file.type?.includes('image') ? <ImageIcon size={20} /> : <FileText size={20} />}
                        </div>

                        <div className="flex-1 min-w-0">
                            <a 
                                href={file.url?.startsWith('http') ? file.url : `${BASE_URL}${file.url}`} 
                                onClick={(e) => handleDownload(e, file)}
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="block text-sm font-medium text-slate-900 dark:text-white truncate hover:text-indigo-600 transition-colors"
                            >
                                {file.name}
                            </a>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                    {(file.size / 1024).toFixed(1)} KB
                                </span>
                                <span className="text-[10px] text-slate-400">
                                    {new Date(file.uploadedAt || Date.now()).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a
                                href={file.url?.startsWith('http') ? file.url : `${BASE_URL}${file.url}`}
                                onClick={(e) => handleDownload(e, file)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                title="İndir"
                            >
                                <Download size={14} />
                            </a>
                            <button
                                onClick={() => onRequestDelete(file)}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
