
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'nodemailer2121@gmail.com',
        pass: 'fpqx rxga knwe oocl'
    }
});

module.exports = transporter;