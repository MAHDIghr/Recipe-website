$(document).ready(function () {
    // Récupère les données de l'utilisateur depuis le stockage local
    const user = JSON.parse(localStorage.getItem("userData"));
    let currentRecipeToDelete = null;

    // Si aucun utilisateur connecté, redirige vers la page de connexion
    if (!user) {
        window.location.href = "loginSignUp.html";
        return;
    }

    // Affiche le nom d'utilisateur et son rôle
    $('#username').text(user.username);
    $('#userRole').text(user.role);

    // Gestion du bouton Retour
    $('#backBtn').click(() => {
        window.location.href = "welcomePage.html";
    });

    // Gestion de la déconnexion
    $('#logoutBtn').click(() => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        window.location.href = "loginSignUp.html";
    });

    // Chargement initial des recettes de l'utilisateur
    loadUserRecipes(user.username);

    // Fonction pour récupérer les recettes de l'utilisateur depuis le backend
    function loadUserRecipes(username) {
        $.get('php/recipes/getRecipes.php', function(recipes) {
            // Filtre les recettes où l'auteur correspond à l'utilisateur connecté
            const userRecipes = recipes.filter(recipe => recipe.Author === username);
            renderUserRecipes(userRecipes);
        }).fail(xhr => {
            console.error("Erreur:", xhr.responseText);
            $('#recipesList').html('<p>Erreur de chargement des recettes.</p>');
        });
    }

    // Fonction pour afficher les recettes de l'utilisateur
    function renderUserRecipes(recipes) {
        $('#recipesList').empty();

        if (recipes.length === 0) {
            $('#recipesList').html('<p>Vous n\'avez pas encore créé de recettes.</p>');
            return;
        }

        // Pour chaque recette, crée une carte de présentation
        recipes.forEach(recipe => {
            const name = recipe.nameFR || recipe.name;
            const image = recipe.imagePreferred || 'assets/img/default-recipe.jpg';
            const dietTags = recipe.Without || [];
            const status = getStatusText(recipe.status);

            $('#recipesList').append(`
                <div class="recipe-card">
                    <img src="${image}" alt="${name}" class="recipe-img">
                    <div class="recipe-info">
                        <h3 class="recipe-title">${name}</h3>
                        <div class="recipe-status ${recipe.status === 'accepted' ? 'status-accepted' : 'status-pending'}">
                            <i class="fas ${recipe.status === 'accepted' ? 'fa-check-circle' : 'fa-clock'}"></i> ${status}
                        </div>
                        <div class="recipe-diet-tags">
                            ${dietTags.map(tag => `<span class="diet-tag ${tag}">${tag}</span>`).join('')}
                        </div>
                        <div class="recipe-actions">
                            <button class="view-recipe-btn" data-id="${recipe.id}">
                                <i class="fas fa-eye"></i> Voir
                            </button>
                            <button class="edit-recipe-btn" data-id="${recipe.id}">
                                <i class="fas fa-edit"></i> Modifier
                            </button>
                            <button class="delete-recipe-btn" data-id="${recipe.id}">
                                <i class="fas fa-trash"></i> Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            `);
        });

        // Gestion des boutons
        $('.view-recipe-btn').click(function() {
            const recipeId = $(this).data('id');
            window.location.href = `recipeDetail.html?id=${recipeId}`;
        });

        $('.edit-recipe-btn').click(function() {
            const recipeId = $(this).data('id');
            // À implémenter plus tard
            alert('Fonctionnalité de modification à implémenter');
        });

        $('.delete-recipe-btn').click(function() {
            currentRecipeToDelete = $(this).data('id');
            $('#confirmDeleteModal').show();
        });
    }

    // Fonction pour obtenir le texte du statut
    function getStatusText(status) {
        switch(status) {
            case 'accepted': return 'Publiée';
            case 'nonAccepted': 
            case 'notAccepted': return 'En attente de validation';
            default: return status;
        }
    }

    // Gestion de la modal de suppression
    $('.close-modal, #cancelDeleteBtn').click(() => {
        $('#confirmDeleteModal').hide();
        currentRecipeToDelete = null;
    });

    $('#confirmDeleteBtn').click(() => {
        if (currentRecipeToDelete) {
            deleteRecipe(currentRecipeToDelete);
        }
    });

    // Fonction pour supprimer une recette
    function deleteRecipe(recipeId) {
        $.ajax({
            url: 'php/recipes/deleteRecipe.php',
            method: 'POST',
            data: { id: recipeId },
            success: function(response) {
                if (response.success) {
                    alert('Recette supprimée avec succès');
                    // Recharger les recettes
                    const user = JSON.parse(localStorage.getItem("userData"));
                    loadUserRecipes(user.username);
                } else {
                    alert('Erreur lors de la suppression: ' + response.message);
                }
                $('#confirmDeleteModal').hide();
                currentRecipeToDelete = null;
            },
            error: function(xhr) {
                alert('Erreur lors de la suppression');
                console.error(xhr.responseText);
                $('#confirmDeleteModal').hide();
                currentRecipeToDelete = null;
            }
        });
    }
});