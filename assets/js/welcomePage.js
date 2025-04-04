/**
 * welcomePage.js
 * Affiche les infos utilisateur et gère la déconnexion
 */

$(document).ready(function () {
    const user = JSON.parse(localStorage.getItem("userData"));

    if (!user) {
        // Si l'utilisateur n'est pas connecté, rediriger
        window.location.href = "loginSignUp.html";
        return;
    }

    // Affiche le nom d'utilisateur
    $('#username').text(user.username);

    // Déconnexion
    $('#logoutBtn').click(function () {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        window.location.href = "loginSignUp.html";
    });
});
