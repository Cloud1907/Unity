import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { toast } from 'sonner';
import { AlignLeft } from 'lucide-react';
import { useTaskDetails } from '../hooks/useTaskDetails';
import { TaskModalHeader } from './TaskModal/TaskModalHeader';
import { TaskModalTabs } from './TaskModal/TaskModalTabs';
import { TaskModalSubtasks } from './TaskModal/TaskModalSubtasks';
import { TaskModalComments } from './TaskModal/TaskModalComments';
import { TaskModalAttachments } from './TaskModal/TaskModalAttachments';
import { TaskModalLink } from './TaskModal/TaskModalLink';
import { TaskModalActivity } from './TaskModal/TaskModalActivity';
import { TaskModalProperties } from './TaskModal/TaskModalProperties';
import ConfirmModal from './ui/ConfirmModal';

const ModernTaskModal = ({ task: initialTask, isOpen, onClose, initialSection = 'subtasks' }) => {
  const {
    task,
    taskData,
    setTaskData,
    subtasks,
    setSubtasks,
    comments,
    attachments,
    activeSection,
    setActiveSection,
    activityLogs,
    isUploading,
    handleTitleChange,
    handleUpdate,
    handleAddSubtask,
    updateSubtask,
    handleAddComment,
    handleFileUpload,
    handleDeleteAttachment,
    handleDeleteComment,
    handleDeleteSubtask,
    handleReorderSubtasks,
    deleteTask,
    currentUser,
    users,
    filteredUsers,
    workspaceId
  } = useTaskDetails(initialTask, isOpen, onClose, initialSection);

  const [localDescription, setLocalDescription] = useState(taskData.description || '');
  const [isDescFocused, setIsDescFocused] = useState(false);

  // Sync local description when backend data changes or modal opens
  React.useEffect(() => {
    if (!isDescFocused) {
      setLocalDescription(taskData.description || '');
    }
  }, [taskData.description, isDescFocused]);

  const hasDescriptionChanged = localDescription !== (taskData.description || '');

  const handleSaveDescription = async () => {
    try {
      await handleUpdate(taskData.id, { description: localDescription });
      toast.success('Açıklama kaydedildi', { duration: 1000 });
    } catch (error) {
      console.error('Failed to save description:', error);
      toast.error('Açıklama kaydedilemedi');
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [genericConfirm, setGenericConfirm] = useState({ isOpen: false, title: '', message: '', action: null });

  if (!isOpen) return null;

  const isSubtask = !!taskData.taskId;

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6">
      <div
        className="bg-white dark:bg-slate-950 w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <TaskModalHeader
          title={taskData.title}
          onTitleChange={handleTitleChange}
          onClose={onClose}
        />

        {/* Body Container */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT COLUMN: Main Content Area (Tabs+Content Top, Description Bottom) */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-100 dark:border-slate-800">

            {/* 1. Tabs + Dynamic Content (Top - Flexible) */}
            <div className="flex-1 flex flex-row overflow-hidden w-full">
               {/* Inner Left: Tabs Rail */}
               <div className="flex-shrink-0 h-full">
                 <TaskModalTabs
                  activeSection={activeSection}
                  setActiveSection={setActiveSection}
                  subtaskCount={subtasks.filter(s => !s.isCompleted).length}
                  commentCount={comments.length}
                  fileCount={attachments.length}
                  linkCount={taskData.taskUrl ? 1 : 0}
                />
               </div>

              {/* Inner Right: Dynamic Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-950 min-w-0">
                 <div className="max-w-3xl mx-auto">
                    {activeSection === 'subtasks' && (
                      <TaskModalSubtasks
                        subtasks={subtasks}
                        setSubtasks={setSubtasks}
                        onAddSubtask={handleAddSubtask}
                        onUpdateSubtask={updateSubtask}
                        onReorderSubtask={handleReorderSubtasks}
                        requestDeleteSubtask={(subtask) => {
                          setGenericConfirm({
                            isOpen: true,
                            title: 'Alt Görevi Sil',
                            message: 'Alt görevi silmek istediğinize emin misiniz?',
                            action: async () => handleDeleteSubtask(subtask.id)
                          });
                        }}
                        assignees={taskData.assignees || []}
                        workspaceId={workspaceId}
                        allUsers={filteredUsers}
                      />
                    )}

                    {activeSection === 'comments' && (
                      <TaskModalComments
                        comments={comments}
                        onAddComment={handleAddComment}
                        currentUser={currentUser}
                        taskData={taskData}
                        onRequestDelete={(comment) => {
                          setGenericConfirm({
                            isOpen: true,
                            title: 'Yorumu Sil',
                            message: 'Yorumu silmek istediğinize emin misiniz?',
                            action: async () => handleDeleteComment(comment.id)
                          });
                        }}
                      />
                    )}

                    {activeSection === 'files' && (
                      <TaskModalAttachments
                        attachments={attachments}
                        onUpload={handleFileUpload}
                        onRequestDelete={(file) => {
                          setGenericConfirm({
                            isOpen: true,
                            title: 'Dosyayı Sil',
                            message: 'Dosyayı silmek istediğinize emin misiniz?',
                            action: async () => handleDeleteAttachment(file.id)
                          });
                        }}
                        isUploading={isUploading}
                      />
                    )}

                    {activeSection === 'link' && (
                       <TaskModalLink 
                           taskData={taskData} 
                           onUpdate={handleUpdate} 
                       />
                    )}

                    {activeSection === 'activity' && (
                      <TaskModalActivity
                        activityLogs={activityLogs}
                        taskData={taskData}
                        users={users}
                      />
                    )}
                 </div>
              </div>
            </div>
            
            {/* 2. Description Section (Bottom - Fixed Footer) */}
            <div className="flex-shrink-0 p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 z-10">
              <div className="group/desc relative">
                <div className="flex items-center gap-2 mb-2">
                  <AlignLeft size={16} className="text-slate-400" />
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Açıklama</h3>
                </div>
                
                <div className={`relative transition-all duration-200 rounded-xl ${isDescFocused ? 'bg-white dark:bg-slate-900 shadow-sm ring-1 ring-indigo-500/20' : ''}`}>
                  <textarea
                    value={localDescription}
                    onChange={(e) => setLocalDescription(e.target.value)}
                    onFocus={() => setIsDescFocused(true)}
                    onBlur={() => setIsDescFocused(false)}
                    placeholder="Bu görev için bir detaylı açıklama ekleyin..."
                    className="w-full min-h-[80px] p-3 pb-8 rounded-xl bg-transparent border-0 focus:ring-0 text-sm text-slate-700 dark:text-slate-300 resize-none placeholder:text-slate-400 leading-relaxed"
                    style={{ height: 'auto' }}
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                  />
                  
                  {hasDescriptionChanged && (
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleSaveDescription}
                      className="absolute bottom-2 right-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-md shadow-sm transition-all animate-in fade-in z-20"
                    >
                      Kaydet
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Properties Sidebar */}
          <TaskModalProperties
            taskData={taskData}
            setTaskData={setTaskData}
            onUpdate={handleUpdate}
            filteredUsers={filteredUsers}
            workspaceId={workspaceId}
            currentUser={currentUser}
            onDeleteClick={() => setShowDeleteConfirm(true)}
            isSubtask={isSubtask}
          />
        </div>
      </div>
    </div >
  );

  return (
    <>
      {ReactDOM.createPortal(modalContent, document.body)}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          await deleteTask(task.id);
          setShowDeleteConfirm(false);
          onClose();
          toast.success('Görev silindi');
        }}
        title="Görevi Sil"
        message="Bu görevi silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="İptal"
        type="danger"
      />

      {/* Generic Confirmation Modal */}
      <ConfirmModal
        isOpen={genericConfirm.isOpen}
        onClose={() => setGenericConfirm({ ...genericConfirm, isOpen: false })}
        onConfirm={async () => {
          if (genericConfirm.action) await genericConfirm.action();
          setGenericConfirm({ ...genericConfirm, isOpen: false });
        }}
        title={genericConfirm.title}
        message={genericConfirm.message}
        confirmText="Sil"
        cancelText="İptal"
        type="danger"
      />
    </>
  );
};

export default ModernTaskModal;
