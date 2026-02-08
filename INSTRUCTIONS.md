# 🚨 CRITICAL DEVELOPMENT RULES (PORTS)

> **ALWAYS USE PORT 3000 FOR DEVELOPMENT**
> - **Frontend (Dev):** `http://localhost:3000` (Use `npm start` in `frontend/`)
> - **Backend (API):** `http://localhost:8080`
>
> ❌ **NEVER** use `http://localhost:8080` for viewing the frontend during development. It serves an **OLD/STALE** build.

---

# AGENT WORKFLOW: TERMINAL-FIRST TDD

1. **DEFAULT TO HEADLESS TESTING:**
   - Always attempt to verify code using Terminal/CLI tools (npm, pip, go test) FIRST.
   - Do not use the "Browser/GUI" tool for verification unless:
     a) I explicitly ask for it.
     b) The task involves visual CSS/Layout checks that a terminal cannot verify.

2. **THE "SILENT" ITERATION LOOP:**
   - When I ask for a feature, follow this loop BEFORE showing me code:
     1. Write a minimal Unit/Integration Test.
     2. Run it in the terminal -> Expect Fail.
     3. Write the implementation code.
     4. Run the test again -> Fix errors based on logs.
   - **CRITICAL:** Do not stop to ask me about simple errors. Fix them yourself using the logs.

3. **DELIVERABLE STANDARD:**
   - Only present the final code to me AFTER the terminal test returns "PASS".
   - If you cannot make the test pass after 3 attempts, then stop and ask for guidance.

4. **BROWSER PERMISSION:**
   - You are authorized to use the Browser Tool if strictly necessary for the task, but always prefer the Terminal for speed.

---

# 🏛️ UNITY PROJECT CONSTITUTION

> Bu kurallar KANUN niteliğindedir. Her kod değişikliğinde uyulması zorunludur.

---

## 📊 BÖLÜM 1: PERFORMANCE & UX STANDARDS

### 1.1 SKELETON SCREENS OVER SPINNERS
- Full-screen loading spinner kullanmak **YASAKTIR**
- Yüklenen içeriğin boyutlarına uygun **Skeleton Loader** kullanılmalı
- Amaç: Cumulative Layout Shift (CLS) önlemek

### 1.3 AGGRESSIVE MEMOIZATION
- Board view'daki tüm leaf componentler (`Cell`, `Button`, `Input`) `React.memo` ile sarılmalı
- Prop drilling kaynaklı re-render'ları önlemek için stable context veya signals kullanılmalı

### 1.4 OPTIMISTIC UI WITH UNDO
- UI güncellemeleri tıklama anında olmalı (server response beklenmeden)
- API hatası durumunda state sessizce geri alınmalı ve Toast bildirimi gösterilmeli
- Silme gibi yıkıcı aksiyonlarda Toast mesajında **"Geri Al"** seçeneği sunulmalı

### 1.5 LAZY ARCHITECTURE
- Ağır view'lar (`Gantt`, `Map`, `Dashboard`, `Reports`) `React.lazy` ile import edilmeli
- İlk login hızını yavaşlatmamalı

---

## ✅ BÖLÜM 2: POST-CODING CHECKLIST

> Her feature/fix tamamlandığında aşağıdaki kontroller yapılmalı:

```
[ ] Console'da error/warning yok
[ ] Network tab'da failed request yok
[ ] Component unmount'ta cleanup yapıldı (useEffect return)
[ ] Loading state handle edildi
[ ] Error state handle edildi
[ ] Mobile responsive kontrol edildi (375px, 768px, 1024px)
[ ] Türkçe karakter/metin kontrolü yapıldı
```

---

## 🛡️ BÖLÜM 3: ERROR HANDLING STANDARDS

### 3.1 TRY-CATCH ZORUNLULUĞU
- Tüm API çağrıları `try-catch` bloğu içinde olmalı
- Catch bloğunda kullanıcıya **anlamlı Türkçe mesaj** gösterilmeli
- Console'a detaylı error log yazılmalı

### 3.2 ERROR BOUNDARY
- Her major route için `React Error Boundary` kullanılmalı
- Crash durumunda kullanıcı dostu hata sayfası gösterilmeli

### 3.3 FORM VALIDATION
- Backend'e göndermeden önce frontend'de validation yapılmalı
- Validation hataları **inline** gösterilmeli (toast değil, input altında)
- Submit butonu validation geçene kadar disabled olmalı

---

## ♿ BÖLÜM 4: ACCESSIBILITY (A11Y) STANDARDS

### 4.1 KEYBOARD NAVIGATION
- Tüm interactive elementler `Tab` ile ulaşılabilir olmalı
- Modal açıkken focus içeride kilitli kalmalı (focus trap)
- `Escape` tuşu modal'ı kapatmalı

### 4.2 ARIA LABELS
- Icon-only buttonlarda `aria-label` **ZORUNLU**
- Form input'larında `htmlFor` + `id` eşleşmeli
- Loading durumlarında `aria-busy="true"` kullanılmalı

### 4.3 COLOR & CONTRAST
- Metin/arkaplan kontrastı WCAG AA standardını geçmeli (4.5:1)
- Sadece renge dayalı bilgi aktarımı yapılmamalı (renk körü kullanıcılar)

---

## 📁 BÖLÜM 5: FILE ORGANIZATION RULES

### 5.1 COMPONENT STRUCTURE
- 200+ satırı geçen component **parçalanmalı**
- Ortak kullanılan componentler `components/shared/` altında olmalı
- Page-specific componentler `pages/PageName/components/` altında olmalı

### 5.2 IMPORT ORDER (Sırasıyla)
```javascript
// 1. React/Framework imports
import React, { useState, useEffect } from 'react';

// 2. Third-party libraries
import axios from 'axios';
import { motion } from 'framer-motion';

// 3. Local components
import { Button, Modal } from '../components/shared';

// 4. Hooks
import { useAuth } from '../hooks/useAuth';

// 5. Utils/helpers
import { formatDate } from '../utils/dateUtils';

// 6. Styles
import './styles.css';
```

### 5.3 NAMING CONVENTIONS
| Tür | Format | Örnek |
|-----|--------|-------|
| Components | PascalCase | `TaskCard.jsx` |
| Hooks | useCamelCase | `useTaskData.js` |
| Utils | camelCase | `formatDate.js` |
| Constants | SCREAMING_SNAKE | `API_BASE_URL` |
| CSS Classes | kebab-case | `.task-card-header` |

---

## 🔐 BÖLÜM 6: SECURITY STANDARDS

### 6.1 INPUT SANITIZATION
- User input doğrudan DOM'a enjekte edilmemeli
- `dangerouslySetInnerHTML` **YASAK** (özel izin + code review gerekli)
- SQL injection ve XSS kontrolleri backend'de yapılmalı

### 6.2 AUTHENTICATION
- Protected route'larda auth kontrolü **ZORUNLU**
- API çağrılarında token expire kontrolü yapılmalı
- 401 response durumunda otomatik logout + login'e yönlendirme

### 6.3 SENSITIVE DATA
- ❌ `console.log()` ile user data yazdırmak **YASAK**
- ❌ localStorage'da şifre saklamak **YASAK**
- Token dışında sensitive data localStorage'da tutulmamalı

---

## 📝 BÖLÜM 7: GIT & DOCUMENTATION

### 7.1 COMMIT MESSAGE FORMAT
```
<type>(<scope>): <description>

Tipler: feat, fix, refactor, style, docs, test, chore
Örnek: feat(kanban): add drag-and-drop support
```

### 7.2 PR/MERGE CHECKLIST
```
[ ] Kod çalışıyor ve test edildi
[ ] Console'da hata yok
[ ] Bu constitution kurallarına uygun
[ ] CHANGELOG güncellendi (eğer user-facing değişiklik varsa)
```

---

> **Son Güncelleme:** 2026-01-27
> **Versiyon:** 1.0

---

## 🧪 BÖLÜM 8: MANDATORY TESTING RULES

### 8.1 STANDART TEST HESABI
- Tüm manuel ve otomasyon testleri aşağıdaki hesap ile yapılmalıdır:
  - **Email:** `melih.bulut@univera.com.tr`
  - **Şifre:** `test123`

### 8.2 STANDART TEST PROJESİ
- Tüm özellikler ve hata düzeltmeleri **Test Project Final 3** çalışma alanında test edilmelidir.
- Yeni proje oluşturmak yerine bu proje kullanılmalıdır.
