const submitBtn   = document.getElementById('submitBtn');
const reviewText  = document.getElementById('reviewText');
const reviewType  = document.getElementById('reviewType');
const reviewList  = document.getElementById('reviewList');
const stars       = document.querySelectorAll('.star');
const filterBtns  = document.querySelectorAll('.filter-btn');

const GEMINI_API_KEY = "AIzaSyCg1G1ieKIvvfxOCS9PP-PbGCSobGiO5aU";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;
let isLoading    = false;
let selectedStar = 0;
let activeFilter = 'all';
let reviews      = JSON.parse(localStorage.getItem('reviews') || '[]');

// ── Звёзды ──────────────────────────────────────────
stars.forEach(star => {
  star.addEventListener('click', () => {
    selectedStar = parseInt(star.dataset.value);
    updateStars();
  });

  star.addEventListener('mouseover', () => {
    const val = parseInt(star.dataset.value);
    stars.forEach(s => {
      s.style.color = parseInt(s.dataset.value) <= val ? '#ffc107' : '#ddd';
    });
  });
});

document.getElementById('starRating').addEventListener('mouseleave', () => {
  updateStars();
});

function updateStars() {
  stars.forEach(s => {
    const active = parseInt(s.dataset.value) <= selectedStar;
    s.style.color = active ? '#ffc107' : '#ddd';
  });
}

// ── Фильтры ─────────────────────────────────────────
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    renderReviews();
  });
});

// ── Gemini API ───────────────────────────────────────
async function generateAIResponse(text, type, rating) {
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

Тип сообщения: ${typeDescriptions[type]}
${ratingText}
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
    if (response.status === 429) throw new Error('429');
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text.trim();
}

// ── Кнопка отправки ──────────────────────────────────
submitBtn.addEventListener('click', async () => {
  if (isLoading) return;

  const text   = reviewText.value.trim();
  const type   = reviewType.value;
  const rating = selectedStar;

  if (!text) {
    alert('Введите текст отзыва');
    return;
  }

  isLoading = true;
  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ Генерирую ответ...';

  let aiResponse;
  try {
    aiResponse = await generateAIResponse(text, type, rating);
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
    rating,
    date: new Date().toLocaleString('ru-RU'),
    aiResponse,
  };

  reviews.unshift(review);
  localStorage.setItem('reviews', JSON.stringify(reviews));
  renderReviews();

  // Сброс формы
  reviewText.value = '';
  selectedStar = 0;
  updateStars();

  isLoading = false;
  submitBtn.disabled = false;
  submitBtn.textContent = 'Добавить и сгенерировать ответ';
});

// ── Рендер ───────────────────────────────────────────
function renderReviews() {
  const filtered = activeFilter === 'all'
    ? reviews
    : reviews.filter(r => r.type === activeFilter);

  if (filtered.length === 0) {
    reviewList.innerHTML = '<p class="empty-state">Отзывов пока нет. Добавьте первый.</p>';
    return;
  }

  reviewList.innerHTML = filtered.map(review => `
    <div class="review-item" data-id="${review.id}">
      <div class="review-meta">
        <span class="badge ${review.type}">${getTypeLabel(review.type)}</span>
        ${review.rating ? `<span class="review-stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>` : ''}
        <span class="review-date">${review.date}</span>
      </div>
      <p class="review-text">${review.text}</p>
      <div class="ai-label">AI-ответ (Gemini)</div>
      <div class="ai-response" id="resp-${review.id}">${review.aiResponse}</div>
      <div class="review-actions">
        <button class="btn-copy" onclick="copyResponse(${review.id})">📋 Копировать ответ</button>
        <button class="btn-delete" onclick="deleteReview(${review.id})">🗑️ Удалить</button>
      </div>
    </div>
  `).join('');
}

// ── Копировать ───────────────────────────────────────
function copyResponse(id) {
  const el = document.getElementById(`resp-${id}`);
  navigator.clipboard.writeText(el.textContent).then(() => {
    const btn = el.nextElementSibling.querySelector('.btn-copy');
    btn.textContent = '✅ Скопировано!';
    setTimeout(() => btn.textContent = '📋 Копировать ответ', 2000);
  });
}

// ── Удалить ──────────────────────────────────────────
function deleteReview(id) {
  if (!confirm('Удалить этот отзыв?')) return;
  reviews = reviews.filter(r => r.id !== id);
  localStorage.setItem('reviews', JSON.stringify(reviews));
  renderReviews();
}

function getTypeLabel(type) {
  return { review: 'Отзыв', question: 'Вопрос', complaint: 'Жалоба' }[type] || type;
}

// Инициализация
renderReviews();