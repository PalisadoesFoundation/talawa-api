const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user')

router.get('/', UserController.fetchUsers);

router.get('/filter/:userId', UserController.fetchUsersFilter);

router.get('/getUsersByActivity/:activityId', UserController.fetchUsersByActivity);

router.get('/:userId', UserController.fetchUser);

router.patch('/:userId', UserController.updateUser);

router.delete('/:userId', UserController.deleteUser);

router.post('/validateEmail', UserController.validateEmail);
module.exports = router;