/**
 * Script pour la gestion de la page de connexion/inscription
 * avec validation des champs et indicateurs visuels
 */

$(document).ready(function () {
    // =============================================
    // GESTION DE L'INTERFACE
    // =============================================
    
    // Bascule entre les panneaux de connexion/inscription
    $('#signUp').click(() => $('#container').addClass('right-panel-active'));
    $('#signIn').click(() => $('#container').removeClass('right-panel-active'));

    // Redirection si déjà connecté
    if (localStorage.getItem('authToken')) {
        window.location.href = 'welcomePage.html';
    }

    // =============================================
    // VALIDATION DES CHAMPS
    // =============================================
    
    // Vérification format email
    $('[name="email"]').on('input', function() {
        const email = $(this).val();
        const emailError = $('#emailError');
        
        if (!isValidEmail(email)) {
            emailError.text('Veuillez entrer une adresse email valide').addClass('show');
            return false;
        } else {
            emailError.removeClass('show');
            return true;
        }
    });

    // Vérification force mot de passe
    $('#passwordInput').on('input', function() {
        const password = $(this).val();
        const strengthText = $(this).siblings('.strength-text');
        const inputGroup = $(this).parent();
        
        // Minimum 6 caractères
        if (password.length < 6) {
            strengthText.text('Trop court (min 6)').addClass('show');
            inputGroup.addClass('password-weak');
            return false;
        } else {
            strengthText.removeClass('show');
            inputGroup.removeClass('password-weak');
        }
        
        // Calcul force
        let strength = 0;
        if (password.length > 7) strength++;
        if (password.match(/([0-9])/)) strength++;
        if (password.match(/([!,%,&,@,#,$,^,*,?,_,~])/)) strength++;
        
        // Mise à jour UI
        inputGroup.removeClass('password-weak password-medium password-strong');
        if (strength === 0) {
            strengthText.text('Faible').addClass('show');
            inputGroup.addClass('password-weak');
        } else if (strength === 1) {
            strengthText.text('Moyen').addClass('show');
            inputGroup.addClass('password-medium');
        } else {
            strengthText.text('Fort').addClass('show');
            inputGroup.addClass('password-strong');
        }
    });

    // Vérification correspondance mots de passe
    $('[name="confirmPassword"]').on('input', function() {
        const password = $('[name="password"]').val();
        const confirmPassword = $(this).val();
        const passwordError = $('#passwordError');
        
        if (password !== confirmPassword) {
            passwordError.text('Les mots de passe ne correspondent pas').addClass('show');
            return false;
        } else {
            passwordError.removeClass('show');
            return true;
        }
    });

    // =============================================
    // SOUMISSION DES FORMULAIRES
    // =============================================
    
    // Soumission inscription
    $('#signupForm').on('submit', function (e) {
        e.preventDefault();
        
        // Validation avant soumission
        const emailValid = $('[name="email"]').triggerHandler('input');
        const password = $('[name="password"]').val();
        const passwordMatch = $('[name="confirmPassword"]').triggerHandler('input');
        
        // Vérification longueur mot de passe
        if (password.length < 6) {
            $('.strength-text').text('Minimum 6 caractères').addClass('show');
            $('#signupForm').addClass('shake');
            setTimeout(() => $('#signupForm').removeClass('shake'), 500);
            return;
        }
        
        if (!emailValid || !passwordMatch) {
            $('#signupForm').addClass('shake');
            setTimeout(() => $('#signupForm').removeClass('shake'), 500);
            return;
        }

        // Préparation données
        const formData = {
            username: $('[name="username"]').val(),
            email: $('[name="email"]').val(),
            password: $('[name="password"]').val(),
            confirmPassword: $('[name="confirmPassword"]').val(),
            role: 'cuisinier',
            second_rol: null,
            role_request: $('[name="role_request"]').val()
        };

        // Affichage spinner
        $('#signupBtn').addClass('loading');

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
                    $('#signupBtn').removeClass('loading');
                    alert(response.error || "Erreur lors de l'inscription.");
                }
            },
            error: function (xhr) {
                $('#signupBtn').removeClass('loading');
                alert("Erreur serveur : " + (xhr.responseJSON?.error || xhr.statusText));
            }
        });
    });

    // Soumission connexion
    $('#loginForm').on('submit', function (e) {
        e.preventDefault();

        // Affichage spinner
        $('#loginBtn').addClass('loading');

        // Envoi AJAX
        $.ajax({
            url: 'php/auth/login.php',
            method: 'POST',
            data: {
                username: $(this).find('[name="username"]').val(),
                password: $(this).find('[name="password"]').val()
            },
            dataType: 'json',
            success: function (response) {
                if (response.success) {
                    localStorage.setItem('authToken', response.token);
                    localStorage.setItem('userData', JSON.stringify(response.user));
                    window.location.href = 'welcomePage.html';
                } else {
                    $('#loginBtn').removeClass('loading');
                    alert(response.error || "Erreur lors de la connexion.");
                }
            },
            error: function (xhr) {
                $('#loginBtn').removeClass('loading');
                alert("Erreur serveur : " + (xhr.responseJSON?.error || xhr.statusText));
            }
        });
    });

    // =============================================
    // FONCTIONS UTILITAIRES
    // =============================================
    
    /**
     * Vérifie si un email est valide
     * @param {string} email - L'email à vérifier
     * @return {boolean} True si l'email est valide
     */
    function isValidEmail(email) {
        const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        return re.test(String(email).toLowerCase());
    }
});