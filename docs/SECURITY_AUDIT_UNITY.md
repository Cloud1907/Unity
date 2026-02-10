# Unity Uygulaması — Kapsamlı Güvenlik Denetim Raporu

**Rol:** Senior DevSecOps / Siber Güvenlik Uzmanı  
**Tarih:** 2026-02-08  
**Kapsam:** State & IIS persistence, hassas veri maskeleme, OWASP/IDOR

---

## 1. State Management & IIS Persistence

### 1.1 Mevcut Durum (Kod İncelemesi)

- **Oturum modeli:** Uygulama **sunucu taraflı session kullanmıyor**. Kimlik doğrulama **JWT (Bearer)** ile yapılıyor; token istemcide `localStorage`'da tutuluyor.
- **JWT imza anahtarı:** `AppConfig.cs` içinde **her uygulama başlangıcında** `RandomNumberGenerator` ile yeni 32-byte key üretiliyor:
  ```csharp
  public static readonly byte[] JwtKey = GenerateKey();
  ```
- **Sonuç:** IIS reset / App Pool recycle sonrası process yeniden başlar → **yeni JwtKey** → eski token’lar **imza doğrulamasında başarısız** olur. Yani sunucu tarafında “oturum” zaten geçersiz hale geliyor.

### 1.2 Neden “Oturum Bitmiyor” Gibi Hissedilebilir?

1. **İstemci bilgisi yok:** Tarayıcı IIS restart’ı bilmez; `localStorage`’daki token durur, sayfa yenilenmeden kullanıcı “giriş yapmış” görünür.
2. **İstek atılana kadar 401 yok:** Kullanıcı sadece UI’da gezinip API çağrısı yapmazsa, 401 hiç dönmez; token temizlenmez.
3. **SignalR:** Yeniden bağlanırken eski token gönderilebilir; sunucu imza hatası verir ama istemci tarafında logout/redirect bazen tek bir yerde merkezi değilse “oturum bitmedi” izlenimi oluşabilir.

Yani sorun büyük ölçüde **istemci tarafında “restart sonrası token’ı atıp login’e düşme” davranışının net ve her yerde uygulanması** ile ilgilidir.

### 1.3 Güvenlik Riskleri

| Risk | Açıklama |
|------|----------|
| Eski token ile istek | Restart sonrası eski token 401 alana kadar kullanıcı arayüzde “girişli” kalabilir; ilk API’de 401 → mevcut `api.js` interceptor logout + `/login` yapıyor (bu doğru). |
| Token’ın çalınması | Token `localStorage`’da; XSS ile çalınabilir. Restart bunu değiştirmez. |
| Uzun süre geçerli token | JWT `Expires = Now.AddMinutes(30)` ile 30 dk; bu süre içinde token çalınsa kullanılabilir. |

### 1.4 Çözüm: Oturumun Hem Sunucu Hem İstemci Tarafında Kesin Sonlanması

#### A) Sunucu tarafı

**Seçenek 1 – Mevcut davranışı korumak (önerilen temel):**  
- JWT key’i **startup’ta üretilmeye devam etsin**. Restart = tüm token’lar geçersiz.  
- Ek olarak **token blacklist / revocation** istiyorsanız:
  - **Redis** (veya SQL) içinde “revoked JTI” veya “revoked before timestamp” tutun.
  - Restart sonrası tüm kullanıcıları “revoked” saymak için tek bir “global invalidation” zaman damgası kullanın; JWT doğrulama middleware’de bu listeyi/zamanı kontrol edin.

**Seçenek 2 – Restart’ta token’ları geçersiz kılmamak (daha az önerilir):**  
- JWT key’i **sabit** yapın: `appsettings` veya env’den `Base64` key okuyun, **MachineKey** ile şifreleyip saklayın.  
- Böylece restart sonrası eski token’lar hâlâ geçerli olur; “oturum kesilmesi” sadece 30 dk expiry veya sizin ekleyeceğiniz revocation ile olur.  
- Risk: Key sızdıysa veya sunucu ele geçtiyse tüm token’lar uzun süre kullanılabilir.

**Öneri:**  
- **Production’da** “restart = herkes çıksın” istiyorsanız: mevcut **dinamik key** kalsın.  
- **İstemci tarafında** 401’de token + user’ı silip `/login`’e yönlendirdiğinizden emin olun (zaten var).  
- İsteğe bağlı: **Redis** ile “session invalidation version” veya “blacklist” ekleyin; restart sonrası bu version’ı güncelleyerek tüm token’ları tek seferde geçersiz sayabilirsiniz.

#### B) İstemci tarafı

- **401 Unauthorized:** `api.js` interceptor’da zaten `localStorage.removeItem('token'/'refreshToken'/'user')` ve `window.location.href = '/login'` var. Bu kalmalı.
- **SignalR:** Bağlantı hata verdiğinde (ör. 401 veya “invalid token”) aynı temizliği yapın: token/user sil, `/login`’e yönlendir.
- **Heartbeat (isteğe bağlı):** Periyodik (örn. 5 dk) bir `GET /auth/me` veya benzeri çağrı; 401 alırsa hemen logout. Böylece restart sonrası kullanıcı en geç bir sonraki heartbeat’te çıkış yapar.
- **Sayfa yükleme:** `AuthContext` veya ana layout’ta, uygulama açılışında bir kez token ile “me” çağrısı yapıyorsanız; 401 alınca logout yapın (muhtemelen zaten yapıyorsunuz).

**IIS / App Pool ayarları:**  
- ASP.NET Core **InProcess** ile çalışıyor; oturum state’i JWT ile tutulmadığı için **IIS Session State / MachineKey** bu mimaride oturum sonlandırma için kritik değil.  
- 30 dk “idle timeout” davranışı tamamen **JWT `exp` claim** (30 dk) ve istemcinin 401’de logout etmesi ile sağlanıyor. Restart sonrası kesin sonlanma için yukarıdaki “401’de temizlik + isteğe bağlı heartbeat” yeterli.

---

## 2. Hassas Veri Maskeleme (Sensitive Data)

### 2.1 Mevcut Zafiyetler (Kod Bazlı)

| Konum | Risk | Açıklama |
|-------|------|----------|
| **InfoController.cs** | **KRİTİK** | `GetInfo()`: `MelihHash = melih?.PasswordHash?.Substring(0, 10) + "..."` — API yanıtında hash parçası dönüyor. `TestHash([FromQuery] string password)`: Gelen **şifreyi** ve üretilen hash’i **açıkça** döndürüyor: `Ok(new { Input = password, Hash = ... })`. Production’da **kesinlikle kapatılmalı veya kaldırılmalı**. |
| **AuthController.cs** | **YÜKSEK** | `LogToFile` ile "Password MISMATCH", "Verifying password" gibi mesajlar yazılıyor; şifre yazılmıyor ama bağlam hassas. `ForgotPassword`: Geçici şifre **e-posta HTML’inde** ve değişkende açık: `<strong>{tempPassword}</strong>`. E-posta gerekli ama log’a **asla** yazılmamalı. |
| **appsettings.json / appsettings.Development.json / appsettings.Production.json** | **YÜKSEK** | Connection string ve e-posta ayarlarında **parola düz metin**: `Password=P@ssw0rd`, `"Password": "yukyncnzdclpvyhw"`. Bu dosyalar repo’da veya yedekte ise credential sızması riski. |
| **UsersController.cs** | Orta | `Create`/Update’te `request.Password` alınıp hash’leniyor; DTO’da şifre var, log’a yazılmadığı sürece kabul edilebilir. |
| **User model (EF)** | Düşük | `PasswordHash` DB’de; `Password` [NotMapped], API’de UserDto kullanıldığı için yanıta şifre/hash gitmiyor — iyi. |

### 2.2 Backend: Data Masking ve Sensitive Attribute

- **Şifre/hash API’de olmasın:**  
  - Tüm login/me/user DTO’ları **Password / PasswordHash** içermesin (şu an UserDto’da yok — iyi).  
  - Hiçbir endpoint **query/body’deki şifreyi** response’ta döndürmesin. **InfoController.TestHash** kaldırılmalı veya sadece development’ta ve asla `password` dönmemeli.

- **Loglama:**  
  - `[Sensitive]` veya custom attribute ile işaretleyin: örn. `LogPasswordAttempt(bool success)` → sadece “success/fail”, identifier **hash’lenmiş** veya kısaltılmış (örn. e-posta için `a***@x.com`).  
  - `request.Password`, `tempPassword`, connection string, e-posta parolası **asla** log/Console’a yazılmasın.

- **Connection string / secrets:**  
  - Production’da **User Secrets**, **Azure Key Vault** veya **environment variable** (`UNITY_CONNECTION_STRING`) kullanın; `appsettings.Production.json` içinde düz metin parola olmasın.

- **E-posta şifresi:**  
  - Aynı şekilde env veya secret store’dan okunsun; appsettings’te düz metin kalmasın.

### 2.3 Frontend: Şifre Alanları ve Hafıza

- **React state:** Login/Register/ChangePassword’te şifre `useState` ile tutuluyor. JavaScript’te string’i “silerek” sıfırlamak tam mümkün değil ama aşağıdakiler riski azaltır:
  - **Submit sonrası sıfırlama:** `setPassword('')` / `setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })` — en azından referansı bırakıp tekrar kullanmayın.
  - **Input’lar:** `type="password"` ve `autocomplete="current-password"` / `new-password` kullanın (zaten kullanılıyor).
- **Best practice:**  
  - Şifreyi mümkün olduğunca **az süre** tutun: form submit handler’da doğrudan `login(email, password)` çağırıp, cevap gelince state’i temizleyin.  
  - Şifreyi **global state veya ref**’te uzun süre tutmayın.  
  - **console.log(password)** veya şifre içeren objeleri log’lama (projede görülmedi; böyle kalsın).

---

## 3. Genel Zafiyet Taraması (OWASP & IDOR)

### 3.1 IDOR / Yatay Yetki Yükseltme

**Tespit edilen noktalar:**

| Endpoint / Metod | Dosya | Sorun | Öneri |
|------------------|--------|--------|--------|
| **GET /api/tasks/{id}** | TasksController.cs ~243 | **Okuma yetkisi kontrolü yok.** Herhangi giriş yapmış kullanıcı, başka projedeki görevin ID’sini bilerek detayını okuyabilir. | Task’ı aldıktan sonra kullanıcının bu task’a (proje üyeliği / atanmış kişi / proje sahibi / departman) erişim hakkı var mı kontrol edin; yoksa `403 Forbid`. |
| **GET /api/tasks?projectId=** | TasksController.cs ~145 | **Proje erişim kontrolü yok.** Herhangi bir `projectId` ile istek atıldığında, o projeye üye olmayan kullanıcı da o projenin görev listesini alabiliyor. | Önce kullanıcının `projectId` projesine erişimi olduğunu (ProjectsController’daki gibi: owner, member veya public + department) doğrulayın; yoksa boş liste veya 403. |
| **GET /api/projects/{id}** | ProjectsController.cs ~96 | Erişim var: owner, member, isPrivate + department kontrolü, yetkisizse `Forbid()`. | Mevcut hali iyi; diğer list/detail endpoint’lerinde aynı pattern kullanılmalı. |

**Örnek güvenli pattern (task okuma):**

```csharp
[HttpGet("{id:int}")]
public async Task<ActionResult<TaskItem>> GetTask(int id)
{
    var task = await _context.Tasks.AsNoTracking()
        .Include(t => t.Assignees).ThenInclude(a => a.User)
        // ... diğer Include'lar
        .FirstOrDefaultAsync(t => t.Id == id);

    if (task == null) return NotFound();

    var currentUser = await GetCurrentUserWithDeptsAsync();
    if (!await HasReadAccessAsync(task, currentUser))  // HasReadAccessAsync: proje üyesi/owner/atanan/admin
        return Forbid();

    return Ok(task);
}
```

**GetTasks (liste) için:**  
- `projectId` verilmişse, önce `currentUser`’ın o projeye erişimi var mı kontrol edin (ProjectsController’daki visibility mantığı ile).  
- Yoksa `Forbid()` veya boş liste dönün; asla başka projenin görev listesini döndürmeyin.

### 3.2 Diğer OWASP Noktaları (Kısa)

- **A01 Broken Access Control:** Yukarıdaki IDOR düzeltmeleri bu başlık altında. Ayrıca tüm yazma işlemlerinde (PUT/PATCH/DELETE) `HasWriteAccessAsync` kullanımı devam etmeli (zaten var).
- **A02 Cryptographic Failures:** Şifreler BCrypt ile hash’leniyor; connection string ve e-posta parolası env/secret store’a alınmalı.
- **A03 Injection:** Parametreli sorgu (EF Core) kullanılıyor; ek dikkat: raw SQL varsa parametre kullanın.
- **A07 XSS:** Frontend’de `dangerouslySetInnerHTML` kullanımı taranmadı; kullanıyorsanız sadece sanitize edilmiş içerik.
- **A08 Insecure Deserialization:** JSON ile DTO kullanımı; bilinmeyen tiplerle deserialize etmeyin.

---

## Özet Aksiyon Listesi

1. **IIS / Restart sonrası oturum:**  
   - JWT key’i startup’ta üretilmeye devam etsin (restart = token’lar geçersiz).  
   - İstemcide 401’de token/user sil + `/login` (mevcut); SignalR hata verince de aynı temizlik.  
   - İsteğe bağlı: periyodik heartbeat ile 401’de erken logout.

2. **Hassas veri:**  
   - **InfoController:** `TestHash` kaldırın veya production’da devre dışı bırakın; `GetInfo`’dan PasswordHash parçasını çıkarın.  
   - **AuthController:** Log’larda şifre/geçici şifre yazmayın; ForgotPassword e-postası dışında `tempPassword` kullanıp hemen scope’tan çıkın.  
   - **appsettings:** Production’da connection string ve e-posta parolası env/secret store’dan gelsin.

3. **IDOR:**  
   - **GET /api/tasks/{id}:** Okuma için `HasReadAccessAsync` (veya mevcut proje erişim mantığı) ekleyin; yetkisizse 403.  
   - **GET /api/tasks?projectId=:** `projectId` için kullanıcının o projeye erişimini doğrulayın; yetkisizse 403 veya boş liste.

Bu adımlar, hem “IIS restart sonrası oturum” hem “hassas veri” hem de “IDOR” tarafında güvenliği net şekilde iyileştirir.
