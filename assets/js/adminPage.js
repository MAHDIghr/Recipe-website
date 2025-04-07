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
                        <button class="accept-btn" data-id="${recipe.id}">
                            <i class="fas fa-check"></i> Accepter
                        </button>
                        <button class="reject-btn" data-id="${recipe.id}">
                            <i class="fas fa-times"></i> Rejeter
                        </button>
                        <button class="view-recipe-btn">
                            <i class="fas fa-eye"></i> Voir
                        </button>
                    </div>
                </div>
            </div>
        `);
    });

    // Gestion des boutons
    $('.view-recipe-btn').click(function() {
        const recipeId = $(this).closest('.recipe-card').data('id');
        window.location.href = `recipeDetail.html?id=${recipeId}`;
    });

    $('.accept-btn').click(function() {
        const recipeId = $(this).data('id');
        if (confirm("Êtes-vous sûr de vouloir accepter cette recette ?")) {
            acceptRecipe(recipeId);
        }
    });

    $('.reject-btn').click(function() {
        const recipeId = $(this).data('id');
        if (confirm("Êtes-vous sûr de vouloir rejeter cette recette ?")) {
            rejectRecipe(recipeId);
        }
    });
}

function acceptRecipe(recipeId) {
    // D'abord, récupérer la recette complète
    $.get(`php/recipes/getRecipeById.php?id=${recipeId}`)
        .done(recipe => {
            if (!recipe) {
                console.error("Recette non trouvée");
                return;
            }

            // Mettre à jour le statut de la recette
            const updatedRecipe = {
                ...recipe,
                status: 'accepted' // Changer le statut
            };

            // Envoyer la recette complète mise à jour
            $.ajax({
                url: 'php/recipes/updateRecipe.php',
                type: 'POST',
                data: { recipe: JSON.stringify(updatedRecipe) },
                success: () => {
                    loadPendingRecipes();
                },
                error: error => {
                    console.error("Erreur d'acceptation:", error);
                    alert("Erreur lors de la mise à jour de la recette");
                }
            });
        })
        .fail(error => {
            console.error("Erreur de récupération de la recette:", error);
            alert("Erreur lors de la récupération de la recette");
        });
}

function rejectRecipe(recipeId) {
    $.post('php/recipes/deleteRecipe.php', { id: recipeId })
        .done(() => {
            loadPendingRecipes();
        })
        .fail(error => console.error("Erreur de rejet:", error));
}