<?php
header('Content-Type: application/json');
$recipesFile = __DIR__ . '/../../data/recipes.json';

// Si le fichier n'existe pas, renvoyer null
if (!file_exists($recipesFile)) {
    echo json_encode(null);
    exit;
}

$recipes = json_decode(file_get_contents($recipesFile), true);
$requestedId = $_GET['id'] ?? null;

// Si aucun ID n'est fourni, renvoyer null
if (!$requestedId) {
    echo json_encode(null);
    exit;
}

// Recherche de la recette correspondant à l'ID
$foundRecipe = null;
foreach ($recipes as $recipe) {
    if ($recipe['id'] === $requestedId) {
        $foundRecipe = $recipe;
        break;
    }
}

echo json_encode($foundRecipe);
