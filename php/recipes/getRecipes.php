<?php
header('Content-Type: application/json');

// Chemin vers le fichier JSON des recettes
$recipesFile = __DIR__ . '/../../data/recipes.json';

// Si le fichier n'existe pas, retourner une liste vide
if (!file_exists($recipesFile)) {
    echo json_encode([]);
    exit;
}

// Lecture et décodage des recettes
$recipes = json_decode(file_get_contents($recipesFile), true);

$acceptedRecipes = [];

foreach ($recipes as &$recipe) {
    // Génère un ID unique si manquant
    if (!isset($recipe['id'])) {
        $recipe['id'] = uniqid();
    }

    // Ne garder que les recettes avec le statut "accepted"
    if (isset($recipe['status']) && $recipe['status'] === 'accepted') {
        $acceptedRecipes[] = $recipe;
    }
}

// Retourne uniquement les recettes acceptées
echo json_encode($acceptedRecipes);
