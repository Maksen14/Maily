import Imap from "imap";
import { simpleParser } from "mailparser";
import nodemailer from "nodemailer";

// Fetch last 10 unread emails without marking them as read
export async function getUnreadEmailsFromGmail(limit = 10) {
  return new Promise((resolve, reject) => {
    console.log("Starting email fetch process...");
    const imap = new Imap({
      user: process.env.GMAIL_USER,
      password: process.env.GMAIL_APP_PASSWORD,
      host: "imap.gmail.com",
      port: 993,
      tls: true,
      tlsOptions: {
        rejectUnauthorized: false
      }
    });

    imap.once("ready", () => {
      console.log("IMAP connection ready");
      imap.openBox("INBOX", true, (err, box) => { // 'true' for readonly mode so emails won't be marked as read
        if (err) {
          console.error("Error opening inbox:", err);
          imap.end();
          return reject(err);
        }
        
        console.log("Inbox opened, searching for unread emails...");
        // Search for all unread emails
        imap.search(["UNSEEN"], (err, results) => {
          if (err) {
            console.error("Error searching for unread emails:", err);
            imap.end();
            return reject(err);
          }
          
          if (!results || results.length === 0) {
            console.log("No unread emails found");
            imap.end();
            return resolve([]);
          }

          console.log(`Found ${results.length} unread emails`);
          
          // Sort results to ensure proper order - UID typically increases with newer emails
          results.sort((a, b) => b - a); // Sort in descending order (newest first)
          
          // Take the top 'limit' emails
          const latest = results.slice(0, limit);
          console.log(`Processing ${latest.length} most recent emails`);
          
          const fetch = imap.fetch(latest, { bodies: "", struct: true });
          
          const emails: any[] = [];
          const emailPromises: Promise<void>[] = [];

          fetch.on("message", (msg) => {
            let emailData: any = {};
            
            const processPromise = new Promise<void>((resolveEmail) => {
              msg.once("attributes", (attrs) => {
                emailData.uid = attrs.uid;
              });
              
              msg.on("body", (stream) => {
                // Use a promise to ensure the email is fully parsed before adding to array
                const parsePromise = simpleParser(stream)
                  .then(parsed => {
                    emailData = {
                      ...emailData,
                      id: parsed.messageId,
                      from_email: parsed.from?.text || "",
                      subject: parsed.subject || "",
                      body: parsed.text || "",
                      received_at: parsed.date?.toISOString() || new Date().toISOString(),
                    };
                    
                    // Add to emails array once fully parsed
                    emails.push(emailData);
                    resolveEmail();
                  })
                  .catch(error => {
                    console.error("Error parsing email:", error);
                    resolveEmail(); // Resolve anyway to continue processing other emails
                  });
              });
            });
            
            emailPromises.push(processPromise);
          });

          fetch.once("error", (err) => {
            console.error("Error fetching emails:", err);
            reject(err);
          });

          fetch.once("end", () => {
            console.log("Finished fetching all emails, waiting for processing to complete...");
            
            // Wait for all emails to be processed before resolving
            Promise.all(emailPromises)
              .then(() => {
                console.log(`Successfully processed ${emails.length} emails`);
                
                if (emails.length === 0) {
                  imap.end();
                  return resolve([]);
                }
                
                // First try to sort by UID if available
                emails.sort((a, b) => {
                  // First sort by UID (most reliable)
                  if (a.uid && b.uid) {
                    return b.uid - a.uid;
                  }
                  
                  // Fallback to date if UIDs not available or identical
                  const dateA = new Date(a.received_at).getTime();
                  const dateB = new Date(b.received_at).getTime();
                  return dateB - dateA;
                });
                
                console.log("Emails sorted, ending IMAP connection");
                imap.end();
                resolve(emails);
              })
              .catch(error => {
                console.error("Error processing emails:", error);
                imap.end();
                reject(error);
              });
          });
        });
      });
    });

    imap.once("error", (err) => {
      console.error("IMAP connection error:", err);
      reject(err);
    });
    
    imap.once("end", () => {
      console.log("IMAP connection ended");
    });

    console.log("Connecting to IMAP server...");
    imap.connect();
  });
}

// Mark an email as read by its message ID
export async function markEmailAsRead(messageId: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    console.log(`Attempting to mark email ${messageId} as read...`);
    
    const imap = new Imap({
      user: process.env.GMAIL_USER,
      password: process.env.GMAIL_APP_PASSWORD,
      host: "imap.gmail.com",
      port: 993,
      tls: true,
      tlsOptions: {
        rejectUnauthorized: false
      }
    });
    
    imap.once("ready", () => {
      // Open inbox in readwrite mode
      imap.openBox("INBOX", false, (err, box) => {
        if (err) {
          console.error("Error opening inbox:", err);
          imap.end();
          return resolve(false);
        }
        
        // Search for the specific email by Message-ID
        imap.search([["HEADER", "Message-ID", messageId]], (err, results) => {
          if (err || !results || results.length === 0) {
            console.log(`Could not find email with Message-ID: ${messageId}`);
            imap.end();
            return resolve(false);
          }
          
          console.log(`Found email with Message-ID ${messageId}, UID: ${results[0]}`);
          
          // Mark the email as read by setting the \Seen flag
          imap.setFlags(results, ["\\Seen"], (err) => {
            if (err) {
              console.error("Error marking email as read:", err);
              imap.end();
              return resolve(false);
            }
            
            console.log(`Successfully marked email ${messageId} as read`);
            imap.end();
            resolve(true);
          });
        });
      });
    });
    
    imap.once("error", (err) => {
      console.error("IMAP connection error:", err);
      resolve(false);
    });
    
    imap.connect();
  });
}

// Send email using Gmail SMTP
export async function sendEmail({ to, subject, text, inReplyTo }: { to: string; subject: string; text: string; inReplyTo?: string }) {
  // Clean up the text - remove any numbering or quotation marks that might have been missed
  const cleanedText = text
    .replace(/^\d+[\.\)]\s*/, '') // Remove numbering like "1. " or "1) "
    .replace(/^["']|["']$/g, ''); // Remove quotation marks
    
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  // Send the email
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject,
    text: cleanedText,
    headers: inReplyTo ? { "In-Reply-To": inReplyTo } : {},
  });
  
  // Mark the original email as read if we have a message ID
  if (inReplyTo) {
    try {
      await markEmailAsRead(inReplyTo);
    } catch (error) {
      console.error("Error marking email as read:", error);
      // Don't throw an error here, as the email was sent successfully
    }
  }
}
