$(document).ready(function() {
    // Vérifier si l'utilisateur est connecté et a les droits
    const user = JSON.parse(localStorage.getItem("userData"));
    const recipeId = new URLSearchParams(window.location.search).get('id');
    
    if (!user || (!user.second_role === 'translator' && user.role !== 'admin')) {
        window.location.href = "loginSignUp.html";
        return;
    }

    // Afficher les infos utilisateur
    $('#username').text(user.username);
    $('#userRole').text(user.role + (user.second_role ? ` / ${user.second_role}` : ''));

    // Gestion des boutons
    $('#backBtn').click(() => window.history.back());
    $('#logoutBtn').click(() => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        window.location.href = "loginSignUp.html";
    });

    // Charger la recette
    if (recipeId) {
        loadRecipe(recipeId);
    } else {
        showError('Aucune recette sélectionnée');
    }

    function loadRecipe(id) {
        $.get(`php/recipes/getRecipeById.php?id=${id}`)
            .done(recipe => {
                if (recipe) {
                    displayRecipe(recipe);
                } else {
                    showError('Recette non trouvée');
                }
            })
            .fail(xhr => {
                console.error("Erreur:", xhr.responseText);
                showError('Erreur de chargement');
            });
    }

    function displayRecipe(recipe) {
        // Afficher le nom
        $('#recipeNameFR').val(recipe.nameFR || recipe.name);
        $('#recipeNameEN').val(recipe.name || '');

        // Afficher les ingrédients
        displayIngredients(recipe.ingredientsFR || recipe.ingredients, recipe.ingredients, 'FR');
        displayIngredients(recipe.ingredients, recipe.ingredientsFR || recipe.ingredients, 'EN');

        // Afficher les étapes
        displaySteps(recipe.stepsFR || recipe.steps, recipe.steps, 'FR');
        displaySteps(recipe.steps, recipe.stepsFR || recipe.steps, 'EN');

        // Gestion du bouton d'enregistrement
        $('#saveTranslationBtn').click(() => saveTranslation(recipe));
    }

    function displayIngredients(sourceIngredients, targetIngredients, lang) {
        const container = $(`#ingredients${lang}`).empty();
        
        sourceIngredients.forEach((ing, index) => {
            const targetIng = targetIngredients[index] || {};
            // Un champ est modifiable seulement si:
            // - C'est la version anglaise (EN)
            // - Le champ correspondant en français est rempli
            // - Le champ anglais est vide
            const isEditable = lang === 'EN' && 
                              sourceIngredients[index].name && 
                              !targetIng.name;
            
            const item = $(`
                <div class="ingredient-item">
                    <input type="text" value="${ing.quantity || ''}" 
                           ${lang === 'FR' ? 'readonly' : 'readonly'} 
                           class="ingredient-quantity" 
                           data-index="${index}">
                    <input type="text" value="${lang === 'FR' ? (ing.name || '') : (targetIng.name || '')}" 
                           ${!isEditable ? 'readonly' : ''} 
                           class="ingredient-name" 
                           data-index="${index}"
                           ${isEditable ? '' : 'readonly'}>
                    <input type="text" value="${ing.type || ''}" 
                           ${lang === 'FR' ? 'readonly' : 'readonly'} 
                           class="ingredient-type" 
                           data-index="${index}">
                </div>
            `);
            
            container.append(item);
        });
    }

    function displaySteps(sourceSteps, targetSteps, lang) {
        const container = $(`#steps${lang}`).empty();
        
        sourceSteps.forEach((step, index) => {
            const targetStep = targetSteps[index] || '';
            // Un champ est modifiable seulement si:
            // - Le champ correspondant en deuxieme langue est rempli
            // - Le champ est vide
            const isEditable = lang === 'EN' && 
                              sourceSteps[index] && 
                              !targetStep;
            
            const item = $(`
                <div class="step-item">
                    <textarea ${!isEditable ? 'readonly' : ''} 
                              data-index="${index}">${lang === 'FR' ? step : (targetStep || '')}</textarea>
                </div>
            `);
            
            container.append(item);
        });
    }

    function saveTranslation(originalRecipe) {
        const updatedRecipe = {...originalRecipe};
        
        // Mettre à jour le nom anglais seulement s'il était vide et modifié
        const newNameEN = $('#recipeNameEN').val().trim();
        if (!updatedRecipe.name && newNameEN) {
            updatedRecipe.name = newNameEN;
        }
        
        // Mettre à jour les ingrédients anglais seulement s'ils étaient vides et modifiés
        updatedRecipe.ingredients = originalRecipe.ingredients.map((ing, index) => {
            const nameEN = $(`#ingredientsEN .ingredient-name[data-index="${index}"]`).val().trim();
            return {
                ...ing,
                name: (!ing.name && nameEN) ? nameEN : ing.name
            };
        });
        
        // Mettre à jour les étapes anglaises seulement si elles étaient vides et modifiées
        updatedRecipe.steps = originalRecipe.steps.map((step, index) => {
            const stepEN = $(`#stepsEN textarea[data-index="${index}"]`).val().trim();
            return (!step && stepEN) ? stepEN : step;
        });
        
        // Mettre à jour les langues disponibles si nécessaire
        if (!updatedRecipe.langues.includes('en') && 
            (updatedRecipe.name !== originalRecipe.name || 
             JSON.stringify(updatedRecipe.ingredients) !== JSON.stringify(originalRecipe.ingredients) ||
             JSON.stringify(updatedRecipe.steps) !== JSON.stringify(originalRecipe.steps))) {
            updatedRecipe.langues.push('en');
        }
        
        // Vérifier si des modifications ont été faites
        const hasChanges = updatedRecipe.name !== originalRecipe.name ||
                          JSON.stringify(updatedRecipe.ingredients) !== JSON.stringify(originalRecipe.ingredients) ||
                          JSON.stringify(updatedRecipe.steps) !== JSON.stringify(originalRecipe.steps);
        
        if (!hasChanges) {
            alert('Aucune modification valide à enregistrer');
            return;
        }
        
        // Envoyer la mise à jour au serveur
        $.ajax({
            url: 'php/recipes/updateRecipe.php',
            method: 'POST',
            data: { recipe: JSON.stringify(updatedRecipe) },
            success: () => {
                alert('Traduction enregistrée avec succès');
                window.location.href = `recipeDetail.html?id=${updatedRecipe.id}`;
            },
            error: xhr => {
                console.error("Erreur:", xhr.responseText);
                alert('Une erreur est survenue lors de la sauvegarde');
            }
        });
    }

    function showError(message) {
        alert(message);
        window.location.href = "welcomePage.html";
    }
});