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

// Function to convert time to Central Time
function convertToCentralTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', { 
        timeZone: 'America/Chicago',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
    });
}

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
    console.log('User info:', req.body);

    const userInfo = req.body;
    const centralTime = convertToCentralTime(userInfo.time);
    
    // Format device information
    const deviceInfo = `
        Device: ${userInfo.device.platform}
        Browser: ${userInfo.device.userAgent.split(')')[0].split('(')[1]}
        Language: ${userInfo.device.language}
        Screen Resolution: ${userInfo.device.screenWidth}x${userInfo.device.screenHeight}
        Timezone: ${userInfo.timezone}
    `;

    // Send email notification
    const mailOptions = {
        from: `"Message Notification" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_TO,
        subject: 'Someone Viewed Your Message',
        text: `
Someone has viewed your message!

Time (Central Time): ${centralTime}

Device Information:
${deviceInfo}
        `,
        html: `
            <h2>Someone Viewed Your Message</h2>
            <p><strong>Time (Central Time):</strong> ${centralTime}</p>
            <h3>Device Information:</h3>
            <ul>
                <li><strong>Device:</strong> ${userInfo.device.platform}</li>
                <li><strong>Browser:</strong> ${userInfo.device.userAgent.split(')')[0].split('(')[1]}</li>
                <li><strong>Language:</strong> ${userInfo.device.language}</li>
                <li><strong>Screen Resolution:</strong> ${userInfo.device.screenWidth}x${userInfo.device.screenHeight}</li>
                <li><strong>Timezone:</strong> ${userInfo.timezone}</li>
            </ul>
        `
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