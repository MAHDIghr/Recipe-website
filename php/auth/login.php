<?php
header('Content-Type: application/json');

$usersFile = __DIR__ . '/../../data/users.json';

$users = file_exists($usersFile) ? json_decode(file_get_contents($usersFile), true) : [];

$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';

// Validation
if (!$username || !$password) {
    echo json_encode(['success' => false, 'error' => 'Champs requis manquants.']);
    exit;
}

// Vérifie l'utilisateur
$foundUser = null;
foreach ($users as $user) {
    if ($user['username'] === $username && password_verify($password, $user['password'])) {
        $foundUser = $user;
        break;
    }
}

if (!$foundUser) {
    echo json_encode(['success' => false, 'error' => 'Identifiants invalides.']);
    exit;
}

// Réponse
echo json_encode([
    'success' => true,
    'token' => bin2hex(random_bytes(16)),
    'user' => [
        'id' => $foundUser['id'],
        'username' => $foundUser['username'],
        'email' => $foundUser['email'],
        'role' => $foundUser['role'],
        'second_role' => $foundUser['second_role'],
        'role_request' => $foundUser['role_request'] ?? null
    ]
]);
