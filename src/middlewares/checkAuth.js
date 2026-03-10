import express from "express";
import UserModel from "../models/user.js";
import jwt from "jsonwebtoken";

async function checkAuth(req, res, next) {
  try {
    let authToken = req.cookies.authToken;
    let { mobileToken , ismobileapp : isMobileApp } = req.headers;
    console.log(req.headers)

    if (!authToken && !isMobileApp) {
      return res.status(401).json({
        isLogin: false,
        success: false,
        message: "Unauthorized",
      });
    }

    if ((isMobileApp === 'true') && mobileToken) {
      authToken = mobileToken;
    }

    if (!authToken) {
      return res.status(401).json({
        isLogin: false,
        success: false,
        message: "Unauthorized",
      });
    }


    let decode = jwt.verify(authToken, process.env.JWT_SECRET);
    let userId = decode.userId;
    
    let user = await UserModel.findById(userId);
    console.log(user)
    if (!user) {
      return res.status(401).json({
        isLogin: false,
        success: false,
        message: "user not found",
      });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({
      isLogin: false,
      success: false,
      message: error.message,
    });

    console.log('middleware error')
  }
}

export default checkAuth;
