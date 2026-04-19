<?php
// Hani worked on user accounts and courses
// did login and signup stuff + sessions so users stay logged in
// also made add/edit/delete for courses
// connected it to database with php and sql
// made sure courses are tied to the correct user

session_start();
if (isset($_SESSION['user_id'])) {
    header('Location: index.php');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require 'db.php';
    $name     = trim($_POST['name'] ?? '');
    $email    = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if (!$name || !$email || !$password) {
        $error = 'All fields are required.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'Please enter a valid email address (e.g. you@mcmaster.ca).';
    } else {
        // check if someone already registered with this email
        $stmt = $pdo->prepare('SELECT user_id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            $error = 'An account with that email already exists.';
        } else {
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
            $stmt->execute([$name, $email, $hash]);
            $_SESSION['user_id']   = (int) $pdo->lastInsertId();
            $_SESSION['user_name'] = $name;
            header('Location: index.php');
            exit;
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sign Up - Student Planner</title>
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>
  <div class="auth-wrap">
    <div class="auth-card">
      <h1>Create Account</h1>
      <p>Sign up to start tracking your assignments.</p>
      <?php if ($error): ?>
        <div class="auth-error"><?= htmlspecialchars($error) ?></div>
      <?php endif; ?>
      <form method="POST">
        <div class="form-group">
          <label for="name">Full Name</label>
          <input type="text" id="name" name="name" placeholder="e.g. Jane Smith" required />
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" placeholder="you@mcmaster.ca" required />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" placeholder="Choose a password" required />
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%; margin-top:8px;">Create Account</button>
      </form>
      <div class="auth-footer">Already have an account? <a href="login.php">Sign in</a></div>
    </div>
  </div>
</body>
</html>