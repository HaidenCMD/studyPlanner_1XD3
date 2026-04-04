const state = {
  courses:           [],
  assignments:       [],
  editingId:         null,
  editingCourseId:   null,
  activeChecklistId: null,
};

async function api(url, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  return res.json();
}

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');

  if (name === 'dashboard') renderDashboard();
  if (name === 'courses')   renderCourses();
  if (name === 'form')      populateFormCourses();
  if (name === 'checklist') populateChecklistSelect();
}

function renderDashboard() {
  const cfEl = document.getElementById('filter-course');
  const prev = cfEl.value;
  cfEl.innerHTML = '<option value="">All Courses</option>';
  state.courses.forEach(c => {
    const o = document.createElement('option');
    o.value = c.code;
    o.textContent = c.code;
    if (o.value === prev) o.selected = true;
    cfEl.appendChild(o);
  });

  const today    = new Date();
  today.setHours(0, 0, 0, 0);
  const threeDays = new Date(today);
  threeDays.setDate(today.getDate() + 3);

  let dueSoon = 0, overdue = 0, completed = 0;
  state.assignments.forEach(a => {
    const d = new Date(a.dueDate + 'T00:00:00');
    if (a.status === 'Completed') {
      completed++;
    } else if (a.status === 'Overdue' || d < today) {
      overdue++;
    } else if (d <= threeDays) {
      dueSoon++;
    }
  });
  document.getElementById('stat-due-soon').textContent  = dueSoon;
  document.getElementById('stat-overdue').textContent   = overdue;
  document.getElementById('stat-completed').textContent = completed;

  const courseFilter = document.getElementById('filter-course').value;
  const statusFilter = document.getElementById('filter-status').value;
  const sortFilter   = document.getElementById('filter-sort').value;
  const search       = document.getElementById('filter-search').value.toLowerCase();

  let list = [...state.assignments];
  if (courseFilter) list = list.filter(a => a.course === courseFilter);
  if (statusFilter) list = list.filter(a => a.status === statusFilter);
  if (search)       list = list.filter(a =>
    a.title.toLowerCase().includes(search) ||
    a.course.toLowerCase().includes(search)
  );

  if (sortFilter === 'due')      list.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
  if (sortFilter === 'title')    list.sort((a, b) => a.title.localeCompare(b.title));
  if (sortFilter === 'progress') list.sort((a, b) => b.progress - a.progress);

  const grid = document.getElementById('assignments-grid');
  if (!list.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="emoji">${state.assignments.length === 0 ? '📚' : '🔍'}</div>
        <p>${state.assignments.length === 0
          ? 'No assignments yet. Click <strong>＋ New Assignment</strong> to get started.'
          : 'No assignments match your filters.'}</p>
      </div>`;
    return;
  }
  grid.innerHTML = list.map((a, i) => assignmentCardHTML(a, i * 0.05)).join('');
}

function assignmentCardHTML(a, delay) {
  const done = a.progress >= 100;
  const statusMap = {
    'To Do':       ['status-todo',     '⭕'],
    'In Progress': ['status-progress', '🔄'],
    'Completed':   ['status-done',     '✅'],
    'Overdue':     ['status-overdue',  '⚠️'],
  };
  const [sCls, sIcon] = statusMap[a.status] || ['status-todo', '⭕'];

  return `
    <div class="assignment-card" style="animation-delay:${delay}s" onclick="openChecklist(${a.id})">
      <div class="card-top">
        <span class="card-course-badge">${a.course}</span>
        <span class="status-badge ${sCls}">${sIcon} ${a.status}</span>
      </div>
      <div class="card-title">${a.title}</div>
      <div class="card-meta">
        ${a.dueDate ? `<span class="card-meta-item">📅 ${formatDate(a.dueDate)}</span>` : ''}
        ${a.description ? `<span class="card-meta-item" style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">📄 ${a.description}</span>` : ''}
      </div>
      <div class="progress-wrap">
        <div class="progress-top">
          <span>Progress</span><span>${a.progress}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${done ? 'done' : ''}" style="width:${a.progress}%"></div>
        </div>
      </div>
      <div class="card-actions" onclick="event.stopPropagation()">
        <button class="btn btn-ghost btn-sm" onclick="editAssignment(${a.id})">✏️ Edit</button>
        <button class="btn btn-ghost btn-sm" onclick="openChecklist(${a.id})">📋 Checklist</button>
        <button class="btn btn-danger btn-sm ml-auto" onclick="deleteAssignment(${a.id})">🗑</button>
      </div>
    </div>`;
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderCourses() {
  const grid  = document.getElementById('courses-grid');
  const cards = state.courses.map((c, i) => `
    <div class="course-card ${c.color}" style="animation-delay:${i * 0.06}s">
      <div class="course-code">${c.code}</div>
      <div class="course-name">${c.name}</div>
      <div class="course-term">📆 ${c.term}</div>
      <div class="course-actions">
        <button class="btn btn-ghost btn-sm" onclick="editCourse(${c.id})">✏️ Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteCourse(${c.id})">🗑 Delete</button>
      </div>
    </div>`).join('');

  const addCard = `
    <div class="add-course-card" onclick="openAddCourseModal()">
      <span class="plus">＋</span>
      <span>Add New Course</span>
    </div>`;

  grid.innerHTML = cards + addCard;
}

function openAddCourseModal() {
  state.editingCourseId = null;
  document.getElementById('course-modal-title').textContent = '➕ Add Course';
  document.getElementById('m-code').value  = '';
  document.getElementById('m-name').value  = '';
  document.getElementById('m-term').value  = '';
  document.getElementById('m-color').value = 'tag-blue';
  document.getElementById('course-modal').classList.add('open');
}

function editCourse(id) {
  const c = state.courses.find(x => x.id === id);
  if (!c) return;
  state.editingCourseId = id;
  document.getElementById('course-modal-title').textContent = '✏️ Edit Course';
  document.getElementById('m-code').value  = c.code;
  document.getElementById('m-name').value  = c.name;
  document.getElementById('m-term').value  = c.term;
  document.getElementById('m-color').value = c.color;
  document.getElementById('course-modal').classList.add('open');
}

async function saveCourse() {
  const code  = document.getElementById('m-code').value.trim();
  const name  = document.getElementById('m-name').value.trim();
  const term  = document.getElementById('m-term').value.trim();
  const color = document.getElementById('m-color').value;

  if (!code || !name) {
    alert('Please enter a course code and name.');
    return;
  }

  if (state.editingCourseId !== null) {
    await api('api/courses.php', 'PUT', { id: state.editingCourseId, code, name, term, color });
    const c = state.courses.find(x => x.id === state.editingCourseId);
    Object.assign(c, { code, name, term, color });
  } else {
    const res = await api('api/courses.php', 'POST', { code, name, term, color });
    state.courses.push({ id: res.id, code, name, term, color });
  }

  closeModal('course-modal');
  renderCourses();
}

async function deleteCourse(id) {
  if (!confirm('Delete this course? Any assignments linked to it will also be deleted.')) return;
  await api('api/courses.php?id=' + id, 'DELETE');
  state.courses     = state.courses.filter(x => x.id !== id);
  state.assignments = state.assignments.filter(a => {
    const c = state.courses.find(x => x.code === a.course);
    return !!c;
  });
  renderCourses();
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function populateFormCourses() {
  const sel = document.getElementById('f-course');
  const cur = sel.value;
  sel.innerHTML = '<option value="">Select course…</option>';
  state.courses.forEach(c => {
    const o = document.createElement('option');
    o.value = c.code;
    o.textContent = c.code + ' — ' + c.name;
    if (o.value === cur) o.selected = true;
    sel.appendChild(o);
  });
}

function editAssignment(id) {
  const a = state.assignments.find(x => x.id === id);
  if (!a) return;
  state.editingId = id;
  document.getElementById('form-page-title').textContent   = 'Edit Assignment';
  document.getElementById('form-card-heading').textContent = 'Edit Assignment';
  showPage('form');
  setTimeout(() => {
    document.getElementById('f-title').value       = a.title;
    document.getElementById('f-course').value      = a.course;
    document.getElementById('f-due-date').value    = a.dueDate || '';
    document.getElementById('f-status').value      = a.status;
    document.getElementById('f-description').value = a.description || '';
  }, 50);
}

async function saveAssignment() {
  const title  = document.getElementById('f-title').value.trim();
  const course = document.getElementById('f-course').value;
  const dueDate  = document.getElementById('f-due-date').value;
  const status   = document.getElementById('f-status').value;
  const desc     = document.getElementById('f-description').value.trim();

  if (!title || !course) {
    alert('Please enter a title and select a course.');
    return;
  }

  if (state.editingId) {
    await api('api/assignments.php', 'PUT', { id: state.editingId, title, course, dueDate, status, description: desc });
    const idx = state.assignments.findIndex(x => x.id === state.editingId);
    state.assignments[idx] = { ...state.assignments[idx], title, course, dueDate, status, description: desc };
    state.editingId = null;
  } else {
    const res = await api('api/assignments.php', 'POST', { title, course, dueDate, status, description: desc });
    state.assignments.push({ id: res.id, title, course, dueDate, status, description: desc, progress: 0, checklist: [] });
  }

  document.getElementById('form-page-title').textContent   = 'Add Assignment';
  document.getElementById('form-card-heading').textContent = 'New Assignment';
  clearForm();
  showPage('dashboard');
}

function clearForm() {
  document.getElementById('f-title').value       = '';
  document.getElementById('f-due-date').value    = '';
  document.getElementById('f-description').value = '';
  document.getElementById('f-status').value      = 'To Do';
}

async function deleteAssignment(id) {
  if (!confirm('Delete this assignment?')) return;
  await api('api/assignments.php?id=' + id, 'DELETE');
  state.assignments = state.assignments.filter(x => x.id !== id);
  renderDashboard();
}

function populateChecklistSelect() {
  const sel = document.getElementById('checklist-select');
  sel.innerHTML = '<option value="">Select an assignment…</option>';
  state.assignments.forEach(a => {
    const o = document.createElement('option');
    o.value = a.id;
    o.textContent = a.title + ' (' + a.course + ')';
    sel.appendChild(o);
  });
  if (state.activeChecklistId) {
    sel.value = state.activeChecklistId;
    loadChecklist();
  }
}

function openChecklist(id) {
  state.activeChecklistId = id;
  showPage('checklist');
}

function loadChecklist() {
  const id      = parseInt(document.getElementById('checklist-select').value);
  const a       = state.assignments.find(x => x.id === id);
  const content = document.getElementById('checklist-content');
  const empty   = document.getElementById('checklist-empty');

  if (!a) {
    content.style.display = 'none';
    empty.style.display   = 'block';
    return;
  }

  content.style.display   = 'grid';
  empty.style.display     = 'none';
  state.activeChecklistId = id;

  document.getElementById('cl-title').textContent    = a.title;
  document.getElementById('cl-course').textContent   = a.course;
  document.getElementById('cl-due').textContent      = a.dueDate ? 'Due ' + formatDate(a.dueDate) : '';
  document.getElementById('cl-status-select').value  = a.status;
  document.getElementById('cl-pct-input').value      = a.progress;

  updateChecklistUI(a);
}

function updateChecklistUI(a) {
  const cl   = a.checklist || [];
  const done = cl.filter(x => x.done).length;
  const pct  = cl.length ? Math.round((done / cl.length) * 100) : a.progress;

  document.getElementById('cl-pct').textContent           = pct + '%';
  document.getElementById('cl-bar').style.width           = pct + '%';
  document.getElementById('cl-progress-text').textContent = pct + '% complete';

  const statusMap = {
    'To Do':       ['status-todo',     '⭕ To Do'],
    'In Progress': ['status-progress', '🔄 In Progress'],
    'Completed':   ['status-done',     '✅ Completed'],
    'Overdue':     ['status-overdue',  '⚠️ Overdue'],
  };
  const [cls, label] = statusMap[a.status] || statusMap['To Do'];
  const badge = document.getElementById('cl-status-badge');
  badge.className   = 'status-badge ' + cls;
  badge.textContent = label;

  const itemsEl = document.getElementById('checklist-items');
  if (!cl.length) {
    itemsEl.innerHTML = `<div style="color:var(--txt2);font-size:13px;padding:12px 0;">No items yet — add your first step below.</div>`;
    return;
  }

  itemsEl.innerHTML = cl.map(item => `
    <div class="checklist-item ${item.done ? 'done' : ''}">
      <div class="check-box" onclick="toggleItem(${a.id}, ${item.id})">
        <span class="check-tick">✓</span>
      </div>
      <span class="item-text">${item.text}</span>
      <button class="btn btn-danger btn-sm" onclick="deleteItem(${a.id}, ${item.id})" style="padding:3px 8px;">✕</button>
    </div>`).join('');
}

async function toggleItem(aId, itemId) {
  const a    = state.assignments.find(x => x.id === aId);
  const item = a.checklist.find(x => x.id === itemId);
  item.done  = !item.done;

  const done = a.checklist.filter(x => x.done).length;
  a.progress = a.checklist.length ? Math.round((done / a.checklist.length) * 100) : a.progress;
  if (a.progress === 100) a.status = 'Completed';
  else if (a.progress > 0 && a.status === 'To Do') a.status = 'In Progress';

  document.getElementById('cl-status-select').value = a.status;
  document.getElementById('cl-pct-input').value      = a.progress;
  updateChecklistUI(a);

  await Promise.all([
    api('api/checklist.php', 'PUT', { id: itemId, done: item.done }),
    api('api/assignments.php', 'PUT', { id: aId, status: a.status, progress: a.progress }),
  ]);
}

async function addChecklistItem() {
  const input = document.getElementById('new-item-input');
  const text  = input.value.trim();
  if (!text) return;
  const id = parseInt(document.getElementById('checklist-select').value);
  const a  = state.assignments.find(x => x.id === id);
  if (!a) return;

  const res = await api('api/checklist.php', 'POST', { assignment_id: a.id, text });
  a.checklist.push({ id: res.id, text, done: false });
  input.value = '';
  updateChecklistUI(a);
}

async function deleteItem(aId, itemId) {
  const a    = state.assignments.find(x => x.id === aId);
  a.checklist = a.checklist.filter(x => x.id !== itemId);

  const done = a.checklist.filter(x => x.done).length;
  a.progress = a.checklist.length ? Math.round((done / a.checklist.length) * 100) : a.progress;
  updateChecklistUI(a);

  await api('api/checklist.php?id=' + itemId, 'DELETE');
}

function updateAssignmentStatus() {
  const id = parseInt(document.getElementById('checklist-select').value);
  const a  = state.assignments.find(x => x.id === id);
  if (!a) return;
  a.status = document.getElementById('cl-status-select').value;
  updateChecklistUI(a);
}

function overrideProgress() {
  const id  = parseInt(document.getElementById('checklist-select').value);
  const a   = state.assignments.find(x => x.id === id);
  if (!a) return;
  const pct = Math.max(0, Math.min(100, parseInt(document.getElementById('cl-pct-input').value) || 0));
  a.progress = pct;
  document.getElementById('cl-pct').textContent           = pct + '%';
  document.getElementById('cl-bar').style.width           = pct + '%';
  document.getElementById('cl-progress-text').textContent = pct + '% complete';
}

async function saveProgressUpdate() {
  const id = parseInt(document.getElementById('checklist-select').value);
  const a  = state.assignments.find(x => x.id === id);
  if (!a) return;
  a.status   = document.getElementById('cl-status-select').value;
  a.progress = Math.max(0, Math.min(100, parseInt(document.getElementById('cl-pct-input').value) || 0));
  await api('api/assignments.php', 'PUT', { id: a.id, status: a.status, progress: a.progress });
  updateChecklistUI(a);
  alert('✅ Progress saved!');
}

async function initApp() {
  const [courses, assignments] = await Promise.all([
    api('api/courses.php'),
    api('api/assignments.php'),
  ]);
  state.courses     = courses;
  state.assignments = assignments;
  renderDashboard();
}

initApp();
