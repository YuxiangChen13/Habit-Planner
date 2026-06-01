const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAYS_SHORT = ['S','M','T','W','T','F','S'];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getWeekKeys() {
  const keys = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    keys.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
  }
  return keys;
}

function getWeekDayIndices() {
  const now = new Date();
  const indices = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    indices.push(d.getDay());
  }
  return indices;
}

function loadData() {
  try { return JSON.parse(localStorage.getItem('habitplanner_v1') || '{"habits":[]}'); }
  catch(e) { return { habits: [] }; }
}

function saveData(data) {
  localStorage.setItem('habitplanner_v1', JSON.stringify(data));
}

function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function computeStreak(habit) {
  const today = todayKey();
  let streak = 0;
  let d = new Date();
  if (!habit.done[today]) d.setDate(d.getDate() - 1);
  while (true) {
    const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (habit.done[k]) { streak++; d.setDate(d.getDate()-1); }
    else break;
    if (streak > 365) break;
  }
  return streak;
}

function render() {
  const data = loadData();
  const today = todayKey();
  const weekKeys = getWeekKeys();
  const weekDayIdx = getWeekDayIndices();
  const list = document.getElementById('habit-list');
  const listLabel = document.getElementById('list-label');

  const now = new Date();
  document.getElementById('today-label').textContent =
    `${DAYS[now.getDay()]}, ${now.toLocaleString('default',{month:'short'})} ${now.getDate()}`;

  const total = data.habits.length;
  const doneToday = data.habits.filter(h => h.done[today]).length;
  const bestStreak = data.habits.reduce((m, h) => Math.max(m, computeStreak(h)), 0);
  let weekDone = 0, weekTotal = 0;
  data.habits.forEach(h => {
    weekKeys.forEach(k => {
      weekTotal++;
      if (h.done[k]) weekDone++;
    });
  });
  const weekPct = weekTotal === 0 ? 0 : Math.round(weekDone / weekTotal * 100);

  document.getElementById('stat-today').textContent = `${doneToday}/${total}`;
  document.getElementById('stat-streak').textContent = bestStreak;
  document.getElementById('stat-week').textContent = `${weekPct}%`;

  listLabel.textContent = total > 0 ? `${total} habit${total !== 1 ? 's' : ''}` : '';

  list.innerHTML = '';

  if (total === 0) {
    list.innerHTML = `<div class="empty-state">
      <div class="big">✦</div>
      <p>No habits yet.<br>Add one above to get started.</p>
    </div>`;
    return;
  }

  data.habits.forEach((habit, idx) => {
    const isDoneToday = !!habit.done[today];
    const streak = computeStreak(habit);

    const card = document.createElement('div');
    card.className = 'habit-card';

    const dotsHTML = weekKeys.map((k, i) => {
      const isToday = k === today;
      const done = !!habit.done[k];
      let cls = 'empty';
      if (isToday && done) cls = 'today-done';
      else if (isToday) cls = 'today-empty';
      else if (done) cls = 'done';
      return `<div class="day-col">
        <div class="day-dot ${cls}"></div>
        <div class="day-label">${DAYS_SHORT[weekDayIdx[i]]}</div>
      </div>`;
    }).join('');

    card.innerHTML = `
      <div class="habit-top">
        <button class="check-btn ${isDoneToday ? 'done' : ''}" data-idx="${idx}" aria-label="Toggle ${habit.name}">
          ${isDoneToday ? '✓' : ''}
        </button>
        <span class="habit-name">${escapeHtml(habit.name)}</span>
        <span class="habit-streak ${streak >= 3 ? 'hot' : ''}">
          ${streak >= 3 ? '🔥' : '○'} ${streak}d
        </span>
        <button class="delete-btn" data-del="${idx}" aria-label="Delete ${habit.name}">✕</button>
      </div>
      <div class="week-row">${dotsHTML}</div>
    `;

    list.appendChild(card);
  });
}

document.getElementById('habit-list').addEventListener('click', e => {
  const checkBtn = e.target.closest('.check-btn');
  const delBtn   = e.target.closest('.delete-btn');
  if (checkBtn) {
    const i = parseInt(checkBtn.dataset.idx);
    const data2 = loadData();
    const today = todayKey();
    const h = data2.habits[i];
    if (h.done[today]) delete h.done[today];
    else h.done[today] = true;
    saveData(data2);
    render();
  } else if (delBtn) {
    const i = parseInt(delBtn.dataset.del);
    const data2 = loadData();
    data2.habits.splice(i, 1);
    saveData(data2);
    render();
  }
});

function addHabit() {
  const input = document.getElementById('habit-input');
  const name = input.value.trim();
  if (!name) return;
  const data = loadData();
  data.habits.push({ name, done: {} });
  saveData(data);
  input.value = '';
  render();
}

document.getElementById('btn-add').addEventListener('click', addHabit);
document.getElementById('habit-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') addHabit();
});

render();
