import { quizData } from './data.js';

export class QuizManager {
  constructor() {
    this.currentLevel = null;
    this.questions = [];
    this.currentIndex = 0;
    this.score = 0;
    this.timeLeft = 15 * 60;
    this.timerId = null;
    this.isAnswered = false;

    this.dom = {
      menu: document.getElementById('menu-screen'),
      quiz: document.getElementById('quiz-screen'),
      result: document.getElementById('result-screen'),
      grid: document.getElementById('levels-grid'),
      qText: document.getElementById('question-text'),
      opts: document.getElementById('options-container'),
      pBar: document.getElementById('progress-bar'),
      timer: document.getElementById('timer'),
      btnNext: document.getElementById('btn-next')
    };

    this.initEvents();
    this.renderMenu();
  }

  initEvents() {
    this.dom.btnNext.addEventListener('click', () => this.nextQuestion());
    document.getElementById('btn-quit').addEventListener('click', () => this.quit());
    document.getElementById('btn-back-menu').addEventListener('click', () => this.showScreen('menu'));
  }

  renderMenu() {
    this.dom.grid.innerHTML = '';
    const levels = [
      { id: 'beginner', name: 'Beginner', desc: 'Для начинающих' },
      { id: 'intermediate', name: 'Intermediate', desc: 'Средний уровень' },
      { id: 'advanced', name: 'Advanced', desc: 'Продвинутый' },
      { id: 'expert', name: 'Expert', desc: 'Экспертный' }
    ];

    levels.forEach(level => {
      const best = localStorage.getItem(`quiz_${level.id}`) || 0;
      const card = document.createElement('div');
      card.className = 'level-card';
      card.dataset.level = level.id;
      card.innerHTML = `
        <h3>${level.name}</h3>
        <p>${level.desc} • 20 вопросов</p>
        <div class="best-score">Рекорд: ${best}/20</div>
      `;
      card.addEventListener('click', () => this.start(level.id));
      this.dom.grid.appendChild(card);
    });
  }

  start(levelId) {
    this.currentLevel = levelId;
    // Берем вопросы и перемешиваем их
    this.questions = [...quizData[levelId]].sort(() => Math.random() - 0.5);
    this.currentIndex = 0;
    this.score = 0;
    this.timeLeft = 15 * 60;
    
    this.showScreen('quiz');
    this.startTimer();
    this.loadQuestion();
  }

  startTimer() {
    clearInterval(this.timerId);
    this.updateTimer();
    this.timerId = setInterval(() => {
      this.timeLeft--;
      this.updateTimer();
      if (this.timeLeft <= 0) this.end();
    }, 1000);
  }

  updateTimer() {
    const m = Math.floor(this.timeLeft / 60);
    const s = this.timeLeft % 60;
    this.dom.timer.textContent = `${m}:${s.toString().padStart(2, '0')}`;
    
    // Меняем цвет таймера на красный, если осталось меньше минуты
    if (this.timeLeft < 60) {
      this.dom.timer.style.color = 'var(--danger)';
    } else {
      this.dom.timer.style.color = 'var(--primary-blue)';
    }
  }

  loadQuestion() {
    this.isAnswered = false;
    this.dom.btnNext.classList.add('hidden');
    const q = this.questions[this.currentIndex];
    
    // Обновляем только полоску прогресса (как на EF SET)
    const percent = Math.round((this.currentIndex / 20) * 100);
    this.dom.pBar.style.width = `${percent}%`;

    // Выводим вопрос
    this.dom.qText.textContent = q.q;
    this.dom.opts.innerHTML = '';

    // Выводим варианты ответов
    q.o.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = opt;
      btn.addEventListener('click', () => this.answer(idx, q.a));
      this.dom.opts.appendChild(btn);
    });
  }

  answer(selected, correct) {
    if (this.isAnswered) return;
    this.isAnswered = true;

    const btns = this.dom.opts.querySelectorAll('.option-btn');
    btns.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === correct) btn.classList.add('correct');
      if (idx === selected && idx !== correct) btn.classList.add('incorrect');
    });

    if (selected === correct) this.score++;
    
    this.dom.btnNext.classList.remove('hidden');
    this.dom.btnNext.textContent = this.currentIndex === 19 ? 'Завершить' : 'Далее';
  }

  nextQuestion() {
    this.currentIndex++;
    if (this.currentIndex >= 20) this.end();
    else this.loadQuestion();
  }

  end() {
    clearInterval(this.timerId);
    this.showScreen('result');

    // Сохраняем рекорд
    const key = `quiz_${this.currentLevel}`;
    const best = parseInt(localStorage.getItem(key)) || 0;
    if (this.score > best) localStorage.setItem(key, this.score);

    // Выводим результат
    document.getElementById('score-text').textContent = this.score;

    // Сообщение
    const msg = document.getElementById('result-message');
    if (this.score === 20) { msg.textContent = "Идеально! 🏆"; msg.style.color = "var(--success)"; }
    else if (this.score >= 15) { msg.textContent = "Отлично! 👍"; msg.style.color = "var(--success)"; }
    else if (this.score >= 10) { msg.textContent = "Неплохо, но можно лучше."; msg.style.color = "var(--warning)"; }
    else { msg.textContent = "Стоит повторить материал. 📚"; msg.style.color = "var(--danger)"; }

    this.renderMenu(); 
  }

  quit() {
    if (confirm('Выйти? Прогресс не сохранится.')) {
      clearInterval(this.timerId);
      this.showScreen('menu');
    }
  }

  showScreen(name) {
    this.dom.menu.classList.remove('active');
    this.dom.quiz.classList.remove('active');
    this.dom.result.classList.remove('active');
    
    if (name === 'menu') this.dom.menu.classList.add('active');
    if (name === 'quiz') this.dom.quiz.classList.add('active');
    if (name === 'result') this.dom.result.classList.add('active');
  }
}