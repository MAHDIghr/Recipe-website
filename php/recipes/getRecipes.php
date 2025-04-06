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

// Générer un id unique s'il manque
foreach ($recipes as &$recipe) {
    if (!isset($recipe['id'])) {
        $recipe['id'] = uniqid();
    }
}

// Retourner toutes les recettes (sans filtre)
echo json_encode($recipes);
?>
