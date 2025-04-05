<?php
header('Content-Type: application/json');
$usersFile = __DIR__ . '/../../data/users.json';

$userId = $_POST['id'] ?? null;
if (!$userId) {
    echo json_encode(['success' => false, 'message' => 'ID utilisateur manquant']);
    exit;
}

$users = file_exists($usersFile) ? json_decode(file_get_contents($usersFile), true) : [];
$updated = false;

foreach ($users as &$user) {
    if ($user['id'] === $userId) {
        $user['role_request'] = null;
        $updated = true;
        break;
    }
}

if ($updated) {
    file_put_contents($usersFile, json_encode($users, JSON_PRETTY_PRINT));
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Utilisateur non trouvé']);
}
?>