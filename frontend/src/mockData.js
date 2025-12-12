// Mock data for Monday.com clone

export const users = [
  {
    id: '1',
    name: 'Ahmet Yılmaz',
    email: 'ahmet@example.com',
    avatar: 'https://i.pravatar.cc/150?img=12',
    role: 'admin',
    color: '#ff5a5f'
  },
  {
    id: '2',
    name: 'Ayşe Kaya',
    email: 'ayse@example.com',
    avatar: 'https://i.pravatar.cc/150?img=45',
    role: 'member',
    color: '#00c875'
  },
  {
    id: '3',
    name: 'Mehmet Demir',
    email: 'mehmet@example.com',
    avatar: 'https://i.pravatar.cc/150?img=33',
    role: 'member',
    color: '#0086c0'
  },
  {
    id: '4',
    name: 'Zeynep Şahin',
    email: 'zeynep@example.com',
    avatar: 'https://i.pravatar.cc/150?img=47',
    role: 'guest',
    color: '#ffcb00'
  }
];

export const statuses = [
  { id: 'todo', label: 'Yapılacak', color: '#c4c4c4' },
  { id: 'working', label: 'Devam Ediyor', color: '#fdab3d' },
  { id: 'stuck', label: 'Takıldı', color: '#e2445c' },
  { id: 'done', label: 'Tamamlandı', color: '#00c875' },
  { id: 'review', label: 'İncelemede', color: '#579bfc' }
];

export const priorities = [
  { id: 'low', label: 'Düşük', color: '#c4c4c4', icon: '↓' },
  { id: 'medium', label: 'Orta', color: '#fdab3d', icon: '−' },
  { id: 'high', label: 'Yüksek', color: '#e2445c', icon: '↑' },
  { id: 'urgent', label: 'Acil', color: '#df2f4a', icon: '⇈' }
];

export const labels = [
  { id: 'frontend', name: 'Frontend', color: '#0086c0' },
  { id: 'backend', name: 'Backend', color: '#9cd326' },
  { id: 'design', name: 'Tasarım', color: '#a25ddc' },
  { id: 'bug', name: 'Bug', color: '#e2445c' },
  { id: 'feature', name: 'Özellik', color: '#00c875' }
];

export const boards = [
  {
    id: '1',
    name: 'Web Sitesi Yenileme',
    description: 'Şirket web sitesinin yenilenmesi projesi',
    color: '#0086c0',
    icon: '🌐',
    favorite: true,
    members: ['1', '2', '3']
  },
  {
    id: '2',
    name: 'Mobil Uygulama',
    description: 'iOS ve Android mobil uygulama geliştirme',
    color: '#a25ddc',
    icon: '📱',
    favorite: true,
    members: ['1', '2', '4']
  },
  {
    id: '3',
    name: 'Pazarlama Kampanyası',
    description: 'Q2 pazarlama kampanyası planlaması',
    color: '#ff5a5f',
    icon: '📢',
    favorite: false,
    members: ['2', '3', '4']
  }
];

export const tasks = [
  {
    id: '1',
    boardId: '1',
    title: 'Ana sayfa tasarımı',
    description: 'Modern ve kullanıcı dostu ana sayfa tasarımı oluştur',
    status: 'working',
    priority: 'high',
    assignees: ['2'],
    labels: ['design', 'frontend'],
    dueDate: '2025-02-15',
    createdAt: '2025-01-10',
    progress: 65,
    files: [],
    comments: [
      {
        id: 'c1',
        userId: '1',
        text: 'Harika ilerliyor! Mockup\u0027ları görebilir miyim?',
        createdAt: '2025-01-12T10:30:00Z'
      }
    ]
  },
  {
    id: '2',
    boardId: '1',
    title: 'Backend API geliştirme',
    description: 'RESTful API endpoints oluştur',
    status: 'todo',
    priority: 'high',
    assignees: ['3'],
    labels: ['backend'],
    dueDate: '2025-02-20',
    createdAt: '2025-01-11',
    progress: 0,
    files: [],
    comments: []
  },
  {
    id: '3',
    boardId: '1',
    title: 'Veritabanı şeması',
    description: 'MongoDB şeması tasarla ve implement et',
    status: 'done',
    priority: 'urgent',
    assignees: ['3', '1'],
    labels: ['backend'],
    dueDate: '2025-01-25',
    createdAt: '2025-01-08',
    progress: 100,
    files: [],
    comments: []
  },
  {
    id: '4',
    boardId: '1',
    title: 'Responsive tasarım',
    description: 'Tüm sayfaların mobil uyumlu olmasını sağla',
    status: 'review',
    priority: 'medium',
    assignees: ['2'],
    labels: ['frontend', 'design'],
    dueDate: '2025-02-18',
    createdAt: '2025-01-13',
    progress: 80,
    files: [],
    comments: []
  },
  {
    id: '5',
    boardId: '1',
    title: 'SEO optimizasyonu',
    description: 'Meta tags, sitemap ve SEO iyileştirmeleri',
    status: 'stuck',
    priority: 'low',
    assignees: ['4'],
    labels: ['frontend'],
    dueDate: '2025-02-25',
    createdAt: '2025-01-14',
    progress: 20,
    files: [],
    comments: []
  },
  {
    id: '6',
    boardId: '2',
    title: 'Login ekranı',
    description: 'Kullanıcı giriş ve kayıt ekranları',
    status: 'working',
    priority: 'high',
    assignees: ['2', '3'],
    labels: ['frontend', 'backend'],
    dueDate: '2025-02-10',
    createdAt: '2025-01-09',
    progress: 45,
    files: [],
    comments: []
  },
  {
    id: '7',
    boardId: '2',
    title: 'Push notification servisi',
    description: 'Firebase ile push notification entegrasyonu',
    status: 'todo',
    priority: 'medium',
    assignees: ['3'],
    labels: ['backend', 'feature'],
    dueDate: '2025-02-28',
    createdAt: '2025-01-15',
    progress: 0,
    files: [],
    comments: []
  }
];

export const currentUser = users[0];

export const activityLog = [
  {
    id: '1',
    userId: '2',
    action: 'task_updated',
    taskId: '1',
    description: 'Ana sayfa tasarımı görevinin durumunu güncelledi',
    timestamp: '2025-01-15T14:30:00Z'
  },
  {
    id: '2',
    userId: '1',
    action: 'comment_added',
    taskId: '1',
    description: 'Ana sayfa tasarımı görevine yorum ekledi',
    timestamp: '2025-01-15T10:15:00Z'
  },
  {
    id: '3',
    userId: '3',
    action: 'task_completed',
    taskId: '3',
    description: 'Veritabanı şeması görevini tamamladı',
    timestamp: '2025-01-14T16:45:00Z'
  }
];
