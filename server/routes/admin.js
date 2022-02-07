const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const adminController = require('../controllers/adminController');

router.post('/registerCat', userController.allowIfLoggedin, userController.grantAccess('updateAny', 'profile'), adminController.registerCat);

router.get('/cats', userController.allowIfLoggedin, userController.grantAccess('readAny', 'profile'), adminController.getCats);

router.get('/cat/:catId', userController.allowIfLoggedin, userController.grantAccess('readAny', 'profile'), adminController.getCat);

router.put('/adoptCat/:catId', userController.allowIfLoggedin, userController.grantAccess('updateAny', 'profile'), adminController.adoptCat);

router.put('/cat/:catId', userController.allowIfLoggedin, userController.grantAccess('updateAny', 'profile'), adminController.updateCat);

router.get('/user/:userId', userController.allowIfLoggedin, userController.getUser);

router.get('/users', userController.allowIfLoggedin, userController.grantAccess('readAny', 'profile'), userController.getUsers);

router.put('/:userId', userController.allowIfLoggedin, userController.grantAccess('updateAny', 'profile'), userController.updateUser);

router.delete('/:userId', userController.allowIfLoggedin, userController.grantAccess('deleteAny', 'profile'), userController.deleteUser);

module.exports = router;