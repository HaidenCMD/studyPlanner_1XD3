// app.js - main javascript file for the student planner app
// Group: Dev101, McMaster CS Society
// handles all the frontend stuff - rendering pages, talking to the API, updating the UI

var state = {
    courses: [],
    assignments: [],
    editingId: null,
    editingCourseId: null,
    activeChecklistId: null
};

// helper function to make API calls, method defaults to GET if not specified
function api(url, method, body) {
    method = method || 'GET';
    var opts = { method: method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    return fetch(url, opts).then(function(res) { return res.json(); });
}

// hides all pages and shows the one we want, also updates which tab looks active
function showPage(name) {
    document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
    document.querySelectorAll('.nav-tab').forEach(function(t) { t.classList.remove('active'); });
    document.getElementById('page-' + name).classList.add('active');
    document.getElementById('tab-' + name).classList.add('active');

    // close the mobile nav if its open
    var navTabs = document.getElementById('nav-tabs-wrap');
    if (navTabs) navTabs.classList.remove('open');

    if (name === 'dashboard') renderDashboard();
    if (name === 'courses')   renderCourses();
    if (name === 'form')      populateFormCourses();
    if (name === 'checklist') populateChecklistSelect();
}

// re-renders the dashboard cards and updates the stat counters at the top
// also handles filtering/sorting based on whatever the user picked
function renderDashboard() {
    var cfEl = document.getElementById('filter-course');
    var prev = cfEl.value;
    cfEl.innerHTML = '<option value="">All Courses</option>';
    state.courses.forEach(function(c) {
        var o = document.createElement('option');
        o.value = c.code;
        o.textContent = c.code;
        if (o.value === prev) o.selected = true;
        cfEl.appendChild(o);
    });

    // figure out which assignments are due soon (within 3 days), overdue, or done
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var soon = new Date(today);
    soon.setDate(today.getDate() + 3);

    var dueSoon = 0, overdue = 0, completed = 0;
    state.assignments.forEach(function(a) {
        var d = new Date(a.dueDate + 'T00:00:00');
        if (a.status === 'Completed') {
            completed++;
        } else if (a.status === 'Overdue' || d < today) {
            overdue++;
        } else if (d <= soon) {
            dueSoon++;
        }
    });
    document.getElementById('stat-due-soon').textContent  = dueSoon;
    document.getElementById('stat-overdue').textContent   = overdue;
    document.getElementById('stat-completed').textContent = completed;

    // apply filters
    var courseFilter = document.getElementById('filter-course').value;
    var statusFilter = document.getElementById('filter-status').value;
    var sortFilter   = document.getElementById('filter-sort').value;
    var search       = document.getElementById('filter-search').value.toLowerCase();

    var list = state.assignments.slice();
    if (courseFilter) list = list.filter(function(a) { return a.course === courseFilter; });
    if (statusFilter) list = list.filter(function(a) { return a.status === statusFilter; });
    if (search) list = list.filter(function(a) {
        return a.title.toLowerCase().indexOf(search) !== -1 || a.course.toLowerCase().indexOf(search) !== -1;
    });

    if (sortFilter === 'due')   list.sort(function(a, b) { return (a.dueDate || '').localeCompare(b.dueDate || ''); });
    if (sortFilter === 'title') list.sort(function(a, b) { return a.title.localeCompare(b.title); });

    var grid = document.getElementById('assignments-grid');
    if (!list.length) {
        grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><p>' +
            (state.assignments.length === 0
                ? 'No assignments yet. Click <strong>New Assignment</strong> to get started.'
                : 'No assignments match your filters.') +
            '</p></div>';
        return;
    }
    grid.innerHTML = list.map(function(a) { return assignmentCardHTML(a); }).join('');
}

// builds the HTML for a single assignment card
function assignmentCardHTML(a) {
    var statusMap = {
        'To Do':       'status-todo',
        'In Progress': 'status-progress',
        'Completed':   'status-done',
        'Overdue':     'status-overdue'
    };
    var sCls = statusMap[a.status] || 'status-todo';

    return '<div class="assignment-card" onclick="openChecklist(' + a.id + ')">' +
        '<div class="card-top">' +
            '<span class="card-course-badge">' + a.course + '</span>' +
            '<span class="status-badge ' + sCls + '">' + a.status + '</span>' +
        '</div>' +
        '<div class="card-title">' + a.title + '</div>' +
        '<div class="card-meta">' +
            (a.dueDate ? 'Due: ' + formatDate(a.dueDate) : 'No due date') +
        '</div>' +
        '<div class="card-actions" onclick="event.stopPropagation()">' +
            '<button class="btn btn-ghost btn-sm" onclick="editAssignment(' + a.id + ')">Edit</button>' +
            '<button class="btn btn-ghost btn-sm" onclick="openChecklist(' + a.id + ')">Checklist</button>' +
            '<button class="btn btn-danger btn-sm ml-auto" onclick="deleteAssignment(' + a.id + ')">Delete</button>' +
        '</div>' +
    '</div>';
}

// formats a date string like "2025-04-01" into something readable
function formatDate(d) {
    if (!d) return '--';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
}

// renders all the course cards on the courses page
function renderCourses() {
    var grid = document.getElementById('courses-grid');
    var cards = state.courses.map(function(c) {
        return '<div class="course-card ' + c.color + '">' +
            '<div class="course-code">' + c.code + '</div>' +
            '<div class="course-name">' + c.name + '</div>' +
            '<div class="course-term">' + (c.term || '') + '</div>' +
            '<div class="course-actions">' +
                '<button class="btn btn-ghost btn-sm" onclick="editCourse(' + c.id + ')">Edit</button>' +
                '<button class="btn btn-danger btn-sm" onclick="deleteCourse(' + c.id + ')">Delete</button>' +
            '</div>' +
        '</div>';
    }).join('');

    // add the dashed "add course" card at the end
    var addCard = '<div class="add-course-card" onclick="openAddCourseModal()">' +
        '<span class="plus">+</span><span>Add New Course</span></div>';

    grid.innerHTML = cards + addCard;
}

// opens the course modal with blank fields for adding a new course
function openAddCourseModal() {
    state.editingCourseId = null;
    document.getElementById('course-modal-title').textContent = 'Add Course';
    document.getElementById('m-code').value  = '';
    document.getElementById('m-name').value  = '';
    document.getElementById('m-term').value  = '';
    document.getElementById('m-color').value = 'tag-blue';
    document.getElementById('course-modal').classList.add('open');
}

// opens the course modal pre-filled so the user can edit an existing course
function editCourse(id) {
    var c = state.courses.find(function(x) { return x.id === id; });
    if (!c) return;
    state.editingCourseId = id;
    document.getElementById('course-modal-title').textContent = 'Edit Course';
    document.getElementById('m-code').value  = c.code;
    document.getElementById('m-name').value  = c.name;
    document.getElementById('m-term').value  = c.term;
    document.getElementById('m-color').value = c.color;
    document.getElementById('course-modal').classList.add('open');
}

// saves a course - handles both adding new and editing existing
function saveCourse() {
    var code  = document.getElementById('m-code').value.trim();
    var name  = document.getElementById('m-name').value.trim();
    var term  = document.getElementById('m-term').value.trim();
    var color = document.getElementById('m-color').value;

    if (!code || !name) {
        alert('Please fill in the course code and name.');
        return;
    }

    if (state.editingCourseId !== null) {
        api('api/courses.php', 'PUT', { id: state.editingCourseId, code: code, name: name, term: term, color: color }).then(function() {
            var c = state.courses.find(function(x) { return x.id === state.editingCourseId; });
            c.code = code; c.name = name; c.term = term; c.color = color;
            closeModal('course-modal');
            renderCourses();
        });
    } else {
        api('api/courses.php', 'POST', { code: code, name: name, term: term, color: color }).then(function(res) {
            state.courses.push({ id: res.id, code: code, name: name, term: term, color: color });
            closeModal('course-modal');
            renderCourses();
        });
    }
}

// deletes a course and removes its assignments from local state too
function deleteCourse(id) {
    if (!confirm('Delete this course? All its assignments will also be deleted.')) return;
    api('api/courses.php?id=' + id, 'DELETE').then(function() {
        state.courses = state.courses.filter(function(x) { return x.id !== id; });
        state.assignments = state.assignments.filter(function(a) {
            return state.courses.some(function(c) { return c.code === a.course; });
        });
        renderCourses();
    });
}

// fills the course dropdown on the assignment form
function populateFormCourses() {
    var sel = document.getElementById('f-course');
    var prev = sel.value;
    sel.innerHTML = '<option value="">Select course...</option>';
    state.courses.forEach(function(c) {
        var o = document.createElement('option');
        o.value = c.code;
        o.textContent = c.code + ' - ' + c.name;
        sel.appendChild(o);
    });
    if (prev) sel.value = prev;
}

// loads an assignment's data into the form so the user can edit it
function editAssignment(id) {
    var a = state.assignments.find(function(x) { return x.id === id; });
    if (!a) return;
    state.editingId = id;
    document.getElementById('form-page-title').textContent   = 'Edit Assignment';
    document.getElementById('form-card-heading').textContent = 'Edit Assignment';
    showPage('form');
    // small timeout so the form is visible before we try to fill it
    setTimeout(function() {
        document.getElementById('f-title').value       = a.title;
        document.getElementById('f-course').value      = a.course;
        document.getElementById('f-due-date').value    = a.dueDate || '';
        document.getElementById('f-description').value = a.description || '';
    }, 50);
}

// saves a new assignment or updates an existing one
function saveAssignment() {
    var title   = document.getElementById('f-title').value.trim();
    var course  = document.getElementById('f-course').value;
    var dueDate = document.getElementById('f-due-date').value;
    var desc    = document.getElementById('f-description').value.trim();

    if (!title || !course) {
        alert('Please enter a title and select a course.');
        return;
    }

    if (state.editingId) {
        api('api/assignments.php', 'PUT', { id: state.editingId, title: title, course: course, dueDate: dueDate, status: 'To Do', description: desc }).then(function() {
            var idx = state.assignments.findIndex(function(x) { return x.id === state.editingId; });
            var old = state.assignments[idx];
            state.assignments[idx] = Object.assign({}, old, { title: title, course: course, dueDate: dueDate, description: desc });
            state.editingId = null;
            document.getElementById('form-page-title').textContent   = 'Add Assignment';
            document.getElementById('form-card-heading').textContent = 'New Assignment';
            clearForm();
            showPage('dashboard');
        });
    } else {
        api('api/assignments.php', 'POST', { title: title, course: course, dueDate: dueDate, status: 'To Do', description: desc }).then(function(res) {
            state.assignments.push({ id: res.id, title: title, course: course, dueDate: dueDate, status: 'To Do', description: desc, progress: 0, checklist: [] });
            clearForm();
            showPage('dashboard');
        });
    }
}

// clears the assignment form fields
function clearForm() {
    document.getElementById('f-title').value       = '';
    document.getElementById('f-due-date').value    = '';
    document.getElementById('f-description').value = '';
    if (document.getElementById('f-course')) document.getElementById('f-course').selectedIndex = 0;
}

// deletes an assignment after the user confirms
function deleteAssignment(id) {
    if (!confirm('Delete this assignment?')) return;
    api('api/assignments.php?id=' + id, 'DELETE').then(function() {
        state.assignments = state.assignments.filter(function(x) { return x.id !== id; });
        renderDashboard();
    });
}

// populates the assignment dropdown on the checklist page
function populateChecklistSelect() {
    var sel = document.getElementById('checklist-select');
    sel.innerHTML = '<option value="">Select an assignment...</option>';
    state.assignments.forEach(function(a) {
        var o = document.createElement('option');
        o.value = a.id;
        o.textContent = a.title + ' (' + a.course + ')';
        sel.appendChild(o);
    });
    // if we came here by clicking "Checklist" on a card, auto-select that assignment
    if (state.activeChecklistId) {
        sel.value = state.activeChecklistId;
        loadChecklist();
    }
}

// navigates to the checklist page for a specific assignment
function openChecklist(id) {
    state.activeChecklistId = id;
    showPage('checklist');
}

// loads the checklist for whichever assignment is selected in the dropdown
function loadChecklist() {
    var id  = parseInt(document.getElementById('checklist-select').value);
    var a   = state.assignments.find(function(x) { return x.id === id; });
    var content = document.getElementById('checklist-content');
    var empty   = document.getElementById('checklist-empty');

    if (!a) {
        content.style.display = 'none';
        empty.style.display   = 'block';
        return;
    }

    content.style.display   = 'grid';
    empty.style.display     = 'none';
    state.activeChecklistId = id;

    document.getElementById('cl-title').textContent   = a.title;
    document.getElementById('cl-course').textContent  = a.course;
    document.getElementById('cl-due').textContent     = a.dueDate ? 'Due: ' + formatDate(a.dueDate) : '';
    document.getElementById('cl-status-select').value = a.status;

    renderChecklistItems(a);
}

// renders the list of checklist items and updates the status badge
function renderChecklistItems(a) {
    var cl = a.checklist || [];

    var statusMap = {
        'To Do':       ['status-todo', 'To Do'],
        'In Progress': ['status-progress', 'In Progress'],
        'Completed':   ['status-done', 'Completed'],
        'Overdue':     ['status-overdue', 'Overdue']
    };
    var pair  = statusMap[a.status] || statusMap['To Do'];
    var badge = document.getElementById('cl-status-badge');
    badge.className   = 'status-badge ' + pair[0];
    badge.textContent = pair[1];

    var itemsEl = document.getElementById('checklist-items');
    if (!cl.length) {
        itemsEl.innerHTML = '<p style="color:#888;font-size:14px;padding:8px 0;">No items yet. Add one below.</p>';
        return;
    }

    itemsEl.innerHTML = cl.map(function(item) {
        return '<div class="checklist-item ' + (item.done ? 'done' : '') + '">' +
            '<div class="check-box" onclick="toggleItem(' + a.id + ',' + item.id + ')">' +
                '<span class="check-tick">&#10003;</span>' +
            '</div>' +
            '<span class="item-text">' + item.text + '</span>' +
            '<button class="btn btn-danger btn-sm" onclick="deleteItem(' + a.id + ',' + item.id + ')" style="padding:3px 8px;">x</button>' +
        '</div>';
    }).join('');
}

// toggles a checklist item done/not done and auto-updates the assignment status
function toggleItem(aId, itemId) {
    var a    = state.assignments.find(function(x) { return x.id === aId; });
    var item = a.checklist.find(function(x) { return x.id === itemId; });
    item.done = !item.done;

    var done = a.checklist.filter(function(x) { return x.done; }).length;
    a.progress = a.checklist.length ? Math.round((done / a.checklist.length) * 100) : a.progress;

    // automatically move status based on progress
    if (a.progress === 100) a.status = 'Completed';
    else if (a.progress > 0 && a.status === 'To Do') a.status = 'In Progress';

    document.getElementById('cl-status-select').value = a.status;
    renderChecklistItems(a);

    api('api/checklist.php', 'PUT', { id: itemId, done: item.done });
    api('api/assignments.php', 'PUT', { id: aId, status: a.status, progress: a.progress });
}

// adds a new checklist item to the current assignment
function addChecklistItem() {
    var input = document.getElementById('new-item-input');
    var text  = input.value.trim();
    if (!text) return;
    var id = parseInt(document.getElementById('checklist-select').value);
    var a  = state.assignments.find(function(x) { return x.id === id; });
    if (!a) return;

    api('api/checklist.php', 'POST', { assignment_id: a.id, text: text }).then(function(res) {
        a.checklist.push({ id: res.id, text: text, done: false });
        input.value = '';
        renderChecklistItems(a);
    });
}

// removes a checklist item from the list
function deleteItem(aId, itemId) {
    var a = state.assignments.find(function(x) { return x.id === aId; });
    a.checklist = a.checklist.filter(function(x) { return x.id !== itemId; });
    renderChecklistItems(a);
    api('api/checklist.php?id=' + itemId, 'DELETE');
}

// called when the user manually changes the status dropdown on the checklist page
function updateAssignmentStatus() {
    var id = parseInt(document.getElementById('checklist-select').value);
    var a  = state.assignments.find(function(x) { return x.id === id; });
    if (!a) return;
    a.status = document.getElementById('cl-status-select').value;
    api('api/assignments.php', 'PUT', { id: a.id, status: a.status, progress: a.progress });
    renderChecklistItems(a);
}

// closes a modal by removing the open class
function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}

// fetches courses and assignments from the server on startup
function initApp() {
    Promise.all([
        api('api/courses.php'),
        api('api/assignments.php')
    ]).then(function(results) {
        state.courses     = results[0];
        state.assignments = results[1];
        renderDashboard();
    });
}

// wait for the page to fully load before attaching event listeners
window.addEventListener('load', function() {

    // hamburger button for mobile nav
    var hamburger = document.getElementById('hamburger-btn');
    var navWrap   = document.getElementById('nav-tabs-wrap');
    if (hamburger && navWrap) {
        hamburger.addEventListener('click', function() {
            navWrap.classList.toggle('open');
        });
    }

    // nav tab buttons
    document.getElementById('tab-dashboard').addEventListener('click', function() { showPage('dashboard'); });
    document.getElementById('tab-courses').addEventListener('click',   function() { showPage('courses'); });
    document.getElementById('tab-form').addEventListener('click',      function() { showPage('form'); });
    document.getElementById('tab-checklist').addEventListener('click', function() { showPage('checklist'); });

    // dashboard filter dropdowns and search bar
    document.getElementById('filter-course').addEventListener('change', renderDashboard);
    document.getElementById('filter-status').addEventListener('change', renderDashboard);
    document.getElementById('filter-sort').addEventListener('change',   renderDashboard);
    document.getElementById('filter-search').addEventListener('input',  renderDashboard);

    // new assignment button on the dashboard
    var newBtn = document.getElementById('btn-new-assignment');
    if (newBtn) newBtn.addEventListener('click', function() { showPage('form'); });

    // form page buttons
    document.getElementById('btn-save-assignment').addEventListener('click', saveAssignment);
    document.getElementById('btn-clear-form').addEventListener('click',      clearForm);
    document.getElementById('btn-back-form').addEventListener('click',       function() { showPage('dashboard'); });

    // add course button
    var addCourseBtn = document.getElementById('btn-add-course');
    if (addCourseBtn) addCourseBtn.addEventListener('click', openAddCourseModal);

    // course modal buttons
    document.getElementById('btn-save-course').addEventListener('click',   saveCourse);
    document.getElementById('btn-cancel-course').addEventListener('click', function() { closeModal('course-modal'); });

    // checklist page
    document.getElementById('checklist-select').addEventListener('change', loadChecklist);
    document.getElementById('btn-add-item').addEventListener('click', addChecklistItem);
    document.getElementById('new-item-input').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') addChecklistItem();
    });
    document.getElementById('cl-status-select').addEventListener('change', updateAssignmentStatus);

    // navbar brand link
    var brand = document.getElementById('navbar-brand');
    if (brand) brand.addEventListener('click', function(e) { e.preventDefault(); showPage('dashboard'); });

    initApp();
});