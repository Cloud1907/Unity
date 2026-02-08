// Shared constants for task management across components
import { ChevronDown, ChevronUp, ChevronsUp, Minus } from 'lucide-react';

// Monday.com benzeri durum renkleri (Daha canlı ve pastel)
export const statuses = [
    { id: 'todo', label: 'Başlanmadı', color: '#c4c4c4' },      // Gri
    { id: 'working', label: 'Devam Ediyor', color: '#fdab3d' }, // Turuncu
    { id: 'stuck', label: 'Takıldı', color: '#e2445c' },        // Kırmızı
    { id: 'review', label: 'İncelemede', color: '#579bfc' },     // Mavi
    { id: 'done', label: 'Tamamlandı', color: '#00c875' }       // Yeşil
];

// Öncelik renkleri (Daha kibar, pastel ve şık)
export const priorities = [
    { id: 'low', label: 'Düşük', color: '#eef2f5', textColor: '#5f6b7c', icon: <ChevronDown size={14} /> },
    { id: 'medium', label: 'Orta', color: '#e5e9f5', textColor: '#4051b5', icon: <Minus size={14} /> },
    { id: 'high', label: 'Yüksek', color: '#fff0e5', textColor: '#ff6b00', icon: <ChevronUp size={14} /> },
    { id: 'urgent', label: 'Acil', color: '#ffe5e9', textColor: '#d91d4a', icon: <ChevronsUp size={14} /> }
];

// T-Shirt Sizes (Daha hafif ve profesyonel renkler)
export const tShirtSizes = [
    { id: null, label: '-', color: '#f8fafc', textColor: '#94a3b8' },
    { id: 'small', label: 'Small', color: '#f0fdf4', textColor: '#16a34a' },
    { id: 'medium', label: 'Medium', color: '#f8fafc', textColor: '#475569' },
    { id: 'large', label: 'Large', color: '#f5f3ff', textColor: '#7c3aed' },
    { id: 'xlarge', label: 'X-Large', color: '#fff7ed', textColor: '#ea580c' },
    { id: 'xxlarge', label: 'XX-Large', color: '#fff1f2', textColor: '#e11d48' }
];

// ============================================
// LAYOUT CONSTANTS (Enterprise Standard)
// ============================================
// Centralized width definitions to ensure consistency
// across MainTable, TaskRow, and any future components
export const EXPANDER_COLUMN_WIDTH = '32px';
export const TASK_COLUMN_WIDTH = '480px';
export const ACTIONS_COLUMN_WIDTH = '3rem';

// Column Definitions for Dynamic Visibility
// Note: 'task' column is always visible and sticky
export const COLUMNS = [
    { id: 'status', label: 'Durum', width: '140px', defaultVisible: true },
    { id: 'priority', label: 'Öncelik', width: '120px', defaultVisible: true },
    { id: 'assignee', label: 'Atanan', width: '110px', defaultVisible: true },
    { id: 'startDate', label: 'Başlangıç', width: '110px', defaultVisible: false },
    { id: 'dueDate', label: 'Bitiş Tarihi', width: '110px', defaultVisible: true },
    { id: 'labels', label: 'Etiketler', width: '220px', defaultVisible: true },
    { id: 'tShirtSize', label: 'T-Shirt', width: '120px', defaultVisible: false },
    { id: 'progress', label: 'İlerleme', width: '160px', defaultVisible: true },
    { id: 'files', label: 'Dosyalar', width: '110px', defaultVisible: true },
    { id: 'createdBy', label: 'Oluşturan', width: '180px', defaultVisible: true }
];

// Get default column visibility state
export const getDefaultColumnVisibility = () => {
    const visibility = {};
    COLUMNS.forEach(col => {
        visibility[col.id] = col.defaultVisible;
    });
    return visibility;
};

// Generate dynamic grid template based on visible columns
export const generateGridTemplate = (visibleColumns) => {
    // Fixed columns use centralized constants for enterprise consistency
    let template = `${EXPANDER_COLUMN_WIDTH} ${TASK_COLUMN_WIDTH}`;

    COLUMNS.forEach(col => {
        if (visibleColumns[col.id]) {
            template += ` ${col.width}`;
        }
    });

    // Actions column at the end
    template += ` ${ACTIONS_COLUMN_WIDTH}`;

    return template;
};

// CSS GRID TEMPLATE DEFINITION (Static - for backward compatibility)
// Ensures strict alignment between Header and Body
export const GRID_TEMPLATE = "2rem 22rem 120px 100px 140px 120px 110px 140px 90px 70px 110px 3rem";

// Helper functions
export const getStatusColor = (statusId) => {
    return statuses.find(s => s.id === statusId)?.color || '#c4c4c4';
};

export const getPriorityData = (priorityId) => {
    return priorities.find(p => p.id === priorityId) || priorities[0];
};

export const getTShirtData = (sizeId) => {
    return tShirtSizes.find(s => s.id === sizeId) || tShirtSizes[0];
};
