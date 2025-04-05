<?php
header('Content-Type: application/json');
$usersFile = __DIR__ . '/../../data/users.json';

$input = json_decode(file_get_contents('php://input'), true);
$userId = $input['userId'] ?? null;
$newRole = $input['newRole'] ?? null;

if (!$userId || !$newRole) {
    echo json_encode(['success' => false, 'message' => 'Données invalides']);
    exit;
}

$users = file_exists($usersFile) ? json_decode(file_get_contents($usersFile), true) : [];
$updated = false;

foreach ($users as &$user) {
    if ($user['id'] === $userId) {
        if ($newRole === 'traducteur') {
            $user['second_role'] = $newRole;
        } elseif ($newRole === 'chef') {
            $user['role'] = $newRole;
        } else {
            echo json_encode(['success' => false, 'message' => 'Rôle non pris en charge']);
            exit;
        }
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
