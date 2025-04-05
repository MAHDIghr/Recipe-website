<?php
header('Content-Type: application/json');
$recipesFile = __DIR__ . '/../../data/recipes.json';

$input = json_decode(file_get_contents('php://input'), true);
$recipeId = $input['id'] ?? null;
$newStatus = $input['status'] ?? null;

if (!$recipeId || !$newStatus) {
    echo json_encode(['success' => false, 'message' => 'Données invalides']);
    exit;
}

$recipes = file_exists($recipesFile) ? json_decode(file_get_contents($recipesFile), true) : [];
$updated = false;

foreach ($recipes as &$recipe) {
    if ($recipe['id'] === $recipeId) {
        $recipe['status'] = $newStatus;
        $updated = true;
        break;
    }
}

if ($updated) {
    file_put_contents($recipesFile, json_encode($recipes, JSON_PRETTY_PRINT));
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Recette non trouvée']);
}
?>