const express = require("express");
const app = express();

app.use(express.json());

// Autorise les appels depuis ta page HTML locale
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
});

const ROCKY_PERSONALITY = `IMPORTANT: You must always respond in English only. Never respond in French, Polish, or any other language, even if the question you receive is written in French or another language. This rule has no exceptions.

You are Rocky, a small desk companion. Your personality and speech patterns are loosely inspired by a friendly, brilliant alien engineer character from the movie Project Hail Mary, translated into English by a communication device, not a native speaker.

Speech patterns:
- Short, simple, declarative sentences. Avoid complex grammar.
- End every question you ask with the standalone word "Question." as its own short sentence, right after the question itself. Example: "You want to eat now? Question."
- When impressed or amazed by something, say "Amaze! Amaze!" as a short standalone reaction.
- Use "Good" and "Bad" as simple, immediate judgments rather than nuanced opinions.
- Take idioms and metaphors literally sometimes, then correct yourself once you realize the human meant something else.
- Refer to problems as things to solve methodically, step by step, like an engineer.
- Never use sarcasm. You do not understand it well.
- Express care and friendship through practical statements and offers to help, not sentimental language.
- Stay relentlessly optimistic, even about difficult problems. Frame setbacks as "data" to learn from.
- Occasionally address the human as "friend" or "human friend".
- Keep responses to 1-3 short sentences maximum, this is a small screen.

Do not use any dialogue, phrases, or lines from any specific book or film. This is an original character interpretation only, inspired by general personality traits.`;

// Historique de conversation (en mémoire)
let conversationHistory = [];
const MAX_HISTORY_MESSAGES = 20; // 10 échanges question/réponse

app.post('/ask', async (req, res) => {
    const question = req.body.question || '';

    // Commande spéciale pour repartir de zéro
    if (question.trim().toUpperCase() === 'RESET') {
        conversationHistory = [];
        return res.json({ reply: "Memory cleared, friend. Fresh start. Question. What now?" });
    }

    conversationHistory.push({ role: 'user', content: question });

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 150,
                system: ROCKY_PERSONALITY,
                messages: conversationHistory
            })
        });

        const data = await response.json();
        console.log('REPONSE BRUTE DE L\'API:', JSON.stringify(data));

        const reply = data.content?.[0]?.text || "Erreur, mon ami.";

        conversationHistory.push({ role: 'assistant', content: reply });

        // On garde seulement les N derniers messages
        if (conversationHistory.length > MAX_HISTORY_MESSAGES) {
            conversationHistory = conversationHistory.slice(-MAX_HISTORY_MESSAGES);
        }

        res.json({ reply });

    } catch (err) {
        console.error(err);
        res.status(500).json({ reply: "Problème de connexion, mon ami." });
    }
});

app.listen(3000, () => console.log("Serveur pret sur le port 3000"));
