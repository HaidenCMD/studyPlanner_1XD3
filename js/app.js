// we all worked together on connecting everything
// made sure courses, assignments and checklist all work together
// tested full app multiple times and fixed bugs we found

var state = {
    courses: [],
    assignments: [],
    editingId: null,
    editingCourseId: null,
    activeChecklistId: null
};

function api(url, method, body) {
    method = method || 'GET';

    // normal GET (no change)
    if (method === 'GET') {
        return fetch(url)
            .then(res => res.json());
    }

    // else use POST
    const form = new URLSearchParams();
    form.append('_method', method); // THIS is the key

    if (body) {
        for (let key in body) {
            form.append(key, body[key]);
        }
    }

    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: form.toString()
    }).then(res => res.json());
}

function showPage(name) {
    document.querySelectorAll('.page').forEach(function(p) {
        p.classList.remove('active');
    });

    document.querySelectorAll('.nav-tab').forEach(function(t) {
        t.classList.remove('active');
    });

    var page = document.getElementById('page-' + name);
    var tab = document.getElementById('tab-' + name);

    if (page) page.classList.add('active');
    if (tab) tab.classList.add('active');

    var navTabs = document.getElementById('nav-tabs-wrap');
    if (navTabs) navTabs.classList.remove('open');

    if (name === 'dashboard') renderDashboard();
    if (name === 'courses') renderCourses();
    if (name === 'form') populateFormCourses();
    if (name === 'checklist') populateChecklistSelect();
}

function formatDate(d) {
    if (!d) return '--';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-CA', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function renderDashboard() {
    var cfEl = document.getElementById('filter-course');
    if (!cfEl) return;

    var prev = cfEl.value;
    cfEl.innerHTML = '<option value="">All Courses</option>';

    state.courses.forEach(function(c) {
        var o = document.createElement('option');
        o.value = c.code;
        o.textContent = c.code;
        if (o.value === prev) o.selected = true;
        cfEl.appendChild(o);
    });

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var soon = new Date(today);
    soon.setDate(today.getDate() + 3);

    var dueSoon = 0;
    var overdue = 0;
    var completed = 0;

    state.assignments.forEach(function(a) {
        var d = a.dueDate ? new Date(a.dueDate + 'T00:00:00') : null;

        if (a.status === 'Completed') {
            completed++;
        } else if (a.status === 'Overdue' || (d && d < today)) {
            overdue++;
        } else if (d && d <= soon) {
            dueSoon++;
        }
    });

    var statDueSoon = document.getElementById('stat-due-soon');
    var statOverdue = document.getElementById('stat-overdue');
    var statCompleted = document.getElementById('stat-completed');

    if (statDueSoon) statDueSoon.textContent = dueSoon;
    if (statOverdue) statOverdue.textContent = overdue;
    if (statCompleted) statCompleted.textContent = completed;

    var courseFilterEl = document.getElementById('filter-course');
    var statusFilterEl = document.getElementById('filter-status');
    var sortFilterEl = document.getElementById('filter-sort');
    var searchEl = document.getElementById('filter-search');

    var courseFilter = courseFilterEl ? courseFilterEl.value : '';
    var statusFilter = statusFilterEl ? statusFilterEl.value : '';
    var sortFilter = sortFilterEl ? sortFilterEl.value : '';
    var search = searchEl ? searchEl.value.toLowerCase() : '';

    var list = state.assignments.slice();

    if (courseFilter) {
        list = list.filter(function(a) { return a.course === courseFilter; });
    }

    if (statusFilter) {
        list = list.filter(function(a) { return a.status === statusFilter; });
    }

    if (search) {
        list = list.filter(function(a) {
            return (
                (a.title || '').toLowerCase().indexOf(search) !== -1 ||
                (a.course || '').toLowerCase().indexOf(search) !== -1
            );
        });
    }

    if (sortFilter === 'due') {
        list.sort(function(a, b) {
            return (a.dueDate || '').localeCompare(b.dueDate || '');
        });
    }

    if (sortFilter === 'title') {
        list.sort(function(a, b) {
            return (a.title || '').localeCompare(b.title || '');
        });
    }

    var grid = document.getElementById('assignments-grid');
    if (!grid) return;

    if (!list.length) {
        grid.innerHTML =
            '<div class="empty-state" style="grid-column:1/-1"><p>' +
            (state.assignments.length === 0
                ? 'No assignments yet. Click <strong>+ New Assignment</strong> to get started.'
                : 'No assignments match your filters.') +
            '</p></div>';
        return;
    }

    grid.innerHTML = list.map(function(a) {
        return assignmentCardHTML(a);
    }).join('');
}

function assignmentCardHTML(a) {
    var statusMap = {
        'To Do': 'status-todo',
        'In Progress': 'status-progress',
        'Completed': 'status-done',
        'Overdue': 'status-overdue'
    };

    var sCls = statusMap[a.status] || 'status-todo';
    var progress = a.progress || 0;

    return '' +
        '<div class="assignment-card" onclick="openChecklist(' + a.id + ')">' +
            '<div class="card-top">' +
                '<span class="card-course-badge">' + a.course + '</span>' +
                '<span class="status-badge ' + sCls + '">' + a.status + '</span>' +
            '</div>' +
            '<div class="card-title">' + a.title + '</div>' +
            '<div class="card-meta">' +
                (a.dueDate ? 'Due: ' + formatDate(a.dueDate) : 'No due date') +
            '</div>' +
            '<div class="progress-wrap">' +
                '<div class="progress-bar"><div class="progress-fill" style="width:' + progress + '%"></div></div>' +
                '<span class="progress-label">' + progress + '%</span>' +
            '</div>' +
            '<div class="card-actions" onclick="event.stopPropagation()">' +
                '<button type="button" class="btn btn-ghost btn-sm" onclick="editAssignment(' + a.id + ')">Edit</button>' +
                '<button type="button" class="btn btn-ghost btn-sm" onclick="openChecklist(' + a.id + ')">Checklist</button>' +
                '<button type="button" class="btn btn-danger btn-sm ml-auto" onclick="deleteAssignment(' + a.id + ')">Delete</button>' +
            '</div>' +
        '</div>';
}

function renderCourses() {
    var grid = document.getElementById('courses-grid');
    if (!grid) return;

    var cards = state.courses.map(function(c) {
        return '' +
            '<div class="course-card ' + (c.color || 'tag-blue') + '">' +
                '<div class="course-code">' + c.code + '</div>' +
                '<div class="course-name">' + c.name + '</div>' +
                '<div class="course-term">' + (c.term || '') + '</div>' +
                '<div class="course-actions">' +
                    '<button type="button" class="btn btn-ghost btn-sm" onclick="editCourse(' + c.id + ')">Edit</button>' +
                    '<button type="button" class="btn btn-danger btn-sm" onclick="deleteCourse(' + c.id + ')">Delete</button>' +
                '</div>' +
            '</div>';
    }).join('');

    var addCard =
        '<div class="add-course-card" onclick="openAddCourseModal()">' +
            '<span class="plus">+</span><span>Add New Course</span>' +
        '</div>';

    grid.innerHTML = cards + addCard;
}

function openAddCourseModal() {
    state.editingCourseId = null;

    document.getElementById('course-modal-title').textContent = 'Add Course';
    document.getElementById('m-code').value = '';
    document.getElementById('m-name').value = '';
    document.getElementById('m-term').value = '';
    document.getElementById('m-color').value = 'tag-blue';

    document.getElementById('course-modal').classList.add('open');
}

function editCourse(id) {
    id = parseInt(id, 10);

    var c = state.courses.find(function(x) {
        return x.id === id;
    });

    if (!c) return;

    state.editingCourseId = id;

    document.getElementById('course-modal-title').textContent = 'Edit Course';
    document.getElementById('m-code').value = c.code;
    document.getElementById('m-name').value = c.name;
    document.getElementById('m-term').value = c.term || '';
    document.getElementById('m-color').value = c.color || 'tag-blue';

    document.getElementById('course-modal').classList.add('open');
}

function saveCourse() {
    var code = document.getElementById('m-code').value.trim();
    var name = document.getElementById('m-name').value.trim();
    var term = document.getElementById('m-term').value.trim();
    var color = document.getElementById('m-color').value;

    if (!code || !name) {
        alert('Please fill in the course code and name.');
        return;
    }

    if (state.editingCourseId !== null) {
        api('courses.php', 'PUT', {
            id: state.editingCourseId,
            code: code,
            name: name,
            term: term,
            color: color
        }).then(function() {
            var c = state.courses.find(function(x) {
                return x.id === state.editingCourseId;
            });

            if (c) {
                c.code = code;
                c.name = name;
                c.term = term;
                c.color = color;
            }

            closeModal('course-modal');
            renderCourses();
            renderDashboard();
            populateFormCourses();
        });
    } else {
        api('courses.php', 'POST', {
            code: code,
            name: name,
            term: term,
            color: color
        }).then(function(res) {
            state.courses.push({
                id: res.id,
                code: code,
                name: name,
                term: term,
                color: color
            });

            closeModal('course-modal');
            renderCourses();
            renderDashboard();
            populateFormCourses();
        });
    }
}

function deleteCourse(id) {
    id = parseInt(id, 10);

    api('courses.php', 'DELETE', { id: id }).then(function() {
        var deleted = state.courses.find(function(c) { return c.id === id; });

        state.courses = state.courses.filter(function(x) {
            return x.id !== id;
        });

        if (deleted) {
            state.assignments = state.assignments.filter(function(a) {
                return a.course !== deleted.code;
            });
        }

        renderCourses();
        renderDashboard();
        populateFormCourses();
    });
}

function populateFormCourses() {
    var sel = document.getElementById('f-course');
    if (!sel) return;

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

function editAssignment(id) {
    id = parseInt(id, 10);

    var a = state.assignments.find(function(x) {
        return x.id === id;
    });

    if (!a) return;

    state.editingId = id;

    document.getElementById('form-page-title').textContent = 'Edit Assignment';
    document.getElementById('form-card-heading').textContent = 'Edit Assignment';

    showPage('form');

    setTimeout(function() {
        document.getElementById('f-title').value = a.title || '';
        document.getElementById('f-course').value = a.course || '';
        document.getElementById('f-due-date').value = a.dueDate || '';
        document.getElementById('f-description').value = a.description || '';
    }, 30);
}

function saveAssignment() {
    var title = document.getElementById('f-title').value.trim();
    var course = document.getElementById('f-course').value;
    var dueDate = document.getElementById('f-due-date').value;
    var desc = document.getElementById('f-description').value.trim();

    if (!title || !course) {
        alert('Please enter a title and select a course.');
        return;
    }

    if (state.editingId !== null) {
        api('assignments.php', 'PUT', {
            id: state.editingId,
            title: title,
            course: course,
            dueDate: dueDate,
            status: 'To Do',
            description: desc
        }).then(function() {
            var idx = state.assignments.findIndex(function(x) {
                return x.id === state.editingId;
            });

            if (idx !== -1) {
                var old = state.assignments[idx];
                state.assignments[idx] = Object.assign({}, old, {
                    title: title,
                    course: course,
                    dueDate: dueDate,
                    description: desc
                });
            }

            state.editingId = null;
            document.getElementById('form-page-title').textContent = 'Add Assignment';
            document.getElementById('form-card-heading').textContent = 'New Assignment';
            clearForm();
            showPage('dashboard');
        });
    } else {
        api('assignments.php', 'POST', {
            title: title,
            course: course,
            dueDate: dueDate,
            status: 'To Do',
            description: desc
        }).then(function(res) {
            state.assignments.push({
                id: res.id,
                title: title,
                course: course,
                dueDate: dueDate,
                status: 'To Do',
                description: desc,
                progress: 0,
                checklist: []
            });

            clearForm();
            showPage('dashboard');
        });
    }
}

function clearForm() {
    document.getElementById('f-title').value = '';
    document.getElementById('f-due-date').value = '';
    document.getElementById('f-description').value = '';

    var course = document.getElementById('f-course');
    if (course) course.selectedIndex = 0;
}

function deleteAssignment(id) {
    id = parseInt(id, 10);

    api('assignments.php', 'DELETE', { id: id }).then(function() {
        state.assignments = state.assignments.filter(function(x) {
            return x.id !== id;
        });

        renderDashboard();

        if (state.activeChecklistId === id) {
            state.activeChecklistId = null;
            showPage('dashboard');
        }
    });
}

function populateChecklistSelect() {
    var sel = document.getElementById('checklist-select');
    if (!sel) return;

    sel.innerHTML = '<option value="">Select an assignment...</option>';

    state.assignments.forEach(function(a) {
        var o = document.createElement('option');
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
    state.activeChecklistId = parseInt(id, 10);
    showPage('checklist');
}

function loadChecklist() {
    var selectEl = document.getElementById('checklist-select');
    if (!selectEl) return;

    var id = parseInt(selectEl.value, 10);
    var a = state.assignments.find(function(x) {
        return x.id === id;
    });

    var content = document.getElementById('checklist-content');
    var empty = document.getElementById('checklist-empty');

    if (!a) {
        if (content) content.style.display = 'none';
        if (empty) empty.style.display = 'block';
        return;
    }

    if (content) content.style.display = 'block';
    if (empty) empty.style.display = 'none';

    state.activeChecklistId = id;

    document.getElementById('cl-title').textContent = a.title;
    document.getElementById('cl-course').textContent = a.course;
    document.getElementById('cl-due').textContent = a.dueDate ? 'Due: ' + formatDate(a.dueDate) : '';

    renderChecklistItems(a);
}

function renderChecklistItems(a) {
    var cl = a.checklist || [];
    var done = cl.filter(function(x) { return x.done; }).length;
    var progress = cl.length ? Math.round((done / cl.length) * 100) : 0;

    a.progress = progress;

    if (a.progress === 100) a.status = 'Completed';
    else if (a.progress > 0) a.status = 'In Progress';
    else a.status = 'To Do';

    var bar = document.getElementById('cl-progress-fill');
    var label = document.getElementById('cl-progress-label');

    if (bar) bar.style.width = progress + '%';
    if (label) label.textContent = progress + '%';

    var itemsEl = document.getElementById('checklist-items');
    if (!itemsEl) return;

    if (!cl.length) {
        itemsEl.innerHTML = '<p class="no-items-msg">No tasks yet. Add one below.</p>';
    } else {
        itemsEl.innerHTML = cl.map(function(item) {
            return '' +
                '<div class="checklist-item ' + (item.done ? 'done' : '') + '">' +
                    '<div class="check-box" onclick="toggleItem(' + a.id + ',' + item.id + ')">' +
                        '<span class="check-tick">&#10003;</span>' +
                    '</div>' +
                    '<span class="item-text">' + item.text + '</span>' +
                    '<button type="button" class="btn btn-danger btn-sm" onclick="deleteItem(' + a.id + ',' + item.id + ')" style="padding:3px 8px;">x</button>' +
                '</div>';
        }).join('');
    }
}

function toggleItem(aId, itemId) {
    aId = parseInt(aId, 10);
    itemId = parseInt(itemId, 10);

    var a = state.assignments.find(function(x) {
        return x.id === aId;
    });

    if (!a || !a.checklist) return;

    var item = a.checklist.find(function(x) {
        return x.id === itemId;
    });

    if (!item) return;

    item.done = !item.done;

    var done = a.checklist.filter(function(x) { return x.done; }).length;
    a.progress = a.checklist.length ? Math.round((done / a.checklist.length) * 100) : 0;

    if (a.progress === 100) a.status = 'Completed';
    else if (a.progress > 0) a.status = 'In Progress';
    else a.status = 'To Do';

    renderChecklistItems(a);
    renderDashboard();

    api('checklist.php', 'PUT', { id: itemId, done: item.done });
    api('assignments.php', 'PUT', { id: aId, status: a.status, progress: a.progress });
}

function addChecklistItem() {
    var input = document.getElementById('new-item-input');
    if (!input) return;

    var text = input.value.trim();
    if (!text) return;

    var selectEl = document.getElementById('checklist-select');
    if (!selectEl) return;

    var id = parseInt(selectEl.value, 10);
    var a = state.assignments.find(function(x) {
        return x.id === id;
    });

    if (!a) return;

    api('checklist.php', 'POST', {
        assignment_id: a.id,
        text: text
    }).then(function(res) {
        if (!a.checklist) a.checklist = [];
        a.checklist.push({
            id: res.id,
            text: text,
            done: false
        });

        input.value = '';
        renderChecklistItems(a);
        renderDashboard();
    });
}

function deleteItem(aId, itemId) {
    aId = parseInt(aId, 10);
    itemId = parseInt(itemId, 10);

    var a = state.assignments.find(function(x) {
        return x.id === aId;
    });

    if (!a || !a.checklist) return;

    a.checklist = a.checklist.filter(function(x) {
        return x.id !== itemId;
    });

    var done = a.checklist.filter(function(x) { return x.done; }).length;
    a.progress = a.checklist.length ? Math.round((done / a.checklist.length) * 100) : 0;

    if (a.progress === 100) a.status = 'Completed';
    else if (a.progress > 0) a.status = 'In Progress';
    else a.status = 'To Do';

    renderChecklistItems(a);
    renderDashboard();

    api('checklist.php', 'DELETE', { id: itemId });
    api('assignments.php', 'PUT', { id: aId, status: a.status, progress: a.progress });
}

function closeModal(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('open');
}

function initApp() {
    Promise.all([
        api('courses.php'),
        api('assignments.php')
    ]).then(function(results) {
        state.courses = results[0] || [];
        state.assignments = results[1] || [];

        state.assignments.forEach(function(a) {
            if (!a.checklist) a.checklist = [];
            if (!a.status) a.status = 'To Do';
            if (typeof a.progress === 'undefined' || a.progress === null) a.progress = 0;
        });

        renderDashboard();
        renderCourses();
        populateFormCourses();
    });
}

window.addEventListener('load', function() {
    var hamburger = document.getElementById('hamburger-btn');
    var navWrap = document.getElementById('nav-tabs-wrap');

    if (hamburger && navWrap) {
        hamburger.addEventListener('click', function() {
            navWrap.classList.toggle('open');
        });
    }

    var tabDashboard = document.getElementById('tab-dashboard');
    var tabCourses = document.getElementById('tab-courses');
    var tabForm = document.getElementById('tab-form');
    var tabChecklist = document.getElementById('tab-checklist');

    if (tabDashboard) tabDashboard.addEventListener('click', function() { showPage('dashboard'); });
    if (tabCourses) tabCourses.addEventListener('click', function() { showPage('courses'); });
    if (tabForm) tabForm.addEventListener('click', function() { showPage('form'); });
    if (tabChecklist) tabChecklist.addEventListener('click', function() { showPage('checklist'); });

    var filterCourse = document.getElementById('filter-course');
    var filterStatus = document.getElementById('filter-status');
    var filterSort = document.getElementById('filter-sort');
    var filterSearch = document.getElementById('filter-search');

    if (filterCourse) filterCourse.addEventListener('change', renderDashboard);
    if (filterStatus) filterStatus.addEventListener('change', renderDashboard);
    if (filterSort) filterSort.addEventListener('change', renderDashboard);
    if (filterSearch) filterSearch.addEventListener('input', renderDashboard);

    var newBtn = document.getElementById('btn-new-assignment');
    if (newBtn) {
        newBtn.addEventListener('click', function() {
            state.editingId = null;
            document.getElementById('form-page-title').textContent = 'Add Assignment';
            document.getElementById('form-card-heading').textContent = 'New Assignment';
            clearForm();
            showPage('form');
        });
    }

    var btnSaveAssignment = document.getElementById('btn-save-assignment');
    var btnClearForm = document.getElementById('btn-clear-form');
    var btnBackForm = document.getElementById('btn-back-form');

    if (btnSaveAssignment) btnSaveAssignment.addEventListener('click', saveAssignment);
    if (btnClearForm) btnClearForm.addEventListener('click', clearForm);
    if (btnBackForm) btnBackForm.addEventListener('click', function() { showPage('dashboard'); });

    var addCourseBtn = document.getElementById('btn-add-course');
    var btnSaveCourse = document.getElementById('btn-save-course');
    var btnCancelCourse = document.getElementById('btn-cancel-course');

    if (addCourseBtn) addCourseBtn.addEventListener('click', openAddCourseModal);
    if (btnSaveCourse) btnSaveCourse.addEventListener('click', saveCourse);
    if (btnCancelCourse) btnCancelCourse.addEventListener('click', function() {
        closeModal('course-modal');
    });

    var checklistSelect = document.getElementById('checklist-select');
    var btnAddItem = document.getElementById('btn-add-item');
    var newItemInput = document.getElementById('new-item-input');

    if (checklistSelect) checklistSelect.addEventListener('change', loadChecklist);
    if (btnAddItem) btnAddItem.addEventListener('click', addChecklistItem);

    if (newItemInput) {
        newItemInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') addChecklistItem();
        });
    }

    var backChecklistBtn = document.getElementById('btn-back-checklist');
    if (backChecklistBtn) {
        backChecklistBtn.addEventListener('click', function() {
            showPage('dashboard');
        });
    }

    var brand = document.getElementById('navbar-brand');
    if (brand) {
        brand.addEventListener('click', function(e) {
            e.preventDefault();
            showPage('dashboard');
        });
    }

    initApp();
});