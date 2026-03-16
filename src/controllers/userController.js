import express from "express"
import User from "../models/user.js"
import jwt from 'jsonwebtoken'
import utils from "../models/utilsSchema.js";


export async function getProfile(req, res) {
    try {
        let user = req.user.toObject ? req.user.toObject() : { ...req.user };
        
        delete user.password;
        // Keep isFirstLogin for frontend logic
        delete user.otp;

        const { ismobileapp: isMobileApp } = req.headers;

        let newToken = jwt.sign(
            {
                userId: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            },
        );

        res.cookie("authToken", newToken, {
            // httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1,
            sameSite: "none"
        })

        if (isMobileApp === 'true') {

            return res.status(200).json({
                success: true,
                message: 'Logged in successfully in mobile app!',
                data: user,
                token: newToken
            })
        }



        res.status(200).json({
            success: true,
            data: user,
            token: newToken
        })


        console.log('response sent')
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })

    }
}

export async function updateProfile(req, res) {
    try {
        const userId = req.user._id;
        const { name, phone, bio, location, avatar } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { name, phone, bio, location, avatar },
            { new: true, runValidators: true }
        ).select("-password -otp -otpExpiry");

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updatedUser
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export async function getUsersByRole(req, res) {
    try {
        const { role, bootcampId } = req.query;
        if (!role) {
            return res.status(400).json({
                success: false,
                message: 'Role is required'
            });
        }

        let query = { role };
        
        if (req.query.search) {
            query.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { email: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        if (bootcampId) {
            if (role === 'teacher') {
                query.teacherBootcampIds = bootcampId;
            } else if (role === 'student') {
                query.studentBootcampId = bootcampId;
            }
        }

        const users = await User.find(query).select('name email _id rollNo studentStatus teacherStatus createdAt');
        res.status(200).json({
            success: true,
            data: users,
            users: users // For frontend compatibility
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// export const getUser = async (req,res)=>{
//  try{

//   const user = await User.findById(req.params.id)
//    .populate("bootcampId","name")
//    .populate("domainId","name")

//   if(!user){
//    return res.status(404).send({
//     success:false,
//     message:"User not found"
//    })
//   }

//   res.status(200).send({
//    success:true,
//    message:"User fetched",
//    user
//   })

//  }catch(err){

//   res.status(500).send({
//    success:false,
//    message:err.message
//   })

//  }
// }