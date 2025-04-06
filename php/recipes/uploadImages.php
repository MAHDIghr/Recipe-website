<?php
header('Content-Type: application/json');
session_start();

// Vérifier si des fichiers ont été uploadés
if (empty($_FILES['images'])) {
    echo json_encode(['success' => false, 'message' => 'Aucune image uploadée']);
    exit;
}

$uploadedPaths = [];
$uploadDir = __DIR__ . '/../../uploads/';

// Créer le dossier uploads s'il n'existe pas
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Traiter chaque image
foreach ($_FILES['images']['tmp_name'] as $key => $tmpName) {
    if ($_FILES['images']['error'][$key] !== UPLOAD_ERR_OK) {
        continue;
    }

    // Vérifier que c'est bien une image
    $imageInfo = getimagesize($tmpName);
    if ($imageInfo === false) {
        continue; // Ce n'est pas une image
    }

    // Vérifier le type MIME
    $mime = $imageInfo['mime'];
    if (!in_array($mime, ['image/jpeg', 'image/png', 'image/gif'])) {
        continue; // Type non autorisé
    }

    // Générer un nom de fichier unique
    $extension = pathinfo($_FILES['images']['name'][$key], PATHINFO_EXTENSION);
    $filename = uniqid('img_') . '.' . $extension;
    $destination = $uploadDir . $filename;

    // Déplacer le fichier
    if (move_uploaded_file($tmpName, $destination)) {
        $uploadedPaths[] = 'uploads/' . $filename;
    }
}

if (empty($uploadedPaths)) {
    echo json_encode(['success' => false, 'message' => 'Aucune image valide uploadée']);
    exit;
}

echo json_encode([
    'success' => true,
    'imagePaths' => $uploadedPaths
]);
?>
