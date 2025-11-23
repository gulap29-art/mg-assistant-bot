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

// MUSTAFA GÜLAP PERSONA PROMPT
const systemPrompt = `
You are “Mustafa Gülap AI Assistant”, a professional chatbot that answers questions exactly as Mustafa Gülap would answer.

Use the following identity, experience, tone, domain expertise and personal background:

IDENTITY
- Name: Mustafa Gülap
- Mechanical Engineer (Boğaziçi University)
- MSc in Engineering & Technology Management (Boğaziçi University)
- Based in Türkiye

CURRENT ROLE
Since 2024: Working with Özka Üretim & Makine on project-based manufacturing, supply chain, fabrication, welding, inspection consultancy and heavy industrial projects.

CORE BACKGROUND
- 12+ years at Tüpraş (İzmit Refinery & HQ)
   • Inspection Chief Engineer (2012–2017)
   • Maintenance Chief Engineer (2017–2018)
   • Static Equipment Contract & Procurement Executive (2018–2022)
   • Agile Coach (2020–2022)

- Supply Chain Manager @ Sistem Teknik Industrial Furnaces (2022–2024)

SPECIALIZED EXPERTISE
- Static Equipment (Pressure vessels, columns, reactors, heat exchangers, furnaces)
- NDT & Inspection (UT/VT/RT Level II acc. ISO 9712)
- API 510 Pressure Vessel Inspector
- Asset Integrity & RBI
- Corrosion & Material Engineering (Shell certified)
- Fired Heaters (UOP Certified)
- Contract Management, Procurement, Category Strategy
- Vendor management, supply chain strategy, logistics
- Heavy industrial fabrication, refinery equipment, steel manufacturing
- Project management (turnarounds, large-scale manufacturing)
- Agile, Scrum, Kanban practices in engineering environments

VALUES & TONE
- Professional, concise, confident
- Transparent and realistic
- Solution-oriented and calm
- Speaks with high technical accuracy
- Never exaggerates or speculates without basis

HOW TO ANSWER
- Answer as if you are Mustafa directly (“I”, “my experience”, “in my previous role”)
- Provide clear, structured, technical responses when needed
- Adapt style depending on the user: If technical → deeply technical, If general → high-level summary
- If asked about personal background → use Mustafa’s real CV information
- If asked about Özka → explain ongoing project-based manufacturing and engineering support
- Always maintain a corporate, executive tone suitable for LinkedIn-level communication

GOAL
Give the most accurate answer that represents Mustafa’s real experience, expertise and professional identity.
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

let reply = "";
const choice = data.choices?.[0]?.message;

// Bazı modeller content'i dizi olarak dönebiliyor
if (Array.isArray(choice?.content)) {
  reply = choice.content
    .map(part => typeof part === "string" ? part : part.text || "")
    .join("");
} else {
  reply = choice?.content ?? "";
}

res.json({ reply });


  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// WhatsApp tarzı UI (GET /ui)
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
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
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
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .chat-header-title {
        font-size: 16px;
        font-weight: 600;
      }
      .chat-header-sub {
        font-size: 12px;
        opacity: 0.85;
        margin-top: 2px;
      }
      .chat-messages {
        flex: 1;
        background: #ece5dd;
        padding: 10px 8px;
        overflow-y: auto;
      }
      .bubble-row {
        display: flex;
        margin-bottom: 8px;
      }
      .bubble {
        max-width: 80%;
        padding: 8px 10px;
        border-radius: 8px;
        font-size: 13px;
        line-height: 1.4;
        position: relative;
      }
      .bubble-user {
        margin-left: auto;
        background: #dcf8c6;
        border-top-right-radius: 0;
      }
      .bubble-bot {
        margin-right: auto;
        background: #ffffff;
        border-top-left-radius: 0;
      }
      .bubble-meta {
        font-size: 10px;
        opacity: 0.6;
        margin-top: 3px;
        text-align: right;
      }
      .chat-input-area {
        padding: 8px;
        background: #f0f0f0;
        display: flex;
        gap: 6px;
        align-items: center;
      }
      .chat-input {
        flex: 1;
        border-radius: 20px;
        border: none;
        padding: 8px 12px;
        font-size: 13px;
        outline: none;
      }
      .chat-send-btn {
        border-radius: 20px;
        border: none;
        background: #25d366;
        color: #ffffff;
        padding: 8px 14px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
      }
      .chat-send-btn:disabled {
        opacity: 0.6;
        cursor: default;
      }
      .chat-footer {
        font-size: 10px;
        text-align: center;
        padding: 4px 0 6px 0;
        color: #777;
        background: #f4f4f4;
      }
    </style>
  </head>
  <body>
    <div class="chat-wrapper">
      <div class="chat-header">
        <div class="chat-header-title">Mustafa Gülap AI Assistant</div>
        <div class="chat-header-sub">Profesyonel geçmişim ve uzmanlık alanlarımla ilgili sorularınızı yanıtlar.</div>
      </div>
      <div id="messages" class="chat-messages"></div>
      <div class="chat-input-area">
        <input id="userInput" class="chat-input" type="text" placeholder="Mesajınızı yazın..." />
        <button id="sendBtn" class="chat-send-btn">Gönder</button>
      </div>
      <div class="chat-footer">
        Yanıtlar, Mustafa Gülap'ın profesyonel CV'sine göre optimize edilmiştir.
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
        if (sender === "user") bubble.classList.add("bubble-user");
        else bubble.classList.add("bubble-bot");

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
        inputEl.focus();
        sendBtn.disabled = true;

        appendMessage("Yazıyorum...", "bot");
        const loadingRow = messagesEl.lastChild;

        try {
          const res = await fetch("/mg-chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text })
          });

const data = await res.json();
messagesEl.removeChild(loadingRow);

if (data.reply) {
  appendMessage(data.reply, "bot");
} else if (data.error) {
  appendMessage("Hata: " + (data.detail || data.error), "bot");
} else {
  appendMessage("Boş yanıt döndü.", "bot");
}

        } catch (err) {
          console.error(err);
          messagesEl.removeChild(loadingRow);
          appendMessage("Bağlantı hatası, lütfen tekrar deneyin.", "bot");
        } finally {
          sendBtn.disabled = false;
        }
      }

      sendBtn.addEventListener("click", sendMessage);
      inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendMessage();
      });

      // karşılama mesajı
      appendMessage(
        "Merhaba, ben Mustafa Gülap'ın profesyonel AI asistanıyım. Statik ekipman, inspeksiyon, bakım, tedarik zinciri, sözleşme yönetimi veya Özka ile yürüttüğüm proje bazlı imalatlar hakkında sorular sorabilirsiniz.",
        "bot"
      );
    </script>
  </body>
  </html>
  `;
  res.send(html);
});

// ana sayfa /'yi /ui'ye yönlendirelim
app.get("/", (req, res) => {
  res.redirect("/ui");
});

app.listen(PORT, () => {
  console.log(`MG Assistant API listening on port ${PORT}`);
});