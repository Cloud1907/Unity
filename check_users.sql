-- Tüm kullanıcıları listele
SELECT Id, Username, FullName, Email, Role, DepartmentsJson, PasswordHash 
FROM Users;

-- Melih kullanıcısını kontrol et
SELECT * FROM Users WHERE Username = 'melih';

-- Toplam kullanıcı sayısı
SELECT COUNT(*) as ToplamKullanici FROM Users;
