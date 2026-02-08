import React, { useState } from 'react';
import { MessageSquare, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import UserAvatar from '../ui/shared/UserAvatar';
import { toast } from 'sonner';

export const TaskModalComments = ({ comments, onAddComment, onRequestDelete, currentUser, taskData }) => {
    const [newComment, setNewComment] = useState('');

    const handleAdd = () => {
        onAddComment(newComment, () => setNewComment(''));
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-sm font-bold text-slate-400 mb-6 flex items-center gap-2">
                <MessageSquare size={16} /> Yorumlar
            </h3>

            <div className="flex gap-4 mb-8">
                <UserAvatar
                    user={currentUser}
                    size="lg"
                    className="w-10 h-10 border-2 border-white shadow-sm"
                />
                <div className="flex-1 relative">
                    <Textarea
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (newComment.trim()) handleAdd();
                            }
                        }}
                        placeholder="Yorumunuzu yazın..."
                        className="min-h-[100px] resize-none pr-20 pt-3 border-slate-200 focus:border-indigo-300 focus:ring-indigo-100"
                    />
                    <div className="absolute bottom-3 right-3">
                        <Button onClick={handleAdd} disabled={!newComment.trim()} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">Gönder</Button>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {comments.map(comment => (
                    <div key={comment.id} className="flex gap-4 group">
                        <UserAvatar
                            user={comment.user || { fullName: comment.userName, color: comment.user?.color, avatar: comment.user?.avatar || comment.userAvatar }}
                            size="md"
                            className="w-8 h-8 mt-1 border border-slate-100"
                        />
                        <div className="flex-1 group/comment relative">
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-sm text-slate-900 dark:text-white">{comment.user?.fullName || comment.userName}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                    {(currentUser?.role === 'admin' || comment.createdBy === currentUser?.id || taskData.assignedBy === currentUser?.id) && (
                                        <button
                                            onClick={() => onRequestDelete(comment)}
                                            className="opacity-0 group-hover/comment:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                                            title="Yorumu sil"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl rounded-tl-none text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                {comment.text}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
