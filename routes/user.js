const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user')

router.post('/register', UserController.register_user);

router.post('/login', UserController.login_user);

router.get('/', UserController.fetchUsers);

router.get('/:userId', UserController.fetchUser);

router.patch('/:userId', UserController.updateUser);

router.delete('/:userId', UserController.deleteUser);

module.exports = router;