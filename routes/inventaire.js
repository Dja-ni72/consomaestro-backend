// Importation des modules nécessaires
var express = require('express');
var router = express.Router();
const Product = require('../models/products');

// Route GET pour récupérer les produits d'un utilisateur spécifique dans le réfrigérateur
router.get('/:userId/:inventaire', async (req, res) => {
    const userId = req.params.userId; // Récupération de l'ID utilisateur depuis les paramètres
    const inventaire = req.params.inventaire; // Récupération de l'inventaire depuis les paramètres
    let inventaireTarger;
    if (inventaire === "frigo") {
        inventaireTarger = "Frigo";
    } else if (inventaire === "congelo") {
        inventaireTarger = "Congelo";
    } else if (inventaire === "placard") {
        inventaireTarger = "Placard";
    };

    try {
        // Recherche des produits dans la base de données pour un utilisateur et un lieu de stockage "Frigo"
        const products = await Product.find({ user: userId, storagePlace: inventaireTarger});
        
        // Vérification de la présence des produits trouvés
        if (products) {
            res.json({ result: true, data: products });
        } else {
            res.json({ result: false, message: 'Aucun produit trouvé pour cet utilisateur.' });
        }
    } catch (error) {
        // Gestion des erreurs serveur lors de la récupération des produits
        console.error("Erreur lors de la récupération des produits :", error);
        res.status(500).json({ result: false, message: 'Erreur serveur lors de la récupération des produits.' });
    }
});

// Exportation du routeur pour l'utiliser dans l'application principale
module.exports = router;
