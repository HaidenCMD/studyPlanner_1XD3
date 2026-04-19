<?php
// db.php - sets up the database connection
// Group: Dev101, McMaster CS Society
// every other PHP file includes this to get the $pdo object

$host   = 'localhost';
$dbname = 'student_planner';
$user   = 'root';
$pass   = '';

$pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
?>