const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        port: 465,
        secure: true, // true for 465, false for other ports
        logger: true,
        debug: true,
        secureConnection: false,
        auth: {
            user: process.env.EMAIL_USERNAME, // Ganti dengan email Anda
            pass: process.env.EMAIL_PASSWORD, // Ganti dengan password aplikasi Gmail Anda
        },
        tls: {
            rejectUnauthorized: true // Mengizinkan koneksi yang tidak terautentikasi
        }
    });

    const emailOptions = {
        from: process.env.EMAIL_FROM, // Ganti dengan alamat email pengirim
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