<?php
header('Content-Type: application/json');

session_start();

// Vérifier les données reçues
$input = json_decode(file_get_contents('php://input'), true);
$recipeData = $input['recipe'] ?? null;

if (!$recipeData) {
    $recipeData = $_POST['recipe'] ?? null;
    if ($recipeData) {
        $recipeData = json_decode($recipeData, true);
    }
}

if (!$recipeData) {
    echo json_encode(['success' => false, 'message' => 'Données invalides']);
    exit;
}

// Chemin vers le fichier des recettes
$recipesFile = __DIR__ . '/../../data/recipes.json';

// Charger les recettes existantes
$recipes = [];
if (file_exists($recipesFile)) {
    $recipes = json_decode(file_get_contents($recipesFile), true);
}

// Ajouter la nouvelle recette
$recipes[] = $recipeData;

// Sauvegarder
if (file_put_contents($recipesFile, json_encode($recipes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la sauvegarde']);
}
?>