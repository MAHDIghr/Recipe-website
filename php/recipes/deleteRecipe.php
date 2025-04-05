<?php
header('Content-Type: application/json');
$recipesFile = __DIR__ . '/../../data/recipes.json';

$recipeId = $_POST['id'] ?? null;

if (!$recipeId) {
    echo json_encode(['success' => false, 'message' => 'ID manquant']);
    exit;
}

$recipes = file_exists($recipesFile) ? json_decode(file_get_contents($recipesFile), true) : [];
$newRecipes = array_filter($recipes, fn($r) => $r['id'] !== $recipeId);

if (count($newRecipes) < count($recipes)) {
    file_put_contents($recipesFile, json_encode(array_values($newRecipes), JSON_PRETTY_PRINT));
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Recette non trouvée']);
}