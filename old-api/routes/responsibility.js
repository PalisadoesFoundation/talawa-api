const express = require('express');
const router = express.Router();
const ResponsibilityController = require('../controllers/responsibility')

//CRUD Operations
router.post('/', ResponsibilityController.create_responsibility);

router.get('/', ResponsibilityController.fetch_responsibilities);

router.get('/:respId', ResponsibilityController.fetch_responsibility);

router.patch('/:respId', ResponsibilityController.update_responsibility);

router.delete('/:respId', ResponsibilityController.delete_responsibility);

//Specific Procedures
//Get Responsibility by Activity
router.get('/getByActivity/:activityId/', ResponsibilityController.fetch_responsibility_by_activity);

module.exports = router;