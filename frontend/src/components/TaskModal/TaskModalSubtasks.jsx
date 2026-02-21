import React, { useState, useEffect } from 'react';
import { ListTodo, Check, Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '../ui/button';
import InlineAssigneePicker from '../InlineAssigneePicker';
import InlineDatePicker from '../InlineDatePicker';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableSubtaskItem = ({
    subtask,
    localSubtasks,
    setLocalSubtasks,
    onUpdateSubtask,
    allUsers,
    workspaceId,
    requestDeleteSubtask
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: subtask.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/50 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all duration-200 ${isDragging ? 'shadow-2xl bg-white dark:bg-slate-800 border-indigo-200 z-50 opacity-90 scale-[1.02]' : 'hover:scale-[1.01] hover:shadow-md'}`}
        >
            {/* Left accent border on hover */}
            <div className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-indigo-500 transition-colors p-1 -ml-1"
            >
                <GripVertical size={16} />
            </div>

            {/* Checkbox */}
            <div
                onClick={() => {
                    const newStatus = !subtask.isCompleted;
                    const updated = localSubtasks.map(s => s.id === subtask.id ? { ...s, isCompleted: newStatus } : s);
                    setLocalSubtasks(updated);
                    onUpdateSubtask(subtask.id, { isCompleted: newStatus });
                }}
                className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all ${subtask.isCompleted
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-200 dark:shadow-none font-bold scale-110'
                    : 'border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-400 bg-white dark:bg-slate-950 shadow-sm'
                    } hover:scale-125 active:scale-90`}
            >
                {subtask.isCompleted && <Check size={14} className="text-white" strokeWidth={3} />}
            </div>

            {/* Title & Actions Stack */}
            <div className="flex-1 flex flex-col gap-2 min-w-0">
                {/* Title Input */}
                <input
                    value={subtask.title}
                    onChange={(e) => {
                        const updated = localSubtasks.map(s => s.id === subtask.id ? { ...s, title: e.target.value } : s);
                        setLocalSubtasks(updated);
                    }}
                    onBlur={() => onUpdateSubtask(subtask.id, { title: subtask.title })}
                    title={subtask.title}
                    className={`w-full bg-transparent border-none text-sm font-normal outline-none focus:ring-0 p-0 transition-colors ${subtask.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white'
                        } `}
                />

                {/* Actions Row - Always below title */}
                <div className="flex items-center gap-3 opacity-60 group-hover:opacity-100 transition-all duration-300">
                    <InlineAssigneePicker
                        assigneeIds={subtask.assigneeIds}
                        allUsers={allUsers}
                        workspaceId={workspaceId}
                        onChange={(newIds) => {
                            const updated = localSubtasks.map(s => s.id === subtask.id ? { ...s, assigneeIds: newIds } : s);
                            setLocalSubtasks(updated);
                            onUpdateSubtask(subtask.id, { assigneeIds: newIds });
                        }}
                    />

                    <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-900/80 rounded-lg px-2 py-0.5 border border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-700 transition-all shadow-sm text-[11px]">
                        <InlineDatePicker
                            value={subtask.startDate}
                            placeholder="Başlangıç"
                            onChange={(date) => {
                                const updated = localSubtasks.map(s => s.id === subtask.id ? { ...s, startDate: date } : s);
                                setLocalSubtasks(updated);
                                onUpdateSubtask(subtask.id, { startDate: date });
                            }}
                        />
                        <span className="text-slate-400 font-bold mx-1">/</span>
                        <InlineDatePicker
                            value={subtask.dueDate}
                            placeholder="Bitiş"
                            onChange={(date) => {
                                const updated = localSubtasks.map(s => s.id === subtask.id ? { ...s, dueDate: date } : s);
                                setLocalSubtasks(updated);
                                onUpdateSubtask(subtask.id, { dueDate: date });
                            }}
                        />
                    </div>

                    <div className="flex-1" />

                    <button
                        onClick={() => requestDeleteSubtask(subtask)}
                        className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export const TaskModalSubtasks = ({
    subtasks,
    setSubtasks,
    onAddSubtask,
    onUpdateSubtask,
    onReorderSubtask,
    requestDeleteSubtask,
    workspaceId,
    allUsers
}) => {
    const [newSubtask, setNewSubtask] = useState('');
    const [localSubtasks, setLocalSubtasks] = useState(() => 
        [...subtasks].sort((a, b) => (a.position || 0) - (b.position || 0))
    );

    useEffect(() => {
        setLocalSubtasks([...subtasks].sort((a, b) => (a.position || 0) - (b.position || 0)));
    }, [subtasks]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Avoid accidental drags when clicking
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = localSubtasks.findIndex((s) => s.id === active.id);
            const newIndex = localSubtasks.findIndex((s) => s.id === over.id);

            const newOrder = arrayMove(localSubtasks, oldIndex, newIndex);
            setLocalSubtasks(newOrder);

            // Use bulk reorder to ensure persistence and avoid race conditions
            const reorderItems = newOrder.map((item, index) => ({
                id: item.id,
                position: index
            }));

            if (onReorderSubtask) {
                await onReorderSubtask(reorderItems);
            }
        }
    };

    const handleAdd = () => {
        onAddSubtask(newSubtask, () => setNewSubtask(''));
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2">
                <ListTodo size={16} /> Alt Görevler
            </h3>

            <div className="mb-6">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={localSubtasks.map(s => s.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-1">
                            {localSubtasks.map((subtask) => (
                                <SortableSubtaskItem
                                    key={subtask.id}
                                    subtask={subtask}
                                    localSubtasks={localSubtasks}
                                    setLocalSubtasks={setLocalSubtasks}
                                    onUpdateSubtask={onUpdateSubtask}
                                    allUsers={allUsers}
                                    workspaceId={workspaceId}
                                    requestDeleteSubtask={requestDeleteSubtask}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-300 transition-colors">
                <Plus size={18} className="text-slate-400" />
                <input
                    value={newSubtask}
                    onChange={e => setNewSubtask(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    placeholder="Yeni alt görev ekle..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder:text-slate-400 font-medium"
                />
                <Button onClick={handleAdd} disabled={!newSubtask.trim()} size="sm" className="bg-white hover:bg-slate-100 text-indigo-600 border border-slate-200 shadow-sm">Ekle</Button>
            </div>
        </div>
    );
};

