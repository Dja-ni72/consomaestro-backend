var express = require('express');
// Importation du module Express pour créer des routes et gérer les requêtes.
var router = express.Router();
// Création d'un routeur Express pour définir les routes de manière modulaire.
const Recipe = require('../models/recipes');
// Importation du modèle `Recipe` qui représente la structure des données des recettes en base de données.
require('dotenv').config();
// Chargement des variables d'environnement depuis un fichier `.env` à l'aide du module `dotenv`.

// Nouvelle route pour récupérer des recettes depuis Spoonacular
router.get('/spoonacular', (req, res) => {
    const { number = 1 } = req.query;
    // Récupération du paramètre `number` dans les requêtes. Valeur par défaut : 1 (si non fourni).
    
    const apiKey = process.env.SPOONACULAR_API_KEY;
    // Lecture de la clé API Spoonacular à partir des variables d'environnement.

    fetch(`https://api.spoonacular.com/recipes/random?number=${number}&apiKey=${apiKey}`)
    // Envoi d'une requête à l'API Spoonacular pour récupérer des recettes aléatoires.
    
      .then(async response => {
        if (!response.ok) {
          // Si la réponse n'est pas correcte (statut HTTP différent de 2xx).
          
          const errorData = await response.json();
          // Récupération des détails de l'erreur renvoyée par l'API.

          console.error('Erreur API Spoonacular:', errorData);
          // Affichage de l'erreur dans la console pour faciliter le débogage.

          if (response.status === 401) {
            res.status(401).json({ error: 'Clé API Spoonacular invalide ou manquante.' });
            // Gestion de l'erreur 401 : clé API invalide ou absente.
          } else if (response.status === 402) {
            res.status(402).json({ error: 'Limite de requêtes atteinte pour l\'API Spoonacular.' });
            // Gestion de l'erreur 402 : limite de requêtes atteinte.
          } else {
            res.status(response.status).json({ error: 'Erreur lors de la récupération des recettes depuis Spoonacular.' });
            // Gestion des autres types d'erreurs.
          }
        } else {
          const data = await response.json();
          // Si la réponse est correcte, parse les données JSON reçues.

          return res.status(200).json(data);
          // Retourne les données reçues au client avec un statut HTTP 200.
        }
      })
      .catch(error => {
        // Gestion des erreurs liées au réseau ou internes.

        console.error('Erreur de réseau ou interne lors de la récupération des recettes:', error);
        // Affiche l'erreur dans la console.

        res.status(500).json({ error: 'Erreur de réseau ou serveur lors de la récupération des recettes.' });
        // Renvoie une réponse d'erreur avec un statut HTTP 500.
      });
  });


// Route pour sauvegarder une recette en favori
router.post('/', async (req, res) => {
  const { userId, title, image, description, products, recipeId } = req.body;
  // Extraction des données nécessaires depuis le corps de la requête.

  try {
    let recipe = await Recipe.findOne({ recipeId });
    // Recherche d'une recette existante dans la base de données par son ID unique.

    if (recipe) {
      // Si la recette existe déjà :
      if (!recipe.users.includes(userId)) {
        // Vérifie si l'utilisateur n'a pas encore enregistré cette recette comme favori.

        recipe.users.push(userId);
        // Ajoute l'utilisateur à la liste des favoris pour cette recette.

        await recipe.save();
        // Sauvegarde les modifications en base de données.
      }
    } else {
      // Si la recette n'existe pas :
      recipe = new Recipe({
        recipeId,
        title,
        image,
        description,
        products,
        users: [userId] // Crée une nouvelle recette associée à l'utilisateur.
      });

      await recipe.save();
      // Sauvegarde la nouvelle recette en base de données.
    }

    res.status(201).json({ message: 'Recette mise en favori sauvegardée avec succès', recipe });
    // Retourne une réponse avec un statut 201 (créé) et les détails de la recette.
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la recette mise en favori:', error);
    // Affiche les erreurs dans la console.

    res.status(500).json({ error: 'Erreur lors de la sauvegarde de la recette mise en favori' });
    // Retourne une réponse d'erreur avec un statut HTTP 500.
  }
});

// Route pour supprimer une recette mise en favori
router.delete('/:recipeId', async (req, res) => {
  const { recipeId } = req.params;
  // Récupère l'ID de la recette depuis les paramètres d'URL.

  const { userId } = req.body;
  // Récupère l'ID de l'utilisateur depuis le corps de la requête.

  try {
    const recipe = await Recipe.findOne({ recipeId });
    // Recherche la recette correspondante en base de données.
    console.log("recipe", recipe);

    if (!recipe) {
      return res.status(404).json({ error: 'Recette non trouvée' });
      // Si la recette n'existe pas, renvoie une erreur avec un statut 404.
    }

    recipe.users = recipe.users.filter(user => user.toString() !== userId);
    // Filtre les utilisateurs pour retirer celui correspondant à `userId`.

    await recipe.save();
    // Sauvegarde les modifications en base de données.

    res.status(200).json({ message: 'Recette retirée des favoris avec succès' });
    // Retourne une réponse avec un statut 200 (succès) pour confirmer la suppression.
  } catch (error) {
    console.error('Erreur lors de la suppression de la recette mise en favori:', error);
    // Affiche les erreurs dans la console.

    res.status(500).json({ error: 'Erreur lors de la suppression de la recette mise en favori' });
    // Retourne une réponse d'erreur avec un statut HTTP 500.
  }
});

// Route pour récupérer les recettes favorites d'un utilisateur
router.get('/favorites/:userId', async (req, res) => {
  const { userId } = req.params;
  // Récupère l'ID de l'utilisateur depuis les paramètres d'URL.

  try {
    const favoriteRecipes = await Recipe.find({ users: userId });
    // Recherche les recettes où l'utilisateur est associé comme favori.

    res.status(200).json({ favorites: favoriteRecipes });
    // Retourne une réponse avec un statut 200 et la liste des recettes favorites.
  } catch (error) {
    console.error("Erreur lors de la récupération des recettes favorites :", error);
    // Affiche les erreurs dans la console.

    res.status(500).json({ error: 'Erreur lors de la récupération des recettes favorites' });
    // Retourne une réponse d'erreur avec un statut HTTP 500.
  }
});

module.exports = router;
// Exporte le routeur pour pouvoir l'utiliser dans d'autres fichiers de l'application. 