import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
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

const NewWorkspaceModal = ({ isOpen, onClose }) => {
    const { createDepartment } = useData();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            const result = await createDepartment({ name, description });
            if (result.success) {
                onClose();
                setName('');
                setDescription('');
            }
        } catch (error) {
            console.error('Failed to create workspace:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Yeni Çalışma Alanı Oluştur</DialogTitle>
                    <DialogDescription>
                        Projelerinizi gruplamak ve ekiplerinizi yönetmek için yeni bir çalışma alanı oluşturun.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Çalışma Alanı Adı</Label>
                        <Input
                            id="name"
                            placeholder="Örn: Pazarlama, Yazılım Ekibi"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Açıklama (İsteğe bağlı)</Label>
                        <Input
                            id="description"
                            placeholder="Bu alanın amacı nedir?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            İptal
                        </Button>
                        <Button type="submit" disabled={!name.trim() || isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {isLoading ? 'Oluşturuluyor...' : 'Oluştur'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default NewWorkspaceModal;
