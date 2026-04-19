<?php
/*
 * checklist.php
 * Student Assignment Manager - Checklist Items API
 * Authors: Dev101 Group - McMaster Computer Science Society
 * Description: Handles POST, PUT, and DELETE requests for checklist items.
 *              Items are linked to assignments.
 */

session_start();
require '../db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

/*
 * POST /api/checklist.php
 * Adds a new checklist item to an assignment.
 * Expects JSON body with assignment_id and text.
 */
if ($method === 'POST') {
    $d    = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare('INSERT INTO checklist_items (assignment_id, item_text) VALUES (?,?)');
    $stmt->execute([$d['assignment_id'], $d['text']]);
    echo json_encode(['id' => (int) $pdo->lastInsertId()]);

/*
 * PUT /api/checklist.php
 * Toggles the completed state of a checklist item.
 * Expects JSON body with id and done (boolean).
 */
} elseif ($method === 'PUT') {
    $d    = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare('UPDATE checklist_items SET is_completed=? WHERE item_id=?');
    $stmt->execute([$d['done'] ? 1 : 0, $d['id']]);
    echo json_encode(['ok' => true]);

/*
 * DELETE /api/checklist.php?id=X
 * Deletes a checklist item by ID.
 */
} elseif ($method === 'DELETE') {
    $id   = intval($_GET['id']);
    $stmt = $pdo->prepare('DELETE FROM checklist_items WHERE item_id=?');
    $stmt->execute([$id]);
    echo json_encode(['ok' => true]);
}
?>