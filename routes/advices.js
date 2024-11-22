var express = require('express');
// Importation du module `express` pour créer des applications ou des routeurs web.
var router = express.Router();
// Création d'un routeur Express pour gérer les routes spécifiques à cette fonctionnalité.
require('../models/connection');
// Importation de la configuration ou de la connexion à la base de données, qui est probablement définie dans `../models/connection`.
const Advice = require('../models/advices');
// Importation du modèle `Advice`, qui représente la structure des conseils stockés dans la base de données.

// Définition d'une route GET pour obtenir un conseil aléatoire.
router.get('/', (req, res) => {
    Advice.find()  
    // Utilisation de la méthode `find` pour récupérer tous les conseils disponibles dans la collection `Advice` de la base de données.

      .then(advices => {
        // Si la récupération est réussie, on obtient un tableau contenant tous les conseils.

        const randomIndex = Math.floor(Math.random() * advices.length);
        // Calcul d'un indice aléatoire basé sur la longueur du tableau des conseils.

        const randomAdvice = advices[randomIndex];
        // Sélection d'un conseil au hasard dans le tableau à l'aide de l'indice généré.

        res.json({ titre: randomAdvice.titre, description: randomAdvice.description });
        // Envoi d'une réponse JSON contenant le titre et la description du conseil aléatoire sélectionné.
      })

      .catch(error => {
        // Si une erreur survient lors de la récupération des conseils :

        console.error("Erreur lors de la récupération des conseils :", error);
        // Affiche l'erreur dans la console pour le débogage.

        res.status(500).json({ message: "Erreur serveur." });
        // Retourne une réponse d'erreur avec un statut HTTP 500, indiquant un problème côté serveur.
      });
});

module.exports = router;
// Exporte le routeur pour qu'il puisse être utilisé dans d'autres parties de l'application.
