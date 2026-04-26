const submitBtn = document.getElementById('submitBtn');
const reviewText = document.getElementById('reviewText');
const reviewType = document.getElementById('reviewType');
const reviewList = document.getElementById('reviewList');
const stars = document.querySelectorAll('.star');
const filterBtns = document.querySelectorAll('.filter-btn');

let isLoading = false;
let selectedStar = 0;
let activeFilter = 'all';
let reviews = JSON.parse(localStorage.getItem('reviews') || '[]');

// ── Звёзды ──────────────────────────────────────────
stars.forEach(star => {
  star.addEventListener('click', () => {
    selectedStar = parseInt(star.dataset.value, 10);
    updateStars();
  });

  star.addEventListener('mouseover', () => {
    const val = parseInt(star.dataset.value, 10);
    stars.forEach(s => {
      s.style.color = parseInt(s.dataset.value, 10) <= val ? '#ffc107' : '#ddd';
    });
  });
});

document.getElementById('starRating')?.addEventListener('mouseleave', () => {
  updateStars();
});

function updateStars() {
  stars.forEach(s => {
    const active = parseInt(s.dataset.value, 10) <= selectedStar;
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

// ── API через backend ───────────────────────────────
async function generateAIResponse(text, type, rating) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, type, rating })
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error('429');
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `API error: ${response.status}`);
  }

  const data = await response.json();
  return data.aiResponse;
}

// ── Кнопка отправки ──────────────────────────────────
submitBtn?.addEventListener('click', async () => {
  if (isLoading) return;

  const text = reviewText.value.trim();
  const type = reviewType.value;
  const rating = selectedStar;

  if (!text) {
    alert('Введите текст отзыва');
    return;
  }

  isLoading = true;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Генерирую...';

  try {
    const aiResponse = await generateAIResponse(text, type, rating);

    const review = {
      id: Date.now(),
      text,
      type,
      rating,
      aiResponse,
      createdAt: new Date().toISOString()
    };

    reviews.unshift(review);
    localStorage.setItem('reviews', JSON.stringify(reviews));

    reviewText.value = '';
    selectedStar = 0;
    updateStars();
    renderReviews();
    updateStats();
  } catch (error) {
    console.error(error);
    alert(`Ошибка: ${error.message}`);
  } finally {
    isLoading = false;
    submitBtn.disabled = false;
    submitBtn.textContent = 'Добавить и сгенерировать ответ';
  }
});

// ── Удаление ────────────────────────────────────────
function deleteReview(id) {
  reviews = reviews.filter(r => r.id !== id);
  localStorage.setItem('reviews', JSON.stringify(reviews));
  renderReviews();
  updateStats();
}

// ── Статистика ──────────────────────────────────────
function updateStats() {
  const total = reviews.length;
  const counts = {
    review: reviews.filter(r => r.type === 'review').length,
    question: reviews.filter(r => r.type === 'question').length,
    complaint: reviews.filter(r => r.type === 'complaint').length,
  };

  const ratedReviews = reviews.filter(r => r.rating && r.rating > 0);
  const avgRating = ratedReviews.length > 0
    ? (ratedReviews.reduce((sum, r) => sum + r.rating, 0) / ratedReviews.length).toFixed(1)
    : '—';

  const totalEl = document.getElementById('statTotal');
  const reviewsEl = document.getElementById('statReviews');
  const questionsEl = document.getElementById('statQuestions');
  const complaintsEl = document.getElementById('statComplaints');
  const avgEl = document.getElementById('statAvgRating');

  if (totalEl) totalEl.textContent = total;
  if (reviewsEl) reviewsEl.textContent = counts.review;
  if (questionsEl) questionsEl.textContent = counts.question;
  if (complaintsEl) complaintsEl.textContent = counts.complaint;
  if (avgEl) avgEl.textContent = avgRating;
}

// ── Рендер списка ───────────────────────────────────
function renderReviews() {
  if (!reviewList) return;

  let filtered = reviews;

  if (activeFilter !== 'all') {
    filtered = reviews.filter(r => r.type === activeFilter);
  }

  reviewList.innerHTML = filtered.map(review => `
    <div class="review-card">
      <div><strong>${getTypeLabel(review.type)}</strong> • ${review.rating || 0}★</div>
      <p>${review.text}</p>
      <div class="ai-response">${review.aiResponse || ''}</div>
      <button onclick="deleteReview(${review.id})">Удалить</button>
    </div>
  `).join('');
}

// ── Хелпер ───────────────────────────────────────────
function getTypeLabel(type) {
  return { review: 'Отзыв', question: 'Вопрос', complaint: 'Жалоба' }[type] || type;
}

// ── Инициализация ───────────────────────────────────
updateStats();
renderReviews();
updateStars();