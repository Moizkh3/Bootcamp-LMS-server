import mongoose from "mongoose";
import dailyProgressModel from "../models/dailyProgressModel.js";
import Assignment from "../models/assignmentModel.js";
import Submission from "../models/submissionModel.js";
import User from "../models/user.js";
import Bootcamp from "../models/bootcampModel.js";

export async function isSubmitTodayStandup(req, res) {
    try {
        let studentId = req.user._id;
        let lastStandup = await dailyProgressModel
            .find({ studentId })
            .sort({ createdAt: -1 })
            .limit(1);

            console.log(lastStandup);

        if (lastStandup.length === 0) {
            return res.status(200).json({
                success: true,
                message: "Today's standup status fetched successfully",
                isSubmitTodayStandup: false
            })
        }


        let lastStandupDate = new Date(lastStandup[0].createdAt);
        let today = new Date();

        const isSubmitTodayStandup = (
            lastStandupDate.getFullYear() === today.getFullYear() &&
            lastStandupDate.getMonth() === today.getMonth() &&
            lastStandupDate.getDate() === today.getDate()
        );

        const diff = (today - lastStandupDate) / (1000 * 60);
        const isEditable = diff <= 120;

        res.status(200).json({
            success: true,
            message: "Today's standup status fetched successfully",
            isSubmitTodayStandup,
            isEditable,
            todayStandup: isSubmitTodayStandup ? lastStandup[0] : null
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export async function getStudentStats(req, res) {
    try {
        const studentId = req.user._id;
        const student = await User.findById(studentId);
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });

        const allSubmissions = await Submission.find({ student: studentId });
        const submittedAssignmentIds = allSubmissions.map(sub => sub.assignment);

        const assignmentQuery = {
            $or: [
                { status: { $in: ['published', 'Active'] } },
                { _id: { $in: submittedAssignmentIds } }
            ]
        };

        if (student.studentBootcampId) {
            assignmentQuery.bootcamp = new mongoose.Types.ObjectId(student.studentBootcampId);
        }

        if (student.domainId) {
            const domainFilter = {
                $or: [
                    { domain: new mongoose.Types.ObjectId(student.domainId) },
                    { domain: { $exists: false } },
                    { domain: null }
                ]
            };

            assignmentQuery.$and = [
                {
                    $or: [
                        { $and: [{ status: { $in: ['published', 'Active'] } }, domainFilter] },
                        { _id: { $in: submittedAssignmentIds } }
                    ]
                }
            ];
            delete assignmentQuery.$or;
        }

        const totalAssignments = await Assignment.countDocuments(assignmentQuery);
        
        // Calculate Average Grade from graded submissions
        const gradedSubmissions = allSubmissions.filter(sub => sub.status === 'graded');
        const completedAssignments = gradedSubmissions.length;
        const totalScore = gradedSubmissions.reduce((acc, curr) => acc + (curr.grade || 0), 0);
        const avgGrade = completedAssignments > 0 ? Math.round(totalScore / completedAssignments) : 0;

        const totalStandups = await dailyProgressModel.countDocuments({ studentId });

        // Calculate Attendance %
        // Logic: (Number of Standups submitted / Days elapsed since bootcamp start) * 100
        let attendance = 0;
        if (student.studentBootcampId) {
            const bootcamp = await Bootcamp.findById(student.studentBootcampId);
            if (bootcamp && bootcamp.startDate) {
                const start = new Date(bootcamp.startDate);
                const today = new Date();
                const diffTime = Math.abs(today - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // Minimum 1 day
                
                attendance = Math.min(Math.round((totalStandups / diffDays) * 100), 100);
            }
        }

        res.status(200).json({
            success: true,
            data: { 
                totalAssignments, 
                completedAssignments, 
                totalStandups, 
                avgGrade: `${avgGrade}%`,
                attendance: `${attendance}%`,
                user: student 
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

export async function getStudentAssignments(req, res) {
    try {
        const studentId = req.user._id;
        const student = await User.findById(studentId);
        if (!student) return res.status(404).json({ success: false, message: "Student not found" });

        const submissions = await Submission.find({ student: studentId });
        const submittedAssignmentIds = submissions.map(sub => sub.assignment);

        const assignmentQuery = {
            $or: [
                { status: { $in: ['published', 'Active'] } },
                { _id: { $in: submittedAssignmentIds } }
            ]
        };

        if (student.studentBootcampId) {
            assignmentQuery.bootcamp = new mongoose.Types.ObjectId(student.studentBootcampId);
        }

        if (student.domainId) {
            // Filter by domain for active assignments, OR just keep the $or logic simple
            // Actually, we should probably ensure that even for submitted assignments, they belong to the student's context?
            // Usually, they won't have a submission for an assignment they shouldn't see.
            
            const domainFilter = {
                $or: [
                    { domain: new mongoose.Types.ObjectId(student.domainId) },
                    { domain: { $exists: false } },
                    { domain: null }
                ]
            };

            // We need to be careful with nested $or. 
            // Assignment must be (Active AND DomainMatches) OR (Submitted)
            // Wait, if it's submitted, we definitely want to show it.
            // If it's Active, we only want to show it if DomainMatches.
            
            assignmentQuery.$and = [
                { $or: [
                    { $and: [
                        { status: { $in: ['published', 'Active'] } },
                        domainFilter
                    ]},
                    { _id: { $in: submittedAssignmentIds } }
                ]}
            ];
            // Remove the top level $or since we handled it in $and
            delete assignmentQuery.$or;

        } else {
             // No domainId assigned to student, show everything in the bootcamp that is Active OR Submitted
        }
        // If student has no domain, we don't add the domain filter, 
        // so it shows all assignments in the bootcamp.

        const assignments = await Assignment.find(assignmentQuery)
            .populate('domain', 'name type')
            .populate('bootcamp', 'name')
            .sort({ deadline: 1 });

        const assignmentsWithStatus = assignments.map(asm => {
            const submission = submissions.find(sub => sub.assignment.toString() === asm._id.toString());
            return {
                ...asm.toObject(),
                submissionStatus: submission ? (submission.status === 'graded' ? 'graded' : submission.status === 're-submit' ? 're-submit' : 'submitted') : 'not-started',
                submissionId: submission ? submission._id : null,
                isSubmit: !!submission,
                grade: submission ? submission.grade : null,
                feedback: submission ? submission.feedback : null
            };
        });

        res.status(200).json({ success: true, data: assignmentsWithStatus });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}