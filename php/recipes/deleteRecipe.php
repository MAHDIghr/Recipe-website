<?php
// Indique que la réponse sera en JSON
header('Content-Type: application/json');

// Chemin vers le fichier contenant les recettes
$recipesFile = __DIR__ . '/../../data/recipes.json';

// Récupère l'identifiant de la recette depuis la requête POST
$recipeId = $_POST['id'] ?? null;

// Si aucun ID n'est fourni, on renvoie une erreur
if (!$recipeId) {
    echo json_encode(['success' => false, 'message' => 'ID manquant']);
    exit;
}

// Lit et décode le fichier JSON contenant les recettes
$recipes = file_exists($recipesFile) ? json_decode(file_get_contents($recipesFile), true) : [];

// Supprime la recette dont l'ID correspond à celui envoyé
$newRecipes = array_filter($recipes, fn($r) => $r['id'] !== $recipeId);

// Si une recette a bien été supprimée (le tableau a changé)
if (count($newRecipes) < count($recipes)) {
    // Réindexe le tableau et réécrit le fichier JSON avec les nouvelles données
    file_put_contents($recipesFile, json_encode(array_values($newRecipes), JSON_PRETTY_PRINT));
    echo json_encode(['success' => true]);
} else {
    // Aucune recette avec l'ID donné n'a été trouvée
    echo json_encode(['success' => false, 'message' => 'Recette non trouvée']);
}
