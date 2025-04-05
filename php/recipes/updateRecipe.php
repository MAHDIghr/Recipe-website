<?php
header('Content-Type: application/json');
$recipesFile = __DIR__ . '/../../data/recipes.json';

// Récupération des données
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Alternative pour les données form-data
if (empty($data)) {
    $data = $_POST;
    if (isset($data['recipe'])) {
        $data = json_decode($data['recipe'], true);
    }
}

if (!$data || !isset($data['id'])) {
    echo json_encode(['success' => false, 'message' => 'Données invalides']);
    exit;
}

// Charger toutes les recettes
$recipes = file_exists($recipesFile) ? json_decode(file_get_contents($recipesFile), true) : [];
$updated = false;

// Mettre à jour la recette
foreach ($recipes as &$recipe) {
    if ($recipe['id'] === $data['id']) {
        $recipe = $data;
        $updated = true;
        break;
    }
}

// Sauvegarder
if ($updated) {
    if (file_put_contents($recipesFile, json_encode($recipes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) !== false) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Erreur d\'écriture fichier']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Recette non trouvée']);
}