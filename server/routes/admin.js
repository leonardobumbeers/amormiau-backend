const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const adminController = require('../controllers/adminController');

router.post('/registerCat', userController.allowIfLoggedin, userController.grantAccess('updateAny', 'profile'), adminController.registerCat);

router.get('/cats', userController.allowIfLoggedin, userController.grantAccess('readAny', 'profile'), adminController.getCats);

router.get('/cat/:catId', userController.allowIfLoggedin, userController.grantAccess('readAny', 'profile'), adminController.getCat);

router.put('/cat/:userId', userController.allowIfLoggedin, userController.grantAccess('updateAny', 'profile'), adminController.updateCat);

router.get('/user/:userId', userController.allowIfLoggedin, userController.show);

router.get('/users', userController.allowIfLoggedin, userController.grantAccess('readAny', 'profile'), userController.index);

router.put('/:userId', userController.allowIfLoggedin, userController.grantAccess('updateAny', 'profile'), userController.updateUser);

router.delete('/:userId', userController.allowIfLoggedin, userController.grantAccess('deleteAny', 'profile'), userController.deleteUser);

module.exports = router;