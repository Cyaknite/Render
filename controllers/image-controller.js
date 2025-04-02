const Image = require('../models/Image');
const { uploadToCloudinary } = require("../helpers/cloudinaryHelper")
const fs = require('fs')
const cloudinary = require('../config/cloudinary');
const { default: mongoose } = require('mongoose');

const uploadImageController = async (req, res) => {
    try {
        //check if the fle is missing in req object
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'File is required. Please upload an image'
            })
        }
        //upload to cloudinary
        const { url, publicId } = await uploadToCloudinary(req.file.path);

        //store the image url and the public id along with the uploaded user id
        const newlyUploadedImage = new Image({
            url,
            publicId,
            uploadedBy: req.userInfo.userId
        })


        await newlyUploadedImage.save();
        //delete the file
        fs.unlink(req.file.path, (error) => {
            if (error) {
                console.error(error);
            }
        })

        res.status(201).json({
            success: true,
            message: "Image uploaded successfully",
            image: newlyUploadedImage
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Something went wrong! Please try again'
        })
    }
}

const fetchImagesController = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit

        const sort = req.query.sortBy || 'createdAt'
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        const totalImages = await Image.countDocuments();
        const totalPages = Math.ceil(totalImages / limit)

        const sortObject = {};
        sortObject['sortBy'] = sortOrder;
        const images = await Image.find().sort(sortObject).skip(skip).limit(limit);
        if (images) {
            res.status(200).json({
                success: true, currentPage: page,
                totalPages,
                totalImages,
                data: images
            })
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Something went wrong! Please try again"
        })
    }
}

const deleteImageController = async (req, res) => {
    try {
        const getCurrentIdOfImageToBeDeleted = req.params.id;
        const userId = req.userInfo.userId;

        const image = await Image.findById(getCurrentIdOfImageToBeDeleted)

        if (!image) {
            return res.status(404).json({
                success: false,
                message: 'Image not found'
            })
        }

        //check if this image is uploaded by the current user who is trying to delete this image
        if (image.uploadedBy.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: `You are not authorized to delete this image because you haven't uploaded it`
            })
        }
        //delete this image first from your cloudinary storage
        await cloudinary.uploader.destroy(image.publicId);

        //uploadedBy-67d8376d2d3f2b3a8206904d
        //delete this image from mongodb database
        await Image.findByIdAndDelete(getCurrentIdOfImageToBeDeleted)

        res.status(200).json({
            success: true,
            message: `Image deleted Successfully`
        })

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Something went wrong! Please try again"
        })
    }
}

module.exports = {
    uploadImageController,
    fetchImagesController,
    deleteImageController
}