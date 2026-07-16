const express = require('express');
const userController = require('../controllers/userController');
const adoptionController = require('../controllers/adoptionController');

const router = express.Router();

router.post(
  '/',
  userController.allowIfLoggedin,
  adoptionController.requestAdoption
);
router.get(
  '/me',
  userController.allowIfLoggedin,
  adoptionController.getMyAdoptions
);

module.exports = router;
