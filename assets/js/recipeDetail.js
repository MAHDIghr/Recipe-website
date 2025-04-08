$(document).ready(function () {
    // === Initialisation des variables ===
    const user = JSON.parse(localStorage.getItem("userData"));
    const recipeId = new URLSearchParams(window.location.search).get('id');
    let currentLanguage = 'fr';
    let currentRecipe = null;
    
    // Variables pour les images de commentaires
    let commentImages = []; // Pour stocker les fichiers images avant upload
    let commentImageUrls = []; // Pour stocker les URLs d'images

    // Redirection si utilisateur non connecté
    if (!user) {
        window.location.href = "loginSignUp.html";
        return;
    }

    // ===  Affichage des infos utilisateur ===
    $('#username').text(user.username);
    $('#userRole').text(
        user.second_role === "traducteur" 
          ? `${user.role} / ${user.second_role}`
          : user.role
    );

    // ===  Affichage conditionnel selon le rôle ===
    if (user.second_role === 'traducteur') $('#translatorActions').removeClass('hidden');
    if (user.role === 'admin') {
        $('#adminActions').removeClass('hidden');
        $('#translatorActions').removeClass('hidden');
    }
    
    // ===  Gestion des événements UI ===
    $('#backBtn').click(() => window.history.back());
    $('#logoutBtn').click(logout);
    $('#switchToFr').click(() => switchLanguage('fr'));
    $('#switchToEn').click(() => switchLanguage('en'));
    $('#likeBtn').click(toggleLike);
    $('#commentForm').submit(addComment);
    $('#deleteRecipeBtn').click(deleteRecipe);
    $('#translateRecipeBtn').click(() => {
        window.location.href = `translateRecipe.html?id=${currentRecipe.id}`;
    });
    $('#chefEditRecipeBtn').click(() => {
        window.location.href = `editRecipe.html?id=${currentRecipe.id}`;
    });
    
    // Gestion des images de commentaires
    $('#addCommentLocalImageBtn').click(() => $('#commentImageUploadInput').click());
    $('#addCommentUrlImageBtn').click(() => $('#commentUrlImageModal').show());
    $('#commentImageUploadInput').change(handleCommentImageUpload);
    $('#confirmCommentUrlImageBtn').click(addCommentImageFromUrl);
    $('.close-modal').click(() => $('#commentUrlImageModal').hide());

    // ===  Chargement de la recette si ID présent ===
    if (recipeId) {
        loadRecipeDetails(recipeId);
    } else {
        showError('Recette non trouvée');
    }

    // ===  Fonction AJAX pour charger les données d'une recette ===
    function loadRecipeDetails(id) {
        $.get('php/recipes/getRecipeById.php?id=' + id)
            .done(recipe => {
                if (recipe) {
                    currentRecipe = recipe;
                    displayRecipe(recipe);
                    //le chef peut modifier que ces propres recettes
                    if (user.role === 'chef' && user.username === recipe.Author) $('#chefActions').removeClass('hidden');
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

    // ===  Affichage des données de la recette ===
    function displayRecipe(recipe) {
        // Titre
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

        // Étapes de préparation
        const stepsList = $('#stepsList').empty();
        const steps = currentLanguage === 'fr' ? 
            (recipe.stepsFR || recipe.steps) : recipe.steps;
        
        steps.forEach(step => {
            stepsList.append(`<li>${step}</li>`);
        });

        // Commentaires
        displayComments(recipe.comments || []);
        
        // Mise à jour du bouton Like
        updateLikeButton(recipe.likedBy || []);
    }

    // ===  Affichage des commentaires ===
    function displayComments(comments) {
        const container = $('#commentsList').empty();
        comments.forEach(comment => {
            const commentElement = $(`
                <div class="comment">
                    <div class="comment-header">
                        <strong>${comment.username}</strong>
                        <span>${new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                    <p>${comment.text}</p>
                    ${comment.images && comment.images.length > 0 ? 
                        `<div class="comment-images">
                            ${comment.images.map(img => `
                                <img src="${img.startsWith('uploads/') ? '../' + img : img}" 
                                     alt="Commentaire photo" class="comment-image">
                            `).join('')}
                        </div>` : ''}
                </div>
            `);
            
            container.append(commentElement);
        });
    }

    // === Gestion des images de commentaires ===
    function handleCommentImageUpload(e) {
        const files = e.target.files;
        if (!files.length) return;
        
        const previewContainer = $('#commentImagesPreview');
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Vérification que c'est bien une image
            if (!file.type.match('image.*')) continue;
            
            commentImages.push(file);
            
            // Création d'un aperçu
            const reader = new FileReader();
            reader.onload = function(e) {
                const imgElement = $(`
                    <div class="comment-image-preview-item" data-index="${commentImages.length - 1}">
                        <img src="${e.target.result}" alt="Aperçu">
                        <div class="comment-image-actions">
                            <button type="button" class="delete-comment-image-btn">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `);
                
                previewContainer.append(imgElement);
                
                imgElement.find('.delete-comment-image-btn').click(() => {
                    const index = parseInt(imgElement.attr('data-index'));
                    commentImages = commentImages.filter((_, i) => i !== index);
                    imgElement.remove();
                });
            };
            reader.readAsDataURL(file);
        }
        
        // Réinitialise la valeur pour permettre de sélectionner les mêmes fichiers à nouveau
        $(this).val('');
    }

    function addCommentImageFromUrl() {
        const url = $('#commentImageUrl').val().trim();
        if (!url) {
            alert("Veuillez entrer une URL valide");
            return;
        }

        // Vérification simple de l'URL
        if (!url.match(/^https?:\/\/.+\..+/) || !url.match(/\.(jpeg|jpg|gif|png|svg)$/)) {
            alert("URL d'image invalide. Doit commencer par http/https et se terminer par .jpg, .png ou .gif .svg");
            return;
        }

        commentImageUrls.push(url);
        displayCommentImage(url);
        $('#commentImageUrl').val('');
        $('#commentUrlImageModal').hide();
    }

    function displayCommentImage(imgUrl) {
        const previewContainer = $('#commentImagesPreview');
        const index = commentImageUrls.length - 1;
        
        const imgElement = $(`
            <div class="comment-image-preview-item" data-url-index="${index}">
                <img src="${imgUrl}" alt="Aperçu">
                <div class="comment-image-actions">
                    <button type="button" class="delete-comment-image-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `);
        
        previewContainer.append(imgElement);
        
        imgElement.find('.delete-comment-image-btn').click(() => {
            commentImageUrls = commentImageUrls.filter((_, i) => i !== index);
            imgElement.remove();
        });
    }

    // ===  Bouton Like dynamique (toggle) ===
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
            // Annuler le like
            currentRecipe.likedBy = likedBy.filter(u => u !== user.username);
            currentRecipe.likes--;
        } else {
            // Ajouter un like
            currentRecipe.likedBy = [...likedBy, user.username];
            currentRecipe.likes++;
        }
        
        // Mise à jour UI
        $('#likeCount').text(currentRecipe.likes);
        updateLikeButton(currentRecipe.likedBy);
        
        // Envoi au serveur via AJAX
        updateRecipeOnServer();
    }

    // ===  Soumission du formulaire de commentaire ===
    function addComment(e) {
        e.preventDefault();
        if (!currentRecipe) return;
        
        const commentText = $('#commentText').val().trim();
        if (!commentText) return;
        
        // Si des images locales sont sélectionnées, on les upload d'abord
        if (commentImages.length > 0) {
            uploadCommentImages(commentText);
        } else {
            createComment(commentText, commentImageUrls);
        }
    }

    function uploadCommentImages(commentText) {
        const formData = new FormData();
        
        commentImages.forEach((file) => {
            formData.append('images[]', file);
        });

        $.ajax({
            url: 'php/recipes/uploadImages.php',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: (response) => {
                if (response.success) {
                    // Combine les images uploadées avec les URLs
                    const allImages = [...response.imagePaths, ...commentImageUrls];
                    createComment(commentText, allImages);
                } else {
                    alert("Erreur lors de l'upload des images: " + response.message);
                }
            },
            error: (xhr) => {
                console.error("Erreur:", xhr.responseText);
                alert("Erreur lors de l'upload des images");
            }
        });
    }

    function createComment(commentText, images) {
        const newComment = {
            id: 'com' + Date.now(),
            userId: user.username,
            username: user.username,
            text: commentText,
            images: images,
            createdAt: new Date().toISOString()
        };
        
        currentRecipe.comments = [...(currentRecipe.comments || []), newComment];
        displayComments(currentRecipe.comments);
        $('#commentText').val('');
        $('#commentImagesPreview').empty();
        commentImages = [];
        commentImageUrls = [];
        
        // Envoi au serveur via AJAX
        updateRecipeOnServer();
    }

    // ===  Suppression de recette via AJAX ===
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

    // ===  Mise à jour de recette via AJAX ===
    function updateRecipeOnServer() {
        if (!currentRecipe) return;
    
        $.ajax({
            url: 'php/recipes/updateRecipe.php',
            method: 'POST',
            data: { recipe: JSON.stringify(currentRecipe) },
            success: () => console.log('Recette mise à jour avec succès'),
            error: xhr => {
                console.error("Erreur:", xhr.responseText);
                alert('Une erreur est survenue lors de la sauvegarde');
            }
        });
    }

    // ===  Gestion du changement de langue ===
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

    // ===  Vérification des droits du chef ===
    function checkChefPermissions(user, recipe) {
        if (user.role === 'chef' && user.username === recipe.Author) {
            $('#chefEditRecipeBtn').removeClass('hidden');
        }
    }

    // ===  Déconnexion ===
    function logout() {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        window.location.href = "loginSignUp.html";
    }

    // ===  Affichage d'une erreur simple ===
    function showError(message) {
        $('#recipeTitle').text(message);
    }
});