/**
 * Script pour gérer l'inscription et la connexion avec jQuery et AJAX
 */

$(document).ready(function () {
    // Bascule entre les panneaux de connexion / inscription
    $('#signUp').click(() => $('#container').addClass('right-panel-active'));
    $('#signIn').click(() => $('#container').removeClass('right-panel-active'));

    // Si l'utilisateur est déjà connecté, on le redirige
    if (localStorage.getItem('authToken')) {
        window.location.href = 'welcomePage.html';
    }

    // Soumission du formulaire d'inscription
    $('#signupForm').on('submit', function (e) {
        e.preventDefault();

        const formData = {
            username: $('[name="username"]').val(),
            email: $('[name="email"]').val(),
            password: $('[name="password"]').val(),
            confirmPassword: $('[name="confirmPassword"]').val(),
            role: 'cuisinier', // rôle par défaut
            role_request: $('[name="role_request"]').val()
        };

        if (formData.password !== formData.confirmPassword) {
            alert("Les mots de passe ne correspondent pas.");
            return;
        }

        // Envoi AJAX
        $.ajax({
            url: 'php/auth/signup.php',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            dataType: 'json',
            success: function (response) {
                if (response.success) {
                    localStorage.setItem('authToken', response.token);
                    localStorage.setItem('userData', JSON.stringify(response.user));
                    window.location.href = 'welcomePage.html';
                } else {
                    alert(response.error || "Erreur lors de l'inscription.");
                }
            },
            error: function (xhr) {
                alert("Erreur serveur : " + (xhr.responseJSON?.error || xhr.statusText));
            }
        });
    });

    // Soumission du formulaire de connexion
    $('#loginForm').on('submit', function (e) {
        e.preventDefault();

        const formData = {
            username: $(this).find('[name="username"]').val(),
            password: $(this).find('[name="password"]').val()
        };

        // Envoi AJAX
        $.ajax({
            url: 'php/auth/login.php',
            method: 'POST',
            data: formData,
            dataType: 'json',
            success: function (response) {
                if (response.success) {
                    localStorage.setItem('authToken', response.token);
                    localStorage.setItem('userData', JSON.stringify(response.user));
                    window.location.href = 'welcomePage.html';
                } else {
                    alert(response.error || "Erreur lors de la connexion.");
                }
            },
            error: function (xhr) {
                alert("Erreur serveur : " + (xhr.responseJSON?.error || xhr.statusText));
            }
        });
    });
});
