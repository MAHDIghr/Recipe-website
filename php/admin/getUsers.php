<?php
header('Content-Type: application/json');
$usersFile = __DIR__ . '/../../data/users.json';

if (!file_exists($usersFile)) {
    echo json_encode([]);
    exit;
}

$users = json_decode(file_get_contents($usersFile), true);
echo json_encode($users);
?>