<?php
// courses.php - API for courses (GET, POST, PUT, DELETE)
// Group: Dev101, McMaster CS Society
// only returns/modifies courses belonging to the logged-in user

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

// GET - return all courses for this user
if ($method === 'GET') {
    $stmt = $pdo->prepare('SELECT course_id as id, course_code as code, course_name as name, term, colour_tag as color FROM courses WHERE user_id = ? ORDER BY course_id');
    $stmt->execute([$uid]);
    echo json_encode($stmt->fetchAll());

// POST - add a new course
} elseif ($method === 'POST') {
    $d    = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare('INSERT INTO courses (user_id, course_code, course_name, term, colour_tag) VALUES (?,?,?,?,?)');
    $stmt->execute([$uid, $d['code'], $d['name'], $d['term'], $d['color']]);
    echo json_encode(['id' => (int) $pdo->lastInsertId()]);

// PUT - update an existing course
} elseif ($method === 'PUT') {
    $d    = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare('UPDATE courses SET course_code=?, course_name=?, term=?, colour_tag=? WHERE course_id=? AND user_id=?');
    $stmt->execute([$d['code'], $d['name'], $d['term'], $d['color'], $d['id'], $uid]);
    echo json_encode(['ok' => true]);

// DELETE - remove a course (cascades to assignments via the DB foreign key)
} elseif ($method === 'DELETE') {
    $id   = intval($_GET['id']);
    $stmt = $pdo->prepare('DELETE FROM courses WHERE course_id=? AND user_id=?');
    $stmt->execute([$id, $uid]);
    echo json_encode(['ok' => true]);
}
?>