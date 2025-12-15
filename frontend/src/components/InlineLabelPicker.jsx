import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Tag, X, Plus } from 'lucide-react';
import { labelsAPI } from '../services/api';

const InlineLabelPicker = ({ taskId, currentLabels = [], projectId, onUpdate, buttonRef }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availableLabels, setAvailableLabels] = useState([]);
  const [selectedLabelIds, setSelectedLabelIds] = useState(currentLabels);
  const dropdownRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (projectId) {
      fetchLabels();
    }
  }, [projectId]);

  useEffect(() => {
    setSelectedLabelIds(currentLabels);
  }, [currentLabels]);

  useEffect(() => {
    if (isOpen && buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX
      });
    }
  }, [isOpen, buttonRef]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          buttonRef?.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, buttonRef]);

  const fetchLabels = async () => {
    try {
      const response = await labelsAPI.getByProject(projectId);
      setAvailableLabels(response.data || []);
    } catch (error) {
      console.error('Error fetching labels:', error);
    }
  };

  const toggleLabel = async (labelId) => {
    const newLabels = selectedLabelIds.includes(labelId)
      ? selectedLabelIds.filter(id => id !== labelId)
      : [...selectedLabelIds, labelId];
    
    setSelectedLabelIds(newLabels);
    
    if (onUpdate) {
      await onUpdate(taskId, newLabels);
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

      <div className="p-2 max-h-80 overflow-y-auto">
        {availableLabels.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">
            Henüz etiket yok
          </div>
        ) : (
          <div className="space-y-1">
            {availableLabels.map(label => {
              const isSelected = selectedLabelIds.includes(label.id);
              return (
                <button
                  key={label.id}
                  onClick={() => toggleLabel(label.id)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isSelected 
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

  return (
    <>
      <div className="flex flex-wrap gap-1 items-center">
        {getSelectedLabels().map(label => (
          <span
            key={label.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: label.color }}
          >
            <Tag size={10} />
            {label.name}
          </span>
        ))}
        <button
          ref={buttonRef}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Etiket ekle/çıkar"
        >
          <Plus size={14} className="text-gray-400" />
        </button>
      </div>

      {isOpen && ReactDOM.createPortal(dropdownContent, document.body)}
    </>
  );
};

export default InlineLabelPicker;
