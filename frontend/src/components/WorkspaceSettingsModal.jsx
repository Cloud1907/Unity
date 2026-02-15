import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Search, UserPlus, Trash2, Users, Loader2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { departmentsAPI } from '../services/api';
import { toast } from 'sonner';
import { getAvatarUrl } from '../utils/avatarHelper';

const WorkspaceSettingsModal = ({ isOpen, onClose, initialWorkspace }) => {
    const { users, fetchAllData: refreshData, departments, projects } = useData();
    const [workspace, setWorkspace] = useState(initialWorkspace);
    const [newName, setNewName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState(false); // For workspace delete
    const [memberToRemove, setMemberToRemove] = useState(null); // For member remove confirmation

    // If initialWorkspace changes (when opening multiple times), sync state
    React.useEffect(() => {
        setWorkspace(initialWorkspace);
        if (initialWorkspace) {
            setNewName(initialWorkspace.name);
        }
        setDeleteConfirmation(false);
        setMemberToRemove(null);
    }, [initialWorkspace]);

    if (!workspace || !isOpen) return null;

    // Safe member check helper
    const isMember = (user) => {
        if (!user.departments || !Array.isArray(user.departments)) return false;
        const wId = parseInt(workspace.id);
        return user.departments.some(d => parseInt(d) === wId);
    };

    const members = users.filter(isMember);

    const nonMembers = users.filter(u =>
        !isMember(u) &&
        (u.fullName.toLocaleLowerCase('tr').includes(searchQuery.toLocaleLowerCase('tr')) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase()))
    ).sort((a, b) => a.fullName.localeCompare(b.fullName, 'tr'));

    const handleAddMember = async (userId) => {
        setLoading(true);
        try {
            await departmentsAPI.addMember(workspace.id, userId);
            toast.success("Kullanıcı eklendi");
            await refreshData();
        } catch (error) {
            console.error(error);
            toast.error("Ekleme başarısız");
        } finally {
            setLoading(false);
            setSearchQuery('');
        }
    };

    const handleRemoveMember = async (userId) => {
        setLoading(true);
        try {
            await departmentsAPI.removeMember(workspace.id, userId);
            toast.success("Kullanıcı çıkarıldı");
            await refreshData();
        } catch (error) {
            console.error(error);
            toast.error("Çıkarma başarısız");
        } finally {
            setLoading(false);
            setMemberToRemove(null);
        }
    };

    const handleRename = async () => {
        if (!newName.trim() || newName === workspace.name) return;
        setLoading(true);
        try {
            // Include ID in payload to fix backend validation
            await departmentsAPI.update(workspace.id, { id: workspace.id, name: newName });
            toast.success("Çalışma alanı adı güncellendi");
            await refreshData();
        } catch (error) {
            console.error(error);
            toast.error("Güncelleme başarısız");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        // Double check confirmation
        if (!deleteConfirmation) {
            setDeleteConfirmation(true);
            return;
        }

        // Check for existing projects
        const workspaceProjects = projects.filter(p =>
            p.departmentId === workspace.id || p.department === workspace.name
        );

        if (workspaceProjects.length > 0) {
            toast.error(`Bu çalışma alanında ${workspaceProjects.length} proje bulunuyor. Önce projeleri silmelisiniz.`);
            setDeleteConfirmation(false);
            return;
        }

        setLoading(true);
        try {
            await departmentsAPI.delete(workspace.id);
            toast.success("Çalışma alanı silindi");
            await refreshData();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Silme işlemi başarısız");
        } finally {
            setLoading(false);
            setDeleteConfirmation(false);
        }
    };

    // Helper for delete confirmation reset
    const cancelDelete = () => setDeleteConfirmation(false);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent 
                className="sm:max-w-[500px] p-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                onPointerDownOutside={(e) => {
                    // Prevent closure on drag-out
                }}
                onInteractOutside={(e) => {
                    // Prevent closure on random outside interaction to be safe
                    e.preventDefault();
                }}
            >
                <DialogHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <Users size={20} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            {workspace.name}
                            <span className="block text-xs font-normal text-slate-500 mt-0.5">Çalışma Alanı Ayarları</span>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    {/* Rename Section */}
                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Çalışma Alanı Adı</label>
                        <div className="flex gap-2">
                            <Input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Çalışma alanı adı"
                                className="bg-slate-50 dark:bg-slate-800"
                            />
                            <Button
                                onClick={handleRename}
                                disabled={loading || !newName.trim() || newName === workspace.name}
                                size="sm"
                            >
                                Kaydet
                            </Button>
                        </div>
                    </div>

                    {/* Add Member Section */}
                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Üye Ekle</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <Input
                                placeholder="İsim veya e-posta ile ara..."
                                className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-indigo-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Search Results */}
                        {searchQuery && (
                            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                                {nonMembers.length === 0 ? (
                                    <div className="p-3 text-sm text-slate-500 text-center">Sonuç bulunamadı</div>
                                ) : (
                                    nonMembers.map(user => (
                                        <div key={user.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={getAvatarUrl(user.avatar)} />
                                                    <AvatarFallback style={{ backgroundColor: user.color || '#6366f1' }} className="text-white text-xs">
                                                        {user.fullName?.[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="text-sm">
                                                    <div className="font-medium text-slate-900 dark:text-slate-100">{user.fullName}</div>
                                                    <div className="text-xs text-slate-500">{user.email}</div>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white h-7 text-xs"
                                                onClick={() => handleAddMember(user.id)}
                                                disabled={loading}
                                            >
                                                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus size={14} className="mr-1" />}
                                                Ekle
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Members List */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mevcut Üyeler ({members.length})</label>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto pr-1 space-y-1">
                            {members.map(member => (
                                <div key={member.id} className="group flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 border border-white dark:border-slate-700 shadow-sm">
                                            <AvatarImage src={getAvatarUrl(member.avatar)} />
                                            <AvatarFallback style={{ backgroundColor: member.color || '#6366f1' }} className="text-white text-xs">
                                                {member.fullName?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium text-sm text-slate-900 dark:text-slate-100">{member.fullName}</div>
                                            <div className="text-xs text-slate-500">{member.role === 'admin' ? 'Yönetici' : 'Üye'}</div>
                                        </div>
                                    </div>

                                    {memberToRemove === member.id ? (
                                        <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-4 duration-200">
                                            <span className="text-xs text-red-600 font-medium mr-1">Silinsin mi?</span>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                className="h-7 text-xs px-2"
                                                onClick={() => handleRemoveMember(member.id)}
                                                disabled={loading}
                                            >
                                                Evet
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 text-xs px-2"
                                                onClick={() => setMemberToRemove(null)}
                                            >
                                                Hayır
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                                            onClick={() => setMemberToRemove(member.id)}
                                            disabled={loading}
                                        >
                                            <Trash2 size={15} />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                        <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-medium text-red-700 dark:text-red-400">Çalışma Alanını Sil</h4>
                                <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-0.5">
                                    Bu işlem geri alınamaz ve tüm veriler silinir.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {deleteConfirmation && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={cancelDelete}
                                        className="text-slate-500 hover:text-slate-700"
                                    >
                                        İptal
                                    </Button>
                                )}
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className={deleteConfirmation ? "bg-red-700 hover:bg-red-800 ring-2 ring-red-500 ring-offset-2" : ""}
                                >
                                    <Trash2 size={14} className="mr-2" />
                                    {deleteConfirmation ? "EMİN MİSİNİZ? (Onayla)" : "Sil"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                    <Button variant="outline" onClick={onClose} disabled={loading}>Kapat</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default WorkspaceSettingsModal;
