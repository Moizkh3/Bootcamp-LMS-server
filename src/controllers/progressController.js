import Progress from "../models/dailyProgressModel.js";

export const submitProgress = async (req, res) => {
  try {
    const {
      yesterdayWork,
      todayPlan,
      blockers,
      githubLink,
      hoursWorked,
      date,
    } = req.body;

    if (!yesterdayWork || !todayPlan || hoursWorked === undefined) {
      return res.status(400).send({
        success: false,
        message: "Required fields missing",
      });
    }

    const progressData = {
      studentId: req.user._id,
      bootcampId: req.user.bootcampId,
      yesterdayWork,
      todayPlan,
      blockers,
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

    const diff = (now - created) / (1000 * 60 * 60);

    if (diff > 2) {
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
    }).sort({ date: -1, createdAt: -1 });

    res.status(200).send({
      success: true,
      message: "student progress fetched successfully",
      data: progress,
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
