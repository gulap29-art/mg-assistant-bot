import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// MUSTAFA GÜLAP – KISA & NET PERSONA
const systemPrompt = `
You are “Mustafa Gülap AI Assistant”, a chatbot that answers exactly as Mustafa Gülap would—short, concise, technical.

IDENTITY
- Name: Mustafa Gülap
- Mechanical Engineer, Boğaziçi University
- MSc Engineering & Technology Management, Boğaziçi University
- Based in Türkiye

CURRENT ROLE
- Özka Üretim & Makine — project-based manufacturing, supply chain, fabrication, welding, inspection consultancy.

EXPERIENCE SUMMARY
- 12+ years at Tüpraş (Inspection, Maintenance, Procurement, Agile Coach)
- Supply Chain Manager @ Sistem Teknik (Industrial Furnaces)
- Expertise: static equipment, pressure vessels, NDT (UT/VT/RT Level II), API 510, corrosion, fired heaters, fabrication, refinery equipment, procurement, logistics, project mgmt.

ANSWERING STYLE — IMPORTANT
- Always answer **as Mustafa** ("Ben", "benim geçmişim", "önceki görevlerimde…")
- **Cevaplar kısa olacak (2–4 cümle).**
- Gereksiz detay, hikâye, uzun açıklama yok.
- Teknik sorularda kısa özet ver; kullanıcı isterse detaylandır.
- Sadece “detaylı anlat” gibi bir talep gelirse uzun cevap ver.
- Kurumsal, net, doğrudan LinkedIn seviyesinde konuş.

GOAL
- Short, accurate, experience-based answers with high technical precision.
`;

// API endpoint
app.post("/mg-chat", async (req, res) => {
  try {
    const userMessage = req.body?.message;
    if (!userMessage) {
      return res.status(400).json({ error: "message field is required" });
    }

    const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 150,
        temperature: 0.4,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ]
      })
    });

    if (!apiRes.ok) {
      const errorText = await apiRes.text();
      console.error("OpenAI API error:", errorText);
      return res.status(500).json({ error: "OpenAI API error", detail: errorText });
    }

    const data = await apiRes.json();
    const reply = data.choices?.[0]?.message?.content ?? "Boş cevap döndü.";

    res.json({ reply });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// WhatsApp tarzı UI
app.get("/ui", (req, res) => {
  const html = `
  <!DOCTYPE html>
  <html lang="tr">
  <head>
    <meta charset="UTF-8" />
    <title>Mustafa Gülap AI Assistant</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: system-ui, sans-serif;
        background: #ece5dd;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 16px;
      }
      .chat-wrapper {
        width: 100%;
        max-width: 480px;
        height: 600px;
        background: #ffffff;
        border-radius: 18px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.15);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .chat-header {
        background: #075e54;
        color: #fff;
        padding: 12px 16px;
      }
      .chat-header-title { font-size: 16px; font-weight: 600; }
      .chat-header-sub { font-size: 12px; opacity: 0.85; margin-top: 2px; }
      .chat-messages {
        flex: 1;
        background: #ece5dd;
        padding: 10px 8px;
        overflow-y: auto;
      }
      .bubble-row { display: flex; margin-bottom: 8px; }
      .bubble {
        max-width: 80%;
        padding: 8px 10px;
        border-radius: 8px;
        font-size: 13px;
        line-height: 1.4;
        position: relative;
      }
      .bubble-user { margin-left: auto; background: #dcf8c6; }
      .bubble-bot { margin-right: auto; background: #ffffff; }
      .bubble-meta {
        font-size: 10px; opacity: 0.6; margin-top: 3px; text-align: right;
      }
      .chat-input-area {
        padding: 8px;
        background: #f0f0f0;
        display: flex;
        gap: 6px;
        align-items: center;
      }
      .chat-input {
        flex: 1; border-radius: 20px; border: none;
        padding: 8px 12px; font-size: 13px; outline: none;
      }
      .chat-send-btn {
        border-radius: 20px; border: none;
        background: #25d366; color: #ffffff;
        padding: 8px 14px; font-size: 13px; cursor: pointer;
      }
    </style>
  </head>
  <body>
    <div class="chat-wrapper">
      <div class="chat-header">
        <div class="chat-header-title">Mustafa Gülap AI Assistant</div>
        <div class="chat-header-sub">Kısa, net ve profesyonel yanıtlar.</div>
      </div>

      <div id="messages" class="chat-messages"></div>

      <div class="chat-input-area">
        <input id="userInput" class="chat-input" type="text" placeholder="Mesajınızı yazın..." />
        <button id="sendBtn" class="chat-send-btn">Gönder</button>
      </div>
    </div>

    <script>
      const messagesEl = document.getElementById("messages");
      const inputEl = document.getElementById("userInput");
      const sendBtn = document.getElementById("sendBtn");

      function appendMessage(text, sender) {
        const row = document.createElement("div");
        row.classList.add("bubble-row");

        const bubble = document.createElement("div");
        bubble.classList.add("bubble");
        bubble.classList.add(sender === "user" ? "bubble-user" : "bubble-bot");

        bubble.innerText = text;

        const meta = document.createElement("div");
        meta.classList.add("bubble-meta");
        const now = new Date();
        meta.innerText = now.getHours().toString().padStart(2,"0") + ":" +
                         now.getMinutes().toString().padStart(2,"0");

        bubble.appendChild(meta);
        row.appendChild(bubble);
        messagesEl.appendChild(row);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }

      async function sendMessage() {
        const text = inputEl.value.trim();
        if (!text) return;

        appendMessage(text, "user");
        inputEl.value = "";
        sendBtn.disabled = true;

        appendMessage("Yazıyorum...", "bot");
        const loader = messagesEl.lastChild;

        try {
          const res = await fetch("/mg-chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text })
          });

          const data = await res.json();
          messagesEl.removeChild(loader);
          appendMessage(data.reply, "bot");
        } catch (err) {
          messagesEl.removeChild(loader);
          appendMessage("Bağlantı hatası.", "bot");
        }

        sendBtn.disabled = false;
      }

      sendBtn.addEventListener("click", sendMessage);
      inputEl.addEventListener("keydown", e => { if (e.key === "Enter") sendMessage(); });

      appendMessage(
        "Merhaba, ben Mustafa Gülap'ın profesyonel AI asistanıyım. Kısa ve net yanıtlar veriyorum.",
        "bot"
      );
    </script>
  </body>
  </html>
  `;
  res.send(html);
});

app.get("/", (req, res) => res.redirect("/ui"));

app.listen(PORT, () => {
  console.log(`MG Assistant API listening on port ${PORT}`);
});
