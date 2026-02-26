import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { labelsAPI } from '../../services/api';

// Label Modal
const LabelFormModal = ({ isOpen, onClose, onSuccess, label = null }) => {
  const { createLabel } = useData();
  const [formData, setFormData] = useState({
    name: label?.name || '',
    color: label?.color || '#00c875',
    isGlobal: true,
    projectId: null
  });
  const [loading, setLoading] = useState(false);

  const colors = ['#00c875', '#e2445c', '#fdab3d', '#0086c0', '#579bfc', '#a25ddc', '#ff5a5f'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (label) {
        await labelsAPI.update(label.id, formData);
      } else {
        await labelsAPI.create(formData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Labels error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {label ? 'Etiketi Düzenle (Global)' : 'Yeni Global Etiket'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Etiket Adı</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Renk</label>
            <div className="flex flex-wrap gap-2">
              {colors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-6 h-6 rounded-full transition-all hover:scale-110 ${formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-lg">İptal</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg">{loading ? '...' : 'Kaydet'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LabelFormModal;
