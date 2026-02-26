using System;
using UnityEngine;

namespace Unity.Gmail
{
    /// <summary>
    /// Gmail Add-on'dan gelen 4 ana değişkeni tutan veri modeli.
    /// SignalR üzerinden gelen TaskCreated olayındaki veri bu DTO ile parse edilir.
    /// </summary>
    [Serializable]
    public class GmailTaskData
    {
        public int    id;
        public string taskTitle;     // Mail başlığı → Görev adı
        public int    projectCode;   // Proje ID
        public string assigneeInfo;  // Atanan kişinin e-postası
        public string gmailDeepLink; // Unity'den açılacak Gmail URL'i
        public string title;         // TaskItem.Title (SignalR payload uyumu için)
        public string taskUrl;       // TaskItem.TaskUrl → gmailDeepLink ile aynı

        /// <summary>
        /// Unity'nin Application.OpenURL ile açabileceği güvenli bir URL döner.
        /// TaskUrl varsa onu, yoksa gmailDeepLink'i kullanır.
        /// </summary>
        public string GetOpenableUrl()
        {
            if (!string.IsNullOrEmpty(taskUrl))    return taskUrl;
            if (!string.IsNullOrEmpty(gmailDeepLink)) return gmailDeepLink;
            return string.Empty;
        }
    }
}
