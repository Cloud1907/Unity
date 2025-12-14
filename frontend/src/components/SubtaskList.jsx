import React, { useState } from 'react';
import { Plus, Check, X, GripVertical } from 'lucide-react';

/**
 * Monday.com Style Subtask List Component
 * 
 * Features:
 * - Inline add/edit subtasks
 * - Click checkbox to toggle completion
 * - Progress bar showing completion percentage
 * - Compact, clean design
 */
const SubtaskList = ({ subtasks = [], onUpdate, taskId }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Calculate completion percentage
  const completedCount = subtasks.filter(st => st.completed).length;
  const totalCount = subtasks.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Handle add new subtask
  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    
    const newSubtask = {
      id: Date.now().toString(),
      title: newSubtaskTitle.trim(),
      completed: false
    };
    
    onUpdate(taskId, { subtasks: [...subtasks, newSubtask] });
    setNewSubtaskTitle('');
    setIsAdding(false);
  };

  // Handle toggle completion
  const handleToggleComplete = (subtaskId) => {
    const updatedSubtasks = subtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    onUpdate(taskId, { subtasks: updatedSubtasks });
  };

  // Handle delete subtask
  const handleDeleteSubtask = (subtaskId) => {
    const updatedSubtasks = subtasks.filter(st => st.id !== subtaskId);
    onUpdate(taskId, { subtasks: updatedSubtasks });
  };

  // Handle edit subtask
  const handleEditSubtask = (subtaskId) => {
    if (!editingTitle.trim()) return;
    
    const updatedSubtasks = subtasks.map(st =>
      st.id === subtaskId ? { ...st, title: editingTitle.trim() } : st
    );
    onUpdate(taskId, { subtasks: updatedSubtasks });
    setEditingId(null);
    setEditingTitle('');
  };

  return (
    <div className="space-y-3">
      {/* Header with Progress */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          Alt Görevler
          {totalCount > 0 && (
            <span className="ml-2 text-xs text-gray-500">
              ({completedCount}/{totalCount})
            </span>
          )}
        </h3>
        {totalCount > 0 && (
          <span className="text-xs font-bold text-blue-600">{completionPercentage}%</span>
        )}
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-1.5 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${completionPercentage}%`,
              backgroundColor: completionPercentage === 100 ? '#00C875' : '#579BFC'
            }}
          />
        </div>
      )}

      {/* Subtask List */}
      <div className="space-y-1">
        {subtasks.map((subtask) => (
          <div
            key={subtask.id}
            className="group flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {/* Drag Handle */}
            <button className="opacity-0 group-hover:opacity-50 hover:opacity-100 transition-opacity cursor-grab">
              <GripVertical size={14} className="text-gray-400" />
            </button>

            {/* Checkbox */}
            <button
              onClick={() => handleToggleComplete(subtask.id)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                subtask.completed
                  ? 'bg-blue-600 border-blue-600'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              {subtask.completed && <Check size={12} className="text-white" />}
            </button>

            {/* Title (Editable) */}
            {editingId === subtask.id ? (
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEditSubtask(subtask.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                onBlur={() => handleEditSubtask(subtask.id)}
                autoFocus
                className="flex-1 px-2 py-1 text-sm border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <span
                onClick={() => {
                  setEditingId(subtask.id);
                  setEditingTitle(subtask.title);
                }}
                className={`flex-1 text-sm cursor-pointer ${
                  subtask.completed
                    ? 'text-gray-400 line-through'
                    : 'text-gray-900'
                }`}
              >
                {subtask.title}
              </span>
            )}

            {/* Delete Button */}
            <button
              onClick={() => handleDeleteSubtask(subtask.id)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
            >
              <X size={14} className="text-red-500" />
            </button>
          </div>
        ))}
      </div>

      {/* Add New Subtask */}
      {isAdding ? (
        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
          <div className="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center">
            <Plus size={12} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddSubtask();
              if (e.key === 'Escape') {
                setIsAdding(false);
                setNewSubtaskTitle('');
              }
            }}
            placeholder="Alt görev başlığı..."
            autoFocus
            className="flex-1 px-2 py-1 text-sm bg-white border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddSubtask}
            className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition-colors"
          >
            Ekle
          </button>
          <button
            onClick={() => {
              setIsAdding(false);
              setNewSubtaskTitle('');
            }}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <X size={14} className="text-gray-600" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all w-full"
        >
          <Plus size={16} />
          <span className="font-medium">Alt görev ekle</span>
        </button>
      )}
    </div>
  );
};

export default SubtaskList;
