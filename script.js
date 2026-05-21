const STORAGE_KEY = "markupQuizProgressV2";
const $ = (id) => document.getElementById(id);
const state = { pool: [], current: 0, score: 0, answers: [], examMode: false, checked: false, reviewOnlyMistakes: false };

function loadProgress(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; } }
function saveProgress(p){ localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); }
function getProgress(qid){ const p=loadProgress(); return p[qid] || {stage:3, attempts:0, correct:0, wrong:0}; }
function setQuestionProgress(qid, ok){
  const p=loadProgress(); const cur=p[qid] || {stage:3, attempts:0, correct:0, wrong:0};
  cur.attempts += 1; cur.last = new Date().toISOString(); cur.lastCorrect = ok;
  if(ok){ cur.correct += 1; cur.stage = Math.max(1, (cur.stage || 3) - 1); }
  else { cur.wrong += 1; cur.stage = Math.min(3, (cur.stage || 3) + 1); }
  p[qid] = cur; saveProgress(p);
}
function stageLabel(stage){ return stage===1?'Stufe 1 · sicher':stage===2?'Stufe 2 · mittel':'Stufe 3 · unsicher'; }
function shuffle(arr){ return [...arr].sort(()=>Math.random()-0.5); }
function unique(arr){ return [...new Set(arr)].filter(Boolean); }
function escapeHtml(str){ return String(str ?? '').replace(/[&<>'"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c])); }
function reasonLabel(opt){ return opt.correct ? 'Warum richtig' : 'Warum falsch'; }
function reasonText(opt){
  const base = (opt.explanation || '').trim() || 'Keine zusätzliche Begründung vorhanden.';
  return `${reasonLabel(opt)}: ${base}`;
}

function init(){ normalizeQuestionExplanations(); populateFilters(); renderQuickStats(); wireEvents(); }
function normalizeQuestionExplanations(){
  QUESTIONS.forEach(q => {
    q.options.forEach((o, i) => {
      if(!o.label) o.label = String.fromCharCode(65+i);
      if(!o.explanation || !String(o.explanation).trim()){
        o.explanation = o.correct ? 'Diese Antwort gehört zur richtigen Lösung.' : 'Diese Antwort gehört nicht zur richtigen Lösung.';
      }
    });
  });
}
function wireEvents(){
  $('sourceFilter').addEventListener('change', populateModuleFilter);
  $('startBtn').addEventListener('click', startQuiz);
  $('submitBtn').addEventListener('click', submitAnswer);
  $('nextBtn').addEventListener('click', nextQuestion);
  $('backBtn').addEventListener('click', showSetup);
  $('restartBtn').addEventListener('click', showSetup);
  $('reviewBtn').addEventListener('click', () => { $('modeSelect').value='mistakes'; showSetup(); startQuiz(); });
  $('toggleReviewBtn').addEventListener('click', () => { state.reviewOnlyMistakes = !state.reviewOnlyMistakes; $('toggleReviewBtn').textContent = state.reviewOnlyMistakes ? 'Alle Fragen anzeigen' : 'Nur Fehler anzeigen'; renderReview(); });
  $('browseBtn').addEventListener('click', showBrowser);
  $('closeBrowserBtn').addEventListener('click', () => $('browserPanel').classList.add('hidden'));
  $('searchInput').addEventListener('input', renderQuestionList);
  $('resetProgressBtn').addEventListener('click', () => {
    if(confirm('Fortschritt wirklich zurücksetzen?')){ localStorage.removeItem(STORAGE_KEY); renderQuickStats(); populateModuleFilter(); }
  });
}
function populateFilters(){
  const sources=['Alle Fragen', ...unique(QUESTIONS.map(q=>q.source))];
  $('sourceFilter').innerHTML=sources.map(s=>`<option value="${encodeURIComponent(s)}">${escapeHtml(s)}</option>`).join('');
  populateModuleFilter();
}
function populateModuleFilter(){
  const selected=decodeURIComponent($('sourceFilter').value);
  const pool=selected==='Alle Fragen'?QUESTIONS:QUESTIONS.filter(q=>q.source===selected);
  const modules=['Alle Themen', ...unique(pool.map(q=>q.module))];
  $('moduleFilter').innerHTML=modules.map(m=>`<option value="${encodeURIComponent(m)}">${escapeHtml(m)}</option>`).join('');
}
function filteredBase(){
  const source=decodeURIComponent($('sourceFilter').value); const mod=decodeURIComponent($('moduleFilter').value);
  let pool=[...QUESTIONS];
  if(source!=='Alle Fragen') pool=pool.filter(q=>q.source===source);
  if(mod!=='Alle Themen') pool=pool.filter(q=>q.module===mod);
  return pool;
}
function buildPool(){
  let pool=filteredBase(); const mode=$('modeSelect').value; const p=loadProgress();
  if(mode.startsWith('stage')){ const st=Number(mode.replace('stage','')); pool=pool.filter(q=>(p[q.id]?.stage ?? 3)===st); }
  if(mode==='mistakes') pool=pool.filter(q=>(p[q.id]?.wrong ?? 0)>0 || p[q.id]?.lastCorrect===false);
  if(mode==='random' || mode==='exam' || mode.startsWith('stage') || mode==='mistakes') pool=shuffle(pool);
  const count=$('countSelect').value;
  if(count!=='all') pool=pool.slice(0, Number(count));
  return pool;
}
function startQuiz(){
  const pool=buildPool();
  if(!pool.length){ alert('Für diese Auswahl gibt es aktuell keine Fragen.'); return; }
  state.pool=pool; state.current=0; state.score=0; state.answers=[]; state.examMode=$('modeSelect').value==='exam'; state.checked=false; state.reviewOnlyMistakes=false;
  $('toggleReviewBtn').textContent='Nur Fehler anzeigen';
  $('setupPanel').classList.add('hidden'); $('browserPanel').classList.add('hidden'); $('resultPanel').classList.add('hidden'); $('quizPanel').classList.remove('hidden');
  renderQuestion();
}
function renderQuestion(){
  state.checked=false; const q=state.pool[state.current]; const prog=getProgress(q.id); const correctCount=q.options.filter(o=>o.correct).length;
  $('progressText').textContent=`Frage ${state.current+1} von ${state.pool.length}`;
  $('scoreText').textContent=`Richtig: ${state.score}`;
  $('progressBar').style.width=`${((state.current)/state.pool.length)*100}%`;
  $('questionMeta').innerHTML='';
  [q.source, q.module, stageLabel(prog.stage)].forEach((t,i)=>{ const span=document.createElement('span'); span.className='tag '+(i===2?`stage${prog.stage}`:''); span.textContent=t; $('questionMeta').appendChild(span); });
  $('questionText').textContent=q.question;
  $('questionHint').textContent=`${q.note || ''} ${correctCount>1?'Mehrfachauswahl möglich.':'Eine Antwort ist richtig.'}`;
  $('optionsBox').innerHTML='';
  q.options.forEach((opt,i)=>{
    const label=document.createElement('label'); label.className='option'; label.dataset.index=i;
    const input=document.createElement('input'); input.type='checkbox'; input.value=i;
    const wrap=document.createElement('div');
    const title=document.createElement('div'); title.className='option-title'; title.textContent=`${opt.label || String.fromCharCode(65+i)}: ${opt.text}`;
    wrap.appendChild(title); label.appendChild(input); label.appendChild(wrap);
    label.addEventListener('click',()=> setTimeout(()=>label.classList.toggle('selected', input.checked),0));
    $('optionsBox').appendChild(label);
  });
  $('feedbackBox').className='feedback hidden'; $('feedbackBox').textContent='';
  $('submitBtn').classList.remove('hidden'); $('nextBtn').classList.add('hidden'); $('submitBtn').disabled=false;
}
function selectedIndexes(){ return [...$('optionsBox').querySelectorAll('input:checked')].map(i=>Number(i.value)); }
function isCorrect(q, selected){
  const correct=q.options.map((o,i)=>o.correct?i:null).filter(i=>i!==null);
  return selected.length===correct.length && correct.every(i=>selected.includes(i));
}
function submitAnswer(){
  const q=state.pool[state.current]; const selected=selectedIndexes();
  if(!selected.length){ alert('Bitte mindestens eine Antwort auswählen.'); return; }
  const ok=isCorrect(q, selected); state.answers.push({id:q.id, ok, selected}); if(ok) state.score++;
  setQuestionProgress(q.id, ok);
  if(!state.examMode){ renderFeedback(q, selected, ok); $('submitBtn').classList.add('hidden'); $('nextBtn').classList.remove('hidden'); }
  else { nextQuestion(); }
  renderQuickStats();
}
function renderFeedback(q, selected, ok){
  const labels=[...$('optionsBox').querySelectorAll('.option')];
  labels.forEach((el,i)=>{
    const opt=q.options[i]; const expl=document.createElement('div'); expl.className='option-expl';
    expl.innerHTML=`<strong>${opt.correct?'RICHTIG':'FALSCH'} · ${reasonLabel(opt)}:</strong> ${escapeHtml(opt.explanation || 'Keine zusätzliche Begründung vorhanden.')}`;
    el.querySelector('div').appendChild(expl);
    if(opt.correct && selected.includes(i)) el.classList.add('correct');
    else if(opt.correct && !selected.includes(i)) el.classList.add('missed');
    else if(!opt.correct && selected.includes(i)) el.classList.add('wrong');
  });
  $('feedbackBox').classList.remove('hidden'); $('feedbackBox').classList.add(ok?'good':'bad');
  $('feedbackBox').textContent= ok ? 'Richtig! Unten ist trotzdem jede Antwortmöglichkeit begründet.' : 'Nicht ganz. Unten siehst du jede richtige und falsche Antwort mit Begründung.';
}
function nextQuestion(){
  if(state.current < state.pool.length-1){ state.current++; renderQuestion(); }
  else showResults();
}
function showResults(){
  $('quizPanel').classList.add('hidden'); $('resultPanel').classList.remove('hidden'); $('progressBar').style.width='100%';
  const total=state.pool.length; const wrong=state.answers.filter(a=>!a.ok).length; const percent=Math.round((state.score/total)*100);
  $('resultGrid').innerHTML=`
    <div class="result-box"><span>Score</span><strong>${state.score}/${total}</strong></div>
    <div class="result-box"><span>Quote</span><strong>${percent}%</strong></div>
    <div class="result-box"><span>Fehler</span><strong>${wrong}</strong></div>
    <div class="result-box"><span>Fragenbank</span><strong>${QUESTIONS.length}</strong></div>`;
  renderReview();
}
function renderReview(){
  const wrap=$('reviewList'); wrap.innerHTML='';
  const answersToShow = state.reviewOnlyMistakes ? state.answers.filter(a=>!a.ok) : state.answers;
  if(!answersToShow.length){
    wrap.innerHTML='<div class="review-item ok"><strong>Keine Fehler in dieser Auswahl.</strong><br><span class="hint">Alle beantworteten Fragen waren richtig.</span></div>';
    return;
  }
  answersToShow.forEach((ans)=>{
    const idx=state.answers.indexOf(ans); const q=state.pool[idx];
    const div=document.createElement('div'); div.className=`review-item ${ans.ok?'ok':'bad'}`;
    const selectedLabels = ans.selected.map(i=>q.options[i]?.label).filter(Boolean).join(', ') || 'keine Auswahl';
    const correctLabels = q.options.filter(o=>o.correct).map(o=>o.label).join(', ');
    div.innerHTML=`
      <div class="review-head">
        <div>
          <h3>${idx+1}. ${escapeHtml(q.question)}</h3>
          <div class="hint">${escapeHtml(q.source)} · ${escapeHtml(q.module)}</div>
        </div>
        <span class="badge ${ans.ok?'ok':'bad'}">${ans.ok?'RICHTIG':'FALSCH'}</span>
      </div>
      <div class="hint">Deine Auswahl: <strong>${escapeHtml(selectedLabels)}</strong> · Richtige Lösung: <strong>${escapeHtml(correctLabels)}</strong></div>
      <div class="review-options">
        ${q.options.map((opt,i)=>renderReviewOption(opt,i,ans.selected.includes(i))).join('')}
      </div>`;
    wrap.appendChild(div);
  });
}
function renderReviewOption(opt, i, selected){
  let cls='neutral';
  if(opt.correct && selected) cls='correct';
  else if(opt.correct && !selected) cls='missed';
  else if(!opt.correct && selected) cls='wrong';
  const chooseText = selected ? 'von dir ausgewählt' : 'nicht ausgewählt';
  const status = opt.correct ? '<span class="correct-line">RICHTIG</span>' : '<span class="wrong-line">FALSCH</span>';
  return `<div class="review-option ${cls}">
    <div class="review-option-title">${escapeHtml(opt.label || String.fromCharCode(65+i))}: ${escapeHtml(opt.text)}</div>
    <div class="review-option-meta">${status} · ${escapeHtml(chooseText)}</div>
    <div class="review-option-expl"><strong>${reasonLabel(opt)}:</strong> ${escapeHtml(opt.explanation || 'Keine zusätzliche Begründung vorhanden.')}</div>
  </div>`;
}
function showSetup(){ $('quizPanel').classList.add('hidden'); $('resultPanel').classList.add('hidden'); $('setupPanel').classList.remove('hidden'); renderQuickStats(); }
function renderQuickStats(){
  const p=loadProgress(); const values=QUESTIONS.map(q=>p[q.id] || {stage:3, attempts:0, correct:0, wrong:0});
  const attempted=values.filter(v=>v.attempts>0).length; const correct=values.reduce((s,v)=>s+(v.correct||0),0); const wrong=values.reduce((s,v)=>s+(v.wrong||0),0);
  const st1=QUESTIONS.filter(q=>(p[q.id]?.stage ?? 3)===1).length; const st2=QUESTIONS.filter(q=>(p[q.id]?.stage ?? 3)===2).length; const st3=QUESTIONS.filter(q=>(p[q.id]?.stage ?? 3)===3).length;
  $('quickStats').innerHTML=[`${QUESTIONS.length} Fragen`, `${attempted} geübt`, `${correct} richtig`, `${wrong} falsch`, `Stufe 1: ${st1}`, `Stufe 2: ${st2}`, `Stufe 3: ${st3}`].map(t=>`<span class="stat-pill">${escapeHtml(t)}</span>`).join('');
}
function showBrowser(){ $('browserPanel').classList.remove('hidden'); renderQuestionList(); }
function renderQuestionList(){
  const term=($('searchInput').value || '').toLowerCase().trim(); const base=filteredBase();
  const items=base.filter(q=>!term || [q.question,q.module,q.source,...q.options.map(o=>o.text)].join(' ').toLowerCase().includes(term));
  $('questionList').innerHTML='';
  items.forEach(q=>{
    const div=document.createElement('div'); div.className='question-list-item';
    const correct=q.options.filter(o=>o.correct).map(o=>`${o.label}: ${o.text}`).join(' · ');
    div.innerHTML=`<h3>${escapeHtml(q.id)} · ${escapeHtml(q.question)}</h3><div class="hint">${escapeHtml(q.source)} · ${escapeHtml(q.module)}</div><ol class="mini-options">${q.options.map(o=>`<li>${o.correct?'✓':'✗'} ${escapeHtml(o.label)}: ${escapeHtml(o.text)}</li>`).join('')}</ol><div class="hint">Richtig: ${escapeHtml(correct)}</div>`;
    $('questionList').appendChild(div);
  });
}

document.addEventListener('DOMContentLoaded', init);
