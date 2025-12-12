# Monday.com Clone - API Contracts & Backend Implementation Plan

## 🎯 Proje Hedefi
Monday.com'un modern UI/UX'i + UniTask'ın güçlü iş mantığını birleştirmek

## 📊 Database Schema

### 1. Users Collection
```javascript
{
  _id: ObjectId,
  fullName: String,
  email: String (unique),
  password: String (hashed),
  department: ObjectId (ref: Departments),
  role: String (enum: ['admin', 'manager', 'member', 'guest']),
  manager: ObjectId (ref: Users),
  avatar: String (URL),
  color: String (hex color),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Departments Collection
```javascript
{
  _id: ObjectId,
  name: String,
  headOfDepartment: ObjectId (ref: Users),
  description: String,
  color: String,
  createdAt: Date
}
```

### 3. Projects (Boards) Collection
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  icon: String (emoji),
  color: String,
  owner: ObjectId (ref: Users),
  members: [ObjectId] (ref: Users),
  department: ObjectId (ref: Departments),
  startDate: Date,
  endDate: Date,
  budget: Number,
  status: String (enum: ['planning', 'in_progress', 'on_hold', 'completed', 'cancelled']),
  priority: String (enum: ['low', 'medium', 'high', 'urgent']),
  favorite: Boolean,
  createdBy: ObjectId (ref: Users),
  createdAt: Date,
  updatedAt: Date
}
```

### 4. Tasks Collection
```javascript
{
  _id: ObjectId,
  projectId: ObjectId (ref: Projects) (nullable - direkt görev olabilir),
  title: String,
  description: String,
  assignees: [ObjectId] (ref: Users),
  assignedBy: ObjectId (ref: Users),
  status: String (enum: ['todo', 'working', 'stuck', 'review', 'done']),
  priority: String (enum: ['low', 'medium', 'high', 'urgent']),
  labels: [String],
  startDate: Date,
  dueDate: Date,
  progress: Number (0-100),
  createdAt: Date,
  updatedAt: Date
}
```

### 5. Subtasks Collection
```javascript
{
  _id: ObjectId,
  taskId: ObjectId (ref: Tasks),
  title: String,
  description: String,
  assignedTo: ObjectId (ref: Users),
  status: String (enum: ['not_started', 'in_progress', 'completed']),
  dueDate: Date,
  completed: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 6. Comments Collection
```javascript
{
  _id: ObjectId,
  taskId: ObjectId (ref: Tasks),
  userId: ObjectId (ref: Users),
  text: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 7. TimeLog Collection
```javascript
{
  _id: ObjectId,
  taskId: ObjectId (ref: Tasks),
  userId: ObjectId (ref: Users),
  date: Date,
  hoursSpent: Number,
  description: String,
  workType: String (enum: ['development', 'design', 'analysis', 'planning', 'meeting', 'other']),
  billable: Boolean,
  createdAt: Date
}
```

### 8. Notifications Collection
```javascript
{
  _id: ObjectId,
  recipientId: ObjectId (ref: Users),
  type: String (enum: ['task_assigned', 'task_updated', 'comment_added', 'due_date_reminder', 'mention']),
  taskId: ObjectId (ref: Tasks),
  senderId: ObjectId (ref: Users),
  message: String,
  isRead: Boolean,
  priority: String (enum: ['low', 'normal', 'high']),
  createdAt: Date
}
```

### 9. ActivityLog Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: Users),
  action: String (enum: ['task_created', 'task_updated', 'task_deleted', 'comment_added', 'status_changed', 'user_assigned']),
  taskId: ObjectId (ref: Tasks),
  projectId: ObjectId (ref: Projects),
  description: String,
  metadata: Object (additional data),
  createdAt: Date
}
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Giriş yap
- `GET /api/auth/me` - Mevcut kullanıcı bilgisi
- `PUT /api/auth/profile` - Profil güncelle

### Users
- `GET /api/users` - Tüm kullanıcılar
- `GET /api/users/:id` - Kullanıcı detayı
- `PUT /api/users/:id` - Kullanıcı güncelle
- `DELETE /api/users/:id` - Kullanıcı sil

### Departments
- `GET /api/departments` - Tüm departmanlar
- `POST /api/departments` - Departman oluştur
- `PUT /api/departments/:id` - Departman güncelle
- `DELETE /api/departments/:id` - Departman sil

### Projects (Boards)
- `GET /api/projects` - Tüm projeler (kullanıcıya göre filtrelenmiş)
- `GET /api/projects/:id` - Proje detayı
- `POST /api/projects` - Proje oluştur
- `PUT /api/projects/:id` - Proje güncelle
- `DELETE /api/projects/:id` - Proje sil
- `POST /api/projects/:id/members` - Proje üyesi ekle
- `DELETE /api/projects/:id/members/:userId` - Proje üyesi çıkar
- `PUT /api/projects/:id/favorite` - Favori toggle

### Tasks
- `GET /api/tasks` - Tüm görevler (filter: projectId, status, assignee)
- `GET /api/tasks/:id` - Görev detayı
- `POST /api/tasks` - Görev oluştur
- `PUT /api/tasks/:id` - Görev güncelle
- `DELETE /api/tasks/:id` - Görev sil
- `PUT /api/tasks/:id/status` - Durum güncelle (drag-drop için)
- `PUT /api/tasks/:id/progress` - İlerleme güncelle
- `POST /api/tasks/:id/assign` - Kullanıcı ata

### Subtasks
- `GET /api/tasks/:taskId/subtasks` - Görevin alt görevleri
- `POST /api/tasks/:taskId/subtasks` - Alt görev oluştur
- `PUT /api/subtasks/:id` - Alt görev güncelle
- `DELETE /api/subtasks/:id` - Alt görev sil

### Comments
- `GET /api/tasks/:taskId/comments` - Görev yorumları
- `POST /api/tasks/:taskId/comments` - Yorum ekle
- `PUT /api/comments/:id` - Yorum güncelle
- `DELETE /api/comments/:id` - Yorum sil

### TimeLog
- `GET /api/timelogs` - Zaman kayıtları (filter: taskId, userId, date range)
- `POST /api/timelogs` - Zaman kaydı ekle
- `PUT /api/timelogs/:id` - Zaman kaydı güncelle
- `DELETE /api/timelogs/:id` - Zaman kaydı sil
- `GET /api/timelogs/reports` - Zaman raporları

### Notifications
- `GET /api/notifications` - Kullanıcının bildirimleri
- `PUT /api/notifications/:id/read` - Bildirimi okundu işaretle
- `PUT /api/notifications/read-all` - Tümünü okundu işaretle
- `DELETE /api/notifications/:id` - Bildirim sil

### Activity Log
- `GET /api/activity` - Aktivite geçmişi (filter: projectId, userId)

### Analytics & Reports
- `GET /api/analytics/overview` - Genel bakış (toplam projeler, görevler, tamamlanma oranı)
- `GET /api/analytics/workload` - İş yükü analizi
- `GET /api/analytics/time-tracking` - Zaman takibi raporları
- `GET /api/analytics/project-progress` - Proje ilerleme raporları

## 🎨 Frontend-Backend Entegrasyonu

### Mock Data → Backend Entegrasyonu
**Dosya: `/app/frontend/src/mockData.js`**

#### Değiştirilecekler:
1. `users` array → API'den gelecek (`GET /api/users`)
2. `boards` array → API'den gelecek (`GET /api/projects`)
3. `tasks` array → API'den gelecek (`GET /api/tasks`)
4. `currentUser` → API'den gelecek (`GET /api/auth/me`)

#### Yeni Servis Katmanı:
**Dosya: `/app/frontend/src/services/api.js`**
```javascript
- authService: login, register, getMe
- userService: getUsers, getUser, updateUser
- projectService: getProjects, createProject, updateProject, deleteProject
- taskService: getTasks, createTask, updateTask, deleteTask, updateStatus
- commentService: getComments, addComment
- timelogService: getTimeLogs, addTimeLog
- notificationService: getNotifications, markAsRead
```

### State Management
**Context API kullanılacak:**
- AuthContext - Kullanıcı oturumu
- ProjectContext - Aktif proje/board
- TaskContext - Görevler
- NotificationContext - Bildirimler

## 🔄 Drag & Drop İşlemleri
Kanban board'da drag-drop olduğunda:
1. Frontend: Optimistic update (anında UI güncelle)
2. API Call: `PUT /api/tasks/:id/status` → { status: 'new_status' }
3. Başarısız olursa: Geri al (rollback)

## 🔐 Authentication Flow
1. Login → JWT token al
2. Token'ı localStorage'a kaydet
3. Her API request'inde header'a ekle: `Authorization: Bearer <token>`
4. Token expire olursa → Login sayfasına yönlendir

## 📝 İlk Backend Implementation Adımları
1. ✅ User model ve auth endpoints (register, login, me)
2. ✅ Department model ve CRUD endpoints
3. ✅ Project model ve CRUD endpoints
4. ✅ Task model ve CRUD endpoints
5. ✅ Subtask model ve CRUD endpoints
6. ✅ Comment model ve CRUD endpoints
7. ✅ TimeLog model ve CRUD endpoints
8. ✅ Notification model ve endpoints
9. ✅ Activity Log model ve tracking
10. ✅ Analytics endpoints

## 🎯 Kritik Özellikler
1. **Proje + Direkt Görev Yönetimi**: Task'lar hem proje altında hem de bağımsız olabilir
2. **Departman Bazlı Organizasyon**: Her proje bir departmana bağlı
3. **Zaman Takibi**: Detaylı zaman loglama ve raporlama
4. **Bildirim Sistemi**: Real-time bildirimler
5. **Yetkilendirme**: Role-based access control (admin, manager, member, guest)

## 🚀 Deployment Considerations
- Environment variables: JWT_SECRET, MONGO_URL
- CORS ayarları
- Rate limiting
- Error handling middleware
- Logging system
