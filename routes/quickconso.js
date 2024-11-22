var express = require('express');
// Importation du module `express` pour créer une application ou un routeur web.
var router = express.Router();
// Création d'un routeur Express pour définir les routes spécifiques à cette fonctionnalité.
const Product = require('../models/products');
// Importation du modèle `Product`, qui représente la structure des produits dans la base de données.
const moment = require('moment');
// Importation de la bibliothèque `moment` pour manipuler facilement les dates et heures.

// Définition d'une route GET avec un paramètre dynamique `userId`.
router.get('/:userId', async (req, res) => {
    const userId = req.params.userId;
    // Récupère l'ID de l'utilisateur à partir des paramètres de l'URL.
    
    try {
        const twoDaysLater = moment().add(3, 'days').endOf('day').toDate();
        // Calcule la date de trois jours après aujourd'hui, en prenant la fin de cette journée, et la convertit en objet Date.
        // Cela représente la limite supérieure pour rechercher les produits dont la DLC (date limite de consommation) est imminente.

        const products = await Product.find({ user: userId, dlc: { $lte: twoDaysLater } });
        // Effectue une recherche dans la base de données pour trouver :
        // - Les produits associés à l'utilisateur spécifié (`userId`).
        // - Dont la DLC est inférieure ou égale à la date calculée (`twoDaysLater`).

        if (products) {
            // Si des produits sont trouvés, renvoie une réponse contenant les données.
            res.json({ result: true, data: products });
        } else {
            // Si aucun produit n'est trouvé, retourne un message informant l'utilisateur.
            res.json({ result: false, message: 'Aucun produit trouvé pour cet utilisateur.' });
        }
    } catch (error) {
        console.error("Erreur lors de la récupération des produits :", error);
        // Affiche une erreur dans la console en cas d'exception lors de l'exécution du code.

        res.status(500).json({ result: false, message: 'Erreur serveur lors de la récupération des produits.' });
        // Retourne une réponse d'erreur avec un statut HTTP 500, signalant un problème côté serveur.
    }
});

module.exports = router;
// Exporte le routeur pour qu'il puisse être utilisé dans d'autres parties de l'application.
