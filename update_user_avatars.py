import sqlite3
from datetime import datetime

db_path = 'dotnet-backend/Unity.API/unity.db'

def update_avatars():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Gender-based avatar mapping
    # Using DiceBear Avataaars
    # Male: topType=shortHair, facialHairType=blank/beard
    # Female: topType=longHair/turban/hijab
    
    # Common mappings
    avatar_base = "https://api.dicebear.com/7.x/avataaars/svg?seed="
    
    users_to_update = [
        ("user-ahmet", f"{avatar_base}Ahmet&topType=shortHairShortFlat"),
        ("user-ayse", f"{avatar_base}Ayse&topType=longHairStraight"),
        ("user-burak", f"{avatar_base}Burak&topType=shortHairSides"),
        ("user-cem", f"{avatar_base}Cem&topType=shortHairShortCurly"),
        ("user-fatma", f"{avatar_base}Fatma&topType=hijab"),
        ("user-mehmet", f"{avatar_base}Mehmet&topType=shortHairDreads01"),
        ("user-melih", f"{avatar_base}Melih&topType=shortHairTheCaesar"),
        ("user-selin", f"{avatar_base}Selin&topType=longHairCurly"),
        ("user-zeynep", f"{avatar_base}Zeynep&topType=longHairBigHair")
    ]
    
    # Generic avatars for test users
    cursor.execute("SELECT Id, FullName FROM Users WHERE Id NOT LIKE 'user-%'")
    test_users = cursor.fetchall()
    for t_id, t_name in test_users:
        users_to_update.append((t_id, f"{avatar_base}{t_id}"))

    print("🖼️ Avatarlar güncelleniyor...")
    for u_id, avatar_url in users_to_update:
        cursor.execute("UPDATE Users SET Avatar = ?, UpdatedAt = ? WHERE Id = ?", 
                       (avatar_url, datetime.now().isoformat(), u_id))
        print(f"   + Güncellendi: {u_id}")

    conn.commit()
    conn.close()
    print("\n✅ Tüm kullanıcı avatarları başarıyla güncellendi.")

if __name__ == "__main__":
    update_avatars()
