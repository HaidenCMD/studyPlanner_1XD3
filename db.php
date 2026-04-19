<?php
// db.php - sets up the database connection
// Group: Dev101, McMaster CS Society
// every other PHP file includes this to get the $pdo object

$host   = 'localhost';
$dbname = 'pater222_db';
$user   = 'pater222_local';
$pass   = '3VxiYT/[I]7Pe4X.';

$pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
?>