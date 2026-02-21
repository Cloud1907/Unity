import React from 'react';
import { History, Plus, CheckCircle2 } from 'lucide-react';
import UserAvatar from '../ui/shared/UserAvatar';
import { statuses } from '../../constants/taskConstants'; // Need to ensure path is correct

export const TaskModalActivity = ({ activityLogs, taskData, users }) => {
    // Server now pre-formats 'details' via AuditController.FormatActivityDetails
    // We just need to map ActionType to friendly Turkish action labels
    const getLogDetails = (log) => {
        const rawDetails = log.details || log.description || '';
        const action = (log.action || '').toUpperCase();

        // Map server action types to readable Turkish labels
        const actionMap = {
            'CREATE': log.entityType === 'Subtask' ? 'Alt Görev Eklendi' : 'Görev Oluşturuldu',
            'CREATE_TASK': 'Görev Oluşturuldu',
            'CREATE_SUBTASK': 'Alt Görev Eklendi',
            'UPDATE': 'Güncelleme',
            'UPDATE_TASK': 'Güncelleme',
            'ASSIGN': 'Atama Yapıldı',
            'ASSIGN_TASK': 'Atama Yapıldı',
            'UNASSIGN': 'Atama Kaldırıldı',
            'COMMENT': 'Yorum Yapıldı',
            'ADD_COMMENT': 'Yorum Yapıldı',
            'STATUS_CHANGE': 'Durum Değişti',
            'DELETED': log.entityType === 'Subtask' ? 'Alt Görev Silindi' : 'Silme İşlemi',
            'DELETE_SUBTASK': 'Alt Görev Silindi',
        };

        const actionText = actionMap[action] || action || 'İşlem Yapıldı';

        // For UPDATE actions, make the label more specific based on content
        let finalActionText = actionText;
        if (action === 'UPDATE' || action === 'UPDATE_TASK') {
            if (rawDetails.includes('Durum:')) finalActionText = 'Durum Güncellendi';
            else if (rawDetails.includes('Öncelik:')) finalActionText = 'Öncelik Güncellendi';
            else if (rawDetails.includes('Bitiş Tarihi:')) finalActionText = 'Bitiş Tarihi Güncellendi';
            else if (rawDetails.includes('Başlangıç Tarihi:')) finalActionText = 'Başlangıç Tarihi Güncellendi';
            else if (rawDetails.includes('Etiket')) finalActionText = 'Etiket Güncellendi';
        }

        return { actionText: finalActionText, detailText: rawDetails };
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-sm font-bold text-slate-400 mb-6 flex items-center gap-2">
                <History size={16} /> Görev Geçmişi
            </h3>

            <div className="space-y-6">
                {activityLogs.length > 0 ? (
                    activityLogs.map((log, index) => {
                        const { actionText, detailText } = getLogDetails(log);
                        const displayName = log.user?.fullName || log.userName || 'Sistem';
                        const isSystem = displayName === 'System' || displayName === 'Sistem' || displayName === 'System/User';

                        return (
                            <div key={log.id || index} className="flex gap-4 relative group">
                                <div className="flex flex-col items-center">
                                    <UserAvatar
                                        user={log.user || { fullName: displayName }}
                                        size="md"
                                        className="w-8 h-8 border-2 border-white dark:border-slate-900 shadow-sm z-10"
                                    />
                                    {index !== activityLogs.length - 1 && (
                                        <div className="w-0.5 h-full bg-slate-100 dark:bg-slate-800 absolute top-8 bottom-0 -z-10"></div>
                                    )}
                                </div>

                                <div className="flex-1 pb-6">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-normal text-sm text-slate-700 dark:text-slate-200">
                                            {actionText}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {new Date(log.createdAt || log.timestamp).toLocaleDateString('tr-TR', {
                                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 font-normal">
                                        {!isSystem && (
                                            <>
                                                <span className="font-medium text-slate-900 dark:text-slate-100">
                                                    {displayName}
                                                </span>
                                                <span className="text-slate-400 mx-1">•</span>
                                            </>
                                        )}
                                        {detailText}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <React.Fragment>
                        {/* Fallback to static summary if no logs - similar to original code */}
                        <div className="flex gap-4 relative">
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 ring-4 ring-white dark:ring-slate-950">
                                    <Plus size={14} />
                                </div>
                                <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-800 mt-2"></div>
                            </div>
                            <div className="flex-1 pb-6">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-sm text-slate-900 dark:text-white">Görev Oluşturuldu</span>
                                    <span className="text-xs text-slate-400">
                                        {new Date(taskData.createdAt || Date.now()).toLocaleDateString('tr-TR', {
                                            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {users.find(u => u.id === taskData.assignedBy)?.fullName || 'Kullanıcı'} tarafından oluşturuldu
                                </p>
                            </div>
                        </div>
                    </React.Fragment>
                )}
            </div>
        </div>
    );
};
