require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// Create email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify transporter configuration
transporter.verify(function(error, success) {
    if (error) {
        console.log('Email configuration error:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

// Root route to confirm server is working
app.get('/', (req, res) => {
    res.json({ status: 'Server is running', message: 'Email notification service is active' });
});

app.post('/send-notification', (req, res) => {
    console.log('Received notification request at:', new Date().toISOString());
    console.log('Environment variables:', {
        emailUser: process.env.EMAIL_USER,
        emailTo: process.env.EMAIL_TO
    });
    
    // Send email notification
    const mailOptions = {
        from: `"Message Notification" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_TO,
        subject: 'Someone Viewed Your Message',
        text: `Someone has clicked the start button on your message page at ${new Date().toLocaleString()}.`,
        html: `<h2>Someone Viewed Your Message</h2><p>Someone has clicked the start button on your message page at ${new Date().toLocaleString()}.</p>`
    };

    console.log('Attempting to send email with options:', mailOptions);

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            console.error('Error details:', error.message);
            if (error.response) {
                console.error('SMTP Error response:', error.response);
            }
            return res.status(500).json({ success: false, error: 'Failed to send email' });
        }
        console.log('Email sent successfully:', info.response);
        console.log('Message ID:', info.messageId);
        res.json({ success: true, message: 'Notification sent' });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 