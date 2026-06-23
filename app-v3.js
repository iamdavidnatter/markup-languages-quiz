// QUESTION_BANK is loaded from src/questions.js

const $ = (id) => document.getElementById(id);
let session = [], current = 0, answers = {}, checked = {}, mode = 'learn';
const storageKey = 'isyQuizMistakesV4';

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }
function getMistakes() { try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { return []; } }
function setMistakes(ids) { localStorage.setItem(storageKey, JSON.stringify([...new Set(ids)])); }
function percent() { const answered = Object.keys(checked).length; const score = session.filter(q => checked[q.id]?.correct).length; return answered ? Math.round(score/answered*100) : 0; }
function populateFilters() {
  $('heroTotal').textContent = QUESTION_BANK.length;
  const topics = [...new Set(QUESTION_BANK.map(q => q.topic))].sort();
  const sources = [...new Set(QUESTION_BANK.map(q => q.source))].sort();
  topics.forEach(t => $('topic').insertAdjacentHTML('beforeend', `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`));
  sources.forEach(s => $('source').insertAdjacentHTML('beforeend', `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`));
}
function escapeHtml(str) { return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
function startQuiz(all=false, forcedMistakes=false) {
  mode = forcedMistakes ? 'mistakes' : $('mode').value;
  let pool = [...QUESTION_BANK];
  if (mode === 'mistakes' || forcedMistakes) { const ids = getMistakes(); pool = pool.filter(q => ids.includes(q.id)); }
  const topic = $('topic').value, source = $('source').value;
  if (topic !== 'all') pool = pool.filter(q => q.topic === topic);
  if (source !== 'all') pool = pool.filter(q => q.source === source);
  pool = shuffle(pool);
  const count = all ? pool.length : Math.max(1, Math.min(Number($('count').value || 20), pool.length));
  session = pool.slice(0,count); current = 0; answers = {}; checked = {};
  $('summary').classList.add('hidden'); $('empty').classList.add('hidden'); $('quizArea').classList.remove('hidden');
  if (!session.length) { $('questionHost').innerHTML = `<section class="question-card"><div class="q-body"><h2>Keine Fragen gefunden.</h2><p>Es gibt keine Fragen für diese Auswahl oder noch keine gespeicherten Fehler.</p></div></section>`; }
  render();
}
function render() { updateStats(); renderDots(); if (!session.length) return; renderQuestion(session[current]); }
function updateStats() {
  const answered = Object.keys(checked).length; const score = session.filter(q => checked[q.id]?.correct).length;
  $('statLoaded').textContent = session.length; $('statIndex').textContent = session.length ? `${current+1} / ${session.length}` : '–'; $('statAnswered').textContent = answered; $('statScore').textContent = score; $('statPercent').textContent = percent() + '%';
  $('progressBar').style.width = session.length ? ((answered/session.length)*100) + '%' : '0%';
  $('sideInfo').textContent = `${answered} von ${session.length} beantwortet · ${getMistakes().length} Fragen im Fehlertraining`;
}
function renderDots() {
  $('dots').innerHTML = session.map((q,i) => `<button class="dot ${i===current?'current':''} ${checked[q.id]?.correct?'done':''} ${checked[q.id]&&!checked[q.id].correct?'wrong':''}" data-i="${i}">${i+1}</button>`).join('');
  $('dots').querySelectorAll('.dot').forEach(b => b.onclick = () => { current = Number(b.dataset.i); render(); });
}
function renderQuestion(q) {
  const isChecked = !!checked[q.id];
  $('questionHost').innerHTML = `<article class="question-card">
    <div class="q-head"><div class="badges"><span class="badge">${escapeHtml(q.topic)}</span><span class="badge source">${escapeHtml(q.source)}</span><span class="badge">${escapeHtml(typeLabel(q.type))}</span></div><span class="badge">Frage ${current+1}/${session.length}</span></div>
    <div class="q-body"><h2 class="q-title">${escapeHtml(q.question)}</h2><div id="answerBox"></div><div id="explanationBox"></div></div>
    <div class="nav"><button id="prev" class="secondary" ${current===0?'disabled':''}>Zurück</button><div class="actions"><button id="check">Antwort prüfen</button><button id="solution" class="ghost">Lösung anzeigen</button></div><button id="next" class="secondary" ${current===session.length-1?'disabled':''}>Weiter</button></div>
  </article>`;
  renderAnswerBox(q, isChecked);
  $('prev').onclick = () => { if(current>0){ current--; render(); } }; $('next').onclick = () => { if(current<session.length-1){ current++; render(); } };
  $('check').onclick = () => checkAnswer(q, false); $('solution').onclick = () => checkAnswer(q, true);
  if (isChecked) showExplanation(q, checked[q.id].showSolution);
}
function typeLabel(t) { return t==='multiple_choice'?'Multiple Choice':t==='true_false'?'Wahr/Falsch':t==='ordering'?'Reihenfolge':'Zuordnung'; }
function renderAnswerBox(q, isChecked) {
  const saved = answers[q.id];
  if (q.type === 'multiple_choice' || q.type === 'true_false') {
    $('answerBox').innerHTML = `<div class="options">${q.options.map(o => `<button class="option ${saved?.includes(o.id)?'selected':''}" data-id="${o.id}"><span class="letter">${escapeHtml(o.id==='true'?'W':o.id==='false'?'F':o.id)}</span><span>${escapeHtml(o.text)}</span></button>`).join('')}</div>`;
    $('answerBox').querySelectorAll('.option').forEach(btn => btn.onclick = () => { if (checked[q.id]) return; const id = btn.dataset.id; let arr = answers[q.id] || []; if (q.type === 'true_false') arr = [id]; else arr = arr.includes(id) ? arr.filter(x=>x!==id) : [...arr,id]; answers[q.id] = arr; renderAnswerBox(q,false); });
  } else if (q.type === 'ordering') {
    const arr = saved || [];
    $('answerBox').innerHTML = `<p style="color:var(--muted);">Klicke die Elemente in der richtigen Reihenfolge an.</p><div class="order-list">${q.items.map(item => `<button class="order-item ${arr.includes(item)?'picked':''}" data-item="${escapeHtml(item)}"><span>${escapeHtml(item)}</span><span class="order-num">${arr.includes(item)?arr.indexOf(item)+1:'+'}</span></button>`).join('')}</div><div class="actions" style="margin-top:10px"><button class="secondary" id="resetOrder">Reihenfolge zurücksetzen</button></div>`;
    $('answerBox').querySelectorAll('.order-item').forEach(btn => btn.onclick = () => { if (checked[q.id]) return; const item=btn.dataset.item; let a=answers[q.id] || []; if(!a.includes(item)) a=[...a,item]; answers[q.id]=a; renderAnswerBox(q,false); });
    $('resetOrder').onclick = () => { if (checked[q.id]) return; answers[q.id]=[]; renderAnswerBox(q,false); };
  } else if (q.type === 'matching') {
    const options = shuffle(q.pairs.map(p=>p.right)); const map = saved || {};
    $('answerBox').innerHTML = q.pairs.map((p,i)=>`<div class="match-row" data-left="${escapeHtml(p.left)}"><strong>${escapeHtml(p.left)}</strong><select data-left="${escapeHtml(p.left)}"><option value="">Bitte wählen</option>${options.map(o=>`<option value="${escapeHtml(o)}" ${map[p.left]===o?'selected':''}>${escapeHtml(o)}</option>`).join('')}</select></div>`).join('');
    $('answerBox').querySelectorAll('select').forEach(sel => sel.onchange = () => { if (checked[q.id]) return; const m=answers[q.id]||{}; m[sel.dataset.left]=sel.value; answers[q.id]=m; });
  }
  if (isChecked) markAnswers(q);
}
function checkAnswer(q, showSolution=false) {
  const correct = isCorrect(q);
  checked[q.id] = { correct, showSolution };
  const mistakes = getMistakes();
  if (!correct) setMistakes([...mistakes, q.id]); else setMistakes(mistakes.filter(id => id !== q.id));
  markAnswers(q); showExplanation(q, showSolution); updateStats(); renderDots();
}
function isCorrect(q) {
  const ans = answers[q.id];
  if (q.type==='multiple_choice' || q.type==='true_false') { const correct = q.options.filter(o=>o.correct).map(o=>o.id).sort(); const given = (ans||[]).slice().sort(); return JSON.stringify(correct)===JSON.stringify(given); }
  if (q.type==='ordering') return JSON.stringify(ans||[])===JSON.stringify(q.items);
  if (q.type==='matching') return q.pairs.every(p => (ans||{})[p.left] === p.right);
  return false;
}
function markAnswers(q) {
  if (q.type==='multiple_choice' || q.type==='true_false') {
    $('answerBox').querySelectorAll('.option').forEach(btn => { const o = q.options.find(x=>x.id===btn.dataset.id); btn.classList.toggle('correct', !!o.correct); btn.classList.toggle('incorrect', (answers[q.id]||[]).includes(o.id) && !o.correct); });
  } else if (q.type==='ordering') {
    const ans=answers[q.id]||[]; $('answerBox').querySelectorAll('.order-item').forEach((btn) => { const item=btn.dataset.item; const pos=ans.indexOf(item); const correctPos=q.items.indexOf(item); if(pos>=0) btn.classList.add(pos===correctPos?'correct':'incorrect'); });
  } else if (q.type==='matching') {
    $('answerBox').querySelectorAll('.match-row').forEach(row => { const left=row.dataset.left; const pair=q.pairs.find(p=>p.left===left); const val=(answers[q.id]||{})[left]; row.classList.add(val===pair.right?'correct':'incorrect'); });
  }
}
function showExplanation(q, showSolution=false) {
  let html = `<div class="explain"><h3>${checked[q.id]?.correct?'✅ Richtig':'❌ Nicht ganz richtig'}</h3><p>${escapeHtml(q.explanation || '')}</p>`;
  if (q.type==='multiple_choice' || q.type==='true_false') { html += `<div class="explain-list">${q.options.map(o=>`<div class="explain-item ${o.correct?'ok':'bad'}"><strong>${escapeHtml(o.id)}. ${escapeHtml(o.text)}</strong><br>${escapeHtml(o.explanation || (o.correct?'Richtig.':'Falsch.'))}</div>`).join('')}</div>`; }
  if (q.type==='ordering') html += `<p><strong>Richtige Reihenfolge:</strong> ${q.items.map(escapeHtml).join(' → ')}</p>`;
  if (q.type==='matching') html += `<div class="explain-list">${q.pairs.map(p=>`<div class="explain-item ok"><strong>${escapeHtml(p.left)}</strong> → ${escapeHtml(p.right)}</div>`).join('')}</div>`;
  html += `</div>`; $('explanationBox').innerHTML = html;
}
function finishQuiz() {
  session.forEach(q => { if(!checked[q.id]) checked[q.id] = { correct:isCorrect(q), showSolution:false }; });
  const score=session.filter(q=>checked[q.id].correct).length; const wrong=session.filter(q=>!checked[q.id].correct);
  setMistakes([...getMistakes(), ...wrong.map(q=>q.id)]);
  $('summary').classList.remove('hidden'); $('summary').innerHTML = `<h2>Auswertung</h2><p><strong>${score} von ${session.length}</strong> richtig · Quote: <strong>${Math.round(score/session.length*100)}%</strong></p>${wrong.length?`<h3>Falsch beantwortete Fragen</h3><ol>${wrong.map(q=>`<li>${escapeHtml(q.question)} <small>(${escapeHtml(q.topic)})</small></li>`).join('')}</ol>`:'<p>Perfekt, keine Fehler 🎉</p>'}<div class="actions"><button onclick="startQuiz(false,true)">Fehlertraining starten</button><button class="secondary" onclick="startQuiz()">Neues Quiz</button></div>`;
  updateStats(); renderDots();
}
$('start').onclick = () => startQuiz(false,false); $('all').onclick = () => startQuiz(true,false); $('finish').onclick = finishQuiz; $('mistakeBtn').onclick = () => startQuiz(false,true); $('reset').onclick = () => { localStorage.removeItem(storageKey); alert('Fortschritt und Fehlerliste wurden gelöscht.'); updateStats(); };
populateFilters(); updateStats();
