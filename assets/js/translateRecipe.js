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
            const isReadOnly = lang === 'FR' && !targetIng.name;
            
            const item = $(`
                <div class="ingredient-item">
                    <input type="text" value="${ing.quantity || ''}" 
                           ${lang === 'FR' ? 'readonly' : ''} 
                           class="ingredient-quantity" 
                           data-index="${index}">
                    <input type="text" value="${lang === 'FR' ? (ing.name || '') : (targetIng.name || '')}" 
                           ${isReadOnly ? 'readonly' : ''} 
                           class="ingredient-name" 
                           data-index="${index}">
                    <input type="text" value="${ing.type || ''}" 
                           ${lang === 'FR' ? 'readonly' : ''} 
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
            const isReadOnly = lang === 'FR' && !targetStep;
            
            const item = $(`
                <div class="step-item">
                    <textarea ${isReadOnly ? 'readonly' : ''} 
                              data-index="${index}">${lang === 'FR' ? step : (targetStep || '')}</textarea>
                </div>
            `);
            
            container.append(item);
        });
    }

    function saveTranslation(originalRecipe) {
        const updatedRecipe = {...originalRecipe};
        
        // Mettre à jour le nom anglais
        updatedRecipe.name = $('#recipeNameEN').val().trim() || originalRecipe.name;
        
        // Mettre à jour les ingrédients anglais
        updatedRecipe.ingredients = originalRecipe.ingredients.map((ing, index) => {
            const nameEN = $(`#ingredientsEN .ingredient-name[data-index="${index}"]`).val().trim();
            return {
                ...ing,
                name: nameEN || ing.name
            };
        });
        
        // Mettre à jour les étapes anglaises
        updatedRecipe.steps = originalRecipe.steps.map((step, index) => {
            const stepEN = $(`#stepsEN textarea[data-index="${index}"]`).val().trim();
            return stepEN || step;
        });
        
        // Mettre à jour les langues disponibles
        if (!updatedRecipe.langues.includes('en')) {
            updatedRecipe.langues.push('en');
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