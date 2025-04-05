$(document).ready(function () {
    const user = JSON.parse(localStorage.getItem("userData"));
    let currentLanguage = 'fr'; // Par défaut en français

    if (!user) {
        window.location.href = "loginSignUp.html";
        return;
    }

    // Affiche les infos utilisateur
    $('#username').text(user.username);
    $('#userRole').text(user.role);

    // Gestion des rôles
    if (user.role === 'admin') $('#adminActions').removeClass('hidden');
    if (user.role === 'chef') $('#chefActions').removeClass('hidden');

    // Déconnexion
    $('#logoutBtn').click(() => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        window.location.href = "loginSignUp.html";
    });

    // Changement de langue
    $('#switchToFr').click(() => switchLanguage('fr'));
    $('#switchToEn').click(() => switchLanguage('en'));

    // Charge les recettes
    loadRecipes();

    function switchLanguage(lang) {
        currentLanguage = lang;
        $('#switchToFr').toggleClass('active', lang === 'fr');
        $('#switchToEn').toggleClass('active', lang === 'en');
        $('#recipesTitle').text(lang === 'fr' ? 'Toutes les recettes' : 'All recipes');
        loadRecipes();
    }

    function loadRecipes() {
        $.get('php/recipes/getRecipes.php', function(recipes) {
            renderRecipes(recipes, currentLanguage);
        }).fail(xhr => {
            console.error("Erreur:", xhr.responseText);
            $('#recipesList').html('<p>Erreur de chargement.</p>');
        });
    }

    function renderRecipes(recipes, lang) {
        $('#recipesList').empty();
        recipes.forEach(recipe => {
            const name = lang === 'fr' ? recipe.nameFR || recipe.name : recipe.name;
            const image = recipe.imageURL || 'assets/img/default-recipe.jpg';
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

        $('.view-recipe-btn').click(function() {
            const recipeId = $(this).data('id');
            window.location.href = `recipeDetail.html?id=${recipeId}`;
        });
    }
});

