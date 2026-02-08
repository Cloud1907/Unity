import React from 'react';
import { History, Plus, CheckCircle2 } from 'lucide-react';
import UserAvatar from '../ui/shared/UserAvatar';
import { statuses } from '../../constants/taskConstants'; // Need to ensure path is correct

export const TaskModalActivity = ({ activityLogs, taskData, users }) => {
    // Parsing logic moved here
    const getLogDetails = (log) => {
        let actionText = 'İşlem yapıldı';
        let detailText = '';
        const rawDetails = log.details || log.description || '';
        const getStatusLabel = (s) => statuses.find(st => st.id === s)?.label || s;

        switch (log.action) {
            case 'CREATE_TASK':
            case 'CREATE':
                actionText = log.entityType === 'Subtask' ? 'Alt Görev Eklendi' : 'Görev Oluşturuldu';
                detailText = rawDetails || 'Kayıt sisteme eklendi.';
                break;
            case 'COMMENT':
                actionText = 'Yorum Yapıldı';
                detailText = rawDetails;
                break;
            case 'UPDATE_TASK':
            case 'UPDATE':
                if (rawDetails.includes('Durum:')) actionText = 'Durum Güncellendi';
                else if (rawDetails.includes('Öncelik:')) actionText = 'Öncelik Güncellendi';
                else if (rawDetails.includes('Bitiş Tarihi:')) actionText = 'Bitiş Tarihi Güncellendi';
                else if (rawDetails.includes('Başlangıç Tarihi:')) actionText = 'Başlangıç Tarihi Güncellendi';
                else actionText = 'Güncelleme';
                detailText = rawDetails || 'Kayıt detayları güncellendi.';
                break;
            case 'ASSIGN_TASK':
            case 'ASSIGN':
                actionText = 'Atama Yapıldı';
                if (rawDetails.includes('ASSIGNED_TO:')) {
                    const parts = rawDetails.split(':');
                    const assignedUserId = parts[1];
                    const assignedUser = users.find(u => u.id == assignedUserId);
                    detailText = assignedUser ? `${assignedUser.fullName} göreve atandı.` : 'Kullanıcı göreve atandı.';
                } else {
                    detailText = rawDetails;
                }
                break;
            case 'STATUS_CHANGE':
                actionText = 'Durum Değişti';
                if (rawDetails.startsWith('STATUS:')) {
                    const newStatus = rawDetails.split(':')[1];
                    detailText = `Durum "${getStatusLabel(newStatus)}" olarak değiştirildi.`;
                } else {
                    detailText = rawDetails;
                }
                break;
            case 'CREATE_SUBTASK':
                actionText = 'Alt Görev Eklendi';
                detailText = rawDetails.replace('SUBTASK:', '');
                break;
            case 'DELETE_SUBTASK':
            case 'DELETED':
                actionText = log.entityType === 'Subtask' || rawDetails.includes('Subtask') ? 'Alt Görev Silindi' : 'Silme İşlemi';
                detailText = rawDetails;
                break;
            case 'ADD_COMMENT':
                actionText = 'Yorum Yapıldı';
                detailText = 'Yeni bir yorum eklendi.';
                break;
            default:
                actionText = log.action;
                detailText = rawDetails;
        }

        return { actionText, detailText };
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
