const express = require('express');
const router = express.Router();
const ActivityController = require('../controllers/activity');

//CRUD Operations
router.post('/', ActivityController.create_activity);

router.get('/', ActivityController.fetch_activities);

router.get('/:activityId', ActivityController.fetch_activity);

router.patch('/:activityId', ActivityController.update_activity);

router.delete('/:activityId', ActivityController.delete_activity);

//Specific Procedures
router.get('/fetchUsersByActivity/:activityId', ActivityController.fetch_users_by_activity);
/*Optional*/
// router.get('/fetchUserByActivity/:activityId/:userId', ActivityController.fetch_user_by_activity);
module.exports = router;