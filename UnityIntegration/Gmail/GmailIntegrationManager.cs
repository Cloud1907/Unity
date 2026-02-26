using System;
using UnityEngine;

namespace Unity.Gmail
{
    /// <summary>
    /// Mevcut TaskSyncManager (SignalR) ile Gmail entegrasyonu arasındaki köprü.
    /// TaskSyncManager'ın OnTaskCreated olayını dinler,
    /// gelen görevi GmailTaskData'ya çevirir ve UI'ya iletir.
    /// 
    /// Sahneye boş bir GameObject ekleyin ve bu scripti atayın.
    /// Inspector'dan TaskSyncManager bileşenini bağlayın.
    /// </summary>
    public class GmailIntegrationManager : MonoBehaviour
    {
        [Header("Dependencies")]
        [SerializeField] private TaskSyncManager _syncManager;

        /// <summary>
        /// Gmail kaynaklı bir görev alındığında tetiklenen olay.
        /// GmailTaskListUI bu olayı dinler.
        /// </summary>
        public static event Action<GmailTaskData> OnGmailTaskReceived;

        // -------------------------------------------------------
        // LIFECYCLE
        // -------------------------------------------------------
        private void Awake()
        {
            if (_syncManager == null)
                _syncManager = FindObjectOfType<TaskSyncManager>();
        }

        private void OnEnable()
        {
            if (_syncManager != null)
                _syncManager.OnTaskCreated += HandleTaskCreated;
        }

        private void OnDisable()
        {
            if (_syncManager != null)
                _syncManager.OnTaskCreated -= HandleTaskCreated;
        }

        // -------------------------------------------------------
        // SİGNALR OLAYINI İŞLE
        // -------------------------------------------------------
        /// <summary>
        /// TaskSyncManager'dan gelen TaskItem verisini işler.
        /// TaskUrl dolu olan görevler Gmail kaynaklıdır.
        /// </summary>
        private void HandleTaskCreated(TaskItem item)
        {
            // Gmail kaynaklı görev filtresi:
            // TaskUrl alanı mail.google.com içeriyorsa bu Gmail'den gelmiştir.
            if (string.IsNullOrEmpty(item.TaskUrl) ||
                !item.TaskUrl.Contains("mail.google.com"))
            {
                return; // Normal görev, işleme
            }

            var gmailTask = new GmailTaskData
            {
                id            = item.Id,
                title         = item.Title,
                taskTitle     = item.Title,
                projectCode   = item.ProjectId,
                assigneeInfo  = "", // TaskItem'da assignee email yok, gerekirse GenişletIn
                gmailDeepLink = item.TaskUrl,
                taskUrl       = item.TaskUrl
            };

            Debug.Log($"[GmailIntegrationManager] Gmail görevi alındı: #{gmailTask.id} - {gmailTask.title}");
            OnGmailTaskReceived?.Invoke(gmailTask);
        }
    }
}
