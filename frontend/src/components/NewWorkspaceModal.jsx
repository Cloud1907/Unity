import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useUserList } from '../hooks/useUserList';
import { Button } from './ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getAvatarUrl, getUserColor, getInitials } from '../utils/avatarHelper';
import {
    X, Folder, Briefcase, Target, Rocket, Star, Zap, Users, BarChart, Calendar, Globe, Shield, Code,
    Cpu, Database, Layout, Layers, Box, Cpu as Chip, HardDrive, Network, GitBranch,
    Puzzle, Activity, Gauge, Infinity, Diamond, Crown, Compass, PieChart,
    Workflow, Ship, Truck, HardHat, Sticker, Scaling, Component, Search, Plus
} from 'lucide-react';

// Premium icon set
const PREMIUM_ICONS = [
    { name: 'Folder', icon: Folder },
    { name: 'Briefcase', icon: Briefcase },
    { name: 'Target', icon: Target },
    { name: 'Rocket', icon: Rocket },
    { name: 'Star', icon: Star },
    { name: 'Zap', icon: Zap },
    { name: 'Users', icon: Users },
    { name: 'BarChart', icon: BarChart },
    { name: 'Calendar', icon: Calendar },
    { name: 'Globe', icon: Globe },
    { name: 'Shield', icon: Shield },
    { name: 'Code', icon: Code },
    { name: 'Cpu', icon: Cpu },
    { name: 'Database', icon: Database },
    { name: 'Layout', icon: Layout },
    { name: 'Layers', icon: Layers },
    { name: 'Box', icon: Box },
    { name: 'Cpu', icon: Chip },
    { name: 'HardDrive', icon: HardDrive },
    { name: 'Network', icon: Network },
    { name: 'GitBranch', icon: GitBranch },
    { name: 'Puzzle', icon: Puzzle },
    { name: 'Activity', icon: Activity },
    { name: 'Gauge', icon: Gauge },
    { name: 'Infinity', icon: Infinity },
    { name: 'Diamond', icon: Diamond },
    { name: 'Crown', icon: Crown },
    { name: 'Compass', icon: Compass },
    { name: 'PieChart', icon: PieChart },
    { name: 'Workflow', icon: Workflow },
    { name: 'Ship', icon: Ship },
    { name: 'Truck', icon: Truck },
    { name: 'HardHat', icon: HardHat },
    { name: 'Sticker', icon: Sticker },
    { name: 'Scaling', icon: Scaling },
    { name: 'Component', icon: Component }
];

// Turkish character normalization helper
const normalizeText = (text) => {
    if (!text) return '';
    return text.toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/İ/g, 'i');
};

const NewWorkspaceModal = ({ isOpen, onClose }) => {
    const { createDepartment, fetchProjects } = useData();
    // Global Mode: Fetch ALL users for workspace creation
    const { users, loading: usersLoading } = useUserList({ global: true, enabled: isOpen });
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [searchMember, setSearchMember] = useState('');
    const [showResults, setShowResults] = useState(false);

    // Quick Project State
    const [showQuickProject, setShowQuickProject] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [projectIcon, setProjectIcon] = useState('Folder');
    const [projectColor, setProjectColor] = useState('#0086c0');

    const [isLoading, setIsLoading] = useState(false);

    const colors = ['#0086c0', '#6366f1', '#8b5cf6', '#00c875', '#fdab3d', '#e2445c', '#ff5a5f'];

    // Initialize with current user when modal opens
    useEffect(() => {
        if (isOpen && user) {
            setSelectedUserIds([user.id]);
        }
    }, [isOpen, user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            const payload = {
                name,
                description,
                userIds: selectedUserIds,
                initialProject: showQuickProject && projectName.trim() ? {
                    name: projectName,
                    icon: projectIcon,
                    color: projectColor,
                    isPrivate: false,
                    memberIds: selectedUserIds // Add workspace members to project
                } : null
            };

            const result = await createDepartment(payload);
            if (result.success) {
                resetForm();
                onClose();
            }
        } catch (error) {
            console.error('Failed to create workspace:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setName('');
        setDescription('');
        if (user) setSelectedUserIds([user.id]);
        else setSelectedUserIds([]);
        setSearchMember('');
        setShowQuickProject(false);
        setProjectName('');
        setProjectIcon('Folder');
        setProjectColor('#0086c0');
    };

    const addMember = (userId) => {
        if (!selectedUserIds.includes(userId)) {
            setSelectedUserIds([...selectedUserIds, userId]);
        }
        setSearchMember('');
        setShowResults(false);
    };

    const removeMember = (userId) => {
        setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    };

    // Filter users: Match search AND Must NOT be already selected
    const filteredUsers = users.filter(user => {
        if (selectedUserIds.includes(user.id)) return false;
        
        const searchNorm = normalizeText(searchMember);
        const nameNorm = normalizeText(user.fullName);
        const emailNorm = normalizeText(user.email);
        
        return nameNorm.includes(searchNorm) || emailNorm.includes(searchNorm);
    });

    const selectedUsers = users.filter(u => selectedUserIds.includes(u.id));

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            onClose(open);
        }}>
            <DialogContent 
                className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
                onPointerDownOutside={(e) => {
                    // Prevent accidental closure if drag started inside the modal
                    // but ended outside (standard Radix behavior usually handles this, 
                    // but we make it explicit for consistency)
                    if (e.detail.originalEvent.type === 'pointerdown') {
                        // Allow click outside if it's a clear separate click
                    }
                }}
                onInteractOutside={(e) => {
                    // Require explicit interaction to close, preventing accidental drag-out closure
                    e.preventDefault();
                }}
            >
                <DialogHeader>
                    <DialogTitle>Yeni Çalışma Alanı Oluştur</DialogTitle>
                    <DialogDescription>
                        Projelerinizi gruplamak ve ekiplerinizi yönetmek için yeni bir çalışma alanı oluşturun.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 py-2">
                    {/* Workspace Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Çalışma Alanı Adı *</Label>
                        <Input
                            id="name"
                            placeholder="Örn: Pazarlama, Yazılım Ekibi"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Açıklama (İsteğe bağlı)</Label>
                        <Input
                            id="description"
                            placeholder="Bu alanın amacı nedir?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    {/* Members Selection (Search & Add Pattern) */}
                    <div className="space-y-3">
                        <Label>Üye Ekle</Label>

                        {/* Search Input - NOW FIRST */}
                        <div className="relative z-20">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <Input
                                placeholder="Üye aramak için yazmaya başlayın..."
                                value={searchMember}
                                onChange={(e) => {
                                    setSearchMember(e.target.value);
                                    setShowResults(true);
                                }}
                                onFocus={() => setShowResults(true)}
                                className="pl-9 h-10"
                            />

                            {/* Dropdown Results */}
                            {showResults && searchMember.trim() !== '' && (
                                <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white rounded-xl border border-gray-200 shadow-xl z-50 animate-in fade-in slide-in-from-top-1">
                                    {filteredUsers.length > 0 ? (
                                        <div className="p-1">
                                            {filteredUsers.map(user => (
                                                <button
                                                    key={user.id}
                                                    type="button"
                                                    onClick={() => addMember(user.id)}
                                                    className="w-full flex items-center gap-3 p-2 hover:bg-indigo-50 rounded-lg transition-colors text-left group"
                                                >
                                                    <Avatar className="w-8 h-8 group-hover:ring-2 ring-indigo-200 transition-all">
                                                        <AvatarImage src={user.avatar ? getAvatarUrl(user.avatar) : ''} />
                                                        <AvatarFallback
                                                            className="text-xs text-white"
                                                            style={{ backgroundColor: getUserColor(user) }}
                                                        >
                                                            {getInitials(user.fullName)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                                                        <p className="text-xs text-gray-500">{user.email}</p>
                                                    </div>
                                                    <Plus size={16} className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 text-center text-gray-500 text-sm">
                                            Sonuç bulunamadı.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Selected Members - Display selected chips BELOW search */}
                        {selectedUserIds.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2 p-2 bg-indigo-50/50 rounded-lg border border-indigo-100">
                                {selectedUsers.map(user => (
                                    <div
                                        key={user.id}
                                        className="flex items-center gap-2 pl-1 pr-2 py-1 bg-white rounded-full border border-indigo-100 shadow-sm"
                                    >
                                        <Avatar className="w-5 h-5">
                                            <AvatarImage src={user.avatar ? getAvatarUrl(user.avatar) : ''} />
                                            <AvatarFallback
                                                className="text-[8px] text-white"
                                                style={{ backgroundColor: getUserColor(user) }}
                                            >
                                                {getInitials(user.fullName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs font-medium text-indigo-900">{user.fullName}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeMember(user.id)}
                                            className="ml-0.5 p-0.5 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors text-gray-400"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="border-t border-gray-100 my-4"></div>

                    {/* Quick Project Toggle */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="quickProject"
                            checked={showQuickProject}
                            onCheckedChange={setShowQuickProject}
                        />
                        <Label
                            htmlFor="quickProject"
                            className="font-medium cursor-pointer flex items-center gap-2"
                        >
                            <Rocket size={16} className="text-indigo-600" />
                            Hızlı Proje Oluştur
                        </Label>
                    </div>

                    {showQuickProject && (
                        <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">

                            {/* Project Name */}
                            <div className="space-y-1.5">
                                <Label htmlFor="projectName" className="text-xs font-bold text-gray-500 uppercase">Proje Adı</Label>
                                <Input
                                    id="projectName"
                                    placeholder="Örn: Q1 Hedefleri, Mobil Uygulama"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    className="bg-white"
                                />
                            </div>

                            {/* Icons Grid */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-500 uppercase">İkon</Label>
                                <div className="grid grid-cols-8 gap-1 max-h-32 overflow-y-auto p-2 bg-white rounded-lg border border-gray-200">
                                    {PREMIUM_ICONS.map(({ name, icon: Icon }) => (
                                        <button
                                            key={name}
                                            type="button"
                                            onClick={() => setProjectIcon(name)}
                                            className={`w-8 h-8 flex items-center justify-center rounded transition-all ${projectIcon === name
                                                ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-500'
                                                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                                                }`}
                                            title={name}
                                        >
                                            <Icon size={16} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Color Picker */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Renk</Label>
                                <div className="flex gap-2">
                                    {colors.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setProjectColor(color)}
                                            className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${projectColor === color ? 'ring-2 ring-offset-1 ring-gray-400' : ''
                                                }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => {
                            resetForm();
                            onClose();
                        }} disabled={isLoading}>
                            İptal
                        </Button>
                        <Button type="submit" disabled={!name.trim() || isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[100px]">
                            {isLoading ? 'Oluşturuluyor...' : 'Oluştur'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default NewWorkspaceModal;
