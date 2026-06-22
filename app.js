const sourceFilter = document.getElementById('sourceFilter');
const topicFilter = document.getElementById('topicFilter');
const countInput = document.getElementById('countInput');
const quiz = document.getElementById('quiz');
const summary = document.getElementById('summary');

function unique(arr){ return [...new Set(arr)].sort(); }
function populateFilters(){
  unique(QUESTION_BANK.map(q=>q.source)).forEach(s=>sourceFilter.add(new Option(s,s)));
  unique(QUESTION_BANK.map(q=>q.topic)).forEach(t=>topicFilter.add(new Option(t,t)));
}
function filtered(){
  return QUESTION_BANK.filter(q =>
    (sourceFilter.value==='all' || q.source===sourceFilter.value) &&
    (topicFilter.value==='all' || q.topic===topicFilter.value)
  );
}
function shuffle(arr){ return [...arr].sort(()=>Math.random()-0.5); }
function renderQuestion(q, idx){
  const div = document.createElement('article');
  div.className = 'card';
  div.innerHTML = `<div class="meta"><span class="pill">${q.id}</span><span class="pill">${q.source}</span><span class="pill">${q.topic}</span><span class="pill">${q.type}</span></div><div class="question">${idx+1}. ${escapeHtml(q.question)}</div>`;
  if(q.type==='multiple_choice'){
    q.options.forEach(o=>{
      const line=document.createElement('div');
      line.className='option'+(o.correct?' correct':'');
      line.textContent=`${o.correct?'✓':'□'} ${o.id}. ${o.text}`;
      div.appendChild(line);
    });
  } else if(q.type==='true_false'){
    q.options.forEach(o=>{
      const line=document.createElement('div');
      line.className='option'+(o.correct?' correct':'');
      line.textContent=`${o.correct?'✓':'□'} ${o.text}`;
      div.appendChild(line);
    });
  } else if(q.type==='matching'){
    q.options.forEach(p=>{
      const line=document.createElement('div');
      line.className='match';
      line.textContent=`${p.left} → ${p.right}`;
      div.appendChild(line);
    });
  } else if(q.type==='ordering'){
    q.options.forEach(p=>{
      const line=document.createElement('div');
      line.className='match';
      line.textContent=`${p.position}. ${p.text}`;
      div.appendChild(line);
    });
  } else if(q.type==='fill_blank'){
    q.options.forEach(p=>{
      const line=document.createElement('div');
      line.className='match';
      line.textContent=`Lücke ${p.blank}: ${p.answer}`;
      div.appendChild(line);
    });
  }
  if(q.explanation){
    const exp=document.createElement('div');
    exp.className='explanation';
    exp.textContent=q.explanation;
    div.appendChild(exp);
  }
  return div;
}
function escapeHtml(str){
  return String(str).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}
function render(list){
  quiz.innerHTML='';
  summary.textContent=`${list.length} Frage(n) angezeigt.`;
  list.forEach((q,i)=>quiz.appendChild(renderQuestion(q,i)));
}
document.getElementById('startBtn').addEventListener('click',()=>{
  const list=shuffle(filtered()).slice(0, Number(countInput.value)||20);
  render(list);
});
document.getElementById('showAllBtn').addEventListener('click',()=>render(filtered()));
populateFilters();
render(shuffle(QUESTION_BANK).slice(0,20));
