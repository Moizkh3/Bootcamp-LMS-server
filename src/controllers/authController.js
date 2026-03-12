import mongoose from "mongoose";
import User from "../models/user.js";
import Bootcamp from "../models/bootcampModel.js";
import Domain from "../models/domainSchema.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import sendEmail from "../utils/sendMail.js";
import utils from "../models/utilsSchema.js";
import XLSX from "xlsx";

// Helper: parse CSV/Excel buffer into array of objects
function excelBufferToArray(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet);
}

let cookiesConfig = {
  httpOnly: true,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  sameSite: "none",
  secure: true, // Required for sameSite: "none"
};

// export const createUser = async (req, res) => {
//   try {
//     const { name, email, password, role, bootcampId, domainId } = req.body;

//     if (!name || !email || !password || !role) {
//       return res.status(400).send({
//         success: false,
//         message: "Required fields missing",
//       });
//     }

//     const existing = await User.findOne({ email });

//     if (existing) {
//       return res.status(400).send({
//         success: false,
//         message: "User already exists",
//       });
//     }

//        const hashed = await bcrypt.hash(userPassword, 10);

//     const user = await User.create({
//       name,
//       email,
//       password: hashed,
//       role,
//       bootcampId,
//       domainId,
//     });

//     res.status(201).send({
//       success: true,
//       message: "User created successfully",
//       user,
//     });
//   } catch (err) {
//     res.status(500).send({
//       success: false,
//       message: err.message,
//     });
//   }
// };

export async function login(req, res) {
  try {
    let { email, password, isMobileApp } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    let isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    let token = jwt.sign(
      {
        userId: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.cookie("authToken", token, cookiesConfig);

    let isFirstLogin = user.isFirstLogin;
    user.isFirstLogin = false;

    user = (await user.save()).toObject();

    delete user.password
    delete user.isFirstLogin;

    if (isMobileApp) {
      return res.status(200).json({
        success: true,
        userId: user._id,
        token,
        message: "Logged in successfully",
        bootcampId: user.bootcampId,
        domainId: user.domainId,
        role: user.role,
        status: user.status,
        isFirstLogin,
      })
    }

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      data: user,
      isFirstLogin
    })




    // res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export const getUsers = async (req, res) => {
  try {
    const { role, bootcampId, domainId, status, startDate, endDate, studentStatus, teacherStatus } = req.query;

    let filter = {};

    if (role) {
      filter.role = role;
    }

    if (bootcampId) {
      filter.$or = [
        { studentBootcampId: new mongoose.Types.ObjectId(bootcampId) },
        { teacherBootcampIds: new mongoose.Types.ObjectId(bootcampId) }
      ];
    }

    if (domainId) {
      filter.$or = [
        { domainId: new mongoose.Types.ObjectId(domainId) },
        { teacherDomainIds: new mongoose.Types.ObjectId(domainId) }
      ];
    }

    if (status) {
      filter.$or = [
        { studentStatus: status },
        { teacherStatus: status }
      ];
    }

    if (studentStatus) {
      filter.studentStatus = studentStatus;
    }

    if (teacherStatus) {
      filter.teacherStatus = teacherStatus;
    }

    if (startDate || endDate) {
      filter.createdAt = {};

      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }

      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    const users = await User.find(filter)
      .populate("studentBootcampId", "name")
      .populate("teacherBootcampIds", "name")
      .populate("teacherDomainIds", "name")
      .populate("domainId", "name")
      .sort({ createdAt: -1 });

    res.status(200).send({
      success: true,
      message: "Users fetched",
      users,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

export const getSingleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("studentBootcampId", "name")
      .populate("teacherBootcampIds", "name")
      .populate("teacherDomainIds", "name")
      .populate("domainId", "name");

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "User fetched",
      user,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "User deleted",
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.domainId === "") updateData.domainId = null;
    if (updateData.studentBootcampId === "") updateData.studentBootcampId = null;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "User updated",
      user,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

export async function logout(req, res) {
  res.clearCookie("authToken", cookiesConfig);
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
}

// export async function register(req, res) {
//   try {
//     let { name, email, password, role } = req.body;
//     let user = await User.findOne({ email });
//     if (user) {
//       return res.status(400).json({
//         success: false,
//         message: "User already exists",
//       });
//     }

//     let newUser = new User({
//       name,
//       email,
//       password,
//       role,
//     });

//     let savedUser = await newUser.save();

//     res.status(201).json({
//       success: true,
//       message: "User registered successfully",
//       data: savedUser,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// }

export async function changePassword(req, res) {
  try {
    let { oldPassword, newPassword } = req.body;
    let user = req.user;
    let isPasswordMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    let newhashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = newhashedPassword;
    let updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
      data: updatedUser,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
}

export const getProfile = async (req, res) => {
  try {
    const user = req.user.toObject();
    delete user.password;
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export async function sentOtpForResetPassword(req, res) {
  try {

    let { email } = req.body;
    if (!email) {
      return res.status(401).json({
        success: false,
        message: 'Email is required'
      })
    }

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email is not register'
      })
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiryTimeOfOtp = Date.now() + 10 * 60 * 1000;

    const hashedOtp = await bcrypt.hash(otp.toString(), 10);

    user.otp = hashedOtp;
    user.otpExpiry = expiryTimeOfOtp;

    await user.save();

    await sendEmail({
      to: user.email,
      subject: 'OTP to reset your account password',
      template: 'passwordReset',
      context: {
        otp,
        expiryTime: '10',
        name: user.name
      }
    });

    res.status(200).json({
      success: true,
      message: 'OTP has successfully sent!'
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export async function verifyOtp(req, res) {
  try {
    let { otp, email, newPassword } = req.body;
    let user = await User.findOne({ email });
    let currentTime = new Date();
    let otpExpiryTime = new Date(user.otpExpiry);
    let isOtpExpired = currentTime > otpExpiryTime;
    if (isOtpExpired) {
      return res.status(400).json({
        success: false,
        message: 'Otp has expired'
      })
    }
    let isOtpCorrect = await bcrypt.compare(otp, user.otp);
    if (!isOtpCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Wrong OTP'
      })
    }

    let newhashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = newhashedPassword;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has successfully changed'
    })


  } catch (error) {
    console.log(error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

export const register = async (req, res) => {
  try {
    const { name, email, role, studentBootcampId, teacherBootcampIds, domainId, teacherDomainIds, password, studentStatus, teacherStatus } = req.body;
    const userPassword = password || "BMS@2024";

    if (!name || !email || !role) {
      return res.status(400).send({
        success: false,
        message: "Required fields missing",
      });
    }

    if (role === 'student' && !studentBootcampId) {
      return res.status(400).send({
        success: false,
        message: "Student bootcamp is required",
      });
    }

    if (role === 'teacher' && teacherBootcampIds?.length === 0) {
      return res.status(400).send({
        success: false,
        message: "Teacher bootcamp is required",
      });
    }



    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(400).send({
        success: false,
        message: "User already exists",
      });
    }

    const hashed = await bcrypt.hash(userPassword, 10);

    const newUser = new User({
      name,
      email,
      password: hashed,
      role,
      studentBootcampId: (role === 'student' && studentBootcampId !== "") ? studentBootcampId : undefined,
      teacherBootcampIds: role === 'teacher' ? teacherBootcampIds : [],
      domainId: (role === 'student' && domainId !== "") ? domainId : null,
      teacherDomainIds: role === 'teacher' ? (teacherDomainIds || (domainId ? [domainId] : [])) : [],
      studentStatus: role === 'student' ? (studentStatus || 'enrolled') : undefined,
      teacherStatus: role === 'teacher' ? (teacherStatus || 'active') : undefined,
    });

    let util = await utils.findOne();

    if (!util) {
      // Initialize utils if not exists
      util = new utils({ rollNo: 1000 });
    } else {
      util.rollNo = util.rollNo + 1;
    }

    await util.save();

    newUser.rollNo = util.rollNo;

    let user = await newUser.save();

    // Send Welcome Email
    try {
      if (role === 'teacher' || role === 'student') {
        const bootcampId = role === 'student' ? studentBootcampId : teacherBootcampIds[0];
        const bc = await Bootcamp.findById(bootcampId);
        const dom = await Domain.findById(domainId);
        const loginLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;

        await sendEmail({
          to: user.email,
          subject: `Welcome to BMS! - ${name}`,
          template: role === 'teacher' ? 'teacher-wellcome-email' : 'student-wellcome-email',
          context: {
            name: user.name,
            email: user.email,
            password: userPassword,
            bootcampName: bc?.name || 'Assigned Bootcamp',
            domainName: dom?.name || 'General',
            loginLink,
          }
        });
      }
    } catch (emailErr) {
      console.error("Failed to send welcome email:", emailErr);
    }

    res.status(201).send({
      success: true,
      message: "User created successfully",
      data: user
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message,
    });
  }
};

// ─── BULK REGISTER STUDENTS FROM CSV/EXCEL ───────────────────────────────────
export const registerBulkUsers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    let users = excelBufferToArray(req.file.buffer);

    if (!users || users.length === 0) {
      return res.status(400).json({ success: false, message: "No users found in the file" });
    }

    let utilDoc = await utils.findOne();
    if (!utilDoc) {
      utilDoc = new utils({ rollNo: 1000 });
    }

    const { bootcampId, domainId } = req.body;

    if (!bootcampId || !domainId) {
      return res.status(400).json({ success: false, message: "bootcampId and domainId are required" });
    }

    const defaultPassword = "BMS@2024";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const usersToInsert = [];
    for (let user of users) {
      utilDoc.rollNo = utilDoc.rollNo + 1;
      usersToInsert.push({
        name: user.name || user.Name,
        email: user.email || user.Email,
        password: hashedPassword,
        rollNo: utilDoc.rollNo,
        domainId,
        role: "student",
        studentStatus: "enrolled",
        studentBootcampId: bootcampId,
        isFirstLogin: true,
      });
    }

    const newUsers = await User.insertMany(usersToInsert);

    await User.populate(newUsers, [
      { path: "studentBootcampId", select: "name" },
      { path: "domainId", select: "name" },
    ]);

    await utilDoc.save();

    // Respond immediately
    res.status(201).json({
      success: true,
      message: `${newUsers.length} student(s) registered successfully`,
    });

    // Send welcome emails (non-blocking, after response sent)
    for (let user of newUsers) {
      try {
        await sendEmail({
          to: user.email,
          subject: "Welcome to the Bootcamp!",
          template: "student-wellcome-email",
          context: {
            name: user.name,
            email: user.email,
            password: defaultPassword,
            bootcampName: user.studentBootcampId?.name || "Assigned Bootcamp",
            domainName: user.domainId?.name || "General",
            loginLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`,
          },
        });
      } catch (emailErr) {
        console.error(`Failed to send email to ${user.email}:`, emailErr.message);
      }
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
