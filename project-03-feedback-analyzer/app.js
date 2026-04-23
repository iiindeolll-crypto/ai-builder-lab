const submitBtn = document.getElementById('submitBtn');
const reviewText = document.getElementById('reviewText');
const reviewType = document.getElementById('reviewType');
const reviewList = document.getElementById('reviewList');

// Массив для хранения отзывов
let reviews = [];

// Заглушка для AI-ответа
function generateFakeAIResponse(text, type) {
  if (type === 'complaint') {
    return 'Здравствуйте! Нам очень жаль, что вы столкнулись с этой проблемой. Мы обязательно разберёмся и исправим ситуацию. Свяжитесь с нами в личные сообщения.';
  }
  if (type === 'question') {
    return 'Здравствуйте! Спасибо за ваш вопрос. Мы готовы помочь. Уточните, пожалуйста, детали в личных сообщениях.';
  }
  return 'Спасибо за ваш отзыв! Нам очень важно ваше мнение. Будем рады видеть вас снова.';
}

// Добавить отзыв
submitBtn.addEventListener('click', () => {
  const text = reviewText.value.trim();
  const type = reviewType.value;

  if (!text) {
    alert('Введите текст отзыва');
    return;
  }

  const review = {
    id: Date.now(),
    text,
    type,
    date: new Date().toLocaleString('ru-RU'),
    aiResponse: generateFakeAIResponse(text, type),
  };

  reviews.unshift(review);
  renderReviews();

  // Очистить поле
  reviewText.value = '';
});

// Отрисовать список
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