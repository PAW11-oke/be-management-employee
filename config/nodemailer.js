const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        port: 465,
        secure: true, 
        logger: true,
        debug: true,
        secureConnection: false,
        auth: {
            user: process.env.EMAIL_USERNAME, 
            pass: process.env.EMAIL_PASSWORD, 
        },
        tls: {
            rejectUnauthorized: true 
        }
    });

    const emailOptions = {
        from: process.env.EMAIL_FROM, 
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    await transporter.sendMail(emailOptions, (error, info) => {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

module.exports = sendEmail;