import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { toast } from 'sonner';
import { useTaskDetails } from '../hooks/useTaskDetails';
import { TaskModalHeader } from './TaskModal/TaskModalHeader';
import { TaskModalTabs } from './TaskModal/TaskModalTabs';
import { TaskModalSubtasks } from './TaskModal/TaskModalSubtasks';
import { TaskModalComments } from './TaskModal/TaskModalComments';
import { TaskModalAttachments } from './TaskModal/TaskModalAttachments';
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
    deleteTask,
    currentUser,
    users,
    filteredUsers,
    workspaceId
  } = useTaskDetails(initialTask, isOpen, onClose, initialSection);

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

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left Nav Rail */}
          <TaskModalTabs
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            subtaskCount={subtasks.filter(s => !s.completed).length}
            commentCount={comments.length}
            fileCount={attachments.length}
          />

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-slate-950">
            <div className="max-w-3xl mx-auto">
              {activeSection === 'subtasks' && (
                <TaskModalSubtasks
                  subtasks={subtasks}
                  setSubtasks={setSubtasks}
                  onAddSubtask={handleAddSubtask}
                  onUpdateSubtask={updateSubtask}
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

              {activeSection === 'activity' && (
                <TaskModalActivity
                  activityLogs={activityLogs}
                  taskData={taskData}
                  users={users}
                />
              )}
            </div>
          </div>

          {/* Right Sidebar - Properties */}
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
