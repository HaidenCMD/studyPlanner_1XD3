<?php
session_start();
require '../db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $d    = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare('INSERT INTO checklist_items (assignment_id, item_text) VALUES (?,?)');
    $stmt->execute([$d['assignment_id'], $d['text']]);
    echo json_encode(['id' => (int) $pdo->lastInsertId()]);

} elseif ($method === 'PUT') {
    $d    = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare('UPDATE checklist_items SET is_completed=? WHERE item_id=?');
    $stmt->execute([$d['done'] ? 1 : 0, $d['id']]);
    echo json_encode(['ok' => true]);

} elseif ($method === 'DELETE') {
    $id   = intval($_GET['id']);
    $stmt = $pdo->prepare('DELETE FROM checklist_items WHERE item_id=?');
    $stmt->execute([$id]);
    echo json_encode(['ok' => true]);
}
?>
