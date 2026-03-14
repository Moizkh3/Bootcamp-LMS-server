import Bootcamp from "../models/bootcampModel.js";
import User from "../models/user.js";
import assignment from "../models/assignmentModel.js";
import SubmittedAssignment from "../models/submissionModel.js";
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
                    { $in: ["$studentStatus", ["enrolled", "active", "Active"]] },
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
                    { $in: ["$teacherStatus", ["active", "Active", "enrolled"]] },
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

    let totalSubmissions = await SubmittedAssignment.countDocuments();
    let pendingSubmissions = await SubmittedAssignment.countDocuments({ status: "submitted" });

    let anylatics = {
      totalBootcamps,
      totalStudents: users?.students ?? 0,
      totalTeachers: users?.teachers ?? 0,
      activeassignments,
      totalSubmissions,
      pendingSubmissions
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
    
    // We want to count students who are "Active". 
    // Usually status is 'enrolled', but let's be safe and check for case-insensitive 'active' too if needed,
    // though the model says 'enrolled'.
    
    const domainsWithCounts = await Promise.all(domains.map(async (domain) => {
      const studentsCount = await User.countDocuments({
        role: "student",
        studentStatus: { $in: ["enrolled", "active", "Active"] }, // Handle potential legacy variations
        domainId: domain._id,
      });
      return { ...domain, studentsCount };
    }));

    const totalStudents = await User.countDocuments({
      role: "student",
      studentStatus: { $in: ["enrolled", "active", "Active"] },
    });

    res.status(200).json({
      success: true,
      message: "Enrollment by domains fetched successfully",
      data: domainsWithCounts,
      totalStudents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
