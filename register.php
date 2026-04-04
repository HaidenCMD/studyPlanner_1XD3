<?php
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
    } else {
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
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sign Up | StudentPlanner</title>
  <link rel="stylesheet" href="css/style.css" />
  <style>
    .auth-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .auth-card { background: var(--card); border: 1px solid var(--border); border-radius: 22px; padding: 36px 40px; width: 100%; max-width: 420px; }
    .auth-card h1 { font-size: 22px; margin-bottom: 6px; }
    .auth-card p { font-size: 13px; color: var(--txt2); margin-bottom: 24px; }
    .auth-error { background: rgba(255,90,106,0.12); color: var(--red); border: 1px solid rgba(255,90,106,0.25); border-radius: 8px; padding: 10px 14px; font-size: 13px; margin-bottom: 16px; }
    .auth-footer { margin-top: 20px; font-size: 13px; color: var(--txt2); text-align: center; }
    .auth-footer a { color: var(--blue); }
  </style>
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
          <input type="text" id="name" name="name" placeholder="e.g. Hani Mahdi" required />
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input type="text" id="email" name="email" placeholder="you@mcmaster.ca" required />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" placeholder="Choose a password" required />
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:8px;">Create Account</button>
      </form>
      <div class="auth-footer">Already have an account? <a href="login.php">Sign in</a></div>
    </div>
  </div>
</body>
</html>
