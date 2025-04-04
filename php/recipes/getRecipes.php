<?php
header('Content-Type: application/json');
$recipesFile = __DIR__ . '/../../data/recipes.json';

if (!file_exists($recipesFile)) {
    echo json_encode([]);
    exit;
}

$recipes = json_decode(file_get_contents($recipesFile), true);

// Ajoute un ID unique si absent
foreach ($recipes as &$recipe) {
    if (!isset($recipe['id'])) {
        $recipe['id'] = uniqid();
    }
}

echo json_encode($recipes);