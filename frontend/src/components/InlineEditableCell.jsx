import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { toSkyISOString } from '../utils/dateUtils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getAvatarUrl } from '../utils/avatarHelper';

const getUserColor = (user) => {
  if (user?.color) return user.color;
  const colors = ['#e2445c', '#00c875', '#fdab3d', '#579bfc', '#a25ddc', '#784bd1', '#ff642e', '#F59E0B'];
  const index = (user?.fullName?.length || 0) % colors.length;
  return colors[index];
};

// Status Column Inline Editor
export const InlineStatusCell = ({ value, options, onChange, colors }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);

  const handleChange = (newValue) => {
    setSelectedValue(newValue);
    onChange(newValue);
    setIsEditing(false);
  };

  const currentOption = options.find(opt => opt.id === selectedValue) || options[0];
  const currentColor = colors[selectedValue] || '#C4C4C4';

  if (isEditing) {
    return (
      <div className="relative">
        <div className="absolute top-0 left-0 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-1 min-w-[140px]">
          {options.map(option => (
            <button
              key={option.id}
              onClick={(e) => {
                e.stopPropagation();
                handleChange(option.id);
              }}
              className="w-full text-left px-3 py-2 rounded text-xs font-bold hover:bg-gray-100 transition-colors flex items-center gap-2"
              style={{ color: colors[option.id] }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[option.id] }} />
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:scale-105 hover:shadow-md"
      style={{ backgroundColor: currentColor }}
    >
      {currentOption.label}
    </button>
  );
};

// Priority Column Inline Editor
export const InlinePriorityCell = ({ value, options, onChange, colors }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);

  const handleChange = (newValue) => {
    setSelectedValue(newValue);
    onChange(newValue);
    setIsEditing(false);
  };

  const currentOption = options.find(opt => opt.id === selectedValue) || options[0];
  const currentColor = colors[selectedValue] || '#579BFC';

  if (isEditing) {
    return (
      <div className="relative">
        <div className="absolute top-0 left-0 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-1 min-w-[120px]">
          {options.map(option => (
            <button
              key={option.id}
              onClick={(e) => {
                e.stopPropagation();
                handleChange(option.id);
              }}
              className="w-full text-left px-3 py-2 rounded text-xs font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[option.id] }} />
              <span style={{ color: colors[option.id] }}>{option.icon} {option.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      className="px-2 py-1 rounded text-xs transition-all hover:scale-105"
      style={{
        backgroundColor: `${currentColor}15`,
        color: currentColor
      }}
    >
      {currentOption.icon} {currentOption.label}
    </button>
  );
};

// Person Column Inline Editor
export const InlinePersonCell = ({ value, users, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const assignees = users.filter(u => value?.includes(u.id)) || [];

  if (isEditing) {
    return (
      <div className="relative">
        <div className="absolute top-0 left-0 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-2 min-w-[200px] max-h-[300px] overflow-y-auto">
          {users.map(user => (
            <button
              key={user.id}
              onClick={(e) => {
                e.stopPropagation();
                const isSelected = value?.includes(user.id);
                const newValue = isSelected
                  ? value.filter(id => id !== user.id)
                  : [...(value || []), user.id];
                onChange(newValue);
              }}
              className="w-full text-left px-2 py-2 rounded text-xs hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <Avatar className="w-5 h-5 border border-white">
                <AvatarImage src={user.avatar ? getAvatarUrl(user.avatar) : ''} />
                <AvatarFallback
                  className="text-[10px] text-white font-bold"
                  style={{ backgroundColor: getUserColor(user) }}
                >
                  {user.fullName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1">{user.fullName}</span>
              {value?.includes(user.id) && <Check size={14} className="text-green-500" />}
            </button>
          ))}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(false);
            }}
            className="w-full mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600 hover:text-gray-900 font-medium"
          >
            Kapat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      className="flex items-center -space-x-1.5 cursor-pointer hover:opacity-75 transition-opacity"
    >
      {assignees.map(assignee => (
        <Avatar key={assignee.id} className="w-5 h-5 border border-white">
          <AvatarImage src={assignee.avatar ? getAvatarUrl(assignee.avatar) : ''} />
          <AvatarFallback
            className="text-[10px] text-white font-bold"
            style={{ backgroundColor: getUserColor(assignee) }}
          >
            {assignee.fullName?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      ))}
      {assignees.length === 0 && (
        <div className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-[#6366f1] transition-colors">
          <span className="text-xs text-gray-400">+</span>
        </div>
      )}
    </div>
  );
};

// Date Column Inline Editor
export const InlineDateCell = ({ value, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' });
  };

  const isOverdue = value && new Date(value) < new Date();
  const isUpcoming = value && new Date(value) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  if (isEditing) {
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <input
          type="date"
          value={value ? toSkyISOString(value).split('T')[0] : ''}
          onChange={(e) => {
            onChange(e.target.value ? toSkyISOString(e.target.value) : null);
            setIsEditing(false);
          }}
          onBlur={() => setIsEditing(false)}
          autoFocus
          className="px-2 py-1 text-xs border border-[#6366f1] rounded focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
        />
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      className={`text-xs px-2 py-1 rounded hover:bg-gray-100 transition-colors ${isOverdue ? 'text-red-600 font-semibold' : isUpcoming ? 'text-orange-600' : 'text-gray-600'
        }`}
    >
      {formatDate(value)}
    </button>
  );
};
