<?php
header('Content-Type: application/json');
$usersFile = __DIR__ . '/../../data/users.json';

if (!file_exists($usersFile)) {
    echo json_encode(['chefRequests' => [], 'translatorRequests' => []]);
    exit;
}

$users = json_decode(file_get_contents($usersFile), true);
$chefRequests = array_filter($users, fn($u) => $u['role_request'] === 'demande_chef');
$translatorRequests = array_filter($users, fn($u) => $u['role_request'] === 'demande_traducteur');

echo json_encode([
    'chefRequests' => array_values($chefRequests),
    'translatorRequests' => array_values($translatorRequests)
]);
?>