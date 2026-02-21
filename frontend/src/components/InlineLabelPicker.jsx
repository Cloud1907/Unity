import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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

  // --- HYBRID OPTIMISTIC STATE ---
  const [localSelectedIds, setLocalSelectedIds] = useState([]);
  const lastInteractionTime = useRef(0);

  useEffect(() => {
    const propIds = (currentLabels || []).map(l =>
      typeof l === 'object' && l !== null ? (l.id ?? l.labelId ?? l) : Number(l)
    ).filter(Boolean);

    // STALE UPDATE PROTECTION:
    // While picker is open, NEVER overwrite local state from props
    // When closed, only accept if no recent interaction (5s window)
    if (isOpen) return;
    const now = Date.now();
    if (now - lastInteractionTime.current > 5000) {
      setLocalSelectedIds(propIds);
    }
  }, [currentLabels, isOpen]);

  // --- LOGIC ---

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0].color);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const colorInputRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  
  // --- DETAILS CACHE ---
  // Stores details for labels encountered to prevent "..." flickers
  const detailsCache = useRef(new Map());

  // Populate cache from current labels and global labels
  useEffect(() => {
    (currentLabels || []).forEach(l => {
        if (typeof l === 'object' && l !== null && l.id) {
            detailsCache.current.set(Number(l.id), { name: l.name, color: l.color });
        }
    });
    (labels || []).forEach(l => {
        detailsCache.current.set(Number(l.id), { name: l.name, color: l.color });
    });
  }, [currentLabels, labels]);

  const toggleLabel = useCallback((labelId) => {
    lastInteractionTime.current = Date.now();
    const labelIdNum = Number(labelId);

    const isSelected = localSelectedIds.some(id => Number(id) === labelIdNum);
    const newIds = isSelected
      ? localSelectedIds.filter(id => Number(id) !== labelIdNum)
      : [...localSelectedIds, labelIdNum];

    // 1. INSTANT FEEDBACK
    setLocalSelectedIds(newIds);

    // 2. GLOBAL UPDATE
    if (onUpdate) {
      onUpdate(taskId, newIds);
    }
  }, [localSelectedIds, taskId, onUpdate]);

  // --- UI HELPERS ---

  const availableLabels = useMemo(() => {
    const pid = Number(projectId);
    let projectLabels = labels.filter(label =>
      label.projectId === pid || label.isGlobal
    );

    const uniqueLabelsMap = new Map();
    projectLabels.forEach(label => {
      if (!uniqueLabelsMap.has(label.name)) {
        uniqueLabelsMap.set(label.name, label);
      } else {
        const existing = uniqueLabelsMap.get(label.name);
        if (existing.isGlobal && !label.isGlobal) {
          uniqueLabelsMap.set(label.name, label);
        }
      }
    });

    let uniqueLabels = Array.from(uniqueLabelsMap.values());
    if (searchQuery) {
      const lowSearch = searchQuery.toLowerCase();
      uniqueLabels = uniqueLabels.filter(l => l.name.toLowerCase().includes(lowSearch));
    }
    return uniqueLabels;
  }, [labels, projectId, searchQuery]);

  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const popoverHeight = 380;

        let top = rect.bottom + 4;
        let left = rect.left;
        const spaceBelow = viewportHeight - rect.bottom;
        const shouldOpenUp = spaceBelow < popoverHeight || rect.top > viewportHeight / 2;

        let style = { left };
        if (shouldOpenUp) {
          style.bottom = viewportHeight - rect.top + 4;
          style.top = 'auto';
          style.transformOrigin = 'bottom left';
        } else {
          style.top = top;
          style.bottom = 'auto';
          style.transformOrigin = 'top left';
        }
        setPosition(style);
      }
    };

    updatePosition();
    if (isOpen) {
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
    }
    return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleCreateLabel = async () => {
    if (!searchQuery.trim()) return;
    const existingLabel = availableLabels.find(l => l.name.toLowerCase() === searchQuery.toLowerCase());
    if (existingLabel) {
      toggleLabel(existingLabel.id);
      setSearchQuery('');
      return;
    }

    const result = await createLabel({
      name: searchQuery,
      color: selectedColor,
      projectId: Number(projectId)
    });

    if (result.success) {
      toggleLabel(result.data.id);
      setSearchQuery('');
    }
  };

  const selectedLabels = useMemo(() => {
    return localSelectedIds.map(sid => {
      const sidNum = Number(sid);
      // 1. Check Global
      const fromGlobal = labels.find(l => Number(l.id) === sidNum);
      if (fromGlobal) return fromGlobal;
      
      // 2. Check Local Details Cache (Persistent across renders)
      const cached = detailsCache.current.get(sidNum);
      if (cached) return { id: sidNum, ...cached };

      // 3. Fallback to Prop check
      const fromProp = currentLabels.find(l => typeof l === 'object' && l !== null && Number(l.id ?? l.labelId) === sidNum);
      if (fromProp) return fromProp;

      return { id: sidNum, name: '...', color: '#cccccc' };
    });
  }, [localSelectedIds, labels, currentLabels]);

  const dropdownContent = (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        ...position,
        zIndex: 9999
      }}
      className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-gray-200 dark:border-slate-700 w-64 max-h-96 overflow-auto animate-in fade-in duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-3 border-b border-gray-200 dark:border-slate-800 flex items-center gap-2 font-semibold text-sm">
        <Tag size={16} className="text-gray-400" />
        <span>Etiketler</span>
      </div>

      <div className="p-2 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700">
          <Search size={14} className="text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Etiket ara veya oluştur..."
            className="flex-1 bg-transparent border-none outline-none text-xs"
            autoFocus
          />
        </div>
      </div>

      <div className="p-2 max-h-80 overflow-y-auto">
        {searchQuery && !availableLabels.find(l => l.name.toLowerCase() === searchQuery.toLowerCase()) && (
          <div className="p-2 mb-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={handleCreateLabel}
              className="w-full px-3 py-2 bg-indigo-600 text-white rounded-md text-xs font-bold"
            >
              "{searchQuery}" Olarak Oluştur
            </button>
          </div>
        )}

        <div className="space-y-1">
          {availableLabels.map(label => {
            const isSelected = localSelectedIds.some(id => Number(id) === Number(label.id));
            return (
              <button
                key={label.id}
                onClick={() => toggleLabel(label.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-slate-800'}`}
              >
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] text-white font-bold"
                  style={{ backgroundColor: label.color }}
                >
                  {label.name}
                </span>
                {isSelected && <span className="text-blue-600">✓</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const DISPLAY_LIMIT = 2;
  const overflowCount = selectedLabels.length - DISPLAY_LIMIT;

  return (
    <div className="w-full h-full flex items-center overflow-hidden" onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-nowrap gap-1 items-center w-full overflow-hidden">
        {selectedLabels.length === 0 ? (
          <button
            ref={buttonRef}
            onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] text-slate-400 border border-dashed border-slate-300"
          >
            <Plus size={10} />
            <span>Etiket</span>
          </button>
        ) : (
          <div className="flex items-center gap-1 overflow-hidden">
            {selectedLabels.slice(0, DISPLAY_LIMIT).map(label => (
              <span
                key={label.id}
                className="px-1.5 py-0.5 rounded-full text-[10px] font-bold border truncate max-w-[80px]"
                style={{ backgroundColor: `${label.color}15`, color: label.color, borderColor: `${label.color}30` }}
              >
                {label.name}
              </span>
            ))}
            {overflowCount > 0 && (
              <button ref={buttonRef} onClick={() => setIsOpen(!isOpen)} className="px-1 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-500 font-bold">+{overflowCount}</button>
            )}
            <button ref={overflowCount <= 0 ? buttonRef : null} onClick={() => setIsOpen(!isOpen)} className="text-slate-400 hover:text-indigo-600"><Plus size={14} /></button>
          </div>
        )}
      </div>
      {isOpen && ReactDOM.createPortal(dropdownContent, document.body)}
    </div>
  );
};

export default React.memo(InlineLabelPicker);
