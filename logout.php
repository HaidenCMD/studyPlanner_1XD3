<?php
// logout.php - destroys the session and sends the user back to login
// Group: Dev101, McMaster CS Society

session_start();
session_destroy();
header('Location: login.php');
exit;
?>