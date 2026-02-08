import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from './ui/sonner';
import ConfirmModal from './ui/ConfirmModal';

// Önceden tanımlı renkler (Monday.com tarzı)
const PRESET_COLORS = [
  { name: 'Kırmızı', color: '#e2445c' },
  { name: 'Yeşil', color: '#00c875' },
  { name: 'Turuncu', color: '#fdab3d' },
  { name: 'Mavi', color: '#579bfc' },
  { name: 'Mor', color: '#a25ddc' },
  { name: 'Lacivert', color: '#784bd1' },
  { name: 'Pembe', color: '#ff642e' },
  { name: 'Altın', color: '#ffb100' },
  { name: 'Sarı', color: '#ffadad' },
  { name: 'Açık Mavi', color: '#9cd3db' },
  { name: 'Adaçayı', color: '#7fbb11' },
  { name: 'Gri', color: '#808080' },
  { name: 'Bordo', color: '#7b0f1d' },
  { name: 'Teal', color: '#008080' },
  { name: 'İndigo', color: '#4b0082' },
  { name: 'Koyu Yeşil', color: '#1f511f' },
  { name: 'Somon', color: '#ff8c69' },
  { name: 'Lavanta', color: '#e6e6fa' },
  { name: 'Zeytin', color: '#808000' },
  { name: 'Mercan', color: '#ff7f50' }
];

const LabelManager = ({ projectId, onClose }) => {
  const { user } = useAuth();
  const { labels: globalLabels, createLabel, updateLabel, deleteLabel } = useData();
  const [isAddMode, setIsAddMode] = useState(false);
  const [editingLabel, setEditingLabel] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [targetLabel, setTargetLabel] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    color: PRESET_COLORS[0].color
  });
  const colorInputRef = React.useRef(null);

  // Ensure projectId is a number for consistent comparison/submission
  const SafeProjectId = Number(projectId);

  // Filter labels for this project
  const labels = globalLabels.filter(l => l.projectId === SafeProjectId || !l.projectId);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingLabel) {
      const result = await updateLabel(editingLabel.id, formData);
      if (result.success) {
        resetForm();
      }
    } else {
      const result = await createLabel({ ...formData, projectId: SafeProjectId });
      if (result.success) {
        resetForm();
      }
    }
  };

  const handleDelete = (label) => {
    setTargetLabel(label);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!targetLabel) return;
    const labelId = targetLabel.id;
    await deleteLabel(labelId);
    setTargetLabel(null);
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
      color: PRESET_COLORS[0].color
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
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(cp => (
                    <button
                      key={cp.color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: cp.color })}
                      className={`w-8 h-8 rounded-lg transition-all border-2 ${formData.color === cp.color
                        ? 'border-blue-500 scale-110 shadow-md ring-2 ring-blue-100'
                        : 'border-transparent hover:scale-105 hover:border-gray-200'
                        }`}
                      style={{ backgroundColor: cp.color }}
                      title={cp.name}
                    />
                  ))}
                  <div className="relative">
                    <input
                      ref={colorInputRef}
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="absolute opacity-0 w-0 h-0"
                    />
                    <button
                      type="button"
                      onClick={() => colorInputRef.current?.click()}
                      className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all bg-white hover:bg-slate-50 ${!PRESET_COLORS.some(cp => cp.color === formData.color)
                        ? 'border-blue-500 scale-110 shadow-md ring-2 ring-blue-100'
                        : 'border-gray-200 border-dashed hover:border-gray-400 hover:scale-105'
                        }`}
                      title="Özel Renk Seç"
                    >
                      <Plus size={16} className="text-gray-500" />
                    </button>
                  </div>
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
                    {(user?.role === 'admin' || label.createdBy === user?.id) && (
                      <>
                        <button
                          onClick={() => startEdit(label)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(label)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
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

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmDelete}
        title="Etiketi Sil"
        message={`"${targetLabel?.name}" etiketini silmek istediğinizden emin misiniz? Bu etiket tüm görevlerden kaldırılacaktır.`}
        confirmText="Evet, Sil"
        cancelText="İptal"
      />
    </div>
  );
};

export default LabelManager;
