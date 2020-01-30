
const model = require('../models');
const Op = require('sequelize').Op;

exports.fetchUsers = async (req, res, next) => {
    try{
        const users = await model.User.findAll({ attributes: {exclude: ['password']}});
        const response = {
            count: users.length,
            users: users.map(user => {
                return {
                    id: user.dataValues.id,
                    firstName: user.dataValues.firstName,
                    lastName: user.dataValues.lastName,
                    email: user.dataValues.email
                }
            })
        }
        res.status(200).json(response);
    }catch(err){
        console.log(err);
    }
}


exports.fetchUsersFilter = async (req, res, next) => {
    try{
        const users = await model.User.findAll({ where:{ id:{[Op.ne]: req.params.userId}}, attributes: {exclude: ['password']}});
        const response = {
            count: users.length,
            users: users.map(user => {
                return {
                    id: user.dataValues.id,
                    firstName: user.dataValues.firstName,
                    lastName: user.dataValues.lastName,
                    email: user.dataValues.email
                }
            })
        }
        res.status(200).json(response);
    }catch(err){
        console.log(err);
    }
}

exports.fetchUsersByActivity = async (req, res, next) => {
    try{
        const users = await model.User.findAll({ 
            include: {
                model: model.UserActivity, 
                where: {
                    activityId: req.params.activityId
                }
            }, 
            attributes: {
                exclude: ['password']
            }
        });
        const response = {
            count: users.length,
            users: users.map(user => {
                return {
                    id: user.dataValues.id,
                    firstName: user.dataValues.firstName,
                    lastName: user.dataValues.lastName,
                    email: user.dataValues.email
                }
            })
        }
        res.status(200).json(response);
    }catch(err){
        console.log(err);
    }
}

exports.fetchUser = async (req, res, next) => {
    try{
        const user = await model.User.findOne({ where: { id: req.params.userId }, attributes: {exclude: ['password']} });
        if(user)
            return res.status(200).json(user);
        else
            throw 'User does not exist'
    }catch(err){
        console.log(err);

    }
}

exports.updateUser = (req, res, next) => {
    model.User.findOne({ where: { id: req.params.userId } })
        .then(user => {
            return user.update(req.body.updates);
        })
        .then(updatedUser => {
            res.status(200).json(updatedUser);
        })
        .catch(err => {
            console.log(err);
        })
}

exports.deleteUser = (req, res, next) => {
    model.User.destroy({ where: { id: req.params.userId } })
        .then(doc => {
            res.status(200).json();
        })
        .catch(err => {
            console.log(err);
        })
}

exports.validateEmail = async (req, res,next) => {
    try{
        var userCount = await model.User.count({where: {email: req.body.email}});
        console.log(userCount)
        res.status(200).json({
            count: userCount
        });
    }catch(e){
        console.log(e)
        res.status(500).json({
            message: e
        });
    }
    
}