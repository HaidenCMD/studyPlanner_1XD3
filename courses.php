<?php
// Hani worked on user accounts and courses
// did login and signup stuff + sessions so users stay logged in
// also made add/edit/delete for courses
// connected it to database with php and sql
// made sure courses are tied to the correct user

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

if ($method === 'GET') {
    $stmt = $pdo->prepare('
        SELECT course_id as id, course_code as code, course_name as name, term, colour_tag as color
        FROM courses
        WHERE user_id = ?
        ORDER BY course_id
    ');
    $stmt->execute([$uid]);
    echo json_encode($stmt->fetchAll());
    exit;
}

if ($method === 'POST') {
    $code = $_POST['code'] ?? '';
    $name = $_POST['name'] ?? '';
    $term = $_POST['term'] ?? '';
    $color = $_POST['color'] ?? 'tag-blue';

    $stmt = $pdo->prepare('
        INSERT INTO courses (user_id, course_code, course_name, term, colour_tag)
        VALUES (?, ?, ?, ?, ?)
    ');
    $stmt->execute([$uid, $code, $name, $term, $color]);

    echo json_encode(['id' => (int)$pdo->lastInsertId()]);
    exit;
}

if ($method === 'PUT') {
    $id = (int)($_POST['id'] ?? 0);
    $code = $_POST['code'] ?? '';
    $name = $_POST['name'] ?? '';
    $term = $_POST['term'] ?? '';
    $color = $_POST['color'] ?? 'tag-blue';

    $stmt = $pdo->prepare('
        UPDATE courses
        SET course_code = ?, course_name = ?, term = ?, colour_tag = ?
        WHERE course_id = ? AND user_id = ?
    ');
    $stmt->execute([$code, $name, $term, $color, $id, $uid]);

    echo json_encode(['ok' => true]);
    exit;
}

if ($method === 'DELETE') {
    $id = (int)($_POST['id'] ?? 0);

    $stmt = $pdo->prepare('DELETE FROM courses WHERE course_id = ? AND user_id = ?');
    $stmt->execute([$id, $uid]);

    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>