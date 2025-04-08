$(document).ready(function () {
    // Variables globales
    const user = JSON.parse(localStorage.getItem("userData"));
    const recipeId = new URLSearchParams(window.location.search).get('id');
    let currentRecipe = null;
    let uploadedImages = [];
    let deletedImages = [];

    // Redirection si utilisateur non connecté
    if (!user) {
        window.location.href = "loginSignUp.html";
        return;
    }

    // Initialisation de l'interface
    $('#username').text(user.username);
    $('#userRole').text(
        user.second_role === "traducteur" 
          ? `${user.role} / ${user.second_role}`
          : user.role
    );

    // Gestion des événements
    $('#backBtn, #cancelBtn').click(() => window.history.back());
    $('#logoutBtn').click(logout);
    $('#addLocalImageBtn').click(() => $('#imageUploadInput').click());
    $('#addUrlImageBtn').click(() => $('#urlImageModal').show());
    $('.close-modal').click(() => $('#urlImageModal').hide());
    $('#confirmUrlImageBtn').click(addImageFromUrl);
    $('#imageUploadInput').change(handleImageUpload);
    $('#editRecipeForm').submit(saveRecipe);

    // Chargement de la recette
    if (recipeId) {
        loadRecipe(recipeId);
    } else {
        showError("Aucune recette sélectionnée");
        window.location.href = "welcomePage.html";
    }

    // Fonction pour charger une recette
    function loadRecipe(id) {
        $.get(`php/recipes/getRecipeById.php?id=${id}`)
            .done(recipe => {
                if (!recipe) {
                    showError("Recette non trouvée");
                    return;
                }

                // Vérification des permissions (il doit etre soit un chef et la recette lui appartient ou bien c'est un admin)
                if (user.role !== 'admin' && user.username !== recipe.Author && user.role !== 'chef' ) {
                    showError("Vous n'avez pas la permission de modifier cette recette");
                    setTimeout(() => window.history.back(), 2000);
                    return;
                }

                currentRecipe = recipe;
                displayRecipe(recipe);
            })
            .fail(xhr => {
                console.error("Erreur:", xhr.responseText);
                showError("Erreur de chargement");
            });
    }

    // Affichage de la recette dans le formulaire
    function displayRecipe(recipe) {
        // Informations de base
        $('#recipeNameFR').val(recipe.nameFR || '');
        $('#recipeNameEN').val(recipe.name || '');
        $('#originalURL').val(recipe.originalURL || '');

        // Tags alimentaires
        $('input[name="dietTags"]').prop('checked', false);
        (recipe.Without || []).forEach(tag => {
            $(`input[name="dietTags"][value="${tag}"]`).prop('checked', true);
        });

        // Images
        displayImages(recipe.imageURL || []);
        if (recipe.imagePreferred) {
            $('#preferredImage').val(recipe.imagePreferred);
        }

        // Ingrédients
        displayIngredients(recipe.ingredients || [], 'en');
        displayIngredients(recipe.ingredientsFR || recipe.ingredients || [], 'fr');

        // Étapes
        displaySteps(recipe.steps || [], 'en');
        displaySteps(recipe.stepsFR || recipe.steps || [], 'fr');

        // Gestion des onglets
        $('.tab-btn').click(function() {
            const lang = $(this).data('lang');
            $(`.tab-content`).removeClass('active');
            $(`#ingredients${lang.toUpperCase()}, #steps${lang.toUpperCase()}`).addClass('active');
            $(`.tab-btn`).removeClass('active');
            $(this).addClass('active');
        });

        // Boutons d'ajout
        $('.add-ingredient-btn').click(function() {
            addIngredientField($(this).data('lang'));
        });

        $('.add-step-btn').click(function() {
            addStepField($(this).data('lang'));
        });
    }

    // Affichage des images
    function displayImages(images) {
        const container = $('#imagesPreview').empty();
        const preferredSelect = $('#preferredImage').empty().append('<option value="">Sélectionner une image</option>');

        images.forEach((img, index) => {
            const isLocal = img.startsWith('uploads/');
            const imgElement = $(`
                <div class="image-preview-item" data-index="${index}">
                    <img src="${isLocal ? '../' + img : img}" alt="Preview">
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
                    deletedImages.push(img);
                    imgElement.remove();
                    preferredSelect.find(`option[value="${img}"]`).remove();
                }
            });
        });
    }

    // Affichage des ingrédients
    function displayIngredients(ingredients, lang) {
        const container = $(`#ingredientsList${lang.toUpperCase()}`).empty();
        ingredients.forEach((ing, index) => {
            if (ing.name) {
                addIngredientField(lang, ing.quantity, ing.name, ing.type);
            }
        });
    }

    // Ajout d'un champ ingrédient
    function addIngredientField(lang, quantity = '', name = '', type = '') {
        const container = $(`#ingredientsList${lang.toUpperCase()}`);
        const fieldId = `ingredient-${lang}-${Date.now()}`;
        
        const field = $(`
            <div class="ingredient-field" id="${fieldId}">
                <input type="text" placeholder="Quantité" value="${quantity}" class="ingredient-quantity">
                <input type="text" placeholder="Nom de l'ingrédient" value="${name}" class="ingredient-name" required>
                <select class="ingredient-type">
                    <option value="">Type</option>
                    <option value="Produce" ${type === 'Produce' ? 'selected' : ''}>Produit frais</option>
                    <option value="Meat" ${type === 'Meat' ? 'selected' : ''}>Viande</option>
                    <option value="Dairy" ${type === 'Dairy' ? 'selected' : ''}>Produit laitier</option>
                    <option value="Baking" ${type === 'Baking' ? 'selected' : ''}>Pâtisserie</option>
                    <option value="Condiments" ${type === 'Condiments' ? 'selected' : ''}>Condiment</option>
                    <option value="Drinks" ${type === 'Drinks' ? 'selected' : ''}>Boisson</option>
                    <option value="Misc" ${type === 'Misc' ? 'selected' : ''}>Divers</option>
                </select>
                <button type="button" class="remove-field-btn"><i class="fas fa-times"></i></button>
            </div>
        `);

        container.append(field);
        field.find('.remove-field-btn').click(() => $(`#${fieldId}`).remove());
    }

    // Affichage des étapes
    function displaySteps(steps, lang) {
        const container = $(`#stepsList${lang.toUpperCase()}`).empty();
        steps.forEach((step, index) => {
            if (step) {
                addStepField(lang, step, (currentRecipe.timers || [])[index] || 0);
            }
        });
    }

    // Ajout d'un champ étape
    function addStepField(lang, text = '', timer = 0) {
        const container = $(`#stepsList${lang.toUpperCase()}`);
        const fieldId = `step-${lang}-${Date.now()}`;
        
        const field = $(`
            <div class="step-field" id="${fieldId}">
                <textarea placeholder="${lang === 'fr' ? 'Description de l\'étape' : 'Step description'}" required>${text}</textarea>
                <div class="step-timer">
                    <label>${lang === 'fr' ? 'Durée (min)' : 'Duration (min)'}</label>
                    <input type="number" min="0" value="${timer}">
                </div>
                <button type="button" class="remove-field-btn"><i class="fas fa-times"></i></button>
            </div>
        `);

        container.append(field);
        field.find('.remove-field-btn').click(() => $(`#${fieldId}`).remove());
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
                    displayImages([...currentRecipe.imageURL, ...response.imagePaths]);
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
        if (!url.match(/^https?:\/\/.+\..+/) || !url.match(/\.(jpeg|jpg|gif|png)$/)) {
            alert("URL d'image invalide. Doit commencer par http/https et se terminer par .jpg, .png ou .gif");
            return;
        }

        uploadedImages.push(url);
        displayImages([...currentRecipe.imageURL, url]);
        $('#imageUrl').val('');
        $('#urlImageModal').hide();
    }

    // Sauvegarde de la recette modifiée
    function saveRecipe(e) {
        e.preventDefault();
        
        // Récupération des données du formulaire
        const recipeData = {
            id: currentRecipe.id,
            name: $('#recipeNameEN').val(),
            nameFR: $('#recipeNameFR').val(),
            Author: currentRecipe.Author,
            status: currentRecipe.status,
            Without: $('input[name="dietTags"]:checked').map((i, el) => $(el).val()).get(),
            ingredients: getIngredients('en'),
            ingredientsFR: getIngredients('fr'),
            steps: getSteps('en'),
            stepsFR: getSteps('fr'),
            timers: getTimers(),
            langues: ['fr', 'en'],
            likes: currentRecipe.likes || 0,
            likedBy: currentRecipe.likedBy || [],
            comments: currentRecipe.comments || [],
            originalURL: $('#originalURL').val() || '',
            createdAt: currentRecipe.createdAt
        };

        // Gestion des images
        const remainingImages = (currentRecipe.imageURL || []).filter(img => !deletedImages.includes(img));
        recipeData.imageURL = [...remainingImages, ...uploadedImages];
        
        // Image préférée
        const preferredImage = $('#preferredImage').val();
        recipeData.imagePreferred = preferredImage || recipeData.imageURL[0] || '';

        // Envoi au serveur
        $.ajax({
            url: 'php/recipes/updateRecipe.php',
            method: 'POST',
            data: { recipe: JSON.stringify(recipeData) },
            success: () => {
                alert("Recette mise à jour avec succès");
                window.location.href = `recipeDetail.html?id=${currentRecipe.id}`;
            },
            error: (xhr) => {
                console.error("Erreur:", xhr.responseText);
                alert("Erreur lors de la mise à jour de la recette");
            }
        });
    }

    // Récupération des ingrédients
    function getIngredients(lang) {
        const ingredients = [];
        $(`#ingredientsList${lang.toUpperCase()} .ingredient-field`).each(function() {
            const quantity = $(this).find('.ingredient-quantity').val().trim();
            const name = $(this).find('.ingredient-name').val().trim();
            const type = $(this).find('.ingredient-type').val();
            
            if (name) {
                ingredients.push({
                    quantity: quantity,
                    name: name,
                    type: type
                });
            }
        });
        return ingredients;
    }

    // Récupération des étapes
    function getSteps(lang) {
        const steps = [];
        $(`#stepsList${lang.toUpperCase()} .step-field`).each(function() {
            const text = $(this).find('textarea').val().trim();
            if (text) {
                steps.push(text);
            }
        });
        return steps;
    }

    // Récupération des timers
    function getTimers() {
        const timers = [];
        $('.step-field').each(function() {
            const timer = $(this).find('input[type="number"]').val() || 0;
            timers.push(parseInt(timer));
        });
        return timers;
    }

    // Déconnexion
    function logout() {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        window.location.href = "loginSignUp.html";
    }

    // Affichage des erreurs
    function showError(message) {
        alert(message);
    }
});