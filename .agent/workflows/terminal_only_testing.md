---
description: Tüm testleri terminalden yap, tarayıcıya bağlanma
---

# Terminal Only Testing

## Kural
- Kullanıcı açıkça istemediği sürece tarayıcıya (browser_subagent) bağlanma
- Tüm testleri terminal komutlarıyla yap:
  - `npm run build` ile derleme kontrolü
  - `npm test` ile unit testler
  - `dotnet build` ile backend derleme
  - `curl` ile API endpoint testleri
- Console output'larını terminalden kontrol et
- ESLint/TypeScript hataları için terminal çıktısını kullan
