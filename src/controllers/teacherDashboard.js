import User from "../models/user.js";
import Assignment from "../models/assignmentModel.js";
import Submission from "../models/submissionModel.js";
import mongoose from "mongoose";
import Bootcamp from "../models/bootcampModel.js";
import Domain from "../models/domainSchema.js";
import fs from "fs";

export const getTeacherStats = async (req, res) => {
    try {
        const teacherId = req.user._id;
        const teacher = await User.findById(teacherId)
            .populate('teacherBootcampIds', 'name')
            .populate('teacherDomainIds', 'name');

        // Safety checks for teacher data
        const bootcampIds = (teacher.teacherBootcampIds || []).map(b => new mongoose.Types.ObjectId(b._id || b));
        const domainIds = (teacher.teacherDomainIds || []).map(d => new mongoose.Types.ObjectId(d._id || d));

        const teacherDomainNames = teacher.teacherDomainIds?.length > 0 
            ? teacher.teacherDomainIds.map(d => d.name).join(', ') 
            : (teacher.domainId?.name || 'All Domains');
        const teacherBootcampNames = (teacher.teacherBootcampIds || []).map(b => b.name).join(', ') || 'All Bootcamps';
        const activeBootcamps = (teacher.teacherBootcampIds || []).map(b => ({ _id: b._id, name: b.name }));

        // 1. Total Enrolled Students (Match by Bootcamp OR Domain)
        const studentQueryConditions = [];
        if (bootcampIds && bootcampIds.length > 0) {
            studentQueryConditions.push({ studentBootcampId: { $in: bootcampIds } });
        }
        if (domainIds.length > 0) {
            studentQueryConditions.push({ domainId: { $in: domainIds } });
        } else if (teacher.domainId) {
            studentQueryConditions.push({ domainId: teacher.domainId });
        }

        const studentQuery = {
            role: 'student',
            studentStatus: 'enrolled',
        };

        if (studentQueryConditions.length > 0) {
            studentQuery.$or = studentQueryConditions;
        }

        const totalEnrolled = await User.countDocuments(studentQuery);
        const enrolledStudentsExist = await User.countDocuments({ role: 'student', studentStatus: 'enrolled' });
        
        // 2. Total Assignments (Active/Published)
        const totalAssignments = await Assignment.countDocuments({
            $or: [
                { teacher: teacherId },
                { bootcamp: { $in: bootcampIds } }
            ],
            status: { $in: ['Active', 'published'] }
        });

        // 3. Pending Submissions to grade
        const assignments = await Assignment.find({
            $or: [
                { teacher: teacherId },
                { bootcamp: { $in: bootcampIds } }
            ],
            status: { $in: ['Active', 'published'] }
        }).select('_id');

        const assignmentIds = assignments.map(a => a._id);

        // User expectation: If an assignment is created and there's a student, it should show 1 pending.
        // This implies "Pending" = (Total Assignments * Total Enrolled Students) - (Already Graded)
        // This gives a count of "tasks requiring attention" (either submission or grading)
        const gradedCount = await Submission.countDocuments({
            assignment: { $in: assignmentIds },
            status: 'graded'
        });

        const pendingGrades = Math.max(0, (totalEnrolled * assignmentIds.length) - gradedCount);

        // 4. Overdue (placeholder logic)
        const now = new Date();
        const overdueAssignments = await Assignment.countDocuments({
            bootcamp: { $in: bootcampIds },
            deadline: { $lt: now }
        });

        // 5. Upcoming Deadlines
        const upcomingDeadlines = await Assignment.find({
            bootcamp: { $in: bootcampIds },
            deadline: { $gte: now }
        }).sort({ deadline: 1 }).limit(5).populate('domain', 'name');

        // Calculate submissions count for each upcoming deadline
        const formattedDeadlines = await Promise.all(upcomingDeadlines.map(async (assignment) => {
            const submissionsCount = await Submission.countDocuments({ assignment: assignment._id });
            // Approximate total students based on totalEnrolled (assuming all are required)
            // Or ideally count students in that specific bootcamp
            const totalStudentsInBootcamp = await User.countDocuments({
                role: 'student',
                studentBootcampId: assignment.bootcamp,
                studentStatus: 'enrolled'
            });

            return {
                _id: assignment._id,
                title: assignment.title,
                domain: assignment.domain?.name || 'General',
                deadline: assignment.deadline,
                submissionsCount,
                totalStudents: totalStudentsInBootcamp,
                progress: totalStudentsInBootcamp > 0 ? Math.round((submissionsCount / totalStudentsInBootcamp) * 100) : 0
            };
        }));

        // 6. Recent Activity (Latest Submissions)
        const recentActivity = await Submission.find({
            assignment: { $in: assignmentIds }
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('student', 'name')
            .populate('assignment', 'title');

        const formattedActivity = recentActivity.map(sub => ({
            _id: sub._id,
            user: sub.student?.name || 'Unknown Student',
            action: sub.status === 'submitted' ? 'submitted' : 'updated',
            target: sub.assignment?.title || 'an assignment',
            time: sub.createdAt,
            status: sub.status
        }));


        res.status(200).json({
            success: true,
            data: {
                totalEnrolled,
                totalAssignments,
                pendingGrades,
                overdueAssignments,
                upcomingDeadlines: formattedDeadlines,
                recentActivity: formattedActivity,
                teacherDomain: teacherDomainNames,
                teacherDomainIds: domainIds,
                teacherBootcamps: teacherBootcampNames,
                activeBootcamps
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getTeacherSubmissions = async (req, res) => {
    try {
        const teacherId = req.user._id;
        const teacher = await User.findById(teacherId);
        const bootcampIds = teacher.teacherBootcampIds;

        const assignments = await Assignment.find({
            $or: [
                { teacher: teacherId },
                { bootcamp: { $in: bootcampIds } }
            ]
        }).select('_id');

        const assignmentIds = assignments.map(a => a._id);

        const submissions = await Submission.find({
            assignment: { $in: assignmentIds }
        })
            .populate('student', 'name profileImage rollNo')
            .populate({
                path: 'assignment',
                select: 'title module domain deadline',
                populate: { path: 'domain', select: 'name' }
            })
            .sort({ createdAt: -1 });

        const processedSubmissions = submissions.map(sub => {
            const subObj = sub.toObject ? sub.toObject() : sub;
            return {
                ...subObj,
                isSubmit: !!subObj.student
            };
        });

        res.status(200).json({
            success: true,
            data: processedSubmissions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getSubmissionById = async (req, res) => {
    try {
        const { id } = req.params;
        const submission = await Submission.findById(id)
            .populate('student', 'name profileImage rollNo')
            .populate({
                path: 'assignment',
                select: 'title module domain deadline description documentUrl',
                populate: { path: 'domain', select: 'name' }
            });

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: "Submission not found"
            });
        }

        res.status(200).json({
            success: true,
            data: submission
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
