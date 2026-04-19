<?php
// checklist.php - API for checklist items (POST, PUT, DELETE)
// Group: Dev101, McMaster CS Society

session_start();
require 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

$uid = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST' && isset($_POST['_method'])) {
    $method = strtoupper($_POST['_method']);
}

// POST - add a new checklist item to an assignment
if ($method === 'POST') {
    $assignmentId = (int)($_POST['assignment_id'] ?? 0);
    $text = $_POST['text'] ?? '';

    $stmt = $pdo->prepare('
        SELECT a.assignment_id
        FROM assignments a
        JOIN courses c ON a.course_id = c.course_id
        WHERE a.assignment_id = ? AND c.user_id = ?
    ');
    $stmt->execute([$assignmentId, $uid]);

    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }

    $stmt = $pdo->prepare('INSERT INTO checklist_items (assignment_id, item_text) VALUES (?, ?)');
    $stmt->execute([$assignmentId, $text]);

    echo json_encode(['id' => (int)$pdo->lastInsertId()]);
    exit;
}

// PUT - toggle an item as done or not done
if ($method === 'PUT') {
    $id = (int)($_POST['id'] ?? 0);
    $done = isset($_POST['done']) && ($_POST['done'] === 'true' || $_POST['done'] === '1' || $_POST['done'] == 1);

    $stmt = $pdo->prepare('
        SELECT ci.item_id
        FROM checklist_items ci
        JOIN assignments a ON ci.assignment_id = a.assignment_id
        JOIN courses c ON a.course_id = c.course_id
        WHERE ci.item_id = ? AND c.user_id = ?
    ');
    $stmt->execute([$id, $uid]);

    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }

    $stmt = $pdo->prepare('UPDATE checklist_items SET is_completed = ? WHERE item_id = ?');
    $stmt->execute([$done ? 1 : 0, $id]);

    echo json_encode(['ok' => true]);
    exit;
}

// DELETE - remove a checklist item
if ($method === 'DELETE') {
    $id = (int)($_POST['id'] ?? 0);

    $stmt = $pdo->prepare('
        SELECT ci.item_id
        FROM checklist_items ci
        JOIN assignments a ON ci.assignment_id = a.assignment_id
        JOIN courses c ON a.course_id = c.course_id
        WHERE ci.item_id = ? AND c.user_id = ?
    ');
    $stmt->execute([$id, $uid]);

    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }

    $stmt = $pdo->prepare('DELETE FROM checklist_items WHERE item_id = ?');
    $stmt->execute([$id]);

    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>