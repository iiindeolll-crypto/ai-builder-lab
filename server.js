const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

// Загружаем переменные окружения из ai.env
dotenv.config({ path: path.join(__dirname, 'ai.env') });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/generate', async (req, res) => {
  try {
    const { text, type, rating } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const typeDescriptions = {
      review: 'отзыв',
      question: 'вопрос',
      complaint: 'жалоба'
    };

    const ratingText = rating
      ? `Оценка покупателя: ${rating} из 5 звёзд.`
      : '';

    const prompt = `Ты помощник продавца на маркетплейсе Ozon.
Пиши вежливые, краткие и профессиональные ответы на отзывы покупателей.
Отвечай по-русски. Максимум 3 предложения. Без лишних слов.

Тип сообщения: ${typeDescriptions[type] || type}
${ratingText}
Текст покупателя: ${text}

Напиши ответ продавца.`;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not found in ai.env' });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }

      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!aiText) {
      return res.status(500).json({ error: 'Empty AI response' });
    }

    res.json({ aiResponse: aiText });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});