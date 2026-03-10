import nodemailer from "nodemailer";
import hbs from "nodemailer-express-handlebars";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from 'dotenv';
dotenv.config();

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transporter = nodemailer.createTransport({
  service: "Gmail", // or SendGrid, Mailgun
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
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
    from: 'Health Mate',
    to,
    subject,
    template, // e.g., 'verify-email'
    context,  // e.g., { name: "Hassan", url: "http://..." }
  });
};

export default sendEmail