<?php
header('Content-Type: application/json');

$usersFile = __DIR__ . '/../../data/users.json';
$users = file_exists($usersFile) ? json_decode(file_get_contents($usersFile), true) : [];

$data = json_decode(file_get_contents("php://input"), true);

// Vérification des champs
if (
    empty($data['username']) ||
    empty($data['email']) ||
    empty($data['password'])
) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => "Champs obligatoires manquants."]);
    exit;
}

// Vérifie si l'utilisateur existe déjà
foreach ($users as $user) {
    if ($user['username'] === $data['username']) {
        echo json_encode(['success' => false, 'error' => "Nom d'utilisateur déjà pris."]);
        exit;
    }
}

// Création d'un nouvel utilisateur
$newUser = [
    'id' => uniqid(),
    'username' => $data['username'],
    'email' => $data['email'],
    'password' => password_hash($data['password'], PASSWORD_DEFAULT),
    'role' => 'cuisinier', // Role par défaut
    'second_role' => null,
    'role_request' => $data['role_request'] ?? null
];

// Ajout dans la liste des utilisateurs
$users[] = $newUser;
file_put_contents($usersFile, json_encode($users, JSON_PRETTY_PRINT));

// Réponse
echo json_encode([
    'success' => true,
    'token' => bin2hex(random_bytes(16)),
    'user' => [
        'id' => $newUser['id'],
        'username' => $newUser['username'],
        'email' => $newUser['email'],
        'role' => $newUser['role'],
        'role_request' => $newUser['role_request']
    ]
]);
