namespace Unity.Core.DTOs
{
    /// <summary>
    /// Gmail Add-on'dan gelen 4 ana değişkeni taşıyan DTO.
    /// </summary>
    public class GmailTaskIngestDto
    {
        /// <summary>Mail başlığı → Görev adı</summary>
        public string TaskTitle { get; set; } = string.Empty;

        /// <summary>Seçilen projenin ID'si</summary>
        public int ProjectCode { get; set; }

        /// <summary>Atanan kişinin e-posta adresi</summary>
        public string AssigneeInfo { get; set; } = string.Empty;

        /// <summary>Görev açıklaması (kullanıcının girdiği)</summary>
        public string? Description { get; set; }

        /// <summary>
        /// Gmail deep link — Unity içinden tıklandığında
        /// doğrudan ilgili mail'i açan URL.
        /// Örnek: https://mail.google.com/mail/u/0/#all/{messageId}
        /// </summary>
        public string GmailDeepLink { get; set; } = string.Empty;
    }
}
