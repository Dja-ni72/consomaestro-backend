var express = require('express'); // Importation du framework Express pour créer des routes et gérer les requêtes HTTP.
var router = express.Router(); // Création d'un routeur Express pour définir les routes de l'API.
const User = require('../models/users'); // Importation du modèle User pour interagir avec la base de données.
const { checkBody } = require('../modules/checkBody'); // Importation d'une fonction utilitaire pour valider les champs de la requête.
const uid2 = require('uid2'); // Importation de uid2 pour générer des jetons uniques pour les utilisateurs.
const bcrypt = require('bcrypt'); // Importation de bcrypt pour hacher les mots de passe de manière sécurisée.
const authMiddleware = require('../middleware/authMiddleware'); // Middleware pour vérifier l'authentification de l'utilisateur.
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // Expression régulière pour valider le format des emails.

// Route pour inscrire un utilisateur
router.post('/signup', (req, res) => {
  // Vérifie si les champs requis ('email', 'username', 'password') sont présents dans le corps de la requête.
  if (!checkBody(req.body, ['email', 'username', 'password'])) {
    res.json({ result: false, error: 'Champs vides ou manquants' });
    return; // Arrête l'exécution si les champs sont invalides.
  }

   // Vérifie si l'email respecte le format spécifié par l'expression régulière.
   if (!emailRegex.test(req.body.email)) {
    return res.json({ result: false, error: 'Email invalide' });
  }
  // Cherche dans la base de données un utilisateur avec le même nom d'utilisateur.
  User.findOne({ username: req.body.username }).then(data => {
    if (data === null) { // Si aucun utilisateur n'est trouvé, on peut en créer un.
      const hash = bcrypt.hashSync(req.body.password, 10); // Hache le mot de passe avec un facteur de coût de 10.
      
      // Création d'un nouvel utilisateur avec les informations fournies.
      const newUser = new User({
        email: req.body.email,
        username: req.body.username,
        password: hash, // Stocke le mot de passe haché.
        token: uid2(32), // Génère un jeton unique pour l'utilisateur.
      });

      // Sauvegarde l'utilisateur dans la base de données et renvoie une réponse avec le jeton et l'ID utilisateur.
      newUser.save().then(newDoc => {
        res.json({ result: true, token: newDoc.token, userId: newDoc._id, username: newDoc.username, message: 'Votre compte a bien été créé !' });
      });
    } else {
      // Si un utilisateur existe déjà avec ce nom d'utilisateur, renvoie une erreur.
      res.json({ result: false, error: 'Utilisateur déjà existant !' });
    }
  });
});


// Route pour connecter un utilisateur
router.post('/signin', (req, res) => {
  // Vérifie si les champs requis ('username', 'password') sont présents.
  if (!checkBody(req.body, ['username', 'password'])) {
    res.json({ result: false, error: 'élément manquant ou champ resté vide' });
    return;
  }

  // Cherche l'utilisateur dans la base de données par son nom d'utilisateur.
  User.findOne({ username: req.body.username }).then(data => {
    // Si l'utilisateur existe et que le mot de passe correspond, renvoie le jeton et les informations utilisateur.
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({ result: true, token: data.token, userId: data._id, username: data.username });
    } else {
      // Sinon, renvoie une erreur indiquant que les informations sont incorrectes.
      res.json({ result: false, error: 'Utilisateur introuvable ou mot de passe incorrect' });
    }
  });
});


// Route pour récupérer les informations de profil de l'utilisateur
router.get('/profile', (req, res) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1]; // Extrait le jeton du header Authorization.
  
  if (!token) { // Vérifie si un jeton est fourni.
    return res.status(401).json({ result: false, error: 'Le token est requis' });
  }

  // Cherche un utilisateur correspondant au jeton fourni et renvoie son email et nom d'utilisateur.
  User.findOne({ token })
    .select('email username') // Limite les champs renvoyés aux champs nécessaires.
    .then(user => {
      if (!user) {
        return res.status(404).json({ result: false, error: 'Utilisateur non trouvé' });
      }
      res.json({ result: true, user });
    });
});



// Route pour mettre à jour l'email ou le nom d'utilisateur
router.put('/update', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // Extrait l'ID utilisateur du middleware d'authentification.
    const { email, username } = req.body; // Extrait les champs email et username du corps de la requête.

    const updateFields = {}; // Initialise un objet pour stocker les champs à mettre à jour.
    if (email) updateFields.email = email; // Ajoute l'email si fourni.
    if (username) updateFields.username = username; // Ajoute le nom d'utilisateur si fourni.

    // Met à jour l'utilisateur dans la base de données et renvoie les nouvelles données.
    const updatedUser = await User.findByIdAndUpdate(
      userId, // ID de l'utilisateur à mettre à jour
      { $set: updateFields }, // Champs spécifiques à mettre à jour
      { new: true, runValidators: true } // Options :
      // - `new: true` : Retourne l'utilisateur après mise à jour
      // - `runValidators: true` : Applique les règles de validation avant mise à jour
    );

    if (!updatedUser) { // Vérifie si l'utilisateur a été trouvé et mis à jour.
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.json({
      message: 'Informations mises à jour avec succès',
      user: {
        email: updatedUser.email,
        username: updatedUser.username,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l’utilisateur :', error);
    res.status(500).json({ message: "Erreur du serveur lors de la mise à jour de l'utilisateur" });
  }
});

// Route pour supprimer un compte utilisateur
router.delete('/delete', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // Extrait l'ID utilisateur depuis req.user.

    const deletedUser = await User.findByIdAndDelete(userId); // Supprime l'utilisateur dans la base de données.

    if (!deletedUser) { // Vérifie si l'utilisateur a été trouvé et supprimé.
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
    }

    res.status(200).json({ success: true, message: 'Compte supprimé avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la suppression du compte :', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression du compte.' });
  }
});

module.exports = router; // Exporte le routeur pour l'utiliser dans l'application principale.