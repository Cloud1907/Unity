import React, { useState, useRef } from 'react';
import { MoreHorizontal, GitMerge, TrendingUp, MessageSquare, Link, Trash2 } from 'lucide-react';
import { STATUS_COLORS } from './constants';
import InlineStatusDropdown from './InlineStatusDropdown';
import InlinePriorityDropdown from './InlinePriorityDropdown';
import InlineDatePickerSmall from './InlineDatePickerSmall';
import InlineLabelPicker from '../InlineLabelPicker';
import InlineAssigneePicker from '../InlineAssigneePicker';
import InlineTextEdit from '../InlineTextEdit';

// Kompakt Task Card - Monday.com stili - MEMOIZED
const CompactTaskCard = React.memo(({
  task,
  onDragStart,
  onDragEnd,
  isDragging,
  users,
  projectId,
  workspaceId,
  onStatusChange,
  onTaskClick,
  onUpdate,
  onDelete,
  activeMenuTaskId, // Prop to know if this card's menu should be open
  onToggleMenu, // Handler to toggle this card's menu
  autoFocus, // NEW: Prop to auto-focus the title
  currentUser // Passed from parent for permission checks
}) => {
  // Normalize assignees to IDs with robust matching
  const assigneeIds = (task.assignees || []).map(a => String(a.userId || a.id || a));

  const assignees = users.filter(u => assigneeIds.includes(String(u.id))); // Strict ID
  const [isHovered, setIsHovered] = useState(false);
  const menuRef = useRef(null);

  // Is THIS card's menu open?
  const showMenu = activeMenuTaskId === task.id;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        // Sadece kart alanına tıklanırsa detay aç
        if (e.target.closest('button') || e.target.closest('[role="menu"]')) return;
        onTaskClick(task);
      }}
      className={`bg-white dark:bg-slate-800 rounded-xl p-3 border transition-all duration-300 cursor-pointer group relative ${isDragging
        ? 'opacity-80 scale-105 shadow-2xl rotate-2 z-50'
        : 'opacity-100 shadow-sm hover:shadow-lg dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:-translate-y-1 border-gray-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500'
        } ${autoFocus ? 'animate-in fade-in slide-in-from-top-2 duration-300' : ''}`}
      style={{
        transform: isDragging ? 'rotate(2deg)' : 'translateY(0)',
        transition: 'box-shadow 0.2s, transform 0.2s, border-color 0.2s'
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2 relative">
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full shrink-0 mt-0.5"
            style={{ backgroundColor: STATUS_COLORS[task.status]?.bg || STATUS_COLORS.todo.bg }}
          />
          <InlineTextEdit
            value={task.title}
            onSave={(newTitle) => onUpdate(task.id, { title: newTitle })}
            startEditing={autoFocus}
            className="text-[13px] font-medium text-gray-800 dark:text-gray-200 leading-tight !p-0 hover:!bg-transparent truncate block"
            inputClassName="w-full bg-white dark:bg-slate-800 border border-indigo-500 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none overflow-hidden leading-normal min-h-[20px]"
          />
        </div>

        <button
          className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-opacity card-menu-trigger ${isHovered || showMenu ? 'opacity-100' : 'opacity-0'
            }`}
          onClick={(e) => {
            e.stopPropagation();
            // Toggle logic: if already open, close (null). If closed, open (this task id)
            onToggleMenu(showMenu ? null : task.id);
          }}
        >
          <MoreHorizontal size={14} className="text-gray-400" />
        </button>

        {/* Portals for Menus */}
        {showMenu && (
          <div
            ref={menuRef}
            className="absolute right-0 top-6 w-32 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 z-50 py-1"
            onClick={(e) => e.stopPropagation()}
          >
            {(currentUser?.role === 'admin' || task.createdBy === currentUser?.id || (!task.createdBy && task.assignedBy === currentUser?.id)) && (
              <button
                onClick={() => {
                  onToggleMenu(null); // Close menu
                  onDelete(task.id);
                }}
                className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <Trash2 size={12} />
                Görevi Sil
              </button>
            )}
          </div>
        )}

      </div>

      {/* Priority & Date Row */}
      <div className="flex items-center gap-2 mb-2">
        {/* Priority */}
        <InlinePriorityDropdown
          currentPriority={task.priority}
          onChange={(newPriority) => onUpdate(task.id, { priority: newPriority })}
        />

        {/* Date */}
        <InlineDatePickerSmall
          value={task.dueDate}
          onChange={(newDate) => onUpdate(task.id, { dueDate: newDate })}
        />
      </div>

      {/* Task Indicators */}
      <div className="flex items-center gap-2 mb-2">
        {(task.subtaskCount > 0 || task.subtasksCount > 0 || task.subtasks?.length > 0) && (
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 dark:bg-slate-700/50 rounded border border-gray-100 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:border-[#6366f1] transition-colors cursor-pointer"
            title="Alt Görevler"
            onClick={(e) => {
              e.stopPropagation();
              onTaskClick(task, 'subtasks');
            }}
          >
            <GitMerge size={10} className="rotate-90 text-[#6366f1] dark:text-[#818cf8]" />
            <span className="text-[9px] font-bold">
              {task.subtasks?.length > 0
                ? `${task.subtasks.filter(s => s.isCompleted).length}/${task.subtasks.length}`
                : `${Math.round(((task.progress || 0) / 100) * (task.subtaskCount || task.subtasksCount || 0))}/${task.subtaskCount || task.subtasksCount || 0}`
              }
            </span>
          </div>
        )}

        {/* Attachments */}
        {(task.attachmentCount > 0 || task.attachmentsCount > 0 || task.attachments?.length > 0) && (
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 dark:bg-slate-700/50 rounded border border-gray-100 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:border-[#6366f1] transition-colors cursor-pointer"
            title={`${task.attachmentCount || task.attachmentsCount || task.attachments?.length} dosya`}
            onClick={(e) => {
              e.stopPropagation();
              onTaskClick(task, 'files');
            }}
          >
            <TrendingUp size={10} className="rotate-90 text-[#6366f1]" />
            <span className="text-[9px] font-bold">{task.attachmentCount || task.attachmentsCount || task.attachments?.length || 0}</span>
          </div>
        )}

        {/* Comments */}
        {(task.commentCount > 0 || task.commentsCount > 0 || task.comments?.length > 0) && (
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 dark:bg-slate-700/50 rounded border border-gray-100 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:border-[#00c875] transition-colors cursor-pointer"
            title={`${task.commentCount || task.commentsCount || task.comments?.length} yorum`}
            onClick={(e) => {
              e.stopPropagation();
              onTaskClick(task, 'comments');
            }}
          >
            <MessageSquare size={10} className="text-[#00c875]" />
            <span className="text-[9px] font-bold">{task.commentCount || task.commentsCount || task.comments?.length || 0}</span>
          </div>
        )}

        {/* Link Indicator */}
        {task.taskUrl && (
           <div
            className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 dark:bg-slate-700/50 rounded border border-gray-100 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:border-sky-500 transition-colors cursor-pointer"
            title="Bağlantı"
            onClick={(e) => {
              e.stopPropagation();
              onTaskClick(task, 'link');
            }}
          >
            <Link size={10} className="text-sky-500" />
          </div>
        )}
      </div>

      {/* Labels Row */}
      <div className="mb-2">
        <InlineLabelPicker
          taskId={task.id}
          currentLabels={task.labels || task.labelIds || []}
          projectId={projectId}
          onUpdate={(taskId, newLabels) => onUpdate(taskId, { labelIds: newLabels })}
        />
      </div>

      {/* Bottom Section - Assignee */}
      <div className="flex items-center gap-2">
        <InlineAssigneePicker
          assigneeIds={assigneeIds}
          allUsers={users}
          workspaceId={workspaceId}
          onChange={(newAssignees) => {
            // Update using 'assigneeIds' key to match Backend behavior
            onUpdate(task.id, { assigneeIds: newAssignees });
          }}
        />
      </div>
      {/* Creator Info - Moved to Right of Assignees */}
      {!!task.createdBy && task.createdBy > 0 && (
        <div className="ml-auto flex items-center h-6">
          <p className="text-[9px] text-gray-400 dark:text-gray-500 flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity whitespace-nowrap">
            <span className="font-light">Oluşturan:</span>
            <span className="font-normal text-gray-500 dark:text-gray-400">
              {users.find(u => u.id === task.createdBy)?.fullName || 'Bilinmeyen'}
            </span>
          </p>
        </div>
      )}
    </div>
  );
});

export default CompactTaskCard;
