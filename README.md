# Recipe-website
Un site web dynamique avec système de rôles (cuisinier, chef, traducteur, admin) pour publier, traduire et commenter des recettes en français/anglais. Développé en PHP/JS avec stockage JSON.


Diagramme de flux du site :

    Page d'accueil

        Description : La page d’introduction avec une présentation du site.
        Particularités : Affichage général des informations et possibilité de commencer la connexion ou l'inscription.

    Page de connexion et d'inscription

        Description : Permet aux utilisateurs de se connecter ou de s'inscrire.
        Particularités :

            Connexion : Uniquement avec un email et un mot de passe.

            Inscription : Validation du format de l'email et de la force du mot de passe, avec vérification de la correspondance des deux mots de passe. À la fin, demande de rôle (chef, traducteur, admin).

    Welcome Page (Page d'accueil après connexion)

        Description : Accueil personnalisé après la connexion.
        Particularités :

            Affichage des recettes acceptées par l'admin (statut Accepted).

            Rôle Admin : Un bouton pour accéder à la gestion des utilisateurs et des recettes (admin page).

            Rôle Chef : Un bouton pour visualiser ses propres recettes et en créer de nouvelles.

            Recherche : Recherche par mots-clés.

    Page de détail de la recette

        Description : Affichage détaillé d'une recette spécifique.

        Particularités :

            Admin : Peut supprimer, modifier ou traduire la recette.

            Chef : Peut modifier la recette et, s'il est traducteur, peut aussi traduire la recette.

            Tous les utilisateurs : Possibilité d'aimer la recette et de commenter (avec photos via téléchargement ou URL).

    Page de création de recette

        Description : Permet au chef de créer une nouvelle recette.

        Particularités :

            Les champs ne sont pas tous obligatoires.

            Après validation, la recette passe en statut NonAccepted et est en attente de validation par un admin.

    Page de traduction

        Description : Permet à un utilisateur avec le rôle de traducteur de traduire des recettes.

        Particularités : L'utilisateur peut traduire les champs non remplis dans l'autre langue.

    Page d'admin

        Description : Interface d'administration pour gérer les utilisateurs et les recettes.

        Particularités :

            Gestion des utilisateurs : Liste des utilisateurs avec possibilité de supprimer ou de rechercher un utilisateur.

            Gestion des demandes : Visualisation des demandes des chefs et traducteurs en attente, possibilité d'accepter ou de refuser.

            Gestion des recettes : Visualisation des recettes en attente et possibilité de les valider ou de les supprimer.

    Droits d'accès pour les pages sensibles

        Description : Chaque page a un contrôle d'accès basé sur le rôle de l'utilisateur.

        Particularités :

            Page d'admin : Accessible uniquement à un utilisateur avec le rôle admin.

            Page de traduction : Accessible par les utilisateurs ayant le rôle admin ou traducteur (second_role).

            Page de modification : Accessible par les utilisateurs ayant les droits nécessaires (admin ou chef).

    Page de modification de recette

        Description : Permet aux utilisateurs ayant les droits de modifier une recette.

        Particularités :

            L'utilisateur peut modifier les champs de la recette, les images et choisir l'image principale de la recette qui sera affichée sur la page d'accueil.

Organisation technique :

    Fichiers HTML/CSS : Contiennent la structure et le design du site.

    JavaScript (JQuery + AJAX) : Gère les événements de l'interface utilisateur, effectue des appels vers le backend et gère la traduction.

    PHP : Assure la persistance des données et le filtrage.

    Fichiers JSON : Stockage des données sous format JSON.

    Dossier 'uploads' : Contient les images téléchargées par les utilisateurs, soit lors de la création d'une recette, soit lors d'un commentaire.


