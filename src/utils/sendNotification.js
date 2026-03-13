import { Expo } from "expo-server-sdk";
import User from "../models/user.js";
import { Notification } from "../models/notificationModel.js";

const expo = new Expo();

export const sendNotificationToBootcamp = async ({
  bootcampId,
  title,
  message,
  type,
}) => {
  try {
    await Notification.create({ bootcampId, title, message, type });

    const user = await User.find({
      studentBootcampId: bootcampId,
      expoPushToken: { $ne: null },
    });

    const messages = user
      .filter((user) => Expo.isExpoPushToken(user.expoPushToken))
      .map((user) => ({
        to: user.expoPushToken,
        title,
        body: message,
        sound: "default",
      }));

    if (messages.length > 0) {
      await expo.sendPushNotificationsAsync(messages);
    }
  } catch (error) {
    console.error("Notification error:", error.message);
  }
};
