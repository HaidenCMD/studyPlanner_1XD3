<?php
// assignments.php - API for assignments (GET, POST, PUT, DELETE)
// Group: Dev101, McMaster CS Society
// all operations are tied to the logged-in user so people cant touch each others data

session_start();
require '../db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

$uid    = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

// GET - returns all assignments for this user, with their checklist items included
if ($method === 'GET') {
    $stmt = $pdo->prepare('
        SELECT a.assignment_id as id, c.course_code as course, a.title,
               a.description, a.due_date as dueDate, a.status,
               a.progress_percent as progress
        FROM assignments a
        JOIN courses c ON a.course_id = c.course_id
        WHERE c.user_id = ?
        ORDER BY a.assignment_id
    ');
    $stmt->execute([$uid]);
    $assignments = $stmt->fetchAll();

    if (!empty($assignments)) {
        $ids          = array_column($assignments, 'id');
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt2        = $pdo->prepare("SELECT item_id as id, assignment_id, item_text as text, is_completed as done FROM checklist_items WHERE assignment_id IN ($placeholders)");
        $stmt2->execute($ids);
        $rows = $stmt2->fetchAll();

        // group checklist items by assignment id
        $byAssignment = [];
        foreach ($rows as $row) {
            $aid         = $row['assignment_id'];
            $row['done'] = (bool) $row['done'];
            $row['id']   = (int)  $row['id'];
            unset($row['assignment_id']);
            $byAssignment[$aid][] = $row;
        }

        foreach ($assignments as &$a) {
            $a['id']        = (int) $a['id'];
            $a['progress']  = (int) $a['progress'];
            $a['checklist'] = $byAssignment[$a['id']] ?? [];
        }
    }

    echo json_encode($assignments);

// POST - create a new assignment
} elseif ($method === 'POST') {
    $d    = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare('SELECT course_id FROM courses WHERE course_code=? AND user_id=?');
    $stmt->execute([$d['course'], $uid]);
    $course = $stmt->fetch();
    if (!$course) {
        http_response_code(400);
        echo json_encode(['error' => 'Course not found']);
        exit;
    }
    $stmt = $pdo->prepare('INSERT INTO assignments (course_id, title, description, due_date, status, progress_percent) VALUES (?,?,?,?,?,0)');
    $stmt->execute([$course['course_id'], $d['title'], $d['description'], $d['dueDate'] ?: null, $d['status']]);
    echo json_encode(['id' => (int) $pdo->lastInsertId()]);

// PUT - update an assignment (either full edit or just status/progress)
} elseif ($method === 'PUT') {
    $d = json_decode(file_get_contents('php://input'), true);

    if (isset($d['course'])) {
        // full update from the edit form
        $stmt = $pdo->prepare('SELECT course_id FROM courses WHERE course_code=? AND user_id=?');
        $stmt->execute([$d['course'], $uid]);
        $course = $stmt->fetch();
        $stmt   = $pdo->prepare('UPDATE assignments SET course_id=?, title=?, description=?, due_date=?, status=? WHERE assignment_id=?');
        $stmt->execute([$course['course_id'], $d['title'], $d['description'], $d['dueDate'] ?: null, $d['status'], $d['id']]);
    } else {
        // just updating status and progress from the checklist
        $stmt = $pdo->prepare('UPDATE assignments SET status=?, progress_percent=? WHERE assignment_id=?');
        $stmt->execute([$d['status'], $d['progress'], $d['id']]);
    }
    echo json_encode(['ok' => true]);

// DELETE - remove an assignment (only if it belongs to this user)
} elseif ($method === 'DELETE') {
    $id   = intval($_GET['id']);
    $stmt = $pdo->prepare('SELECT a.assignment_id FROM assignments a JOIN courses c ON a.course_id=c.course_id WHERE a.assignment_id=? AND c.user_id=?');
    $stmt->execute([$id, $uid]);
    if ($stmt->fetch()) {
        $stmt = $pdo->prepare('DELETE FROM assignments WHERE assignment_id=?');
        $stmt->execute([$id]);
    }
    echo json_encode(['ok' => true]);
}
?>