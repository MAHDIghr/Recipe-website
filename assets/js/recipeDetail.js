$(document).ready(function () {
    const user = JSON.parse(localStorage.getItem("userData"));
    const recipeId = new URLSearchParams(window.location.search).get('id');
    let currentLanguage = 'fr';
    let currentRecipe = null;

    if (!user) {
        window.location.href = "loginSignUp.html";
        return;
    }

    // Initialisation
    $('#username').text(user.username);
    $('#userRole').text(user.role);

    // Gestion des rôles
    if (user.role === 'admin') $('#adminActions').removeClass('hidden');
    if (user.role === 'chef') $('#chefActions').removeClass('hidden');
    if (user.role === 'translator') $('#translatorActions').removeClass('hidden');

    // Boutons
    $('#backBtn').click(() => window.history.back());
    $('#logoutBtn').click(logout);
    $('#switchToFr').click(() => switchLanguage('fr'));
    $('#switchToEn').click(() => switchLanguage('en'));
    $('#likeBtn').click(toggleLike);
    $('#commentForm').submit(addComment);
    $('#deleteRecipeBtn').click(deleteRecipe);

    // Chargement de la recette
    if (recipeId) {
        loadRecipeDetails(recipeId);
    } else {
        showError('Recette non trouvée');
    }

    function loadRecipeDetails(id) {
        $.get('php/recipes/getRecipeById.php?id=' + id)
            .done(recipe => {
                if (recipe) {
                    currentRecipe = recipe;
                    displayRecipe(recipe);
                    updateLanguageSwitcher(recipe.langues);
                    checkChefPermissions(user, recipe);
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
        // Infos de base
        $('#recipeTitle').text(currentLanguage === 'fr' ? recipe.nameFR || recipe.name : recipe.name);
        $('#recipeAuthor').text(recipe.Author);
        $('#recipeDate').text(new Date(recipe.createdAt).toLocaleDateString());
        $('#likeCount').text(recipe.likes || 0);
        
        // Images
        const imagesContainer = $('#recipeImages').empty();
        (recipe.imageURL || []).forEach(img => {
            imagesContainer.append(`<img src="${img}" alt="Image de la recette">`);
        });

        // Tags alimentaires
        const tagsContainer = $('#dietTags').empty();
        (recipe.Without || []).forEach(tag => {
            tagsContainer.append(`<span class="diet-tag ${tag}">${tag}</span>`);
        });

        // Ingrédients
        const ingredientsList = $('#ingredientsList').empty();
        const ingredients = currentLanguage === 'fr' ? 
            (recipe.ingredientsFR || recipe.ingredients) : recipe.ingredients;
        
        ingredients.forEach(ing => {
            if (ing.name) {
                ingredientsList.append(`<li>${ing.quantity} ${ing.name}</li>`);
            }
        });

        // Étapes
        const stepsList = $('#stepsList').empty();
        const steps = currentLanguage === 'fr' ? 
            (recipe.stepsFR || recipe.steps) : recipe.steps;
        
        steps.forEach(step => {
            stepsList.append(`<li>${step}</li>`);
        });

        // Commentaires
        displayComments(recipe.comments || []);
        
        // Bouton like
        updateLikeButton(recipe.likedBy || []);
    }

    function displayComments(comments) {
        const container = $('#commentsList').empty();
        comments.forEach(comment => {
            container.append(`
                <div class="comment">
                    <div class="comment-header">
                        <strong>${comment.username}</strong>
                        <span>${new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                    <p>${comment.text}</p>
                    ${comment.images && comment.images.length > 0 ? 
                        `<div class="comment-images">
                            ${comment.images.map(img => `<img src="${img}" alt="Commentaire photo">`).join('')}
                        </div>` : ''}
                </div>
            `);
        });
    }

    function updateLikeButton(likedBy) {
        const hasLiked = likedBy.includes(user.username);
        $('#likeBtn i')
            .toggleClass('far', !hasLiked)
            .toggleClass('fas', hasLiked)
            .toggleClass('liked', hasLiked);
    }

    function toggleLike() {
        if (!currentRecipe) return;
        
        const likedBy = currentRecipe.likedBy || [];
        const hasLiked = likedBy.includes(user.username);
        
        if (hasLiked) {
            // Retirer le like
            currentRecipe.likedBy = likedBy.filter(u => u !== user.username);
            currentRecipe.likes--;
        } else {
            // Ajouter le like
            currentRecipe.likedBy = [...likedBy, user.username];
            currentRecipe.likes++;
        }
        
        // Mettre à jour l'affichage
        $('#likeCount').text(currentRecipe.likes);
        updateLikeButton(currentRecipe.likedBy);
        
        // Envoyer la mise à jour au serveur
        updateRecipeOnServer();
    }

    function addComment(e) {
        e.preventDefault();
        if (!currentRecipe) return;
        
        const commentText = $('#commentText').val().trim();
        if (!commentText) return;
        
        const newComment = {
            id: 'com' + Date.now(),
            userId: user.username,
            username: user.username,
            text: commentText,
            images: [], // À implémenter: upload d'images
            createdAt: new Date().toISOString()
        };
        
        currentRecipe.comments = [...(currentRecipe.comments || []), newComment];
        displayComments(currentRecipe.comments);
        $('#commentText').val('');
        
        // Envoyer la mise à jour au serveur
        updateRecipeOnServer();
    }

    function deleteRecipe() {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cette recette ?")) return;
        
        $.ajax({
            url: 'php/recipes/deleteRecipe.php',
            method: 'POST',
            data: { id: currentRecipe.id },
            success: () => {
                alert('Recette supprimée avec succès');
                window.location.href = 'welcomePage.html';
            },
            error: xhr => {
                console.error("Erreur:", xhr.responseText);
                alert('Erreur lors de la suppression');
            }
        });
    }

    function updateRecipeOnServer() {
        if (!currentRecipe) return;
    
        $.ajax({
            url: 'php/recipes/updateRecipe.php',
            method: 'POST',
            data: { recipe: JSON.stringify(currentRecipe) }, // Modification ici
            success: () => console.log('Recette mise à jour avec succès'),
            error: xhr => {
                console.error("Erreur:", xhr.responseText);
                alert('Une erreur est survenue lors de la sauvegarde');
            }
        });
    }
    
    function switchLanguage(lang) {
        if (!currentRecipe || !currentRecipe.langues.includes(lang)) return;
        
        currentLanguage = lang;
        $('#switchToFr').toggleClass('active', lang === 'fr');
        $('#switchToEn').toggleClass('active', lang === 'en');
        displayRecipe(currentRecipe);
    }

    function updateLanguageSwitcher(availableLangs) {
        $('#switchToFr').toggleClass('hidden', !availableLangs.includes('fr'));
        $('#switchToEn').toggleClass('hidden', !availableLangs.includes('en'));
    }

    function checkChefPermissions(user, recipe) {
        if (user.role === 'chef' && user.username === recipe.Author) {
            $('#chefEditRecipeBtn').removeClass('hidden');
        }
    }

    function logout() {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        window.location.href = "loginSignUp.html";
    }

    function showError(message) {
        $('#recipeTitle').text(message);
    }
});