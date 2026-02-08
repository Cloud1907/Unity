# Kod Denetim Raporu — Unity (Workforce Management)

**Denetçi:** Kıdemli Yazılım Mimarı & Kod Denetçisi (External Audit)  
**Tarih:** 2026-02-08  
**Kapsam:** Frontend (React), Backend (.NET 8), dokümantasyon ve genel mimari

---

## Yönetici Özeti

Proje, **modern bir React + .NET 8** yığını ile kurumsal bir iş gücü yönetim uygulaması olarak iyi bir temele sahip; mimari standartlar (ARCHITECTURE_STANDARDS.md, INSTRUCTIONS.md) ve entity normalizasyonu gibi disiplinler tanımlı. Ancak **1180+ satırlık tek bileşenler (ModernTaskModal, KanbanViewV2)**, **iki farklı toast kütüphanesinin** aynı anda kullanımı, **production’da kalan debug log’lar** ve **ölü/duplike dosyalar (Sidebar_old, Weekly Progress 2)** teknik borcu artırıyor. Refactoring planı uygulanırsa bakım maliyeti ve hata riski belirgin şekilde düşer.

---

## 1. Mimari Bütünlük ve Teknoloji Kullanımı

**Puan: 7/10**

### Güçlü Yönler
- **Backend:** Clean Architecture (Unity.Core, Unity.Infrastructure, Unity.API), DTO-first, EF Core migrations, integer ID politikası.
- **Frontend:** Hooks (useTasks, useProjects, useSignalR vb.) ile mantığın ayrılması; Context’lerin state/actions ayrımı (DataStateContext / DataActionsContext).
- **Dokümantasyon:** ARCHITECTURE_STANDARDS.md, INSTRUCTIONS.md (Constitution), contracts.md ile kurallar yazılı.
- **Klasör yapısı:** `src/{components, pages, hooks, contexts, services, utils, constants}` mantıklı; ui/ ve shared/ alt klasörleri var.

### Zayıf Yönler / Teknik Borç
- **Bağımlılık şişkinliği:** 50+ production dependency; 25+ ayrı Radix paketi (accordion, alert-dialog, aspect-ratio, menubar, navigation-menu vb.) — tek primitives paketi veya daha az parça ile yönetilebilir. İki toast kütüphanesi: **react-hot-toast** (useTasks, useLabels, useProjects, DataContext, KanbanViewV2, useUserList, useDashboardData) ve **sonner** (ModernTaskModal, Sidebar, Login, Register, Settings, GanttView, ExportButton, WorkspaceSettingsModal). Aynı iş için iki kütüphane = tutarsız UX ve gereksiz bundle.
- **Backend “God Controller”:** TasksController.cs ~1240 satır; tek sorumluluk ihlali ve test edilebilirlik zorluğu.
- **Bağımlılık / coupling:** DataProvider tek yerde 5 hook’u (useProjects, useTasks, useUsers, useDepartments, useLabels) birleştiriyor; bir hook’taki değişiklik tüm Data tüketicilerini etkileyebilir.

---

## 2. Kod Kalitesi ve Spagetti Analizi

**Puan: 5/10**

### God Objects / Aşırı Büyük Dosyalar
| Dosya | Satır | Değerlendirme |
|-------|-------|----------------|
| ModernTaskModal.jsx | ~1181 | Modal + form + alt görevler + yorumlar + dosyalar + aktivite + silme onayı. En az 5–6 bileşene bölünebilir. |
| KanbanViewV2.jsx | ~1122 | Board + sütunlar + CompactTaskCard + filtreler + drag-drop + menü. Card ve column ayrı dosya olmalı. |
| AdminPanel.jsx | ~891 | Kullanıcılar, departmanlar, etiketler, roller tek sayfada. Tab/section bazlı bölünmeli. |
| TasksController.cs | ~1240 | Tüm task CRUD + subtasks + dashboard + status/progress. Command/Query veya ayrı controller’lara bölünmeli. |
| MainTable.jsx | ~620 | Tablo + satır + sanal scroll. TaskRow zaten 401 satır; büyük. |
| Sidebar.jsx | ~497 | Proje/departman ağacı + favoriler + ayarlar. WorkspaceGroup vb. ayrılabilir. |

### Okunabilirlik ve SRP
- **Inline bileşenler:** KanbanViewV2 içinde `CompactTaskCard`, `InlinePriorityDropdown`, `InlineDatePickerSmall` gibi 100+ satırlık yerel bileşenler var; dosya içi “spagetti” ve yeniden kullanım yok.
- **Tekrarlayan mantık:** Assignee/label ID çıkarma hem `entityUtils.extractIds` hem KanbanViewV2 içinde `getIds` ve benzeri map’lerle yapılıyor (DRY ihlali).
- **Callback / karmaşıklık:** Çok sayıda `useEffect` (KanbanViewV2’de 7+) ve bağımlılık listeleri; bazı effect’ler hem fetch hem subscribe hem cleanup yapıyor.

### Olumlu Noktalar
- **entityHelpers.normalizeEntity:** Tek merkezde ID/labels/assignees normalizasyonu; backend/frontend uyumu için kritik ve düzenli.
- **taskHelpers.updateTaskInTree:** Stale update koruması ve merge mantığı net.
- **Error boundary:** shared/ErrorBoundary.jsx mevcut.

---

## 3. Tutarlılık (Consistency)

**Puan: 6/10**

### İsimlendirme ve Stil
- Component: PascalCase. Hook: useCamelCase. Util: camelCase. Genel olarak tutarlı.
- Bazı prop isimleri karışık: `boardId` vs `projectId` (aynı kavram farklı yerlerde farklı isim).
- `useData()` “legacy” olarak kullanılıyor; hem `useDataState` + `useDataActions` hem `useData` ile erişim = iki pattern.

### State Yönetimi
- **Global:** AuthContext (user, login, register), DataContext (projects, tasks, users, departments, labels), ThemeContext. Redux yok; Context + hook’lar kullanılmış — proje büyüklüğü için makul.
- **Sorun:** DataContext state değeri çok büyük bir obje; `projects`, `tasks`, `users` vb. her biri değiştiğinde tüm `useDataState()` tüketicileri re-render olabilir (performans riski).

### Toast Kullanımı
- **react-hot-toast:** useTasks, useLabels, useProjects, useDepartments, useSignalR, DataContext, KanbanViewV2, useUserList, useDashboardData.
- **sonner:** ModernTaskModal, Sidebar, Login, Register, Settings, AdminPanel, GanttView, ExportButton, WorkspaceSettingsModal, ProfileSettings.
- UI’da tek Toaster (sonner) kullanılıyor; bazı sayfalar hâlâ react-hot-toast import ediyor. Tek kütüphane (tercihen sonner) ile standardizasyon gerekli.

---

## 4. Ölü Kod ve Temizlik (Dead Code & Cleanup)

**Puan: 5/10**

### Zombie / Duplike Dosyalar
- **Sidebar_old.jsx:** Eski sidebar; import edilmiyorsa kaldırılmalı.
- **Weekly Progress 2.jsx:** İsimde boşluk ve “2”; muhtemelen duplike veya eski sürüm — tekilleştirilip isim düzeltilmeli veya silinmeli.

### Production’da Kalan Log ve Debug
- **api.js:** Her istekte `console.log('[API] GET /tasks ... took Xms')`; yavaş isteklerde `console.warn`. Production’da log seviyesi kısılmalı veya kaldırılmalı.
- **api.js subtasksAPI.update:** `console.log('[DEBUG] subtasksAPI.update calling:', id, data)` ve response log — tamamen kaldırılmalı.
- **KanbanViewV2.jsx (CompactTaskCard):** `console.log('[CompactTaskCard] Render ${task.id}', { assigneesRaw, parsedIds })` — her kart render’da log; kaldırılmalı.
- **ConfirmModal.jsx:** `console.log("ConfirmModal: Kırmızı Butona Basıldı!")` ve diğer adım log’ları — debug amaçlı; kaldırılmalı.
- **DataContext.jsx:** `console.log('--- GLOBAL DATA SYNC COMPLETED ---')` — production’da gereksiz.
- **Reports.jsx:** `console.log('[Reports] Loading all tasks...')` — kaldırılmalı.
- **BoardHeader.jsx:** `console.log('Board members for workspace:', {...})` — kaldırılmalı veya dev-only yapılmalı.
- **taskHelpers.js:** Stale update için `console.log` — geliştirme için bırakılabilir ama production’da log seviyesi ile korunmalı.

### Yorum ve TODO
- Açık **TODO/FIXME** satırı taranan alanda bulunmadı (iyi).
- Uzun yorum blokları ve “Removed: …” notları bazı dosyalarda var; gereksizse temizlenmeli.

---

## 5. Performans ve Güvenlik

**Puan: 6/10**

### Re-render ve Bellek
- **useEffect cleanup:** Click-outside, resize, SignalR disconnect, interval/observer (App.js) için cleanup fonksiyonları tanımlı — iyi.
- **App.js:** `setInterval(unlockBody, 1000)` — cleanup’ta `clearInterval` var; ancak 1 saniyede bir çalıştırma agresif; sadece “emergent/preview” ortamında ise koşullu bırakılabilir.
- **DataContext:** `stateValue` dependency listesi uzun; tasks/projects gibi büyük listeler değişince çok sayıda bileşen re-render. Listeler için ayrı context veya seçiciler (selector pattern) düşünülebilir.
- **React.memo:** InlineLabelPicker, InlineAssigneePicker, TaskRow gibi yerlerde kullanılmış; büyük listelerde faydalı.

### Hata Yakalama ve Doğrulama
- **Try/catch:** API çağrıları ve kritik işlemler çoğunlukla try/catch ile sarılı; toast veya setState ile kullanıcıya bilgi veriliyor.
- **Form doğrulama:** Register’da şifre uzunluğu/eşleşme kontrolü var; diğer formlarda (proje, görev, workspace) merkezi bir validation (örn. Zod şeması) yok; bazı yerlerde sadece backend hatasına güveniliyor.
- **XSS:** `dangerouslySetInnerHTML` kullanımı yok — iyi.

### Kimlik Doğrulama ve Token
- Token ve refresh token **localStorage**’da; XSS’te çalınma riski var. HttpOnly cookie + backend’de refresh rotası daha güvenli olurdu; mevcut yapı yaygın bir pattern.
- 401 ve refresh token kuyruğu (api.js) doğru kurgulanmış; tekrar deneme mantığı var.

---

## Kritik Bulgular (Red Flags)

1. **İki toast kütüphanesi (react-hot-toast + sonner)**  
   Aynı uygulama içinde iki farklı toast API’si; bundle ve UX tutarsızlığı. **Tek kütüphaneye (tercihen sonner) geçilmesi** ve tüm `toast.*` çağrılarının bu kütüphaneye taşınması gerekir.

2. **1180+ satırlık ModernTaskModal ve 1120+ satırlık KanbanViewV2**  
   Bakımı zor, testi güç, SRP ihlali. **Bölünmeden** yeni özellik eklemek riski artırır. Modal: en az TaskModalHeader, TaskModalDetails, TaskModalSubtasks, TaskModalComments, TaskModalFiles, TaskModalActivity, DeleteConfirmBlock gibi parçalara ayrılmalı. Kanban: KanbanBoard, KanbanColumn, CompactTaskCard, KanbanFilters ayrı dosyalara taşınmalı.

3. **Production’da anlamlı debug log’ları**  
   api.js (her istek), subtasksAPI.update, KanbanViewV2 CompactTaskCard, ConfirmModal, DataContext, Reports, BoardHeader. **Production build’de bu log’lar kapatılmalı** (env check veya log level).

4. **Backend TasksController ~1240 satır**  
   Tek controller’da çok fazla sorumluluk; unit/integration test yazmak zor. **TaskCommands / TaskQueries veya TasksController + TaskSubtaskController + TaskDashboardController** gibi bölünmeler önerilir.

5. **Ölü / duplike dosyalar**  
   Sidebar_old.jsx, Weekly Progress 2.jsx. Referans yoksa **silinmeli**; kullanım varsa tek dosyada birleştirilip isimlendirme düzeltilmeli.

6. **DataContext’in tek dev state objesi**  
   tasks/projects/users değişince tüm tüketiciler re-render olabilir. **Context’i domain’e göre bölmek** (TasksContext, ProjectsContext) veya **selector tabanlı erişim** ile sadece ilgili veriyi kullanan bileşenlerin güncellenmesi sağlanabilir.

---

## İyileştirme Önerileri (Refactoring Plan)

### Faz 1 — Hızlı Temizlik (1–2 gün)
1. **Toast standardizasyonu:** Tüm `react-hot-toast` import ve kullanımlarını kaldır; tek tip `sonner` kullan. `package.json`’dan `react-hot-toast` sil.
2. **Debug log’ları kaldır:** api.js (veya NODE_ENV === 'development' koşuluna al), subtasksAPI.update, KanbanViewV2 CompactTaskCard, ConfirmModal, DataContext, Reports, BoardHeader. Gerekirse tek bir `logger` helper (dev’de console, prod’da noop) kullan.
3. **Ölü dosyalar:** Sidebar_old.jsx referansı yoksa sil. “Weekly Progress 2.jsx” kullanılıyorsa yeniden adlandır veya WeeklyProgress ile birleştir; kullanılmıyorsa sil.

### Faz 2 — Bileşen Bölme (1–2 hafta)
4. **ModernTaskModal:**  
   - TaskModalHeader, TaskModalBody (tabs: details, subtasks, comments, files, activity), TaskModalFooter, TaskDeleteConfirm ayrı dosyalar.  
   - State’i custom hook’a taşı: `useTaskModalState(task)` (taskData, subtasks, comments, attachments, handlers).
5. **KanbanViewV2:**  
   - CompactTaskCard → `components/KanbanTaskCard.jsx`.  
   - InlinePriorityDropdown, InlineDatePickerSmall → mevcut InlineDropdown/InlineDatePicker ile birleştir veya `components/kanban/` altında ince wrapper’lar.  
   - KanbanBoard, KanbanColumn, KanbanFilters ayrı bileşenler; view yalnızca bunları bir araya getirsin.

### Faz 3 — State ve Backend (2–3 hafta)
6. **DataContext:**  
   - İsteğe bağlı: TasksContext, ProjectsContext ayrı provider’lar (veya tek provider içinde ayrı context’ler) ile sadece ilgili state’i tüketen bileşenlerin re-render’ını azalt.  
   - Veya useMemo/selectors (örn. `useTaskById(id)`) ile tüketim noktalarında sadece gerekli veriyi döndür.
7. **TasksController (Backend):**  
   - TaskCqrs veya TaskApplicationService ile command/query ayrımı.  
   - Veya TasksController (CRUD), TaskSubtaskController, TaskDashboardController olarak böl; ortak servisleri inject et.

### Faz 4 — Kalite ve Test (sürekli)
8. **AdminPanel:** Section bazlı bileşenlere böl (AdminUsers, AdminDepartments, AdminLabels); her biri kendi state/API hook’unu kullansın.
9. **Merkezi form validasyonu:** Kritik formlar için Zod (veya mevcut yapı) ile şemalar tanımla; hem client hem (mümkünse) contract test ile backend ile uyumunu koru.
10. **ESLint:** `no-console` kuralı production build’de veya prod path’lerde uyarı verecek şekilde aç; debug log’ların geri dönmesini engelle.

---

## Genel Puan

| Kriter | Puan (10) |
|--------|-----------|
| 1. Mimari Bütünlük ve Teknoloji Kullanımı | 7 |
| 2. Kod Kalitesi ve Spagetti Analizi | 5 |
| 3. Tutarlılık | 6 |
| 4. Ölü Kod ve Temizlik | 5 |
| 5. Performans ve Güvenlik | 6 |

**Ağırlıklı ortalama (eşit ağırlık):** (7 + 5 + 6 + 5 + 6) / 5 = **5.8/10**.

**Genel puan (100 üzerinden):** **58/100**

---

Proje, işlevsel ve belgelenmiş bir kurumsal uygulama olarak iyi bir temele sahip; en büyük riskler **aşırı büyük bileşenler**, **çift toast kullanımı**, **production log’ları** ve **ölü/duplike kod**. Yukarıdaki refactoring planı uygulandıkça puanın 70–75 bandına çıkması beklenir.
