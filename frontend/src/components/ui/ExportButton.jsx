import React, { useState } from 'react';
import { Button } from './button';
import { Download, Loader2 } from 'lucide-react';
import { reportsAPI } from '../../services/api';
import { toast } from 'sonner';

const ExportButton = ({ projectId, projectName }) => {
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        toast.info('Rapor oluşturuluyor...');
        try {
            const response = await reportsAPI.getProjectPdf(projectId);

            // Create Blob
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const dateStr = new Date().toISOString().split('T')[0];
            link.setAttribute('download', `${projectName}_Raporu_${dateStr}.pdf`);
            document.body.appendChild(link);
            link.click();

            // Cleanup
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Rapor başarıyla indirildi.');
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Rapor oluşturulamadı.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            disabled={loading}
            className="gap-2 rounded-md px-3 py-1.5 border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors h-8 text-xs font-medium text-gray-700 dark:text-gray-300"
        >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} strokeWidth={1.5} />}
            <span>PDF İndir</span>
        </Button>
    );
};

export default ExportButton;
