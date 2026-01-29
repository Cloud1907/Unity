// Shared constants for task management across components
import { ChevronDown, ChevronUp, ChevronsUp, Minus } from 'lucide-react';

// Monday.com benzeri durum renkleri (Daha canlı ve pastel)
export const statuses = [
    { id: 'todo', label: 'Yapılacak', color: '#c4c4c4' },      // Gri
    { id: 'working', label: 'Devam Ediyor', color: '#fdab3d' }, // Turuncu
    { id: 'stuck', label: 'Takıldı', color: '#e2445c' },        // Kırmızı
    { id: 'done', label: 'Tamamlandı', color: '#00c875' },      // Yeşil
    { id: 'review', label: 'İncelemede', color: '#579bfc' }     // Mavi
];

// Öncelik renkleri (Daha kibar, pastel ve şık)
export const priorities = [
    { id: 'low', label: 'Düşük', color: '#eef2f5', textColor: '#5f6b7c', icon: <ChevronDown size={14} /> },
    { id: 'medium', label: 'Orta', color: '#e5e9f5', textColor: '#4051b5', icon: <Minus size={14} /> },
    { id: 'high', label: 'Yüksek', color: '#fff0e5', textColor: '#ff6b00', icon: <ChevronUp size={14} /> },
    { id: 'urgent', label: 'Acil', color: '#ffe5e9', textColor: '#d91d4a', icon: <ChevronsUp size={14} /> }
];

// T-Shirt Sizes
export const tShirtSizes = [
    { id: null, label: '-', color: '#f3f4f6', textColor: '#9ca3af' },
    { id: 'small', label: 'Small (1-2 Weeks)', color: '#34d399', textColor: '#ffffff' },
    { id: 'medium', label: 'Medium (2-4 Weeks)', color: '#9ca3af', textColor: '#ffffff' },
    { id: 'large', label: 'Large (4-8 Weeks)', color: '#a78bfa', textColor: '#ffffff' },
    { id: 'xlarge', label: 'X-Large (2-3 Months)', color: '#fb923c', textColor: '#ffffff' },
    { id: 'xxlarge', label: 'XX-Large (3-6+ Months)', color: '#f472b6', textColor: '#ffffff' }
];

// CSS GRID TEMPLATE DEFINITION
// Ensures strict alignment between Header and Body
export const GRID_TEMPLATE = "2rem 35rem 10rem 8rem 12rem 10rem 7rem 12rem 7rem 5rem 9rem 3rem";

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
