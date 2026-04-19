<?php
/*
 * courses.php
 * Student Assignment Manager - Courses API
 * Authors: Dev101 Group - McMaster Computer Science Society
 * Description: Handles GET, POST, PUT, and DELETE requests for courses.
 *              All actions are scoped to the logged-in user via session.
 */

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

/*
 * GET /api/courses.php
 * Returns all courses belonging to the logged-in user.
 */
if ($method === 'GET') {
    $stmt = $pdo->prepare('SELECT course_id as id, course_code as code, course_name as name, term, colour_tag as color FROM courses WHERE user_id = ? ORDER BY course_id');
    $stmt->execute([$uid]);
    echo json_encode($stmt->fetchAll());

/*
 * POST /api/courses.php
 * Creates a new course. Expects JSON body with code, name, term, color.
 */
} elseif ($method === 'POST') {
    $d = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare('INSERT INTO courses (user_id, course_code, course_name, term, colour_tag) VALUES (?,?,?,?,?)');
    $stmt->execute([$uid, $d['code'], $d['name'], $d['term'], $d['color']]);
    echo json_encode(['id' => (int) $pdo->lastInsertId()]);

/*
 * PUT /api/courses.php
 * Updates an existing course. Expects JSON body with id, code, name, term, color.
 */
} elseif ($method === 'PUT') {
    $d = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare('UPDATE courses SET course_code=?, course_name=?, term=?, colour_tag=? WHERE course_id=? AND user_id=?');
    $stmt->execute([$d['code'], $d['name'], $d['term'], $d['color'], $d['id'], $uid]);
    echo json_encode(['ok' => true]);

/*
 * DELETE /api/courses.php?id=X
 * Deletes a course by ID, only if it belongs to the logged-in user.
 */
} elseif ($method === 'DELETE') {
    $id   = intval($_GET['id']);
    $stmt = $pdo->prepare('DELETE FROM courses WHERE course_id=? AND user_id=?');
    $stmt->execute([$id, $uid]);
    echo json_encode(['ok' => true]);
}
?>