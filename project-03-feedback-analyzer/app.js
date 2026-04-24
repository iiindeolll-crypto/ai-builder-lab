const API_KEY = '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';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const submitBtn = document.getElementById('submitBtn');
const reviewText = document.getElementById('reviewText');
const reviewType = document.getElementById('reviewType');
const reviewList = document.getElementById('reviewList');

let reviews = [];

async function generateAIResponse(text, type) {
  const typeContext = {
    review: 'покупатель оставил отзыв',
    question: 'покупатель задал вопрос',
    complaint: 'покупатель написал жалобу',
  };

  const systemPrompt = `Ты вежливый менеджер интернет-магазина на маркетплейсе.
Твоя задача — отвечать на сообщения покупателей коротко, профессионально и по делу.
Ответ должен быть на русском языке.
Максимум 3 предложения.`;

  const userMessage = `Ситуация: ${typeContext[type]}.
Сообщение покупателя: "${text}"
Напиши ответ от имени продавца.`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'HTTP-Referer': 'http://127.0.0.1:5500',
        'X-Title': 'Marketplace Review Assistant',
      },
      body: JSON.stringify({
        model: 'inclusionai/ling-2.6-1t:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenRouter error:', data);
      return `Ошибка API: ${data.error?.message || response.status}`;
    }

    return data.choices?.[0]?.message?.content || 'Пустой ответ от AI';

  } catch (error) {
    console.error('Ошибка AI:', error);
    return 'Не удалось получить ответ. Попробуйте снова.';
  }
}

submitBtn.addEventListener('click', async () => {
  const text = reviewText.value.trim();
  const type = reviewType.value;

  if (!text) {
    alert('Введите текст отзыва');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Генерируем ответ...';

  const aiResponse = await generateAIResponse(text, type);

  const review = {
    id: Date.now(),
    text,
    type,
    date: new Date().toLocaleString('ru-RU'),
    aiResponse,
  };

  reviews.unshift(review);
  renderReviews();

  submitBtn.disabled = false;
  submitBtn.textContent = 'Добавить и сгенерировать ответ';
  reviewText.value = '';
});

function renderReviews() {
  if (reviews.length === 0) {
    reviewList.innerHTML = '<p class="empty-state">Отзывов пока нет. Добавьте первый.</p>';
    return;
  }

  reviewList.innerHTML = reviews.map(review => `
    <div class="review-item">
      <div class="review-meta">
        <span class="badge ${review.type}">${getTypeLabel(review.type)}</span>
        <span class="review-date">${review.date}</span>
      </div>
      <p class="review-text">${review.text}</p>
      <div class="ai-label">AI-ответ</div>
      <div class="ai-response">${review.aiResponse}</div>
    </div>
  `).join('');
}

function getTypeLabel(type) {
  const labels = {
    review: 'Отзыв',
    question: 'Вопрос',
    complaint: 'Жалоба',
  };
  return labels[type] || type;
}