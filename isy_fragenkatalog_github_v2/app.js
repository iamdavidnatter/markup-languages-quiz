const sourceFilter = document.getElementById('sourceFilter');
const topicFilter = document.getElementById('topicFilter');
const countInput = document.getElementById('countInput');
const modeSelect = document.getElementById('modeSelect');
const quiz = document.getElementById('quiz');
const quizActions = document.getElementById('quizActions');

const shownCount = document.getElementById('shownCount');
const answeredCount = document.getElementById('answeredCount');
const scoreCount = document.getElementById('scoreCount');
const percentCount = document.getElementById('percentCount');
const totalQuestions = document.getElementById('totalQuestions');

let currentQuestions = [];
let evaluated = new Set();
let results = new Map();

function unique(arr) {
  return [...new Set(arr.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), 'de'));
}

function byId(a, b) {
  return String(a.id).localeCompare(String(b.id), 'de', { numeric: true });
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function filteredQuestions() {
  return QUESTION_BANK.filter(q =>
    (sourceFilter.value === 'all' || q.source === sourceFilter.value) &&
    (topicFilter.value === 'all' || q.topic === topicFilter.value)
  );
}

function populateFilters() {
  totalQuestions.textContent = QUESTION_BANK.length;
  unique(QUESTION_BANK.map(q => q.source)).forEach(source => {
    sourceFilter.add(new Option(source, source));
  });
  unique(QUESTION_BANK.map(q => q.topic)).forEach(topic => {
    topicFilter.add(new Option(topic, topic));
  });
  countInput.max = QUESTION_BANK.length;
}

function resetEvaluation() {
  evaluated = new Set();
  results = new Map();
}

function loadQuiz(all = false) {
  resetEvaluation();
  const pool = filteredQuestions();
  const ordered = modeSelect.value === 'ordered' ? [...pool].sort(byId) : shuffle(pool);
  const count = all ? ordered.length : Math.max(1, Math.min(Number(countInput.value) || 20, ordered.length));
  currentQuestions = ordered.slice(0, count);
  renderQuiz();
}

function renderQuiz() {
  quiz.innerHTML = '';
  if (!currentQuestions.length) {
    quizActions.hidden = true;
    quiz.innerHTML = '<div class="empty-state">Keine Fragen für diese Filter gefunden.</div>';
    updateStatus();
    return;
  }

  quizActions.hidden = false;
  currentQuestions.forEach((q, index) => quiz.appendChild(renderQuestion(q, index)));
  updateStatus();
}

function renderQuestion(q, index) {
  const card = document.createElement('article');
  card.className = 'question-card';
  card.dataset.qid = q.id;

  const meta = document.createElement('div');
  meta.className = 'meta';
  [q.id, q.source, q.topic, typeLabel(q.type)].forEach(value => {
    const pill = document.createElement('span');
    pill.className = 'pill';
    pill.textContent = value;
    meta.appendChild(pill);
  });

  const questionText = document.createElement('div');
  questionText.className = 'question-text';
  questionText.textContent = `${index + 1}. ${q.question}`;

  const body = document.createElement('div');
  body.className = 'question-body';

  if (q.type === 'multiple_choice' || q.type === 'true_false') {
    body.appendChild(renderChoiceQuestion(q));
  } else if (q.type === 'matching') {
    body.appendChild(renderMatchingQuestion(q));
  } else if (q.type === 'fill_blank') {
    body.appendChild(renderFillBlankQuestion(q));
  }

  const footer = document.createElement('div');
  footer.className = 'card-footer';
  const checkButton = document.createElement('button');
  checkButton.type = 'button';
  checkButton.className = 'secondary';
  checkButton.textContent = 'Frage prüfen';
  checkButton.addEventListener('click', () => {
    evaluateQuestion(q, card, false);
    updateStatus();
  });
  footer.appendChild(checkButton);

  const feedback = document.createElement('div');
  feedback.className = 'feedback';

  card.append(meta, questionText, body, footer, feedback);
  card.addEventListener('change', () => {
    clearEvaluationForQuestion(q.id, card);
    updateSelectedStyles(card);
    updateStatus();
  });

  return card;
}

function typeLabel(type) {
  return {
    multiple_choice: 'Mehrfachauswahl',
    true_false: 'Wahr/Falsch',
    matching: 'Zuordnung',
    fill_blank: 'Lückentext'
  }[type] || type;
}

function renderChoiceQuestion(q) {
  const wrapper = document.createElement('div');
  wrapper.className = 'options';
  const inputType = q.type === 'true_false' ? 'radio' : 'checkbox';

  q.options.forEach(option => {
    const label = document.createElement('label');
    label.className = 'option';
    label.dataset.optionId = option.id;

    const input = document.createElement('input');
    input.type = inputType;
    input.name = `answer-${q.id}`;
    input.value = option.id;

    const text = document.createElement('span');
    const code = document.createElement('span');
    code.className = 'option-code';
    code.textContent = option.id.length === 1 ? `${option.id}.` : '';
    text.append(code, document.createTextNode(option.text));

    label.append(input, text);
    wrapper.appendChild(label);
  });

  return wrapper;
}

function renderMatchingQuestion(q) {
  const wrapper = document.createElement('div');
  wrapper.className = 'match-grid';
  const values = unique(q.options.map(pair => pair.right));

  q.options.forEach(pair => {
    const row = document.createElement('div');
    row.className = 'match-row';
    row.dataset.left = pair.left;

    const left = document.createElement('strong');
    left.textContent = pair.left;

    const select = document.createElement('select');
    select.name = `match-${q.id}-${slug(pair.left)}`;
    select.appendChild(new Option('Bitte auswählen …', ''));
    values.forEach(value => select.appendChild(new Option(value, value)));

    row.append(left, select);
    wrapper.appendChild(row);
  });

  return wrapper;
}

function renderFillBlankQuestion(q) {
  const wrapper = document.createElement('div');
  wrapper.className = 'fill-grid';

  q.options.forEach(item => {
    const row = document.createElement('label');
    row.className = 'fill-row';

    const label = document.createElement('strong');
    label.textContent = `Lücke ${item.blank}`;

    const input = document.createElement('input');
    input.type = 'text';
    input.name = `blank-${q.id}-${item.blank}`;
    input.autocomplete = 'off';
    input.placeholder = 'Antwort eingeben';
    input.dataset.blank = item.blank;

    row.append(label, input);
    wrapper.appendChild(row);
  });

  return wrapper;
}

function getCard(qid) {
  return quiz.querySelector(`[data-qid="${cssEscape(qid)}"]`);
}

function selectedChoiceIds(card) {
  return [...card.querySelectorAll('input[type="checkbox"]:checked, input[type="radio"]:checked')].map(input => input.value).sort();
}

function correctChoiceIds(q) {
  return q.options.filter(option => option.correct).map(option => option.id).sort();
}

function getMatchingAnswers(card) {
  const answers = {};
  card.querySelectorAll('.match-row').forEach(row => {
    answers[row.dataset.left] = row.querySelector('select').value;
  });
  return answers;
}

function getFillAnswers(card) {
  return [...card.querySelectorAll('.fill-row input')].map(input => input.value);
}

function normalize(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[„“”"'`´]/g, '')
    .replace(/[.,;:!?]+$/g, '');
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function evaluateQuestion(q, card = getCard(q.id), revealOnly = false) {
  if (!card) return false;

  let isCorrect = false;

  if (q.type === 'multiple_choice' || q.type === 'true_false') {
    const selected = selectedChoiceIds(card);
    const correct = correctChoiceIds(q);
    isCorrect = arraysEqual(selected, correct);
    markChoices(q, card);
  } else if (q.type === 'matching') {
    const answers = getMatchingAnswers(card);
    isCorrect = q.options.every(pair => answers[pair.left] === String(pair.right));
    markMatching(q, card);
  } else if (q.type === 'fill_blank') {
    const answers = getFillAnswers(card);
    isCorrect = q.options.every((item, index) => normalize(answers[index]) === normalize(item.answer));
    markFill(q, card);
  }

  card.classList.toggle('is-correct', isCorrect);
  card.classList.toggle('is-wrong', !isCorrect);
  showFeedback(q, card, isCorrect, revealOnly);
  evaluated.add(q.id);
  results.set(q.id, isCorrect);
  return isCorrect;
}

function markChoices(q, card) {
  card.querySelectorAll('.option').forEach(label => {
    const option = q.options.find(item => item.id === label.dataset.optionId);
    const input = label.querySelector('input');
    label.classList.remove('is-selected');
    label.classList.toggle('is-correct', Boolean(option?.correct));
    label.classList.toggle('is-wrong', input.checked && !option?.correct);
  });
}

function markMatching(q, card) {
  card.querySelectorAll('.match-row').forEach(row => {
    const pair = q.options.find(item => item.left === row.dataset.left);
    const value = row.querySelector('select').value;
    const correct = value === String(pair?.right);
    row.classList.toggle('is-correct', correct);
    row.classList.toggle('is-wrong', !correct);
  });
}

function markFill(q, card) {
  card.querySelectorAll('.fill-row input').forEach((input, index) => {
    const correct = normalize(input.value) === normalize(q.options[index]?.answer);
    input.classList.toggle('is-correct', correct);
    input.classList.toggle('is-wrong', !correct);
  });
}

function showFeedback(q, card, isCorrect, revealOnly) {
  const feedback = card.querySelector('.feedback');
  feedback.innerHTML = '';
  feedback.classList.add('show');

  const headline = document.createElement('strong');
  headline.textContent = revealOnly ? 'Lösung angezeigt.' : (isCorrect ? 'Richtig.' : 'Noch nicht richtig.');
  feedback.appendChild(headline);

  const correctLine = document.createElement('div');
  correctLine.className = 'correct-answer';
  correctLine.textContent = `Richtige Lösung: ${formatCorrectAnswer(q)}`;
  feedback.appendChild(correctLine);

  if (q.explanation) {
    const explanation = document.createElement('div');
    explanation.textContent = q.explanation;
    feedback.appendChild(explanation);
  }
}

function formatCorrectAnswer(q) {
  if (q.type === 'multiple_choice' || q.type === 'true_false') {
    return q.options.filter(option => option.correct).map(option => {
      const code = option.id.length === 1 ? `${option.id}. ` : '';
      return `${code}${option.text}`;
    }).join(' | ');
  }
  if (q.type === 'matching') {
    return q.options.map(pair => `${pair.left} → ${pair.right}`).join(' | ');
  }
  if (q.type === 'fill_blank') {
    return q.options.map(item => `Lücke ${item.blank}: ${item.answer}`).join(' | ');
  }
  return '';
}

function clearEvaluationForQuestion(qid, card) {
  if (!evaluated.has(qid)) {
    updateSelectedStyles(card);
    return;
  }
  evaluated.delete(qid);
  results.delete(qid);
  card.classList.remove('is-correct', 'is-wrong');
  card.querySelectorAll('.is-correct, .is-wrong').forEach(el => el.classList.remove('is-correct', 'is-wrong'));
  const feedback = card.querySelector('.feedback');
  feedback.classList.remove('show');
  feedback.innerHTML = '';
  updateSelectedStyles(card);
}

function updateSelectedStyles(card) {
  card.querySelectorAll('.option').forEach(label => {
    const input = label.querySelector('input');
    label.classList.toggle('is-selected', input.checked);
  });
}

function isAnswered(q) {
  const card = getCard(q.id);
  if (!card) return false;
  if (q.type === 'multiple_choice' || q.type === 'true_false') {
    return selectedChoiceIds(card).length > 0;
  }
  if (q.type === 'matching') {
    return [...card.querySelectorAll('.match-row select')].every(select => select.value);
  }
  if (q.type === 'fill_blank') {
    return [...card.querySelectorAll('.fill-row input')].every(input => input.value.trim());
  }
  return false;
}

function updateStatus() {
  shownCount.textContent = currentQuestions.length;
  const answered = currentQuestions.filter(isAnswered).length;
  answeredCount.textContent = answered;

  if (!evaluated.size) {
    scoreCount.textContent = '–';
    percentCount.textContent = '–';
    return;
  }

  const correct = [...results.values()].filter(Boolean).length;
  scoreCount.textContent = `${correct}/${evaluated.size}`;
  percentCount.textContent = `${Math.round((correct / evaluated.size) * 100)}%`;
}

function revealSolutions() {
  currentQuestions.forEach(q => {
    const card = getCard(q.id);
    if (!card) return;

    if (q.type === 'multiple_choice' || q.type === 'true_false') {
      card.querySelectorAll('input').forEach(input => {
        const option = q.options.find(item => item.id === input.value);
        input.checked = Boolean(option?.correct);
      });
    } else if (q.type === 'matching') {
      card.querySelectorAll('.match-row').forEach(row => {
        const pair = q.options.find(item => item.left === row.dataset.left);
        row.querySelector('select').value = pair?.right || '';
      });
    } else if (q.type === 'fill_blank') {
      card.querySelectorAll('.fill-row input').forEach((input, index) => {
        input.value = q.options[index]?.answer || '';
      });
    }

    evaluateQuestion(q, card, true);
  });
  updateStatus();
}

function resetCurrentQuiz() {
  resetEvaluation();
  renderQuiz();
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/gi, '-');
}

function cssEscape(value) {
  if (window.CSS && CSS.escape) return CSS.escape(value);
  return String(value).replace(/"/g, '\\"');
}

sourceFilter.addEventListener('change', () => {
  const total = filteredQuestions().length;
  countInput.max = Math.max(total, 1);
  if (Number(countInput.value) > total) countInput.value = total || 1;
});
topicFilter.addEventListener('change', () => {
  const total = filteredQuestions().length;
  countInput.max = Math.max(total, 1);
  if (Number(countInput.value) > total) countInput.value = total || 1;
});

document.getElementById('startBtn').addEventListener('click', () => loadQuiz(false));
document.getElementById('showAllBtn').addEventListener('click', () => loadQuiz(true));
document.getElementById('resetBtn').addEventListener('click', resetCurrentQuiz);
document.getElementById('gradeBtn').addEventListener('click', () => {
  currentQuestions.forEach(q => evaluateQuestion(q));
  updateStatus();
});
document.getElementById('solutionBtn').addEventListener('click', revealSolutions);

populateFilters();
loadQuiz(false);
