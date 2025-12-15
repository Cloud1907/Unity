import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag, X } from 'lucide-react';
import { labelsAPI } from '../services/api';
import { toast } from './ui/sonner';

// Önceden tanımlı renkler (Monday.com tarzı)
const PRESET_COLORS = [
  '#0073EA', // Mavi
  '#00C875', // Yeşil
  '#FDAB3D', // Turuncu
  '#E2445C', // Kırmızı
  '#784BD1', // Mor
  '#FF158A', // Pembe
  '#FF642E', // Koyu Turuncu
  '#7F5347', // Kahverengi
  '#579BFC', // Açık Mavi
  '#66CCFF', // Sky Blue
  '#C4C4C4', // Gri
  '#401694', // Koyu Mor
];

const LabelManager = ({ projectId, onClose }) => {
  const [labels, setLabels] = useState([]);
  const [isAddMode, setIsAddMode] = useState(false);
  const [editingLabel, setEditingLabel] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    color: PRESET_COLORS[0]
  });

  useEffect(() => {
    fetchLabels();
  }, [projectId]);

  const fetchLabels = async () => {
    try {
      const response = await labelsAPI.getByProject(projectId);
      setLabels(response.data || []);
    } catch (error) {
      console.error('Error fetching labels:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingLabel) {
        await labelsAPI.update(editingLabel.id, formData);
        toast.success('Etiket güncellendi');
      } else {
        await labelsAPI.create({ ...formData, projectId });
        toast.success('Etiket oluşturuldu');
      }
      
      fetchLabels();
      resetForm();
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const handleDelete = async (labelId) => {
    if (!window.confirm('Bu etiketi silmek istediğinizden emin misiniz? Tüm görevlerden kaldırılacaktır.')) {
      return;
    }

    try {
      await labelsAPI.delete(labelId);
      toast.success('Etiket silindi');
      fetchLabels();
    } catch (error) {
      toast.error('Etiket silinemedi');
    }
  };

  const startEdit = (label) => {
    setEditingLabel(label);
    setFormData({
      name: label.name,
      color: label.color
    });
    setIsAddMode(true);
  };

  const resetForm = () => {
    setIsAddMode(false);
    setEditingLabel(null);
    setFormData({
      name: '',
      color: PRESET_COLORS[0]
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Tag className="text-blue-600" size={24} />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Etiket Yönetimi</h2>
              <p className="text-sm text-gray-600">Proje etiketlerini oluşturun ve düzenleyin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add/Edit Form */}
          {isAddMode ? (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingLabel ? 'Etiketi Düzenle' : 'Yeni Etiket Oluştur'}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Etiket Adı
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Örn: Backend, Bug, Urgent"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Renk Seçin
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-full aspect-square rounded-lg transition-all ${
                        formData.color === color
                          ? 'ring-4 ring-offset-2 ring-blue-500 scale-110'
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Önizleme
                </label>
                <span
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: formData.color }}
                >
                  <Tag size={12} />
                  {formData.name || 'Etiket Adı'}
                </span>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingLabel ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAddMode(true)}
              className="w-full mb-6 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
            >
              <Plus size={20} className="text-gray-400 group-hover:text-blue-600" />
              <span className="text-gray-600 group-hover:text-blue-600 font-medium">
                Yeni Etiket Ekle
              </span>
            </button>
          )}

          {/* Labels List */}
          <div className="space-y-2">
            {labels.length === 0 ? (
              <div className="text-center py-12">
                <Tag size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Henüz etiket yok</p>
                <p className="text-sm text-gray-400">Yukarıdaki butondan yeni etiket oluşturun</p>
              </div>
            ) : (
              labels.map(label => (
                <div
                  key={label.id}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: label.color }}
                    >
                      <Tag size={12} />
                      {label.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(label)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Düzenle"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(label.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Sil"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer Stats */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Toplam <span className="font-semibold">{labels.length}</span> etiket
          </p>
        </div>
      </div>
    </div>
  );
};

export default LabelManager;
