const express = require('express');
// Importation du module Express pour créer des routes et gérer les requêtes.

const router = express.Router();
// Création d'un routeur Express pour définir les routes de manière modulaire.

const RappelConso = require('../models/rappelconso'); 
// Importation du modèle `RappelConso`, représentant la structure des rappels dans la base de données.

const Product = require('../models/products'); 
// Importation du modèle `Product`, représentant la structure des produits dans la base de données.

// Route pour récupérer et enregistrer les rappels.
router.get('/fetch-recalls', (req, res) => {
    const apiUrl = `https://data.economie.gouv.fr/api/v2/catalog/datasets/rappelconso0/records?where=categorie_de_produit="Alimentation"&limit=100`;
    // URL de l'API publique contenant les rappels. Ici, on filtre pour les produits de catégorie "Alimentation" avec une limite de 100 résultats.

    fetch(apiUrl)
    // Envoi d'une requête GET à l'API publique.

        .then(response => response.json())
        // Convertit la réponse de l'API en format JSON.

        .then(data => {
            if (data && data.records) {
                // Vérifie que des enregistrements (rappels) sont présents dans les données reçues.

                const recallPromises = data.records.map(record => {
                    // Parcourt chaque enregistrement reçu et prépare un tableau de promesses pour les sauvegarder.

                    const fields = record.record.fields;
                    // Récupère les champs de chaque rappel.

                    const barcodes = fields.identification_des_produits.match(/\b\d{13}\b/g);
                    // Utilise une expression régulière pour extraire les codes-barres à 13 chiffres depuis le champ d'identification.

                    const newRecall = new RappelConso({
                        categorie_de_produit: fields.categorie_de_produit,
                        nom_de_la_marque_du_produit: fields.nom_de_la_marque_du_produit,
                        noms_des_modeles_ou_references: fields.noms_des_modeles_ou_references,
                        identification_des_produits: fields.identification_des_produits,
                        upc: barcodes || [], // Stocke les codes-barres extraits, ou un tableau vide si aucun n'est trouvé.
                        motif_du_rappel: fields.motif_du_rappel,
                        risques_encourus_par_le_consommateur: fields.risques_encourus_par_le_consommateur,
                        preconisations_sanitaires: fields.preconisations_sanitaires,
                        description_complementaire_du_risque: fields.description_complementaire_du_risque,
                        conduites_a_tenir_par_le_consommateur: fields.conduites_a_tenir_par_le_consommateur,
                        // Initialise un nouvel objet `RappelConso` avec les données reçues.
                    });

                    return newRecall.save();
                    // Sauvegarde l'objet `RappelConso` dans la base de données.
                });

                Promise.all(recallPromises)
                // Attend que toutes les sauvegardes soient terminées.

                    .then(() => res.json({ result: true, message: 'Les rappels alimentaires ont été enregistrés dans la base de données.' }))
                    // Si toutes les sauvegardes réussissent, retourne un message de succès.

                    .catch(error => {
                        console.error("Erreur lors de la sauvegarde des rappels :", error);
                        // Affiche une erreur dans la console en cas de problème lors de la sauvegarde.

                        res.json({ result: false, message: 'Erreur lors de la sauvegarde des rappels.' });
                        // Retourne un message d'erreur au client.
                    });
            } else {
                res.json({ result: false, message: 'Aucun rappel trouvé dans la réponse API.' });
                // Si aucun enregistrement n'est trouvé, retourne un message d'erreur.
            }
        })
        .catch(error => {
            console.error("Erreur lors de la récupération des rappels :", error);
            // Affiche une erreur dans la console si la requête API échoue.

            res.json({ result: false, message: 'Erreur lors de la récupération des rappels.' });
            // Retourne un message d'erreur au client.
        });
});

// Route pour vérifier les rappels dans les produits de l'utilisateur
router.get('/check-recall/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        // Récupère l'ID de l'utilisateur depuis les paramètres de l'URL.

        console.log("Vérification des rappels pour l'utilisateur avec ID :", userId);
        // Affiche un message dans la console pour suivre l'exécution.

        const userProducts = await Product.find({ user: userId });
        // Recherche tous les produits appartenant à l'utilisateur en base de données.

        console.log("Produits de l'utilisateur :", userProducts);
        // Affiche les produits de l'utilisateur dans la console pour débogage.

        if (!Array.isArray(userProducts)) {
            console.error("userProducts n'est pas un tableau", userProducts);
            // Si `userProducts` n'est pas un tableau, affiche une erreur.

            return res.status(500).json({ result: false, message: 'Erreur lors de la récupération des produits.' });
            // Retourne une réponse d'erreur avec un statut HTTP 500.
        }

        const userUPCs = userProducts.map(product => {
            if (!product.upc) {
                console.warn("Produit sans UPC trouvé :", product);
                // Si un produit n'a pas de code-barres (UPC), affiche un avertissement.

                return null; // Retourne `null` pour ce produit.
            }
            return product.upc;
            // Retourne le code-barres du produit.
        }).filter(upc => upc !== null);
        // Filtre les produits avec un code-barres nul.

        console.log("Codes-barres des produits de l'utilisateur :", userUPCs);
        // Affiche les codes-barres extraits dans la console pour débogage.

        const recalls = await RappelConso.find({ upc: { $in: userUPCs } });
        // Recherche en base de données les rappels dont les codes-barres correspondent à ceux des produits de l'utilisateur.

        console.log("Rappels trouvés :", recalls);
        // Affiche les rappels trouvés dans la console pour débogage.

        if (recalls.length > 0) {
            // Si des rappels sont trouvés :
            res.json({
                result: true,
                message: 'Produits rappelés trouvés dans votre stockage.',
                recalls,
            });
            // Retourne les rappels au client avec un message de succès.
        } else {
            res.json({ result: false, message: 'Aucun produit rappelé trouvé dans votre stockage.' });
            // Si aucun rappel n'est trouvé, retourne un message informant l'utilisateur.
        }
    } catch (error) {
        console.error("Erreur lors de la vérification des rappels :", error);
        // Affiche une erreur dans la console si une exception est levée.

        res.status(500).json({ result: false, message: 'Erreur serveur lors de la vérification des rappels.' });
        // Retourne une réponse d'erreur au client avec un statut HTTP 500.
    }
});

module.exports = router;
// Exporte le routeur pour l'utiliser dans d'autres parties de l'application.
