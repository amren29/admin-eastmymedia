import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
    try {
        const { to, subject, text, attachments } = await request.json();

        if (!to || !subject || !text) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Create transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Send email
        const info = await transporter.sendMail({
            from: `"Verification-Eastmy Media" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`, // sender address with name
            to, // list of receivers
            subject, // Subject line
            text, // plain text body
            attachments: attachments ? attachments.map((att: any) => ({
                filename: att.filename,
                content: att.content, // base64 string
                encoding: 'base64'
            })) : []
        });

        console.log("Message sent: %s", info.messageId);

        return NextResponse.json({ success: true, messageId: info.messageId });
    } catch (error) {
        console.error("Error sending email:", error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to send email' }, { status: 500 });
    }
}
