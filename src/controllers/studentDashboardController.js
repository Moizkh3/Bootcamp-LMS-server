import dailyProgressModel from "../models/dailyProgressModel.js";

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

        let isSubmitTodayStandup = (
            lastStandupDate.getFullYear() === today.getFullYear() &&
            lastStandupDate.getMonth() === today.getMonth() &&
            lastStandupDate.getDate() === today.getDate()
        );

        res.status(200).json({
            success: true,
            message: "Today's standup status fetched successfully",
            isSubmitTodayStandup
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}