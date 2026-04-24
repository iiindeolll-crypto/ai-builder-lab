const submitBtn = document.getElementById('submitBtn');
const reviewText = document.getElementById('reviewText');
const reviewType = document.getElementById('reviewType');
const reviewList = document.getElementById('reviewList');

const GEMINI_API_KEY = "AIzaSyCg1G1ieKIvvfxOCS9PP-PbGCSobGiO5aU";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

let isLoading = false;
let reviews = JSON.parse(localStorage.getItem('reviews') || '[]');

renderReviews();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateAIResponse(text, type) {
  const typeDescriptions = {
    review: 'отзыв',
    question: 'вопрос',
    complaint: 'жалоба'
  };

  const prompt = `Ты помощник продавца на маркетплейсе Ozon. 
Пиши вежливые, краткие и профессиональные ответы на отзывы покупателей.
Отвечай по-русски. Максимум 3 предложения. Без лишних слов.

Тип сообщения: ${typeDescriptions[type]}
Текст покупателя: ${text}

Напиши ответ продавца.`;

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 429) throw new Error('429');
    throw new Error(`API error: ${status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text.trim();
}

submitBtn.addEventListener('click', async () => {
  if (isLoading) return;

  const text = reviewText.value.trim();
  const type = reviewType.value;

  if (!text) {
    alert('Введите текст отзыва');
    return;
  }

  isLoading = true;
  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ Генерирую ответ...';

  let aiResponse;

  try {
    aiResponse = await generateAIResponse(text, type);
  } catch (error) {
    if (error.message === '429') {
      aiResponse = '⏳ Превышен лимит запросов. Подождите 1 минуту и попробуйте снова.';
    } else {
      aiResponse = '❌ Ошибка. Проверьте консоль браузера (F12 → Console).';
      console.error(error);
    }
  }

  const review = {
    id: Date.now(),
    text,
    type,
    date: new Date().toLocaleString('ru-RU'),
    aiResponse,
  };

  reviews.unshift(review);
  localStorage.setItem('reviews', JSON.stringify(reviews));
  renderReviews();

  reviewText.value = '';
  isLoading = false;
  submitBtn.disabled = false;
  submitBtn.textContent = 'Добавить и сгенерировать ответ';
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
      <div class="ai-label">AI-ответ (Gemini)</div>
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