
const User = require('../models/User')
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken')

//register controller
const registerUser = async (req, res) => {
    try {
        //first extract user info from our req body
        const { username, email, password, role } = req.body;

        //check if the user is already exists in our database
        const checkExistingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (checkExistingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists with either same username or same email. Please try with a different username or email."
            })
        }

        //hash user password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        //create a new user and save in your database
        const newlyCreatedUser = new User({
            username: username,
            email: email,
            password: hashedPassword,
            role: role || 'user'
        })

        await newlyCreatedUser.save();

        if (newlyCreatedUser) {
            res.status(201).json({
                success: true,
                message: 'User registered successfully'
            })
        } else {
            res.status(400).json({
                success: false,
                message: 'Unable to register user! Please try again.'
            })
        }
    } catch (error) {
        console.error('An error occured!:', error);
        res.status(500).json({
            success: false,
            message: 'Some error occured! Please try again'
        })
    }
}

//login controller
const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;


        //find if the current user exists in database or not
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User doesn't exists"
            })
        }
        //if the password is correct or not
        const isPasswwordMatch = await bcrypt.compare(password, user.password)

        if (!isPasswwordMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials"
            })
        }

        //create user token
        const accessToken = jwt.sign({
            userId: user._id,
            username: user.username,
            role: user.role
        }, process.env.JWT_SECRET_KEY, {
            expiresIn: '1d'
        })

        res.status(200).json({
            success: true,
            message: "Logged in successful",
            accessToken: accessToken
        })

    } catch (error) {

        console.error('An error occured!:', error);
        res.status(500).json({
            success: false,
            message: 'Some error occured! Please try again'
        })
    }
}

const changePassword = async (req, res) => {
    try {
        const { userId } = req.userInfo;

        //extract old and new password
        const { oldPassword, newPassword } = req.body;

        //find the current logged in user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        //check if the old password is correct
        const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);

        if (!isPasswordMatch) {
            return res.status(400).json({
                success: false,
                message: "Old password is not correct! Please try again"
            })
        }

        //hash the new password
        const salt = await bcrypt.genSalt(10)
        const newHashedPassword = await bcrypt.hash(newPassword, salt);

        //update the user password
        user.password = newHashedPassword;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password changed succesfully"
        })

    } catch (error) {
        console.error('An error occured!:', error);
        res.status(500).json({
            success: false,
            message: 'Some error occured! Please try again'
        })
    }
}

module.exports = {
    loginUser,
    registerUser,
    changePassword
}