import Bootcamp from "../models/bootcampModel.js";
import User from "../models/user.js";
import assignment from "../models/assignmentModel.js";
import Domain from "../models/domainSchema.js";

export async function getKpis(req, res) {
  try {
    let totalBootcamps = await Bootcamp.countDocuments();
    let [users] = await User.aggregate([
      {
        $group: {
          _id: null,

          students: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$role", "student"] },
                    { $eq: ["$studentStatus", "enrolled"] },
                  ],
                },
                1,
                0,
              ],
            },
          },

          teachers: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$role", "teacher"] },
                    { $eq: ["$teacherStatus", "enrolled"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    let activeassignments = await assignment.countDocuments({
      deadline: { $gte: new Date() },
    });

    let anylatics = {
      totalBootcamps,
      totalStudents: users?.students ?? 0,
      totalTeachers: users?.teachers ?? 0,
      activeassignments,
    };

    res.status(200).json({
      success: true,
      message: "KPIs fetched successfully",
      data: anylatics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getEnrollmentByDomains(req, res) {
  try {
    let domains = await Domain.find().lean();

    for (const domain of domains) {
      domain.students = await User.countDocuments({
        role: "student",
        studentStatus: "enrolled",
        domainId: domain._id,
      });
    }

    let totalStudents = await User.countDocuments({
      role: "student",
      studentStatus: "enrolled",
    });

    res.status(200).json({
      success: true,
      message: "Enrollment by domains fetched successfully",
      data: domains,
      totalStudents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
