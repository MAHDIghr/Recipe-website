<?php
header('Content-Type: application/json');
$recipesFile = __DIR__ . '/../../data/recipes.json';

if (!file_exists($recipesFile)) {
    echo json_encode(null);
    exit;
}

$recipes = json_decode(file_get_contents($recipesFile), true);
$requestedId = $_GET['id'] ?? null;

if (!$requestedId) {
    echo json_encode(null);
    exit;
}

$foundRecipe = null;
foreach ($recipes as $recipe) {
    if ($recipe['id'] === $requestedId) {
        $foundRecipe = $recipe;
        break;
    }
}

echo json_encode($foundRecipe);