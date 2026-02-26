// Monday.com renk paleti - TAM eşleşme
export const STATUS_COLORS = {
  todo: { bg: '#c4c4c4', text: '#323338', label: 'Başlanmadı', lightBg: '#f0f0f0' },
  working: { bg: '#fdab3d', text: '#FFFFFF', label: 'Devam Ediyor', lightBg: '#fff4e6' },
  review: { bg: '#579bfc', text: '#FFFFFF', label: 'İncelemede', lightBg: '#e8f2ff' },
  done: { bg: '#00c875', text: '#FFFFFF', label: 'Tamamlandı', lightBg: '#e6f7ed' },
  stuck: { bg: '#e2445c', text: '#FFFFFF', label: 'Takıldı', lightBg: '#ffe6ea' }
};

// Priority badges
export const PRIORITY_CONFIG = {
  urgent: { color: '#cc0000', label: 'Acil', icon: '⇈' },
  high: { color: '#ff9900', label: 'Yüksek', icon: '↑' },
  medium: { color: '#555555', label: 'Orta', icon: '−' },
  low: { color: '#808080', label: 'Düşük', icon: '↓' }
};
