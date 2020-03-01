
const model = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register_user = async (req, res, next) => {
    const authCount = model.User.findOne()
    model.User.findOne({ where: { email: req.body.email }, attributes: {exclude: ['password']} })
        .then(user => {
            if (user) {
                throw 'Email address already exists';
            }
        })
        .then(() => {
            bcrypt.hash(req.body.password, 10, (err, hash) => {
                if (err) {
                    throw err
                }
                else {
                   return model.User.create({
                        firstName: req.body.firstName,
                        lastName: req.body.lastName,
                        email: req.body.email,
                        password: hash
                    });
                }
            });
        })
        .then(doc => {
            return res.status(201).json({
                message: 'user successfully created'
            });
        })
        .catch(err => {
            console.log(err);
            return res.status(500).json({
                error: err
            });
        });
}

exports.login_user = async (req, res, next) => {
    try{
        const user = await model.User.findOne({ where: { email: req.body.email }});
        if(!user)
            throw 'User does not exist';
        else{
            const result = await bcrypt.compare(req.body.password, user.dataValues.password);
            if (result) {
                var token = jwt.sign({
                    id: user.dataValues.id,
                }, process.env.JWT_KEY,
                    {
                        expiresIn: "1h"
                    })
                return res.status(200).json({
                    token: token
                })
            }
            else{
                throw 'Invalid email/password'
            }
        }
    }catch(err){
        return res.status(409).json({
            message: err
        })
    }
}