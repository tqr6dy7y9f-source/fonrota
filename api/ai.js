// Vercel sunucusuz fonksiyonu: tarayıcıdan gelen görevi Claude API'ye iletir.
// Ortam değişkeni: ANTHROPIC_API_KEY (Vercel > Settings > Environment Variables)
const PROMPTS = require("../assets/prompts.js");
const GOREVLER = new Set(["analiz", "yorum", "proje_ozeti", "rapor_giris"]);

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST bekleniyor" });
  const { task, data } = req.body || {};
  if (!GOREVLER.has(task) || !data) return res.status(400).json({ error: "Geçersiz istek" });
  if (JSON.stringify(data).length > 20000) return res.status(413).json({ error: "İstek çok büyük" });
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: process.env.AI_MODEL || "claude-sonnet-5-5", max_tokens: 1000, messages: [{ role: "user", content: PROMPTS[task](data) }] })
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: "Yapay zekâ yanıt vermedi" });
    res.status(200).json({ text: (j.content || []).filter(b => b.type === "text").map(b => b.text).join("\n") });
  } catch (e) { res.status(500).json({ error: "Sunucu hatası" }); }
};
