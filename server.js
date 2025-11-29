import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import fs from "fs";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ------------------------
// PERSONA YÖNETİMİ
// ------------------------
let personaText = "";

try {
  personaText = fs.readFileSync("./persona.txt", "utf-8");
  console.log("Persona yüklendi.");
} catch (err) {
  console.error("persona.txt okunamadı, default persona kullanılacak:", err);
  personaText =
    "Mustafa Gülap; proje bazlı imalat ve mühendislik hizmeti veren, kısa ve net konuşan bir çözüm ortağıdır.";
}

// Her istekte güncel persona'dan system prompt üret
function buildSystemPrompt() {
  return `
You are "Mustafa Gülap AI Assistant".

Use the following persona description as ground truth about
who you are, how you speak and how you answer.
Answer as if you are Mustafa ("ben" diliyle), short, concise, technical and professional.
Keep answers at most 3–4 sentences.

VERY IMPORTANT:
- NEVER invent or guess any new personal or biographical information that is not explicitly written in the persona text.
- This includes (but is not limited to): high school, place of birth, detailed family background, marital status, number of children, home address, salary, phone number or any private life details.
- If the user asks about any information that is NOT clearly present in the persona, you MUST answer exactly in this style (in Turkish):
  "Bu konuda elimde veri yok; o yüzden net bir şey söyleyemem. İsterseniz detaylı bilgi için mustafagulap@gmail.com adresine ulaşabilirsiniz."
- Do not add extra sentences, stories or assumptions in such cases.
- You may share only the email address defined in the persona (mustafagulap@gmail.com) as a contact channel. Do NOT invent any phone numbers or additional contact info.

PERSONA:
${personaText}
`;
}

// ------------------------
// CHAT ENDPOINT
// ------------------------
app.post("/mg-chat", async (req, res) => {
  try {
    const userMessage = req.body?.message;
    if (!userMessage) {
      return res.status(400).json({ error: "message field is required" });
    }

    const systemPrompt = buildSystemPrompt();

    const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 220,
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!apiRes.ok) {
      const errorText = await apiRes.text();
      console.error("OpenAI API error:", errorText);
      return res.status(500).json({ error: "OpenAI API error", detail: errorText });
    }

    const data = await apiRes.json();
    const content = data.choices?.[0]?.message?.content;

    // Multi-part content gelirse hepsini birleştir
    let reply = "";
    if (Array.isArray(content)) {
      reply = content
        .map((part) =>
          typeof part === "string" ? part : (part.text ?? "")
        )
        .join(" ");
    } else {
      reply = content ?? "Boş cevap döndü.";
    }

    res.json({ reply });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ------------------------
// PERSONA OTOMATİK GÜNCELLEME ENDPOINTİ
// ------------------------
app.post("/persona-auto-update", (req, res) => {
  const token = process.env.ADMIN_TOKEN;
  if (token && req.query.token !== token) {
    return res.status(403).json({ error: "unauthorized" });
  }

  const newText = req.body?.text;
  if (!newText) {
    return res.status(400).json({ error: "text alanı zorunlu" });
  }

  personaText = newText;

  try {
    fs.writeFileSync("./persona.txt", newText, "utf-8");
    console.log("Persona persona.txt dosyasına kaydedildi.");
  } catch (err) {
    console.error("Persona dosyaya yazılamadı:", err);
  }

  return res.json({ ok: true });
});

// ------------------------
// WHATSAPP TARZI UI
// ------------------------
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
        <div class="chat-header-title">Mustafa Gülap Yapay Asistanı</div>
        <div class="chat-header-sub">Hakkımdaki bilgilerim için asistanımdan destek alabilirsiniz!.</div>
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
          console.error(err);
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

// Root
app.get("/", (req, res) => res.redirect("/ui"));

app.listen(PORT, () => {
  console.log(`MG Assistant API listening on port ${PORT}`);
});

