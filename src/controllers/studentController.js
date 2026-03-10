import User from "../models/user.js";
import bcrypt from "bcryptjs";

// ─── CREATE STUDENT ──────────────────────────────────────────────────────────
// Only admin or teacher can access this route
export async function createStudent(req, res) {
  try {
    const { name, email, bootcampId, domainId, rollNo, studentStatus } =
      req.body;

    // Validate required fields
    if (!name || !email || !bootcampId || !domainId || !rollNo) {
      return res.status(400).json({
        success: false,
        message:
          "Required fields missing: name, email, bootcampId, domainId, rollNo",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    // Check if rollNo already exists
    const existingRollNo = await User.findOne({ rollNo, role: "student" });
    if (existingRollNo) {
      return res.status(409).json({
        success: false,
        message: "A student with this roll number already exists",
      });
    }

    // Hash a default password. Student must change it on first login.
    const defaultPassword = "student@123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const newStudent = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "student",
      bootcampId,
      domainId,
      rollNo,
      studentStatus: studentStatus || "enrolled",
      isFirstLogin: true,
    });

    // Remove password from response
    const studentObj = newStudent.toObject();
    delete studentObj.password;

    return res.status(201).json({
      success: true,
      message:
        "Student created successfully. Default password is 'student@123'.",
      data: studentObj,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// ─── GET ALL STUDENTS ────────────────────────────────────────────────────────
// Admin sees all students; teacher sees only students in their bootcamp
export async function getAllStudents(req, res) {
  try {
    const { bootcampId, domainId, studentStatus } = req.query;

    // Build filter: always filter by role = student
    const filter = { role: "student" };

    // Teachers are scoped to their own bootcamp
    if (req.user.role === "teacher") {
      filter.bootcampId = req.user.bootcampId;
    } else {
      // Admin can optionally filter by bootcamp
      if (bootcampId) filter.bootcampId = bootcampId;
    }

    if (domainId) filter.domainId = domainId;
    if (studentStatus) filter.studentStatus = studentStatus;

    const students = await User.find(filter)
      .select("-password")
      .populate("bootcampId", "name")
      .populate("domainId", "name")
      .sort({ rollNo: 1 });

    return res.status(200).json({
      success: true,
      message: "Students fetched successfully",
      count: students.length,
      data: students,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// ─── GET STUDENT BY ID ───────────────────────────────────────────────────────
export async function getStudentById(req, res) {
  try {
    const { id } = req.params;

    const student = await User.findOne({ _id: id, role: "student" })
      .select("-password")
      .populate("bootcampId", "name")
      .populate("domainId", "name");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Student fetched successfully",
      data: student,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// ─── EDIT STUDENT ────────────────────────────────────────────────────────────
export async function editStudent(req, res) {
  try {
    const { id } = req.params;
    const { name, email, bootcampId, domainId, studentStatus, rollNo } =
      req.body;

    if (
      !name &&
      !email &&
      !bootcampId &&
      !domainId &&
      !studentStatus &&
      !rollNo
    ) {
      return res.status(400).json({
        success: false,
        message: "No fields provided to update",
      });
    }

    const student = await User.findOne({ _id: id, role: "student" });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Check email uniqueness if being changed
    if (email && email !== student.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: "This email is already in use by another user",
        });
      }
      student.email = email;
    }

    // Check rollNo uniqueness if being changed
    if (rollNo && rollNo !== student.rollNo) {
      const rollExists = await User.findOne({ rollNo, role: "student" });
      if (rollExists) {
        return res.status(409).json({
          success: false,
          message: "This roll number is already in use by another student",
        });
      }
      student.rollNo = rollNo;
    }

    if (name) student.name = name;
    if (bootcampId) student.bootcampId = bootcampId;
    if (domainId) student.domainId = domainId;
    if (studentStatus) student.studentStatus = studentStatus;

    const updatedStudent = await student.save();
    const studentObj = updatedStudent.toObject();
    delete studentObj.password;

    return res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: studentObj,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// ─── DELETE STUDENT ──────────────────────────────────────────────────────────
export async function deleteStudent(req, res) {
  try {
    const { id } = req.params;

    const deletedStudent = await User.findOneAndDelete({
      _id: id,
      role: "student",
    });

    if (!deletedStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Student deleted successfully",
      data: {
        _id: deletedStudent._id,
        name: deletedStudent.name,
        email: deletedStudent.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
