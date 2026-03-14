import nodemailer from "nodemailer";
import hbs from "nodemailer-express-handlebars";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from 'dotenv';
// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config(); // Fallback for environments where .env is not in the expected path or handled by the platform

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn("WARNING: Email credentials (EMAIL_USER/EMAIL_PASS) might be missing in process.env");
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // use TLS
  auth: {
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
  },
  tls: {
    rejectUnauthorized: false // Avoid issues with self-signed certs in some environments
  }
});

// Attach handlebars plugin
// resolve the directory relative to this file location
const templatesDir = path.resolve(__dirname, "../views/emailTemplates");

const handlebarOptions = {
  viewEngine: {
    partialsDir: templatesDir,
    defaultLayout: false,
    extName: ".hbs",
  },
  viewPath: templatesDir,
  extName: ".hbs",
};

transporter.use("compile", hbs(handlebarOptions));

// Verify transporter on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP Connection Error:", error.message);
  } else {
    console.log("✅ Email transporter is ready to send messages");
  }
});

const sendEmail = async ({ to, subject, template, context }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Bootcamp Tracker" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      template,
      context,
    });
    console.log("📧 Email sent to", to, "| Message ID:", info.messageId);
  } catch (err) {
    console.error("❌ Failed to send email to", to, ":", err.message);
    throw err;
  }
};

export default sendEmail