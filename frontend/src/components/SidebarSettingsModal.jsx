import React, { useState, useEffect } from 'react';
import { X, GripVertical, Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '../contexts/AuthContext';
import { useDataState } from '../contexts/DataContext';

// Sortable Item Component
const SortableWorkspaceItem = ({ workspace, isVisible, isCollapsed, onToggleVisibility, onToggleCollapse }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: workspace.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
        >
            {/* Drag Handle */}
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            >
                <GripVertical size={16} />
            </button>

            {/* Workspace Color & Name */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: workspace.color || '#6366f1' }}
                />
                <span className="text-sm font-medium text-gray-700 truncate">
                    {workspace.name}
                </span>
            </div>

            {/* Visibility Toggle */}
            <button
                onClick={() => onToggleVisibility(workspace.id)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title={isVisible ? 'Gizle' : 'Göster'}
            >
                {isVisible ? (
                    <Eye size={16} className="text-gray-600" />
                ) : (
                    <EyeOff size={16} className="text-gray-400" />
                )}
            </button>

            {/* Collapse Toggle */}
            <button
                onClick={() => onToggleCollapse(workspace.id)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title={isCollapsed ? 'Projeleri Göster' : 'Projeleri Gizle'}
            >
                {isCollapsed ? (
                    <ChevronRight size={16} className="text-gray-600" />
                ) : (
                    <ChevronDown size={16} className="text-gray-600" />
                )}
            </button>
        </div>
    );
};

const SidebarSettingsModal = ({ isOpen, onClose }) => {
    const { user, updatePreferences } = useAuth();
    const { departments } = useDataState();
    const [loading, setLoading] = useState(false);
    const [workspaces, setWorkspaces] = useState([]);

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Filter only departments the user has access to
    const userDepts = React.useMemo(() => {
        if (!user) return [];
        return departments.filter(d =>
            user.departments && user.departments.includes(d.id)
        );
    }, [departments, user]);

    // Initialize workspaces from user preferences
    useEffect(() => {
        if (isOpen && user) {
            // Use workspacePreferences if available, otherwise fallback to sidebarPreferences
            if (user.workspacePreferences && user.workspacePreferences.length > 0) {
                // Map from structured preferences
                const prefsMap = new Map(
                    user.workspacePreferences.map(p => [p.departmentId, p])
                );

                const sorted = userDepts
                    .map(dept => ({
                        ...dept,
                        sortOrder: prefsMap.get(dept.id)?.sortOrder ?? 999,
                        isVisible: prefsMap.get(dept.id)?.isVisible ?? true,
                        isCollapsed: prefsMap.get(dept.id)?.isCollapsed ?? false,
                    }))
                    .sort((a, b) => a.sortOrder - b.sortOrder);

                setWorkspaces(sorted);
            } else if (user.sidebarPreferences) {
                // Fallback to JSON preferences
                try {
                    const prefs = JSON.parse(user.sidebarPreferences);
                    const order = prefs.order || [];
                    const visibility = prefs.visibility || {};

                    const sorted = [...userDepts].sort((a, b) => {
                        const indexA = order.indexOf(a.id);
                        const indexB = order.indexOf(b.id);
                        if (indexA === -1 && indexB === -1) return 0;
                        if (indexA === -1) return 1;
                        if (indexB === -1) return -1;
                        return indexA - indexB;
                    });

                    setWorkspaces(sorted.map(dept => ({
                        ...dept,
                        isVisible: visibility[dept.id] !== false,
                        isCollapsed: false,
                    })));
                } catch (e) {
                    console.error('Error parsing sidebar preferences:', e);
                    setWorkspaces(userDepts.map(dept => ({
                        ...dept,
                        isVisible: true,
                        isCollapsed: false,
                    })));
                }
            } else {
                // No preferences, use default
                setWorkspaces(userDepts.map(dept => ({
                    ...dept,
                    isVisible: true,
                    isCollapsed: false,
                })));
            }
        }
    }, [isOpen, user, userDepts]);

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setWorkspaces((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const toggleVisibility = (id) => {
        setWorkspaces(prev =>
            prev.map(ws => ws.id === id ? { ...ws, isVisible: !ws.isVisible } : ws)
        );
    };

    const toggleCollapse = (id) => {
        setWorkspaces(prev =>
            prev.map(ws => ws.id === id ? { ...ws, isCollapsed: !ws.isCollapsed } : ws)
        );
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const workspacePreferences = workspaces.map((ws, index) => ({
                departmentId: ws.id,
                sortOrder: index,
                isVisible: ws.isVisible ?? true,
                isCollapsed: ws.isCollapsed ?? false,
            }));

            const { success } = await updatePreferences({ workspacePreferences });
            if (success) {
                onClose();
            }
        } catch (err) {
            console.error('Save preferences failed:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Görünümü Özelleştir</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Info */}
                <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
                    <p className="text-xs text-blue-700">
                        Sürükleyerek sıralayın. Göz simgesi ile gizleyin, ok simgesi ile projeleri daraltın.
                    </p>
                </div>

                {/* Workspace List */}
                <div className="px-4 py-4 max-h-96 overflow-y-auto">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={workspaces.map(ws => ws.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-2">
                                {workspaces.map((workspace) => (
                                    <SortableWorkspaceItem
                                        key={workspace.id}
                                        workspace={workspace}
                                        isVisible={workspace.isVisible ?? true}
                                        isCollapsed={workspace.isCollapsed ?? false}
                                        onToggleVisibility={toggleVisibility}
                                        onToggleCollapse={toggleCollapse}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Vazgeç
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SidebarSettingsModal;
