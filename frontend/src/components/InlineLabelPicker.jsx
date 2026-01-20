import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Tag, X, Plus, Search } from 'lucide-react';
import { useDataActions, useDataState } from '../contexts/DataContext';

const COLOR_PALETTE = [
  { name: 'Kırmızı', color: '#e2445c' },
  { name: 'Yeşil', color: '#00c875' },
  { name: 'Turuncu', color: '#fdab3d' },
  { name: 'Mavi', color: '#579bfc' },
  { name: 'Mor', color: '#a25ddc' },
  { name: 'Lacivert', color: '#784bd1' },
  { name: 'Pembe', color: '#ff642e' },
  { name: 'Altın', color: '#ffb100' },
  { name: 'Sarı', color: '#ffadad' },
  { name: 'Açık Mavi', color: '#9cd3db' },
  { name: 'Adaçayı', color: '#7fbb11' },
  { name: 'Gri', color: '#808080' },
  { name: 'Bordo', color: '#7b0f1d' },
  { name: 'Teal', color: '#008080' },
  { name: 'İndigo', color: '#4b0082' },
  { name: 'Koyu Yeşil', color: '#1f511f' },
  { name: 'Somon', color: '#ff8c69' },
  { name: 'Lavanta', color: '#e6e6fa' },
  { name: 'Zeytin', color: '#808000' },
  { name: 'Mercan', color: '#ff7f50' }
];

const InlineLabelPicker = ({ taskId, currentLabels = [], projectId, onUpdate }) => {
  const { labels } = useDataState();
  const { createLabel } = useDataActions();
  const [isOpen, setIsOpen] = useState(false);
  // Ensure no duplicates in initial state
  const [selectedLabelIds, setSelectedLabelIds] = useState([...new Set(currentLabels)]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0].color);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const colorInputRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Get labels for this project from context
  const availableLabels = React.useMemo(() => {
    // Cast projectId to number for strict comparison
    const pid = Number(projectId);

    // 1. Get relevant labels - Prioritize project labels and exclude global if project has its own
    let projectLabels = labels.filter(label =>
      label.projectId === pid || label.isGlobal
    );

    // Filter to current project labels ONLY if user wants strict isolation
    // The user said "her proje kendine özel etiket açabilsin"
    // So we show project labels + global ones

    // 2. Deduplicate by name (prefer project-specific over global)
    const uniqueLabelsMap = new Map();
    projectLabels.forEach(label => {
      if (!uniqueLabelsMap.has(label.name)) {
        uniqueLabelsMap.set(label.name, label);
      } else {
        // If we already have a label with this name, replace it ONLY IF the new one is project-specific
        // (Assuming current map entry is global, or if both project, doesn't matter much)
        const existing = uniqueLabelsMap.get(label.name);
        if (existing.isGlobal && !label.isGlobal) {
          uniqueLabelsMap.set(label.name, label);
        }
      }
    });

    let uniqueLabels = Array.from(uniqueLabelsMap.values());

    // 3. Filter by search
    if (searchQuery) {
      uniqueLabels = uniqueLabels.filter(l =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return uniqueLabels;
  }, [labels, projectId, searchQuery]);

  // Sync with prop changes, but deduplicate
  useEffect(() => {
    setSelectedLabelIds([...new Set(currentLabels)]);
  }, [currentLabels]);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const toggleLabel = async (labelId) => {
    const newLabels = selectedLabelIds.includes(labelId)
      ? selectedLabelIds.filter(id => id !== labelId)
      : [...selectedLabelIds, labelId];

    setSelectedLabelIds(newLabels);

    if (onUpdate) {
      await onUpdate(taskId, newLabels);
    }
  };

  const handleCreateLabel = async () => {
    if (!searchQuery.trim()) return;

    // Check if label already exists in the filtered results to prevent duplicates
    const existingLabel = availableLabels.find(l => l.name.toLowerCase() === searchQuery.toLowerCase());
    if (existingLabel) {
      toggleLabel(existingLabel.id || existingLabel._id);
      setSearchQuery('');
      return;
    }

    const result = await createLabel({
      name: searchQuery,
      color: selectedColor,
      projectId: Number(projectId)
    });

    if (result.success) {
      toggleLabel(result.data.id || result.data._id);
      setSearchQuery('');
    }
  };


  const getSelectedLabels = () => {
    return availableLabels.filter(label => selectedLabelIds.includes(label.id));
  };

  const dropdownContent = (
    <div
      ref={dropdownRef}
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 9999
      }}
      className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-gray-200 dark:border-slate-700 w-64 max-h-96 overflow-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-3 border-b border-gray-200 dark:border-slate-800 flex items-center gap-2">
        <Tag size={16} className="text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Etiketler</span>
      </div>

      <div className="p-2 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-colors">
          <Search size={14} className="text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Etiket ara veya oluştur..."
            className="flex-1 bg-transparent border-none outline-none text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            autoFocus
          />
        </div>
      </div>

      <div className="p-2 max-h-80 overflow-y-auto">
        {searchQuery && !availableLabels.find(l => l.name.toLowerCase() === searchQuery.toLowerCase()) && (
          <div className="p-2 mb-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Yeni Etiket Oluştur</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {COLOR_PALETTE.map((cp) => (
                <button
                  key={cp.color}
                  onClick={() => setSelectedColor(cp.color)}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${selectedColor === cp.color ? 'border-slate-400 scale-110' : 'border-transparent hover:scale-105'
                    }`}
                  style={{ backgroundColor: cp.color }}
                  title={cp.name}
                />
              ))}
              <div className="relative">
                <input
                  ref={colorInputRef}
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="absolute opacity-0 w-0 h-0"
                />
                <button
                  onClick={() => colorInputRef.current?.click()}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 ${!COLOR_PALETTE.some(cp => cp.color === selectedColor) ? 'border-indigo-500 scale-110' : 'border-slate-200 dark:border-slate-600 hover:scale-105'
                    }`}
                  title="Özel Renk Seç"
                >
                  <Plus size={10} className="text-slate-600 dark:text-slate-300" />
                </button>
              </div>
            </div>
            <button
              onClick={handleCreateLabel}
              className="flex items-center justify-center gap-1.5 w-full px-3 py-2 bg-indigo-600 text-white rounded-md text-xs font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-[0.98]"
            >
              <Plus size={14} />
              "{searchQuery}" Olarak Oluştur
            </button>
          </div>
        )}

        {availableLabels.length === 0 && !searchQuery ? (
          <div className="text-center py-6">
            <Tag size={24} className="text-slate-200 mx-auto mb-2" />
            <p className="text-slate-400 text-xs">Henüz etiket yok</p>
          </div>
        ) : (
          <div className="space-y-1">
            {availableLabels.map(label => {
              const isSelected = selectedLabelIds.includes(label.id);
              return (
                <button
                  key={label.id}
                  onClick={() => toggleLabel(label.id)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition-colors ${isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    : 'hover:bg-gray-50 dark:hover:bg-slate-800 border border-transparent'
                    }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white whitespace-nowrap"
                      style={{ backgroundColor: label.color }}
                    >
                      <Tag size={10} />
                      {label.name}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const selectedLabels = getSelectedLabels();
  const DISPLAY_LIMIT = 2; // Keep at 2 to prevent overflow
  const overflowCount = selectedLabels.length - DISPLAY_LIMIT;

  // Helper to ensure we have a valid hex color
  const getLabelColor = (color) => color || '#6b7280';

  return (
    <>
      <div className="flex flex-wrap gap-1.5 items-center content-center h-full w-full">
        {selectedLabels.length === 0 ? (
          <button
            ref={buttonRef}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 transition-colors"
          >
            <Plus size={14} />
            <span>Etiket Ekle</span>
          </button>
        ) : (
          <>
            {selectedLabels.slice(0, DISPLAY_LIMIT).map(label => (
              <span
                key={label.id}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors whitespace-nowrap shadow-sm"
                style={{
                  backgroundColor: `${getLabelColor(label.color)}15`, // ~8% opacity
                  color: getLabelColor(label.color),
                  borderColor: `${getLabelColor(label.color)}30`
                }}
              >
                {label.name}
              </span>
            ))}

            {overflowCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                +{overflowCount}
              </span>
            )}

            <button
              ref={buttonRef}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
              className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0"
              title="Etiket Düzenle"
            >
              <Plus size={14} />
            </button>
          </>
        )}
      </div>

      {isOpen && ReactDOM.createPortal(dropdownContent, document.body)}
    </>
  );
};

export default React.memo(InlineLabelPicker);
