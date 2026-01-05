import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Tag, X, Plus, Search } from 'lucide-react';
import { useDataActions, useDataState } from '../contexts/DataContext';

const InlineLabelPicker = ({ taskId, currentLabels = [], projectId, onUpdate }) => {
  const { labels } = useDataState();
  const { createLabel } = useDataActions();
  const [isOpen, setIsOpen] = useState(false);
  // Ensure no duplicates in initial state
  const [selectedLabelIds, setSelectedLabelIds] = useState([...new Set(currentLabels)]);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Get labels for this project from context
  const availableLabels = React.useMemo(() => {
    // 1. Get relevant labels
    let projectLabels = labels.filter(label =>
      label.projectId === projectId || label.isGlobal
    );

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

    // Pick a random color or default
    const colors = ['#e2445c', '#00c875', '#fdab3d', '#579bfc', '#a25ddc', '#784bd1'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const result = await createLabel({
      name: searchQuery,
      color: randomColor,
      projectId: projectId
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
      className="bg-white rounded-lg shadow-2xl border border-gray-200 w-64 max-h-96 overflow-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-3 border-b border-gray-200 flex items-center gap-2">
        <Tag size={16} className="text-gray-600" />
        <span className="text-sm font-semibold text-gray-700">Etiketler</span>
      </div>

      <div className="p-2 border-b border-gray-100">
        <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-md border border-gray-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-colors">
          <Search size={14} className="text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Etiket ara veya oluştur..."
            className="flex-1 bg-transparent border-none outline-none text-xs text-gray-900 placeholder:text-gray-400"
            autoFocus
          />
        </div>
      </div>

      <div className="p-2 max-h-80 overflow-y-auto">
        {availableLabels.length === 0 ? (
          <div className="text-center py-2">
            <p className="text-gray-400 text-xs mb-2">
              {searchQuery ? `"${searchQuery}" bulunamadı` : 'Henüz etiket yok'}
            </p>
            {searchQuery && (
              <button
                onClick={handleCreateLabel}
                className="flex items-center justify-center gap-1.5 w-full px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md text-xs font-medium hover:bg-blue-100 transition-colors"
              >
                <Plus size={12} />
                "{searchQuery}" oluştur
              </button>
            )}
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
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50 border border-transparent'
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
      <div className="flex flex-wrap gap-1.5 items-center min-h-[28px]">
        {selectedLabels.length === 0 ? (
          <button
            ref={buttonRef}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-dashed border-slate-300 transition-colors"
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
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-200">
                +{overflowCount}
              </span>
            )}

            <button
              ref={buttonRef}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
              className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
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

export default InlineLabelPicker;
