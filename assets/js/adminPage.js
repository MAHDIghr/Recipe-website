$(document).ready(function() {
    // Vérifier si l'utilisateur est admin
    const user = JSON.parse(localStorage.getItem("userData"));
    if (!user || user.role !== 'admin') {
        window.location.href = "welcomePage.html";
        return;
    }

    // Afficher les infos utilisateur
    $('#username').text(user.username);
    $('#userRole').text(user.role);

    // Gestion des boutons
    $('#backBtn').click(() => {
        window.location.href = "welcomePage.html";
    });

    $('#logoutBtn').click(() => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        window.location.href = "loginSignUp.html";
    });

    // Gestion des onglets
    $('.tab-btn').click(function() {
        $('.tab-btn').removeClass('active');
        $(this).addClass('active');
        
        const tabId = $(this).data('tab');
        $('.tab-content').removeClass('active');
        $(`#${tabId}`).addClass('active');
    });

    // Charger les données
    loadUsers();
    loadPendingRequests();
    loadPendingRecipes();

    // Recherche d'utilisateurs
    $('#searchUserBtn').click(searchUsers);
    $('#userSearch').keypress(function(e) {
        if (e.which === 13) searchUsers();
    });

    // Gestion du modal
    $('.close-modal').click(() => {
        $('#recipeModal').hide();
    });

    $(window).click((e) => {
        if (e.target === $('#recipeModal')[0]) {
            $('#recipeModal').hide();
        }
    });
});

function loadUsers() {
    $.get('php/admin/getUsers.php', renderUsers)
        .fail(error => console.error("Erreur de chargement des utilisateurs:", error));
}

function renderUsers(users) {
    const $usersList = $('#usersList');
    $usersList.empty();

    users.forEach(user => {
        $usersList.append(`
            <tr>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.role || 'Utilisateur'}</td>
                <td>
                    <button class="action-btn delete-btn" data-id="${user.id}">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </td>
            </tr>
        `);
    });

    // Gestion de la suppression
    $('.delete-btn').click(function() {
        const userId = $(this).data('id');
        if (confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
            deleteUser(userId);
        }
    });
}

function searchUsers() {
    const searchTerm = $('#userSearch').val().toLowerCase();
    $.get('../../data/users.json', function(users) {
        const filteredUsers = users.filter(user => 
            user.username.toLowerCase().includes(searchTerm) || 
            user.email.toLowerCase().includes(searchTerm)
        );
        renderUsers(filteredUsers);
    });
}

function deleteUser(userId) {
    $.post('php/admin/deleteUser.php', { id: userId })
        .done(() => loadUsers())
        .fail(error => console.error("Erreur de suppression:", error));
}

function loadPendingRequests() {
    $.get('php/admin/getPendingRequests.php', function(data) {
        renderRequests(data.chefRequests, '#chefRequestsList');
        renderRequests(data.translatorRequests, '#translatorRequestsList');
    }).fail(error => console.error("Erreur de chargement des demandes:", error));
}


function renderRequests(requests, target) {
    const $target = $(target);
    $target.empty();

    requests.forEach(user => {
        $target.append(`
            <tr>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>
                    <button class="action-btn accept-btn" data-id="${user.id}" data-role="${user.role_request.replace('demande_', '')}">
                        <i class="fas fa-check"></i> Accepter
                    </button>
                    <button class="action-btn reject-btn" data-id="${user.id}">
                        <i class="fas fa-times"></i> Refuser
                    </button>
                </td>
            </tr>
        `);
    });

    // Gestion des boutons
    $('.accept-btn').click(function() {
        const userId = $(this).data('id');
        const newRole = $(this).data('role');
        updateUserRole(userId, newRole);
    });

    $('.reject-btn').click(function() {
        const userId = $(this).data('id');
        rejectUserRequest(userId);
    });
}

function updateUserRole(userId, newRole) {
    $.ajax({
        url: 'php/admin/updateUserRole.php',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ userId, newRole }),
        success: () => loadPendingRequests(),
        error: error => console.error("Erreur de mise à jour:", error)
    });
}


function rejectUserRequest(userId) {
    $.post('php/admin/rejectUserRequest.php', { id: userId })
        .done(() => loadPendingRequests())
        .fail(error => console.error("Erreur de rejet:", error));
}

function loadPendingRecipes() {
    $.get('php/admin/getPendingRecipes.php', renderPendingRecipes)
        .fail(error => console.error("Erreur de chargement des recettes:", error));
}

function renderPendingRecipes(recipes) {
    const $pendingRecipesList = $('#pendingRecipesList');
    $pendingRecipesList.empty();

    recipes.forEach(recipe => {
        const name = recipe.nameFR || recipe.name;
        const image = recipe.imagePreferred || 'assets/img/default-recipe.jpg';
        
        $pendingRecipesList.append(`
            <div class="recipe-card" data-id="${recipe.id}">
                <img src="${image}" alt="${name}" class="recipe-img">
                <div class="recipe-info">
                    <h3 class="recipe-title">${name}</h3>
                    <div class="recipe-actions">
                        <button class="view-recipe-btn">
                            <i class="fas fa-eye"></i> Voir
                        </button>
                    </div>
                </div>
            </div>
        `);
    });

    // Gestion du bouton "Voir"
    $('.view-recipe-btn').click(function() {
        const recipeId = $(this).closest('.recipe-card').data('id');
        showRecipeDetails(recipeId);
    });
}

function showRecipeDetails(recipeId) {
    $.get('../../data/recipes.json', function(recipes) {
        const recipe = recipes.find(r => r.id === recipeId);
        if (recipe) {
            renderRecipeModal(recipe);
            $('#recipeModal').show();
            
            // Définir les IDs pour les boutons d'action
            $('#acceptRecipeBtn').data('id', recipeId);
            $('#rejectRecipeBtn').data('id', recipeId);
        }
    });
}

function renderRecipeModal(recipe) {
    const $modalContent = $('#modalRecipeContent');
    $modalContent.empty();
    
    const name = recipe.nameFR || recipe.name;
    const image = recipe.imagePreferred || 'assets/img/default-recipe.jpg';
    
    $modalContent.append(`
        <div class="recipe-header">
            <h2>${name}</h2>
        </div>
        <div class="recipe-image">
            <img src="${image}" alt="${name}" style="max-width: 100%; border-radius: 8px;">
        </div>
        <div class="recipe-meta">
            <div>
                <strong>Auteur:</strong> ${recipe.Author}
            </div>
            <div>
                <strong>Date de création:</strong> ${new Date(recipe.createdAt).toLocaleDateString()}
            </div>
        </div>
        <div class="recipe-content">
            <div class="ingredients-section">
                <h3>Ingrédients</h3>
                <ul id="ingredientsList">
                    ${recipe.ingredients.map(ing => `<li>${ing.quantity} ${ing.name}</li>`).join('')}
                </ul>
            </div>
            <div class="steps-section">
                <h3>Étapes</h3>
                <ol id="stepsList">
                    ${recipe.steps.map(step => `<li>${step}</li>`).join('')}
                </ol>
            </div>
        </div>
    `);
    
    // Gestion des boutons d'action
    $('#acceptRecipeBtn').off('click').click(function() {
        acceptRecipe($(this).data('id'));
    });
    
    $('#rejectRecipeBtn').off('click').click(function() {
        if (confirm("Êtes-vous sûr de vouloir rejeter cette recette ? Elle sera supprimée définitivement.")) {
            rejectRecipe($(this).data('id'));
        }
    });
}

function acceptRecipe(recipeId) {
    $.ajax({
        url: 'php/admin/updateRecipeStatus.php',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ id: recipeId, status: 'accepted' }),
        success: () => {
            $('#recipeModal').hide();
            loadPendingRecipes();
        },
        error: error => console.error("Erreur d'acceptation:", error)
    });
}

function rejectRecipe(recipeId) {
    $.post('php/recipes/deleteRecipe.php', { id: recipeId })
        .done(() => {
            $('#recipeModal').hide();
            loadPendingRecipes();
        })
        .fail(error => console.error("Erreur de rejet:", error));
}