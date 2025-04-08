$(document).ready(function () {
    // Récupère les données de l'utilisateur depuis le stockage local
    const user = JSON.parse(localStorage.getItem("userData"));
    let currentLanguage = 'fr'; // Langue par défaut : français

    // Si aucun utilisateur connecté, redirige vers la page de connexion
    if (!user) {
        window.location.href = "loginSignUp.html";
        return;
    }

    // Affiche le nom d'utilisateur et son rôle
    $('#username').text(user.username);
    $('#userRole').text(user.role);

    // Affiche les options spécifiques selon le rôle (admin ou chef)
    if (user.role === 'admin') $('#adminActions').removeClass('hidden');
    if (user.role === 'chef') $('#chefActions').removeClass('hidden');

    // Gestion du bouton add recipe
    if (user.role === 'chef') {
        $('#addRecipeBtn').click(() => {
            window.location.href = "createRecipe.html";
        });
        $('#myRecipesBtn').click(function() {
            window.location.href = "myRecipes.html";
        });    
    }
    // Gestion du bouton Admin
    if (user.role === 'admin') {
        $('#adminBtn').click(() => {
            window.location.href = "adminPage.html";
        });
    }

    // Gestion de la déconnexion : supprime les données du localStorage et redirige
    $('#logoutBtn').click(() => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        window.location.href = "loginSignUp.html";
    });

    // Gestion du changement de langue via les boutons
    $('#switchToFr').click(() => switchLanguage('fr'));
    $('#switchToEn').click(() => switchLanguage('en'));

    // Gestion de la recherche
    $('#searchBtn').click(searchRecipes);
    $('#searchInput').keypress(function(e) {
        if (e.which === 13) searchRecipes();
    });

    // Chargement initial des recettes
    loadRecipes();

    // Fonction pour changer la langue de l'affichage
    function switchLanguage(lang) {
        currentLanguage = lang;

        // Active visuellement le bouton de la langue sélectionnée
        $('#switchToFr').toggleClass('active', lang === 'fr');
        $('#switchToEn').toggleClass('active', lang === 'en');

        // Met à jour le titre de la section des recettes
        $('#recipesTitle').text(lang === 'fr' ? 'Toutes les recettes' : 'All recipes');

        // Recharge les recettes dans la langue sélectionnée
        if ($('#searchInput').val().trim() === '') {
            loadRecipes();
        } else {
            searchRecipes();
        }
    }

    // Fonction pour effectuer la recherche
    function searchRecipes() {
        const searchTerm = $('#searchInput').val().trim();
        
        if (searchTerm === '') {
            loadRecipes();
            return;
        }

        $.get(`php/recipes/searchRecipesByKeyWord.php?term=${encodeURIComponent(searchTerm)}`)
            .done(recipes => {
                renderRecipes(recipes, currentLanguage);
            })
            .fail(xhr => {
                console.error("Erreur de recherche:", xhr.responseText);
                $('#recipesList').html('<p>Erreur lors de la recherche.</p>');
            });
    }

    // Fonction pour récupérer les recettes depuis le backend
    function loadRecipes() {
        $.get('php/recipes/getRecipes.php', function(recipes) {
            const acceptedRecipes = recipes.filter(recipe => recipe.status === 'accepted');
            renderRecipes(acceptedRecipes, currentLanguage);
        }).fail(xhr => {
            console.error("Erreur:", xhr.responseText);
            $('#recipesList').html('<p>Erreur de chargement.</p>');
        });
    }

    // Fonction pour afficher les recettes dans la page
    function renderRecipes(recipes, lang) {
        $('#recipesList').empty();

        if (recipes.length === 0) {
            $('#recipesList').html('<p class="no-results">Aucune recette trouvée.</p>');
            return;
        }

        // Pour chaque recette, crée une carte de présentation
        recipes.forEach(recipe => {
            const name = lang === 'fr' ? recipe.nameFR || recipe.name : recipe.name;
            const image = recipe.imagePreferred || 'assets/img/default-recipe.jpg';
            const dietTags = recipe.Without || [];

            $('#recipesList').append(`
                <div class="recipe-card">
                    <img src="${image}" alt="${name}" class="recipe-img">
                    <div class="recipe-info">
                        <h3 class="recipe-title">${name}</h3>
                        <div class="recipe-diet-tags">
                            ${dietTags.map(tag => `<span class="diet-tag ${tag}">${tag}</span>`).join('')}
                        </div>
                        <button class="view-recipe-btn" data-id="${recipe.id}">
                            <i class="fas fa-eye"></i> ${lang === 'fr' ? 'Voir' : 'View'}
                        </button>
                    </div>
                </div>
            `);
        });

        // Lorsqu'on clique sur le bouton "Voir", redirige vers la page détail de la recette
        $('.view-recipe-btn').click(function() {
            const recipeId = $(this).data('id');
            window.location.href = `recipeDetail.html?id=${recipeId}`;
        });
    }
});