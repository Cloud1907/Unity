-- SQL Enterprise Restore Script for Unity Project Management
-- Generated based on Dotnet Backend Models and Seed Data

-- 1. Create Database (Optional, uncomment if needed)
-- CREATE DATABASE UnityDB;
-- GO
-- USE UnityDB;
-- GO

-- 2. Drop Tables if they exist (Order matters due to FKs if any, but models seem loose)
DROP TABLE IF EXISTS Tasks;
DROP TABLE IF EXISTS Labels;
DROP TABLE IF EXISTS Projects;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Departments;

-- 3. Create Tables

CREATE TABLE Departments (
    Id NVARCHAR(50) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255),
    HeadOfDepartment NVARCHAR(50),
    Color NVARCHAR(20)
);

CREATE TABLE Users (
    Id NVARCHAR(50) PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) NOT NULL,
    Username NVARCHAR(50),
    Role NVARCHAR(20) DEFAULT 'member',
    DepartmentsJson NVARCHAR(MAX) DEFAULT '[]',
    JobTitle NVARCHAR(100),
    Manager NVARCHAR(50),
    Avatar NVARCHAR(255),
    Color NVARCHAR(20),
    IsActive BIT DEFAULT 1,
    PasswordHash NVARCHAR(255),
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE Projects (
    Id NVARCHAR(50) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX),
    Icon NVARCHAR(10) DEFAULT '📁',
    Color NVARCHAR(20) DEFAULT '#0086c0',
    Owner NVARCHAR(50),
    MembersJson NVARCHAR(MAX) DEFAULT '[]',
    Department NVARCHAR(50),
    StartDate DATETIME2,
    EndDate DATETIME2,
    Budget FLOAT,
    Status NVARCHAR(20) DEFAULT 'planning',
    Priority NVARCHAR(20) DEFAULT 'medium',
    Favorite BIT DEFAULT 0,
    IsPrivate BIT DEFAULT 0,
    CreatedBy NVARCHAR(50),
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE Labels (
    Id NVARCHAR(50) PRIMARY KEY,
    Name NVARCHAR(50) NOT NULL,
    Color NVARCHAR(20) DEFAULT '#cccccc',
    ProjectId NVARCHAR(50),
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE Tasks (
    Id NVARCHAR(50) PRIMARY KEY,
    ProjectId NVARCHAR(50),
    Title NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX),
    AssigneesJson NVARCHAR(MAX) DEFAULT '[]',
    AssignedBy NVARCHAR(50),
    Status NVARCHAR(20) DEFAULT 'todo',
    Priority NVARCHAR(20) DEFAULT 'medium',
    LabelsJson NVARCHAR(MAX) DEFAULT '[]',
    IsPrivate BIT DEFAULT 0,
    TShirtSize NVARCHAR(10),
    StartDate DATETIME2,
    DueDate DATETIME2,
    Progress INT DEFAULT 0,
    SubtasksJson NVARCHAR(MAX) DEFAULT '[]',
    CommentsJson NVARCHAR(MAX) DEFAULT '[]',
    AttachmentsJson NVARCHAR(MAX) DEFAULT '[]',
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE()
);

-- 4. Insert Data

-- Departments
INSERT INTO Departments (Id, Name, HeadOfDepartment, Description, Color) VALUES
('dept-stokbar', 'Stokbar', 'Melih', 'Stok Yönetimi', '#4F46E5'),
('dept-enroute', 'Enroute', 'Ahmet', 'Lojistik', '#10B981'),
('dept-quest', 'Quest', 'Ayşe', 'Kalite', '#F59E0B'),
('dept-yonetim', 'Yönetim', 'Fatma', 'Üst Yönetim', '#EC4899'),
('dept-satis', 'Satış', 'Elif', 'Satış Departmanı', '#8B5CF6'),
('dept-ik', 'İK', 'Can', 'İnsan Kaynakları', '#14B8A6'),
('dept-pazarlama', 'Pazarlama', 'Selin', 'Pazarlama Departmanı', '#EC4899'),
('dept-arge', 'ArGe', 'Burak', 'Ar-Ge Departmanı', '#6366F1'),
('dept-finans', 'Finans', 'Zeynep', 'Finans Departmanı', '#10B981'),
('dept-yazilim', 'Yazılım', 'Melih', 'Yazılım Geliştirme', '#3B82F6');

-- Users
-- PasswordHash is from DbInitializer ($2a$11$...) - using a placeholder or the same hash if known.
-- The hash in DbInitializer is generated at runtime but we can use a dummy valid bcrypt hash for '123456'.
-- Example hash for '123456': $2a$11$79f.u/y/y... (truncated). 
-- Since we can't run bcrypt here, I'll use the variable name 'HASH_123456' as a placeholder or a common hash.
-- Actually, I will just use a static string since this is for restore. The user can reset passwords if needed.
-- Or better, I will assume the hash provided by the dotnet app is compatible if they use the same library.
-- For this script, I will use a dummy hash representing '123456'.

INSERT INTO Users (Id, FullName, Email, Username, Role, DepartmentsJson, JobTitle, PasswordHash, Color) VALUES
('user-melih', 'Melih Bulut', 'melih.bulut@unity.com', 'melih', 'admin', '["Stokbar", "Yönetim", "Satış", "İK", "Pazarlama", "ArGe", "Finans"]', 'Project Manager', '$2a$11$Z5.z5.z5.z5.z5.z5.z5.z5', '#4F46E5'),
('user-ahmet', 'Ahmet Yılmaz', 'ahmet@unity.com', 'ahmet', 'member', '["Enroute"]', 'Logistics Specialist', '$2a$11$Z5.z5.z5.z5.z5.z5.z5.z5', '#10B981'),
('user-ayse', 'Ayşe Demir', 'ayse@unity.com', 'ayse', 'member', '["Quest"]', 'Quality Analyst', '$2a$11$Z5.z5.z5.z5.z5.z5.z5.z5', '#F59E0B'),
('user-fatma', 'Fatma Kaya', 'fatma@unity.com', 'fatma', 'manager', '["Yönetim"]', 'Director', '$2a$11$Z5.z5.z5.z5.z5.z5.z5.z5', '#EC4899'),
('user-mehmet', 'Mehmet Çelik', 'mehmet@unity.com', 'mehmet', 'member', '["Stokbar"]', 'Warehouse Op.', '$2a$11$Z5.z5.z5.z5.z5.z5.z5.z5', '#6366F1'),
('user-cem', 'Cem Tekin', 'cem@unity.com', 'cem', 'admin', '["IT"]', 'System Admin', '$2a$11$Z5.z5.z5.z5.z5.z5.z5.z5', '#3B82F6'),
('user-selin', 'Selin Yurt', 'selin@unity.com', 'selin', 'member', '["Pazarlama"]', 'Marketing Lead', '$2a$11$Z5.z5.z5.z5.z5.z5.z5.z5', '#EC4899'),
('user-burak', 'Burak Deniz', 'burak@unity.com', 'burak', 'member', '["ArGe"]', 'Senior Dev', '$2a$11$Z5.z5.z5.z5.z5.z5.z5.z5', '#6366F1'),
('user-zeynep', 'Zeynep Akar', 'zeynep@unity.com', 'zeynep', 'manager', '["Finans"]', 'Finance Manager', '$2a$11$Z5.z5.z5.z5.z5.z5.z5.z5', '#10B981');

-- Projects
INSERT INTO Projects (Id, Name, Description, Department, Owner, MembersJson, CreatedBy, Status, Priority, Color) VALUES
('proj-stokbar-main', 'Stokbar Ana Depo', 'Merkez depo stok yönetim ve sayım projesi.', 'Stokbar', 'user-melih', '["user-melih", "user-mehmet"]', 'user-melih', 'in_progress', 'high', '#4F46E5'),
('proj-enroute-logs', 'Enroute Lojistik', 'Sevkiyat takip ve rota optimizasyonu.', 'Enroute', 'user-ahmet', '["user-ahmet", "user-melih"]', 'user-ahmet', 'planning', 'medium', '#10B981'),
('proj-quest-qa', 'Quest Kalite', 'Kalite kontrol süreçleri.', 'Quest', 'user-ayse', '["user-ayse", "user-melih"]', 'user-ayse', 'working', 'medium', '#F59E0B'),
('proj-yonetim-board', 'Yönetim Kurulu', 'Şirket içi stratejik kararlar ve raporlar.', 'Yönetim', 'user-fatma', '["user-fatma", "user-melih"]', 'user-fatma', 'in_progress', 'urgent', '#EC4899'),
('proj-satis-raporlari', 'Satış Raporları', 'Aylık ve yıllık satış hedefleri.', 'Satış', 'user-elif', '["user-elif", "user-melih"]', 'user-elif', 'done', 'high', '#8B5CF6'),
('proj-ik-surecleri', 'İK Süreçleri', 'İşe alım ve personel yönetimi.', 'İK', 'user-can', '["user-can", "user-melih"]', 'user-can', 'todo', 'low', '#14B8A6'),
('proj-pazarlama-kampanya', 'Yaz Kampanyası', '2026 Yaz sezonu reklam çalışmaları.', 'Pazarlama', 'user-selin', '["user-selin", "user-melih"]', 'user-selin', 'working', 'high', '#EC4899'),
('proj-arge-v2', 'Mobile App v2', 'Yeni nesil mobil uygulama geliştirme.', 'ArGe', 'user-burak', '["user-burak", "user-melih"]', 'user-burak', 'in_progress', 'urgent', '#6366F1'),
('proj-finans-butce', '2026 Bütçe Planı', 'Yıllık bütçe dağılımı ve kontrolü.', 'Finans', 'user-zeynep', '["user-zeynep", "user-melih"]', 'user-zeynep', 'review', 'high', '#10B981');

-- Labels
INSERT INTO Labels (Id, Name, Color, ProjectId) VALUES
('lbl-acileyet', 'Acileyet', '#EF4444', 'proj-stokbar-main'),
('lbl-backend', 'Backend', '#3B82F6', 'proj-stokbar-main'),
('lbl-review', 'Review', '#F59E0B', 'proj-yonetim-board'),
('lbl-bug', 'Bug', '#DC2626', 'proj-quest-qa'),
('lbl-feature', 'Feature', '#10B981', 'proj-enroute-logs'),
('lbl-design', 'Design', '#EC4899', 'proj-pazarlama-kampanya'),
('lbl-mobile', 'Mobile', '#8B5CF6', 'proj-arge-v2'),
('lbl-finance', 'Finance', '#10B981', 'proj-finans-butce');

-- Tasks
INSERT INTO Tasks (Id, ProjectId, Title, Status, Priority, AssignedBy, AssigneesJson, LabelsJson, StartDate, DueDate, Description, SubtasksJson, CommentsJson, Progress) VALUES
('task-sb-1', 'proj-stokbar-main', 'Yıllık Stok Sayımı', 'todo', 'urgent', 'user-melih', '["user-mehmet"]', '["lbl-acileyet"]', DATEADD(day, -2, GETUTCDATE()), DATEADD(day, 5, GETUTCDATE()), 'Tüm deponun sayılması gerekiyor.', '[{"id":"st-1","title":"A Blok Sayımı","completed":false},{"id":"st-2","title":"B Blok Sayımı","completed":false}]', '[{"id":"c-1","author":"user-melih","text":"Sayım listeleri hazır mı?","createdAt":"2026-01-10T10:00:00Z"}]', 0),
('task-sb-2', 'proj-stokbar-main', 'Raf Düzenlemesi', 'in_progress', 'medium', 'user-melih', '["user-mehmet", "user-melih"]', '[]', DATEADD(day, -5, GETUTCDATE()), DATEADD(day, 2, GETUTCDATE()), 'A ve B blok rafları düzenlenecek.', '[{"id":"st-3","title":"Etiketleme","completed":true},{"id":"st-4","title":"Barkod Kontrol","completed":false}]', '[]', 50),
('task-sb-3', 'proj-stokbar-main', 'Forklift Bakımı', 'done', 'high', 'user-melih', '["user-mehmet"]', '[]', DATEADD(day, -10, GETUTCDATE()), DATEADD(day, -2, GETUTCDATE()), 'Forkliftlerin yıllık bakımı.', '[]', '[]', 100),
('task-sb-4', 'proj-stokbar-main', 'Yeni Mal Kabul', 'todo', 'medium', 'user-melih', '["user-mehmet"]', '[]', DATEADD(day, 1, GETUTCDATE()), DATEADD(day, 3, GETUTCDATE()), 'Yarın gelecek tırın karşılanması.', '[]', '[]', 0),
('task-sb-5', 'proj-stokbar-main', 'Depo Temizliği', 'todo', 'low', 'user-melih', '["user-mehmet"]', '[]', DATEADD(day, 1, GETUTCDATE()), DATEADD(day, 2, GETUTCDATE()), 'Genel temizlik.', '[]', '[]', 0),

('task-en-1', 'proj-enroute-logs', 'Araç Bakımları', 'todo', 'high', 'user-ahmet', '["user-ahmet"]', '[]', DATEADD(day, 2, GETUTCDATE()), DATEADD(day, 10, GETUTCDATE()), 'Araçların kışlık bakımları.', '[]', '[]', 0),
('task-en-2', 'proj-enroute-logs', 'Rota Optimizasyonu', 'in_progress', 'medium', 'user-ahmet', '["user-ahmet", "user-melih"]', '[]', DATEADD(day, -3, GETUTCDATE()), DATEADD(day, 4, GETUTCDATE()), 'İstanbul rotaları için yeni planlama.', '[{"id":"st-5","title":"Avrupa Yakası","completed":true},{"id":"st-6","title":"Anadolu Yakası","completed":false}]', '[]', 35),
('task-en-3', 'proj-enroute-logs', 'Sürücü Eğitimi', 'working', 'low', 'user-ahmet', '["user-ahmet"]', '[]', DATEADD(day, -1, GETUTCDATE()), DATEADD(day, 5, GETUTCDATE()), 'İleri sürüş teknikleri eğitimi.', '[]', '[]', 0),
('task-en-4', 'proj-enroute-logs', 'Yeni Rota Denemesi', 'todo', 'medium', 'user-ahmet', '["user-ahmet"]', '[]', DATEADD(day, 5, GETUTCDATE()), DATEADD(day, 6, GETUTCDATE()), 'Hızlı teslimat rotası.', '[]', '[]', 0),

('task-quest-1', 'proj-quest-qa', 'Son Kullanıcı Testleri', 'working', 'medium', 'user-ayse', '["user-ayse"]', '[]', DATEADD(day, -2, GETUTCDATE()), DATEADD(day, 3, GETUTCDATE()), 'Beta sürüm testleri.', '[{"id":"st-7","title":"Form Testleri","completed":true},{"id":"st-8","title":"Mobil Uyumluluk","completed":false}]', '[]', 45),
('task-quest-2', 'proj-quest-qa', 'Bug Raporlama', 'review', 'high', 'user-ayse', '["user-ayse", "user-melih"]', '["lbl-bug"]', DATEADD(day, -1, GETUTCDATE()), DATEADD(day, 1, GETUTCDATE()), 'Bulunan hataların raporlanması.', '[]', '[{"id":"c-2","author":"user-ayse","text":"Kritik buglar fixlendi mi?","createdAt":"2026-01-14T09:00:00Z"}]', 80),
('task-quest-3', 'proj-quest-qa', 'Otomasyon Scriptleri', 'todo', 'high', 'user-ayse', '["user-ayse"]', '[]', DATEADD(day, 5, GETUTCDATE()), DATEADD(day, 15, GETUTCDATE()), 'Selenium test otomasyonu.', '[]', '[]', 0),

('task-yon-1', 'proj-yonetim-board', 'Bütçe Raporu', 'review', 'high', 'user-fatma', '["user-melih"]', '["lbl-review"]', DATEADD(day, -4, GETUTCDATE()), DATEADD(day, 2, GETUTCDATE()), '2026 Q1 bütçe raporu hazırlanacak.', '[]', '[]', 90),
('task-yon-2', 'proj-yonetim-board', 'Personel Alımı', 'todo', 'medium', 'user-fatma', '["user-fatma"]', '[]', GETUTCDATE(), DATEADD(day, 20, GETUTCDATE()), 'IT departmanı için yeni personel alımı.', '[]', '[]', 0),
('task-yon-3', 'proj-yonetim-board', 'Strateji Toplantısı', 'done', 'urgent', 'user-fatma', '["user-fatma", "user-melih"]', '[]', DATEADD(day, -7, GETUTCDATE()), DATEADD(day, -7, GETUTCDATE()), 'Yıllık strateji toplantısı notları.', '[]', '[]', 100),
('task-yon-4', 'proj-yonetim-board', 'Yönetim Sunumu', 'todo', 'high', 'user-fatma', '["user-fatma"]', '[]', DATEADD(day, 10, GETUTCDATE()), DATEADD(day, 12, GETUTCDATE()), 'Sunum slaytları hazırlanacak.', '[]', '[]', 0),

('task-paz-1', 'proj-pazarlama-kampanya', 'Sosyal Medya Planı', 'in_progress', 'medium', 'user-selin', '["user-selin"]', '["lbl-design"]', DATEADD(day, -2, GETUTCDATE()), DATEADD(day, 4, GETUTCDATE()), 'Instagram ve LinkedIn içerik planı.', '[{"id":"st-9","title":"Görsel Tasarım","completed":true},{"id":"st-10","title":"Copywriting","completed":false}]', '[]', 60),
('task-paz-2', 'proj-pazarlama-kampanya', 'Google Ads Reklamları', 'working', 'high', 'user-selin', '["user-selin"]', '[]', DATEADD(day, -1, GETUTCDATE()), DATEADD(day, 2, GETUTCDATE()), 'Yeni kampanya kurulumu.', '[]', '[]', 40),
('task-paz-3', 'proj-pazarlama-kampanya', 'Broşür Tasarımı', 'review', 'low', 'user-selin', '["user-selin"]', '["lbl-design"]', DATEADD(day, -5, GETUTCDATE()), DATEADD(day, -1, GETUTCDATE()), 'Baskı için broşür tasarımları.', '[]', '[]', 100),
('task-paz-4', 'proj-pazarlama-kampanya', 'Email Pazarlama', 'todo', 'medium', 'user-selin', '["user-selin"]', '[]', DATEADD(day, 2, GETUTCDATE()), DATEADD(day, 3, GETUTCDATE()), 'Bülten gönderimi.', '[]', '[]', 0),

('task-arge-1', 'proj-arge-v2', 'API Dokümantasyonu', 'todo', 'medium', 'user-burak', '["user-burak"]', '["lbl-mobile"]', DATEADD(day, 3, GETUTCDATE()), DATEADD(day, 7, GETUTCDATE()), 'Swagger docs güncellenecek.', '[]', '[]', 0),
('task-arge-2', 'proj-arge-v2', 'Login Ekranı Tasarımı', 'done', 'high', 'user-burak', '["user-burak"]', '["lbl-mobile"]', DATEADD(day, -8, GETUTCDATE()), DATEADD(day, -3, GETUTCDATE()), 'Figma tasarımları koda dökülecek.', '[]', '[]', 100),
('task-arge-3', 'proj-arge-v2', 'Push Notification', 'working', 'urgent', 'user-burak', '["user-burak", "user-melih"]', '["lbl-mobile"]', DATEADD(day, -2, GETUTCDATE()), DATEADD(day, 5, GETUTCDATE()), 'Firebase entegrasyonu.', '[{"id":"st-11","title":"iOS Kurulumu","completed":false},{"id":"st-12","title":"Android Kurulumu","completed":false}]', '[]', 25),
('task-arge-4', 'proj-arge-v2', 'Unit Test Yazımı', 'todo', 'high', 'user-burak', '["user-burak"]', '[]', DATEADD(day, 8, GETUTCDATE()), DATEADD(day, 12, GETUTCDATE()), 'Core servislerin testleri.', '[]', '[]', 0),

('task-fin-1', 'proj-finans-butce', 'Gider Analizi', 'in_progress', 'high', 'user-zeynep', '["user-zeynep"]', '["lbl-finance"]', DATEADD(day, -3, GETUTCDATE()), DATEADD(day, 3, GETUTCDATE()), 'Son çeyrek giderlerinin analizi.', '[{"id":"st-13","title":"Excel Çıktısı","completed":true},{"id":"st-14","title":"Kategori Eşleme","completed":false}]', '[]', 42),
('task-fin-2', 'proj-finans-butce', 'Nakit Akışı Raporu', 'done', 'urgent', 'user-zeynep', '["user-zeynep"]', '["lbl-finance"]', DATEADD(day, -2, GETUTCDATE()), DATEADD(day, -2, GETUTCDATE()), 'Haftalık nakit akışı.', '[]', '[]', 100),
('task-fin-3', 'proj-finans-butce', 'Vergi Planlaması', 'todo', 'high', 'user-zeynep', '["user-zeynep"]', '[]', DATEADD(day, 15, GETUTCDATE()), DATEADD(day, 20, GETUTCDATE()), 'Yıllık vergi hazırlığı.', '[]', '[]', 0);

