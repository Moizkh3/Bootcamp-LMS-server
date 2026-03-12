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
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
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

const sendEmail = async ({ to, subject, template, context }) => {
  await transporter.sendMail({
    from: `"Bootcamp Tracker" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    template, // e.g., 'verify-email'
    context,  // e.g., { name: "Hassan", url: "http://..." }
  });
};

export default sendEmail