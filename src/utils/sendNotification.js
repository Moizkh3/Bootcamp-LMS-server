import { Expo } from "expo-server-sdk";
import User from "../models/user.js";
import { Notification } from "../models/notificationModel.js";

const expo = new Expo();

export const sendNotificationToBootcamp = async ({
  bootcampId,
  domainId,
  title,
  message,
  type,
}) => {
  try {
    await Notification.create({ bootcampId, domainId, title, message, type });

    const query = {
      studentBootcampId: bootcampId,
      expoPushToken: { $ne: null },
    };
    if (domainId) {
      query.domainId = domainId;
    }

    const user = await User.find(query);

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

export const sendNotificationToUser = async ({
  userId,
  title,
  message,
  type,
}) => {
  try {
    await Notification.create({ userId, title, message, type });

    const user = await User.findById(userId);

    if (user && Expo.isExpoPushToken(user.expoPushToken)) {
      await expo.sendPushNotificationsAsync([
        {
          to: user.expoPushToken,
          title,
          body: message,
          sound: "default",
        },
      ]);
    }
  } catch (error) {
    console.error("Notification error:", error.message);
  }
};

export const sendNotificationToAll = async ({ title, message, type }) => {
  try {
    await Notification.create({ title, message, type, isGlobal: true });

    const students = await User.find({
      role: "student",
      expoPushToken: { $ne: null },
    });

    const messages = students
      .filter((student) => Expo.isExpoPushToken(student.expoPushToken))
      .map((student) => ({
        to: student.expoPushToken,
        title,
        body: message,
        sound: "default",
      }));

    if (messages.length > 0) {
      const chunks = expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        await expo.sendPushNotificationsAsync(chunk);
      }
    }
  } catch (error) {
    console.error("Notification error:", error.message);
  }
};