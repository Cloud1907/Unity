import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { toast } from '../ui/sonner';

const DepartmentFormModal = ({ isOpen, onClose, onSuccess, dept = null }) => {
  const { createDepartment, updateDepartment } = useData();
  const backdropRef = React.useRef(null);
  const isMouseDownOnBackdrop = React.useRef(false);

  const [formData, setFormData] = useState({
    name: dept?.name || '',
    description: dept?.description || '',
    headOfDepartment: dept?.headOfDepartment || '',
    color: dept?.color || '#6366f1',
    isMaster: dept?.isMaster || false
  });
  const [loading, setLoading] = useState(false);

  const colors = ['#0086c0', '#6366f1', '#8b5cf6', '#00c875', '#fdab3d', '#e2445c', '#ff5a5f'];

  const handleMouseDown = (e) => {
    if (e.target === backdropRef.current) isMouseDownOnBackdrop.current = true;
    else isMouseDownOnBackdrop.current = false;
  };

  const handleMouseUp = (e) => {
    if (isMouseDownOnBackdrop.current && e.target === backdropRef.current) onClose();
    isMouseDownOnBackdrop.current = false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (dept) {
        await updateDepartment(dept.id, formData);
      } else {
        await createDepartment(formData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Dept Error:', error);
      const msg = error.response?.data?.detail || error.message;
      toast.error('Hata: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-4 max-w-lg w-full"
      >
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          {dept ? 'Çalışma Alanını Düzenle' : 'Yeni Çalışma Alanı Ekle'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Çalışma Alanı Adı</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-gray-900 dark:text-gray-100"
              placeholder="Örn: Mühendislik"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Çalışma Alanı Yöneticisi</label>
            <input
              type="text"
              value={formData.headOfDepartment}
              onChange={(e) => setFormData({ ...formData, headOfDepartment: e.target.value })}
              className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-gray-900 dark:text-gray-100"
              placeholder="Örn: Melih Bulut"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Açıklama</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
              rows={3}
              placeholder="Çalışma alanı hakkında kısa bilgi..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Renk Seçin</label>
            <div className="flex gap-2">
              {colors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-lg transition-all hover:scale-110 ${formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                    }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor...' : dept ? 'Güncelle' : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepartmentFormModal;
