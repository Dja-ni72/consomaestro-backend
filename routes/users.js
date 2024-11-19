var express = require('express');
var router = express.Router();
const User = require('../models/users');
const { checkBody } = require('../modules/checkBody');
const uid2 = require('uid2');
const bcrypt = require('bcrypt');
const authMiddleware = require('../middleware/authMiddleware');
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // Regex format email valide

router.post('/signup', (req, res) => {
  if (!checkBody(req.body, ['email','username', 'password'])) {
    res.json({ result: false, error: 'Champs vides ou manquants' });
    return;
  }

  // Vérification du format de l'email
  if (!emailRegex.test(req.body.email)) {
    return res.json({ result: false, error: 'Email invalide' });
  }
  // Check if the user has not already been registered.
  User.findOne({ username: req.body.username }).then(data => {
    if (data === null) {

  // The password is being hashed 10 times before being stored in the database.
      const hash = bcrypt.hashSync(req.body.password, 10);

      const newUser = new User({
        email: req.body.email,
        username: req.body.username,
        password: hash,

  // the token is created with 32 random characters
        token: uid2(32),
      });

      newUser.save().then(newDoc => {
        res.json({ result: true, token: newDoc.token, userId: newDoc._id, username: newDoc.username, message: 'Votre compte a bien été créé !' });
      });
    } else {
      // User already exists in database
      res.json({ result: false, error: 'Utilisateur déjà existant !' });
    }
  });
});

// User already exists in database
router.post('/signin', (req, res) => {
  if (!checkBody(req.body, ['username', 'password'])) {
    res.json({ result: false, error: 'élément manquant ou champ resté vide' });
    return;
  }
  // The data entered by the user is compared to what's in the database
  User.findOne({ username: req.body.username }).then(data => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({ result: true, token: data.token, userId: data._id, username: data.username });
    } else {
      res.json({ result: false, error: 'Utilisateur introuvable ou mot de passe incorrect' });
    }
  });
});


// Route to get user profile information
router.get('/profile', (req, res) => {
  // Extract the token from the Authorization header
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  console.log(token);
  

  // Check if token exists
  if (!token) {
    return res.status(401).json({ result: false, error: 'Token is required' });
  }

  User.findOne({ token })
    .select('email username') 
    .then(user => {
      if (!user) {
        return res.status(404).json({ result: false, error: 'User not found' });
      } 
      console.log();
      // Return the user data as JSON if found
      res.json({ result: true, user });
    })
});


// route to update users' email and username

router.put('/update', authMiddleware, async (req, res) => {
  try {
    // AuthMiddleware checks that the user is authenticated and then extracts the user ID from the request
    const userId = req.user.id;
    const { email, username } = req.body; // Extracts the email and username from the request body

     // Build an update object based on what fields are present in the request
     const updateFields = {};
     if (email) updateFields.email = email;
     if (username) updateFields.username = username;

    // Update the user email and username
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true } // Returns the user with the updated email and username
    );

    // Check if the user was updated
    if (!updatedUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Returns the updated user data
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

// route to delete user account

router.delete('/delete', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // Récupération de l'ID de l'utilisateur depuis req.user

    // Suppression de l'utilisateur dans la base de données
    const deletedUser = await User.findByIdAndDelete(userId);

    // Vérifie si l'utilisateur a été trouvé et supprimé
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
    }

    res.status(200).json({ success: true, message: 'Compte supprimé avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la suppression du compte :', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression du compte.' });
  }
});
module.exports = router;
