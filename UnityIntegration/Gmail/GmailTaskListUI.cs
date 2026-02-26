using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
// using TMPro; // Commented out as TMP might not be available in simple C# project context but required for Unity. 
// Assuming Standard Unity UI for compatibility if TMP is missing, but instructions used TMP.
// Let's use UnityEngine.UI.Text for broader compatibility or check if reference exists. 
// Given "UnityApp", it likely has TMP. I'll stick to TMP but add directive.
#if UNITY_TEXTMESHPRO
using TMPro;
#endif
using Unity.Gmail;

namespace Unity.Gmail
{
    /// <summary>
    /// Gmail'den gelen görevleri listeleyen UI Controller.
    /// Prefab tabanlı, dinamik liste oluşturur.
    /// Her görev kartında "📧 Maili Aç" butonu bulunur.
    /// </summary>
    public class GmailTaskListUI : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private Transform  _taskListContainer;
        [SerializeField] private GameObject _taskCardPrefab;
        // [SerializeField] private TMP_Text   _emptyStateText; 
        // Using generic Object to avoid missing reference errors in simple editor
        [SerializeField] private GameObject _emptyStateObject; 

        // Belleğe alınan görev listesi
        private readonly List<GmailTaskData> _gmailTasks = new List<GmailTaskData>();

        // -------------------------------------------------------
        // UNITY LIFECYCLE
        // -------------------------------------------------------
        private void Awake()
        {
            // GmailIntegrationManager'ın olayını dinle
            GmailIntegrationManager.OnGmailTaskReceived += HandleNewGmailTask;
        }

        private void OnDestroy()
        {
            GmailIntegrationManager.OnGmailTaskReceived -= HandleNewGmailTask;
        }

        // -------------------------------------------------------
        // EVENT HANDLER — SignalR'dan yeni Gmail görevi geldiğinde
        // -------------------------------------------------------
        private void HandleNewGmailTask(GmailTaskData task)
        {
            _gmailTasks.Insert(0, task); // En yeni üstte
            RefreshUI();
        }

        // -------------------------------------------------------
        // UI YENİLEME
        // -------------------------------------------------------
        public void RefreshUI()
        {
            // Mevcut kartları temizle
            foreach (Transform child in _taskListContainer)
                Destroy(child.gameObject);

            if (_gmailTasks.Count == 0)
            {
                if (_emptyStateObject) _emptyStateObject.SetActive(true);
                return;
            }

            if (_emptyStateObject) _emptyStateObject.SetActive(false);

            foreach (var task in _gmailTasks)
                SpawnTaskCard(task);
        }

        // -------------------------------------------------------
        // KART OLUŞTURMA
        // -------------------------------------------------------
        private void SpawnTaskCard(GmailTaskData task)
        {
            var card = Instantiate(_taskCardPrefab, _taskListContainer);

            // Başlık
            // var titleText = card.transform.Find("TitleText")?.GetComponent<TMP_Text>();
            // Using logic to find Text component regardless of TMP or Legacy
            var titleTransform = card.transform.Find("TitleText");
            if (titleTransform != null) {
                var txt = titleTransform.GetComponent<Text>();
                if (txt) txt.text = task.title ?? task.taskTitle ?? "—";
            }

            // Atanan kişi
            var assigneeTransform = card.transform.Find("AssigneeText");
            if (assigneeTransform != null) {
                 var txt = assigneeTransform.GetComponent<Text>();
                 if (txt) txt.text = $"👤 {task.assigneeInfo}";
            }

            // "Maili Aç" butonu
            var openButton = card.transform.Find("OpenMailButton")?.GetComponent<Button>();
            if (openButton != null)
            {
                string url = task.GetOpenableUrl();

                if (!string.IsNullOrEmpty(url))
                {
                    openButton.onClick.AddListener(() => OpenGmailLink(url));
                    openButton.gameObject.SetActive(true);
                }
                else
                {
                    openButton.gameObject.SetActive(false);
                }
            }
        }

        // -------------------------------------------------------
        // GMAIL'DE MAİLİ AÇ
        // -------------------------------------------------------
        /// <summary>
        /// Tıklandığında sistemin varsayılan tarayıcısında Gmail'i açar.
        /// Application.OpenURL platforma göre farklı davranır:
        ///   - Windows/Mac: Tarayıcıda açar
        ///   - iOS/Android: Varsayılan uygulamada açar
        /// </summary>
        private void OpenGmailLink(string url)
        {
            if (string.IsNullOrEmpty(url))
            {
                Debug.LogWarning("[GmailTaskListUI] Açılacak URL boş.");
                return;
            }

            Debug.Log($"[GmailTaskListUI] Mail açılıyor: {url}");
            Application.OpenURL(url);
        }
    }
}
