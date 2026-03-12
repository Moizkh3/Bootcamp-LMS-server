import Progress from "../models/dailyProgressModel.js";
import User from "../models/user.js";

export const submitProgress = async (req, res) => {
  try {
    const {
      yesterdayWork,
      workedOn,
      todayPlan,
      planToday,
      blockers,
      needMentor,
      githubLink,
      hoursWorked,
      date,
    } = req.body;

    const finalYesterdayWork = yesterdayWork || workedOn;
    const finalTodayPlan = todayPlan || planToday;

    if (!finalYesterdayWork || !finalTodayPlan || hoursWorked === undefined) {
      return res.status(400).send({
        success: false,
        message: "Required fields missing",
      });
    }

    const progressData = {
      studentId: req.user._id,
      bootcampId: req.user.studentBootcampId || req.user.bootcampId,
      yesterdayWork: finalYesterdayWork,
      todayPlan: finalTodayPlan,
      blockers,
      needMentor: !!needMentor,
      githubLink,
      hoursWorked,
    };

    if (date) {
      progressData.date = date;
    }

    const progress = await Progress.create(progressData);

    res.status(201).send({
      success: true,
      message: "Progress submitted successfully",
      data: progress,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};
// update
export const updateProgress = async (req, res) => {
  try {
    const progress = await Progress.findById(req.params.id);

    if (!progress) {
      return res.status(404).send({
        message: "Progress not found",
      });
    }

    const now = new Date();
    const created = new Date(progress.createdAt);
    const diff = (now - created) / (1000 * 60);

    if (diff > 120) {
      return res.status(403).send({
        message: "Progress can only be edited within 2 hours",
      });
    }
    const updatedProgress = await Progress.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );

    res.status(200).send({
      success: true,
      message: "Progress updated successfully",
      data: updatedProgress,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};
// get
export const getStudentProgress = async (req, res) => {
  try {
    const progress = await Progress.find({
      studentId: req.user._id,
    })
      .populate("mentor", "name")
      .sort({ date: -1, createdAt: -1 });

    const now = new Date();
    const progressWithEditable = progress.map((p) => {
      const created = new Date(p.createdAt);
      const diff = (now - created) / (1000 * 60);
      return {
        ...p.toObject(),
        isEditable: diff <= 120,
      };
    });

    res.status(200).send({
      success: true,
      message: "student progress fetched successfully",
      data: progressWithEditable,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};
export const getBootcampProgress = async (req, res) => {
  try {
    const { bootcampId } = req.params;

    const progress = await Progress.find({
      bootcampId,
    })
      .populate("studentId", "name email rollNo")
      .sort({ date: -1, createdAt: -1 });

    res.status(200).send({
      success: true,
      message: "bootcamp progress fetched successfully",
      data: progress,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// Teacher review standup
export const reviewStandup = async (req, res) => {
  try {
    const { id } = req.params;
    const { grade, feedback } = req.body;
    console.log(`[ReviewStandup] ID: ${id}, Grade: ${grade}, User: ${req.user?._id}`);

    const progress = await Progress.findById(id);
    if (!progress) {
      console.log(`[ReviewStandup] Progress not found for ID: ${id}`);
      return res.status(404).json({ success: false, message: "Progress record not found" });
    }

    progress.reviewedAt = new Date();
    progress.mentor = req.user._id;
    if (grade) progress.grade = grade;
    if (feedback) progress.feedback = feedback;
    
    await progress.save();
    console.log(`[ReviewStandup] Successfully updated ID: ${id}`);

    res.status(200).json({
      success: true,
      message: "Standup reviewed successfully",
      data: progress
    });
  } catch (error) {
    console.error(`[ReviewStandup] Error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin get all progress (optional domain filter)
export const getAllProgress = async (req, res) => {
  try {
    const { domainId } = req.query;
    let query = {};

    if (domainId && domainId !== 'all') {
      const studentsInDomain = await User.find({ domainId, role: 'student' }).select('_id');
      const studentIds = studentsInDomain.map(s => s._id);
      query.studentId = { $in: studentIds };
    }

    const progress = await Progress.find(query)
      .populate("studentId", "name email rollNo domainId")
      .populate("bootcampId", "name")
      .populate("mentor", "name")
      .sort({ date: -1, createdAt: -1 });

    res.status(200).send({
      success: true,
      message: "All progress fetched successfully",
      data: progress,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};
