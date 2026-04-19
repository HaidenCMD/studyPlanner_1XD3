<?php
// index.php - main app page
// Group: Dev101, McMaster CS Society
// redirects to login if not logged in

session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}

$userName = $_SESSION['user_name'];
$parts    = explode(' ', trim($userName));
$initials = strtoupper(substr($parts[0], 0, 1));
if (count($parts) > 1) $initials .= strtoupper(substr(end($parts), 0, 1));
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Student Planner - Dev101</title>
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>

  <nav class="navbar">
    <a class="navbar-brand" id="navbar-brand" href="#">Student Planner</a>
    <button type="button" class="hamburger" id="hamburger-btn" aria-label="Toggle menu">&#9776;</button>
    <div class="nav-tabs" id="nav-tabs-wrap">
      <button type="button" class="nav-tab active" id="tab-dashboard">Dashboard</button>
      <button type="button" class="nav-tab" id="tab-courses">Courses</button>
      <button type="button" class="nav-tab" id="tab-form">Add Assignment</button>
      <button type="button" class="nav-tab" id="tab-checklist">Checklist</button>
    </div>
    <div class="nav-right">
      <div class="user-chip">
        <span><?= htmlspecialchars($initials) ?> - <?= htmlspecialchars($userName) ?></span>
      </div>
      <a href="logout.php" class="btn btn-ghost btn-sm">Sign Out</a>
    </div>
  </nav>


  <!-- dashboard -->
  <div class="page active" id="page-dashboard">
    <div class="container">
      <div class="page-header">
        <h1>Welcome back, <?= htmlspecialchars($userName) ?></h1>
        <p>Here are your assignments for this semester.</p>
      </div>

      <div class="summary-row">
        <div class="summary-card">
          <div class="summary-info">
            <div class="label">Due Soon</div>
            <div class="value" id="stat-due-soon">0</div>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-info">
            <div class="label">Overdue</div>
            <div class="value" id="stat-overdue">0</div>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-info">
            <div class="label">Completed</div>
            <div class="value" id="stat-completed">0</div>
          </div>
        </div>
      </div>

      <div class="filters-bar">
        <span class="filter-label">Filter:</span>
        <select class="filter-select" id="filter-course">
          <option value="">All Courses</option>
        </select>
        <select class="filter-select" id="filter-status">
          <option value="">All Statuses</option>
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Overdue">Overdue</option>
        </select>
        <select class="filter-select" id="filter-sort">
          <option value="due">Sort by Due Date</option>
          <option value="title">Sort by Title</option>
        </select>
        <input class="filter-input" type="text" placeholder="Search assignments..." id="filter-search" />
        <button type="button" class="btn btn-primary ml-auto" id="btn-new-assignment">+ New Assignment</button>
      </div>

      <div class="assignments-grid" id="assignments-grid"></div>
    </div>
  </div>


  <!-- courses -->
  <div class="page" id="page-courses">
    <div class="container">
      <div class="page-header">
        <h1>My Courses</h1>
        <p>Add and manage your courses here.</p>
      </div>
      <div class="filters-bar">
        <button type="button" class="btn btn-primary ml-auto" id="btn-add-course">+ Add Course</button>
      </div>
      <div class="courses-grid" id="courses-grid"></div>
    </div>
  </div>


  <!-- add/edit assignment -->
  <div class="page" id="page-form">
    <div class="container">
      <div class="page-header">
        <h1 id="form-page-title">Add Assignment</h1>
      </div>
      <div class="form-card">
        <h2 id="form-card-heading">New Assignment</h2>
        <div class="form-group">
          <label for="f-title">Title</label>
          <input type="text" id="f-title" placeholder="e.g. Lab Report 3" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="f-course">Course</label>
            <select id="f-course">
              <option value="">Select course...</option>
            </select>
          </div>
          <div class="form-group">
            <label for="f-due-date">Due Date</label>
            <input type="date" id="f-due-date" />
          </div>
        </div>
        <div class="form-group">
          <label for="f-description">Notes</label>
          <textarea id="f-description" placeholder="Any extra notes or details..."></textarea>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-primary" id="btn-save-assignment">Save Assignment</button>
          <button type="button" class="btn btn-ghost" id="btn-clear-form">Clear</button>
          <button type="button" class="btn btn-ghost ml-auto" id="btn-back-form">Back</button>
        </div>
      </div>
    </div>
  </div>


  <!-- checklist - no status panel, just tasks + progress bar -->
  <div class="page" id="page-checklist">
    <div class="container">
      <div class="page-header">
        <h1>Checklist</h1>
        <p>Break assignments into smaller steps and track your progress.</p>
      </div>

      <div class="filters-bar" style="margin-bottom:20px;">
        <button type="button" class="btn btn-ghost" id="btn-back-checklist">Back</button>
        <label style="margin:0;font-size:14px;">Assignment:</label>
        <select class="filter-select" id="checklist-select" style="min-width:220px;">
          <option value="">Select an assignment...</option>
        </select>
      </div>

      <div id="checklist-content" style="display:none;">
        <div class="checklist-card">
          <div class="checklist-header">
            <h2 id="cl-title">Assignment Title</h2>
            <div class="checklist-meta">
              <span id="cl-course"></span>
              <span id="cl-due"></span>
            </div>
          </div>

          <!-- progress bar replaces the status panel -->
          <div class="cl-progress-section">
            <div class="cl-progress-bar">
              <div class="cl-progress-fill" id="cl-progress-fill"></div>
            </div>
            <span class="cl-progress-label" id="cl-progress-label">0%</span>
          </div>

          <div class="section-title">Tasks</div>
          <div class="checklist-items" id="checklist-items"></div>

          <div class="add-item-row">
            <input type="text" id="new-item-input" placeholder="Add a task..." />
            <button type="button" class="btn btn-primary" id="btn-add-item">Add</button>
          </div>
        </div>
      </div>

      <div id="checklist-empty" class="empty-state">
        <p>Select an assignment above to view and manage its checklist.</p>
      </div>
    </div>
  </div>


  <!-- course modal -->
  <div class="modal-overlay" id="course-modal">
    <div class="modal">
      <h3 id="course-modal-title">Add Course</h3>
      <div class="form-group">
        <label for="m-code">Course Code</label>
        <input type="text" id="m-code" placeholder="e.g. COMPSCI 1XD3" />
      </div>
      <div class="form-group">
        <label for="m-name">Course Name</label>
        <input type="text" id="m-name" placeholder="e.g. Intro to Web Design" />
      </div>
      <div class="form-group">
        <label for="m-term">Term</label>
        <input type="text" id="m-term" placeholder="e.g. Winter 2025" />
      </div>
      <div class="form-group">
        <label for="m-color">Colour</label>
        <select id="m-color">
          <option value="tag-blue">Blue</option>
          <option value="tag-purple">Purple</option>
          <option value="tag-green">Green</option>
          <option value="tag-orange">Orange</option>
          <option value="tag-red">Red</option>
          <option value="tag-teal">Teal</option>
        </select>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-primary" id="btn-save-course">Save</button>
        <button type="button" class="btn btn-ghost" id="btn-cancel-course">Cancel</button>
      </div>
    </div>
  </div>


  <footer class="footer">
    <div>Student Assignment Manager</div>
    <div>Dev101 - McMaster Computer Science Society</div>
  </footer>

  <script src="js/app.js"></script>
</body>
</html>
