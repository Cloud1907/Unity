import React, { useState } from 'react';
import { ListTodo, Check, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import InlineAssigneePicker from '../InlineAssigneePicker';
import InlineDatePicker from '../InlineDatePicker';

export const TaskModalSubtasks = ({
    subtasks,
    setSubtasks,
    onAddSubtask,
    onUpdateSubtask,
    requestDeleteSubtask,
    assignees, // Not really used here? subtasks have their own assignees
    workspaceId,
    allUsers
}) => {
    const [newSubtask, setNewSubtask] = useState('');

    const handleAdd = () => {
        onAddSubtask(newSubtask, () => setNewSubtask(''));
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2">
                <ListTodo size={16} /> Alt Görevler
            </h3>

            <div className="space-y-3 mb-6">
                {subtasks.map((subtask, index) => (
                    <div key={subtask.id || index} className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/50 border border-transparent transition-all">

                        {/* Checkbox */}
                        <div
                            onClick={() => {
                                const newStatus = !subtask.isCompleted;
                                const updated = subtasks.map(s => s.id === subtask.id ? { ...s, isCompleted: newStatus } : s);
                                setSubtasks(updated);
                                onUpdateSubtask(subtask.id, { isCompleted: newStatus });
                            }}
                            className={`flex - shrink - 0 w - 6 h - 6 rounded - full flex items - center justify - center cursor - pointer transition - all ${subtask.isCompleted
                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-200 dark:shadow-none'
                                    : 'border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                                } `}
                        >
                            {subtask.isCompleted && <Check size={14} className="text-white" />}
                        </div>

                        {/* Title Input */}
                        <div className="flex-1 min-w-0">
                            <input
                                value={subtask.title}
                                onChange={(e) => {
                                    const updated = subtasks.map(s => s.id === subtask.id ? { ...s, title: e.target.value } : s);
                                    setSubtasks(updated);
                                }}
                                onBlur={() => onUpdateSubtask(subtask.id, { title: subtask.title })}
                                className={`w - full bg - transparent border - none text - sm font - medium outline - none focus: ring - 0 p - 0 ${subtask.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'
                                    } `}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <InlineAssigneePicker
                                assigneeIds={subtask.assigneeIds}
                                allUsers={allUsers}
                                workspaceId={workspaceId}
                                onChange={(newIds) => {
                                    const updated = subtasks.map(s => s.id === subtask.id ? { ...s, assigneeIds: newIds } : s);
                                    setSubtasks(updated);
                                    onUpdateSubtask(subtask.id, { assignees: newIds });
                                }}
                            />

                            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 rounded-lg px-1">
                                <InlineDatePicker
                                    value={subtask.startDate}
                                    placeholder="Başlangıç"
                                    onChange={(date) => {
                                        const updated = subtasks.map(s => s.id === subtask.id ? { ...s, startDate: date } : s);
                                        setSubtasks(updated);
                                        onUpdateSubtask(subtask.id, { startDate: date });
                                    }}
                                />
                                <span className="text-slate-300">-</span>
                                <InlineDatePicker
                                    value={subtask.dueDate}
                                    placeholder="Bitiş"
                                    onChange={(date) => {
                                        const updated = subtasks.map(s => s.id === subtask.id ? { ...s, dueDate: date } : s);
                                        setSubtasks(updated);
                                        onUpdateSubtask(subtask.id, { dueDate: date });
                                    }}
                                />
                            </div>

                            <button
                                onClick={() => requestDeleteSubtask(subtask)}
                                className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-3">
                <Plus size={18} className="text-slate-400" />
                <input
                    value={newSubtask}
                    onChange={e => setNewSubtask(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    placeholder="Yeni alt görev ekle..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder:text-slate-400 font-medium"
                />
                <Button onClick={handleAdd} disabled={!newSubtask.trim()} size="sm" variant="outline">Ekle</Button>
            </div>
        </div>
    );
};
