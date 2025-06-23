const nodemailer = require("nodemailer");

module.exports.sendEmail = async (email, subject, text) => {
    return new Promise(async (resolve, reject) => {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "waseemabunada202@gmail.com",
            pass: "fved pbwk gjvu ytfh", // Replace with your app-specific password
          },
        });
  
        const mailOptions = {
          from: "waseemabunada202@gmail.com",
          to: email,
          subject: subject,
          html: text,
        };
  
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Error sending email:", error);
            reject(error);
          } else {
            console.log("Email sent:", info.response);
            resolve(true); // Resolve with true when the email is sent successfully
          }
        });
      } catch (err) {
        console.error("Unexpected error:", err);
        reject(err);
      }
    });
  };
  