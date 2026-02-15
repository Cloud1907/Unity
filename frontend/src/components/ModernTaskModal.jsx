import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { toast } from 'sonner';
import { AlignLeft } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import useMediaQuery from '../hooks/useMediaQuery';
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
  const isMobile = useMediaQuery('(max-width: 768px)');

  // ─── Initial Section Logic ───
  // Default to 'properties' (Details) on mobile, otherwise use initialSection relative to desktop
  const effectiveInitialSection = isMobile ? 'properties' : initialSection;

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
  } = useTaskDetails(initialTask, isOpen, onClose, effectiveInitialSection);

  const [localDescription, setLocalDescription] = useState(taskData.description || '');
  const [isDescFocused, setIsDescFocused] = useState(false);

  // ─── activeSection fallback guard ───
  // If user switches from mobile to desktop while 'properties' tab is active,
  // fall back to 'subtasks' since desktop renders properties in a sidebar.
  useEffect(() => {
    if (!isMobile && activeSection === 'properties') {
      setActiveSection('subtasks');
    }
  }, [isMobile, activeSection, setActiveSection]);

  // Sync local description when backend data changes
  useEffect(() => {
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

  // ─── Swipe-to-close (Mobile only) ───
  const dragY = useMotionValue(0);
  const bgOpacity = useTransform(dragY, [0, 300], [1, 0.2]);

  const handleDragEnd = useCallback((event, info) => {
    if (info.offset.y > 120) {
      onClose();
    }
  }, [onClose]);

  // ─── Keyboard avoidance for mobile inputs ───
  const handleInputFocus = useCallback((e) => {
    if (isMobile) {
      setTimeout(() => {
        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300); // Wait for keyboard to open
    }
  }, [isMobile]);

  if (!isOpen) return null;

  const isSubtask = !!taskData.taskId;

  // ─── Tab Content Renderer ───
  const renderTabContent = () => {
    // Mobile: Properties tab renders TaskModalProperties inline
    if (activeSection === 'properties' && isMobile) {
      return (
        <TaskModalProperties
          taskData={taskData}
          setTaskData={setTaskData}
          onUpdate={handleUpdate}
          filteredUsers={filteredUsers}
          workspaceId={workspaceId}
          currentUser={currentUser}
          onDeleteClick={() => setShowDeleteConfirm(true)}
          isSubtask={isSubtask}
          isMobile={true}
        />
      );
    }

    switch (activeSection) {
      case 'subtasks':
        return (
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
        );
      case 'comments':
        return (
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
        );
      case 'files':
        return (
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
        );
      case 'link':
        return <TaskModalLink taskData={taskData} onUpdate={handleUpdate} />;
      case 'activity':
        return <TaskModalActivity activityLogs={activityLogs} taskData={taskData} users={users} />;
      default:
        return null;
    }
  };

  // ─── Framer Motion Variants ───
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const modalVariants = isMobile
    ? {
        hidden: { y: '100%', opacity: 0.8 },
        visible: { y: 0, opacity: 1, transition: { type: 'spring', damping: 28, stiffness: 300 } },
        exit: { y: '100%', opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } }
      }
    : {
        hidden: { scale: 0.95, opacity: 0 },
        visible: { scale: 1, opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
        exit: { scale: 0.95, opacity: 0, transition: { duration: 0.15 } }
      };

  // ─── MOBILE LAYOUT ───
  if (isMobile) {
    const mobileContent = (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999]"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          >
            <motion.div
              className="absolute inset-0 bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={e => e.stopPropagation()}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              style={{ height: '100dvh', y: dragY }}
            >
              {/* Glass Header Container (Absolute Top) */}
              <div className="absolute top-0 inset-x-0 z-20 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 transition-all">
                  {/* Swipe Indicator */}
                  <div className="flex justify-center pt-2 pb-0.5 shrink-0" onPointerDown={(e) => e.stopPropagation()}> 
                    {/* Note: Drag handle should be interactive or part of the drag area. Parent has drag. */}
                    <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                  </div>

                  {/* Header */}
                  <TaskModalHeader
                    title={taskData.title}
                    onTitleChange={handleTitleChange}
                    onClose={onClose}
                    isMobile={true}
                  />

                  {/* Horizontal Tabs */}
                  <TaskModalTabs
                    activeSection={activeSection}
                    setActiveSection={setActiveSection}
                    subtaskCount={subtasks.filter(s => !s.isCompleted).length}
                    commentCount={comments.length}
                    fileCount={attachments.length}
                    linkCount={taskData.taskUrl ? 1 : 0}
                    isMobile={true}
                  />
              </div>

              {/* Content Area (Scrollable with top padding for header) */}
              <div className="flex-1 overflow-y-auto pt-[116px] bg-slate-50 dark:bg-slate-950">
                <div className="p-4 pb-20">
                  {renderTabContent()}
                </div>

                {/* Description Section (collapsible on mobile, visible when not in properties tab) */}
                {activeSection !== 'properties' && (
                  <div className="px-4 pb-8">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50 shadow-sm">
                        <div className="group/desc relative">
                        <div className="flex items-center gap-2 mb-2">
                            <AlignLeft size={16} className="text-indigo-500" />
                            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-200">Açıklama</h3>
                        </div>
                        <div className={`relative transition-all duration-200 rounded-xl ${isDescFocused ? 'ring-2 ring-indigo-500/10' : ''}`}>
                            <textarea
                            value={localDescription}
                            onChange={(e) => setLocalDescription(e.target.value)}
                            onFocus={(e) => { setIsDescFocused(true); handleInputFocus(e); }}
                            onBlur={() => setIsDescFocused(false)}
                            placeholder="Bu görev için bir açıklama ekleyin..."
                            className="w-full min-h-[80px] p-0 bg-transparent border-none focus:ring-0 text-sm text-slate-700 dark:text-slate-300 resize-none placeholder:text-slate-400 leading-relaxed"
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
                                className="absolute bottom-0 right-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all animate-in fade-in z-20"
                            >
                                Kaydet
                            </button>
                            )}
                        </div>
                        </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );

    return (
      <>
        {ReactDOM.createPortal(mobileContent, document.body)}
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
  }

  // ─── DESKTOP LAYOUT (Existing, with Framer Motion upgrade) ───
  const desktopContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          <motion.div
            className="bg-white dark:bg-slate-950 w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <TaskModalHeader
              title={taskData.title}
              onTitleChange={handleTitleChange}
              onClose={onClose}
              isMobile={false}
            />

            {/* Body Container */}
            <div className="flex flex-1 overflow-hidden">
              {/* LEFT COLUMN: Main Content Area */}
              <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-100 dark:border-slate-800">
                {/* Tabs + Dynamic Content */}
                <div className="flex-1 flex flex-row overflow-hidden w-full">
                  {/* Vertical Tabs Rail */}
                  <div className="flex-shrink-0 h-full">
                    <TaskModalTabs
                      activeSection={activeSection}
                      setActiveSection={setActiveSection}
                      subtaskCount={subtasks.filter(s => !s.isCompleted).length}
                      commentCount={comments.length}
                      fileCount={attachments.length}
                      linkCount={taskData.taskUrl ? 1 : 0}
                      isMobile={false}
                    />
                  </div>

                  {/* Dynamic Content */}
                  <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-950 min-w-0">
                    <div className="max-w-3xl mx-auto">
                      {renderTabContent()}
                    </div>
                  </div>
                </div>

                {/* Description Section (Fixed Footer) */}
                <div className="flex-shrink-0 p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 z-10">
                  <div className="group/desc relative">
                    <div className="flex items-center gap-2 mb-2">
                      <AlignLeft size={16} className="text-slate-400" />
                      <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400">Açıklama</h3>
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
                isMobile={false}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {ReactDOM.createPortal(desktopContent, document.body)}

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
