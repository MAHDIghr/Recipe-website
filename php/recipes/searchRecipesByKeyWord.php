<?php
header('Content-Type: application/json');

// Récupérer le terme de recherche
$searchTerm = isset($_GET['term']) ? strtolower($_GET['term']) : '';

// Charger toutes les recettes
$recipes = json_decode(file_get_contents('../../data/recipes.json'), true);

// Filtrer les recettes
$filteredRecipes = array_filter($recipes, function($recipe) use ($searchTerm) {
    // Vérifier si le terme de recherche est vide
    if (empty($searchTerm)) {
        return true;
    }

    // Vérifier le nom de la recette (FR et EN)
    $nameMatch = isset($recipe['name']) && strpos(strtolower($recipe['name']), $searchTerm) !== false;
    $nameFRMatch = isset($recipe['nameFR']) && strpos(strtolower($recipe['nameFR']), $searchTerm) !== false;

    // Vérifier les ingrédients
    $ingredientsMatch = false;
    if (isset($recipe['ingredients'])) {
        foreach ($recipe['ingredients'] as $ingredient) {
            if (isset($ingredient['name']) && strpos(strtolower($ingredient['name']), $searchTerm) !== false) {
                $ingredientsMatch = true;
                break;
            }
        }
    }

    // Vérifier les étapes
    $stepsMatch = false;
    if (isset($recipe['steps'])) {
        foreach ($recipe['steps'] as $step) {
            if (strpos(strtolower($step), $searchTerm) !== false) {
                $stepsMatch = true;
                break;
            }
        }
    }

    // Vérifier les tags
    $tagsMatch = false;
    if (isset($recipe['Without'])) {
        foreach ($recipe['Without'] as $tag) {
            if (strpos(strtolower($tag), $searchTerm) !== false) {
                $tagsMatch = true;
                break;
            }
        }
    }

    // Vérifier l'auteur
    $authorMatch = isset($recipe['Author']) && strpos(strtolower($recipe['Author']), $searchTerm) !== false;

    return $nameMatch || $nameFRMatch || $ingredientsMatch || $stepsMatch || $tagsMatch || $authorMatch;
});

// Réindexer le tableau pour éviter les trous dans les indices
$filteredRecipes = array_values($filteredRecipes);

echo json_encode($filteredRecipes);
?>