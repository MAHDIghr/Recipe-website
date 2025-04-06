<?php
header('Content-Type: application/json');
$recipesFile = __DIR__ . '/../../data/recipes.json';

if (!file_exists($recipesFile)) {
    echo json_encode([]);
    exit;
}

$recipes = json_decode(file_get_contents($recipesFile), true);
$pendingRecipes = array_filter($recipes, fn($r) => isset($r['status']) && $r['status'] === 'nonAccepted');

echo json_encode(array_values($pendingRecipes));
?>