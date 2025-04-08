$(document).ready(function() {
    // Vérification du rôle
    const user = JSON.parse(localStorage.getItem("userData"));
    if (!user || user.role !== 'chef') {
        window.location.href = "welcomePage.html";
        return;
    }

    // Affichage des infos utilisateur
    $('#username').text(user.username);
    $('#userRole').text(
        user.second_role === "traducteur" 
          ? `${user.role} / ${user.second_role}`
          : user.role
    );

    // Gestion des boutons
    $('#backBtn').click(() => window.history.back());
    $('#logoutBtn').click(() => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        window.location.href = "loginSignUp.html";
    });

    // Variables pour stocker les images
    let uploadedImages = [];
    let deletedImages = [];

    // Gestion des ingrédients et étapes
    $('#addIngredientFR').click(() => addIngredient('FR'));
    $('#addIngredientEN').click(() => addIngredient('EN'));
    $('#addStepFR').click(() => addStep('FR'));
    $('#addStepEN').click(() => addStep('EN'));

    // Gestion de l'upload d'images
    $('#addLocalImageBtn').click(() => $('#imageUploadInput').click());
    $('#addUrlImageBtn').click(() => $('#urlImageModal').show());
    $('.close-modal').click(() => $('#urlImageModal').hide());
    $('#confirmUrlImageBtn').click(addImageFromUrl);
    $('#imageUploadInput').change(handleImageUpload);
    
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

    // Affichage des images
    function displayImages(images) {
        const container = $('#imagesPreview').empty();
        const preferredSelect = $('#preferredImage').empty().append('<option value="">Sélectionner une image</option>');

        images.forEach((img, index) => {
            const isLocal = img.startsWith('uploads/');
            const imgUrl = isLocal ? '../' + img : img;
            
            const imgElement = $(`
                <div class="image-preview-item" data-index="${index}">
                    <img src="${imgUrl}" alt="Preview">
                    <div class="image-actions">
                        <button type="button" class="set-preferred-btn" title="Définir comme image préférée">
                            <i class="fas fa-star"></i>
                        </button>
                        <button type="button" class="delete-image-btn" title="Supprimer cette image">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `);

            container.append(imgElement);
            preferredSelect.append(`<option value="${img}">Image ${index + 1}</option>`);

            // Gestion des événements
            imgElement.find('.set-preferred-btn').click(() => {
                $('#preferredImage').val(img);
            });

            imgElement.find('.delete-image-btn').click(() => {
                if (confirm("Supprimer cette image ?")) {
                    uploadedImages = uploadedImages.filter((_, i) => i !== index);
                    displayImages(uploadedImages);
                    if ($('#preferredImage').val() === img) {
                        $('#preferredImage').val('');
                    }
                }
            });
        });

        // Active le sélecteur s'il y a des images
        $('#preferredImage').prop('disabled', uploadedImages.length === 0);
    }

    // Gestion de l'upload d'images locales
    function handleImageUpload(e) {
        const files = e.target.files;
        if (!files.length) return;

        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('images[]', files[i]);
        }

        $.ajax({
            url: 'php/recipes/uploadImages.php',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: (response) => {
                if (response.success) {
                    uploadedImages = [...uploadedImages, ...response.imagePaths];
                    displayImages(uploadedImages); // Affiche toutes les images
                } else {
                    alert("Erreur lors de l'upload: " + response.message);
                }
            },
            error: (xhr) => {
                console.error("Erreur:", xhr.responseText);
                alert("Erreur lors de l'upload des images");
            }
        });
    }

    // Ajout d'une image par URL
    function addImageFromUrl() {
        const url = $('#imageUrl').val().trim();
        if (!url) {
            alert("Veuillez entrer une URL valide");
            return;
        }

        // Vérification simple de l'URL
        if (!url.match(/^https?:\/\/.+\..+/) || !url.match(/\.(jpeg|jpg|gif|png|svg)$/)) {
            alert("URL d'image invalide. Doit commencer par http/https et se terminer par .jpg, .png ou .gif .svg .jpeg");
            return;
        }

        uploadedImages.push(url);
        displayImages(uploadedImages); // Affiche toutes les images
        $('#imageUrl').val('');
        $('#urlImageModal').hide();
    }

    async function createRecipe(e) {
        e.preventDefault();
        
        // Validation de base
        const recipeName = $('#recipeName').val().trim();
        if (!recipeName) {
            alert('Le nom de la recette est obligatoire');
            return;
        }

        // Vérification du nombre d'ingrédients
        const ingredientsEN = getIngredients('EN');
        if (ingredientsEN === null) return;
        
        const ingredientsFR = getIngredients('FR');
        if (ingredientsFR === null) return;

        if (ingredientsEN.length !== ingredientsFR.length && (ingredientsEN.length > 0 && ingredientsFR.length > 0)) {
            alert('Le nombre d\'ingrédients en français doit être égal au nombre d\'ingrédients en anglais');
            return;
        }

        // Vérification du nombre d'étapes
        const stepsEN = getSteps('EN');
        const stepsFR = getSteps('FR');
        if (stepsEN.length !== stepsFR.length && (stepsEN.length > 0 && stepsFR.length > 0)) {
            alert('Le nombre d\'étapes en français doit être égal au nombre d\'étapes en anglais');
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
            ingredients: ingredientsEN,
            ingredientsFR: ingredientsFR,
            steps: stepsEN,
            stepsFR: stepsFR,
            timers: getTimers('EN'),
            imageURL: uploadedImages,
            imagePreferred: $('#preferredImage').val() || (uploadedImages.length > 0 ? uploadedImages[0] : ''),
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
        let hasError = false;
        
        $(`#ingredients${lang}Container .ingredient-item`).each(function() {
            const quantity = $(this).find('.ingredient-quantity').val().trim();
            const name = $(this).find('.ingredient-name').val().trim();
            const type = $(this).find('.ingredient-type').val().trim();
            
            const fields = [quantity, name, type];
            const filledFields = fields.filter(field => field !== '');
            
            if (filledFields.length > 0 && filledFields.length < 3) {
                alert(`Pour l'ingrédient en ${lang === 'FR' ? 'français' : 'anglais'}, vous devez remplir tous les champs ou aucun.`);
                hasError = true;
                return false;
            }
            
            if (name) {
                ingredients.push({
                    quantity: quantity,
                    name: name,
                    type: type || 'Misc'
                });
            }
        });
        
        if (hasError) return null;
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