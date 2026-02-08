import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Onaylıyor musunuz?',
    message = 'Bu işlemi yapmak istediğinizden emin misiniz?',
    confirmText = 'Evet, Sil',
    cancelText = 'İptal',
    type = 'danger' // danger | warning | info
}) => {
    const modalRef = useRef(null);
    const [isLoading, setIsLoading] = React.useState(false);

    const handleConfirm = async () => {
        try {
            setIsLoading(true);
            await onConfirm();
            onClose();
        } catch (error) {
            console.error("Confirmation action failed:", error);
            // Optional: Show error here or let parent handle it
            // We still close if parent doesn't explicitly return false?
            // Safer to let parent close, but previous logic was auto-close.
            // Let's assume onConfirm throws if failed and we might want to keep it open?
            // For now, adhere to previous "Click -> Action -> Close" but await it.
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                ref={modalRef}
                className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-slate-700 animate-in zoom-in-95 duration-200 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full shrink-0 ${type === 'danger' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                            type === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                                'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                            <AlertTriangle size={24} />
                        </div>

                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                                {title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                {message}
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-slate-800/50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-slate-800">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-slate-600 rounded-lg transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className={`px-4 py-2 text-sm font-bold text-white rounded-lg shadow-lg transition-all transform active:scale-95 ${type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30' :
                            type === 'warning' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/30' :
                                'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
                            }`}
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>İşleniyor...</span>
                            </div>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmModal;
