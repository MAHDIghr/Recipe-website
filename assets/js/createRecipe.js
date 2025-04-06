$(document).ready(function() {
    // Vérification du rôle
    const user = JSON.parse(localStorage.getItem("userData"));
    if (!user || user.role !== 'chef') {
        window.location.href = "welcomePage.html";
        return;
    }

    // Affichage des infos utilisateur
    $('#username').text(user.username);
    $('#userRole').text(user.role);

    // Gestion des boutons
    $('#backBtn').click(() => window.history.back());
    $('#logoutBtn').click(() => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        window.location.href = "loginSignUp.html";
    });

    // Variables pour stocker les images
    let uploadedImages = [];
    let preferredImage = '';

    // Gestion des ingrédients et étapes
    $('#addIngredientFR').click(() => addIngredient('FR'));
    $('#addIngredientEN').click(() => addIngredient('EN'));
    $('#addStepFR').click(() => addStep('FR'));
    $('#addStepEN').click(() => addStep('EN'));

    // Gestion de l'upload d'images
    $('#recipeImages').change(handleImageUpload);
    
    // Gestion de la soumission du formulaire
    $('#recipeForm').submit(createRecipe);

    // Fonctions helper
    function addIngredient(lang) {
        const container = $(`#ingredients${lang}Container`);
        const newItem = $(`
            <div class="ingredient-item">
                <input type="text" placeholder="${lang === 'FR' ? 'Quantité' : 'Quantity'}" class="ingredient-quantity">
                <input type="text" placeholder="${lang === 'FR' ? 'Nom' : 'Name'}" class="ingredient-name">
                <input type="text" placeholder="${lang === 'FR' ? 'Type (ex: Viande)' : 'Type (ex: Meat)'}" class="ingredient-type">
                <button type="button" class="remove-btn"><i class="fas fa-times"></i></button>
            </div>
        `);
        container.append(newItem);
        newItem.find('.remove-btn').click(function() {
            $(this).parent().remove();
        });
    }

    function addStep(lang) {
        const container = $(`#steps${lang}Container`);
        const newItem = $(`
            <div class="step-item">
                <textarea placeholder="${lang === 'FR' ? 'Description de l\'étape' : 'Step description'}"></textarea>
                <input type="number" placeholder="${lang === 'FR' ? 'Durée (minutes)' : 'Duration (minutes)'}" min="0">
                <button type="button" class="remove-btn"><i class="fas fa-times"></i></button>
            </div>
        `);
        container.append(newItem);
        newItem.find('.remove-btn').click(function() {
            $(this).parent().remove();
        });
    }

    function handleImageUpload(e) {
        const files = e.target.files;
        if (!files) return;

        const previewContainer = $('#imagePreview').empty();
        $('#preferredImage').empty().append('<option value="">Sélectionnez une image préférée</option>');

        Array.from(files).forEach(file => {
            if (!file.type.match('image.*')) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                const imageId = 'img-' + Date.now();
                uploadedImages.push({
                    id: imageId,
                    file: file,
                    url: e.target.result
                });

                const previewItem = $(`
                    <div class="image-preview-item">
                        <img src="${e.target.result}" alt="Preview">
                        <button type="button" class="remove-btn remove-img" data-id="${imageId}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `);
                previewContainer.append(previewItem);

                $('#preferredImage').append(`<option value="${imageId}">${file.name}</option>`);
            };
            reader.readAsDataURL(file);
        });

        $('#preferredImage').prop('disabled', false);
    }

    // Suppression d'image
    $('#imagePreview').on('click', '.remove-img', function() {
        const imageId = $(this).data('id');
        uploadedImages = uploadedImages.filter(img => img.id !== imageId);
        $(this).parent().remove();

        // Mettre à jour la liste déroulante
        $('#preferredImage option[value="' + imageId + '"]').remove();
        if (uploadedImages.length === 0) {
            $('#preferredImage').prop('disabled', true);
        }
    });

    // Sélection de l'image préférée
    $('#preferredImage').change(function() {
        preferredImage = $(this).val();
    });

    async function createRecipe(e) {
        e.preventDefault();
        
        // Validation de base
        const recipeName = $('#recipeName').val().trim();
        if (!recipeName) {
            alert('Le nom de la recette est obligatoire');
            return;
        }

        // Récupération des données du formulaire
        const recipeData = {
            id: 'rec-' + Date.now(),
            name: recipeName,
            nameFR: $('#recipeNameFR').val().trim() || null,
            Author: user.username,
            status: 'nonAccepted',
            Without: $('input[name="dietTags"]:checked').map((i, el) => $(el).val()).get(),
            ingredients: getIngredients('EN'),
            ingredientsFR: getIngredients('FR'),
            steps: getSteps('EN'),
            stepsFR: getSteps('FR'),
            timers: getTimers('EN'),
            imageURL: [],
            imagePreferred: '',
            langues: [],
            likes: 0,
            likedBy: [],
            comments: [],
            originalURL: $('#originalUrl').val().trim() || '',
            createdAt: new Date().toISOString()
        };

        // Déterminer les langues disponibles
        if (recipeData.nameFR || recipeData.ingredientsFR.length > 0 || recipeData.stepsFR.length > 0) {
            recipeData.langues.push('fr');
        }
        if (recipeData.ingredients.length > 0 || recipeData.steps.length > 0) {
            recipeData.langues.push('en');
        }

        // Upload des images si elles existent
        if (uploadedImages.length > 0) {
            try {
                const formData = new FormData();
                uploadedImages.forEach(img => {
                    formData.append('images[]', img.file);
                });

                const uploadResponse = await $.ajax({
                    url: 'php/recipes/uploadImages.php',
                    type: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false
                });

                recipeData.imageURL = uploadResponse.imagePaths;
                
                // Définir l'image préférée
                if (preferredImage) {
                    const preferredImg = uploadedImages.find(img => img.id === preferredImage);
                    if (preferredImg) {
                        const preferredIndex = uploadedImages.findIndex(img => img.id === preferredImage);
                        recipeData.imagePreferred = uploadResponse.imagePaths[preferredIndex];
                    }
                } else {
                    recipeData.imagePreferred = uploadResponse.imagePaths[0];
                }
            } catch (error) {
                console.error("Erreur lors de l'upload des images:", error);
                alert("Une erreur est survenue lors de l'upload des images");
                return;
            }
        }

        // Enregistrement de la recette
        try {
            const response = await $.ajax({
                url: 'php/recipes/createRecipe.php',
                type: 'POST',
                data: { recipe: JSON.stringify(recipeData) },
                dataType: 'json'
            });

            if (response.success) {
                alert('Recette créée avec succès! Elle est maintenant en attente de validation.');
                window.location.href = "welcomePage.html";
            } else {
                alert('Erreur lors de la création: ' + (response.message || 'Erreur inconnue'));
            }
        } catch (error) {
            console.error("Erreur:", error.responseText);
            alert('Une erreur est survenue lors de la création de la recette');
        }
    }

    function getIngredients(lang) {
        const ingredients = [];
        $(`#ingredients${lang}Container .ingredient-item`).each(function() {
            const quantity = $(this).find('.ingredient-quantity').val().trim();
            const name = $(this).find('.ingredient-name').val().trim();
            const type = $(this).find('.ingredient-type').val().trim();
            
            if (name) {
                ingredients.push({
                    quantity: quantity || '',
                    name: name,
                    type: type || 'Misc'
                });
            }
        });
        return ingredients;
    }

    function getSteps(lang) {
        const steps = [];
        $(`#steps${lang}Container .step-item`).each(function() {
            const description = $(this).find('textarea').val().trim();
            if (description) {
                steps.push(description);
            }
        });
        return steps;
    }

    function getTimers(lang) {
        const timers = [];
        $(`#steps${lang}Container .step-item`).each(function() {
            const duration = parseInt($(this).find('input[type="number"]').val()) || 0;
            timers.push(duration);
        });
        return timers;
    }
});