const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const adminController = require('../controllers/adminController');
const multer = require("multer");
const multerConfig = require("../util/multer");


router.post('/registerCat', multer(multerConfig).array("images"), userController.allowIfLoggedin, userController.grantAccess('updateAny', 'profile'), adminController.registerCat);

router.get('/cats', userController.allowIfLoggedin, userController.grantAccess('readAny', 'profile'), adminController.getCats);

router.get('/cat/:catId', userController.allowIfLoggedin, userController.grantAccess('readAny', 'profile'), adminController.getCat);

router.put('/adoptCat/:catId', userController.allowIfLoggedin, userController.grantAccess('updateAny', 'profile'), adminController.adoptCat);

router.put('/cat/:catId', userController.allowIfLoggedin, userController.grantAccess('updateAny', 'profile'), adminController.updateCat);

router.delete('/cat/:catId', userController.allowIfLoggedin, userController.grantAccess('deleteAny', 'profile'), adminController.deleteCat);

router.get('/user/:userId', userController.allowIfLoggedin, userController.getUser);

router.get('/users', userController.allowIfLoggedin, userController.grantAccess('readAny', 'profile'), userController.getUsers);

router.put('/user/:userId', userController.allowIfLoggedin, userController.grantAccess('updateAny', 'profile'), userController.updateUser);

router.delete('/user/:userId', userController.allowIfLoggedin, userController.grantAccess('deleteAny', 'profile'), userController.deleteUser);

module.exports = router;