<?php
// login.php - handles user login
// Group: Dev101, McMaster CS Society
// checks the submitted email and password, starts a session if correct

session_start();
if (isset($_SESSION['user_id'])) {
    header('Location: index.php');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require 'db.php';
    $email    = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'Please enter a valid email address.';
    } else {
        $stmt = $pdo->prepare('SELECT user_id, name, password_hash FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            $_SESSION['user_id']   = $user['user_id'];
            $_SESSION['user_name'] = $user['name'];
            header('Location: index.php');
            exit;
        }

        $error = 'Incorrect email or password.';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sign In - Student Planner</title>
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>
  <div class="auth-wrap">
    <div class="auth-card">
      <h1>Sign In</h1>
      <p>Log in to your Student Planner account.</p>
      <?php if ($error): ?>
        <div class="auth-error"><?= htmlspecialchars($error) ?></div>
      <?php endif; ?>
      <form method="POST">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" placeholder="you@mcmaster.ca" required />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" placeholder="Your password" required />
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%; margin-top:8px;">Sign In</button>
      </form>
      <div class="auth-footer">Don't have an account? <a href="register.php">Sign up</a></div>
    </div>
  </div>
</body>
</html>