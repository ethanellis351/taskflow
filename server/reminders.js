const cron = require('node-cron');
const pool = require('./db');
const { sendMail } = require('./mailer');

async function sendDueReminders() {
  const result = await pool.query(
    `SELECT t.id, t.title, t.due_date, u.email, u.name AS assignee_name, p.name AS project_name
     FROM tasks t
     JOIN users u ON u.id = t.assignee_id
     JOIN projects p ON p.id = t.project_id
     WHERE t.status <> 'done'
       AND t.reminder_sent_at IS NULL
       AND t.due_date IS NOT NULL
       AND t.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 1`
  );

  for (const task of result.rows) {
    try {
      await sendMail({
        to: task.email,
        subject: `Reminder: "${task.title}" is due ${task.due_date}`,
        text:
          `Hi ${task.assignee_name},\n\n` +
          `Your task "${task.title}" in the project "${task.project_name}" is due on ${task.due_date}.\n\n` +
          `- TaskFlow`,
      });
      // Only mark it as sent after the email succeeded
      await pool.query('UPDATE tasks SET reminder_sent_at = NOW() WHERE id = $1', [task.id]);
    } catch (err) {
      console.error(`Reminder failed for task ${task.id}:`, err.message);
    }
  }

  return result.rows.length;
}

function startReminderJob() {
  // Every day at 8:00 AM, server time
  cron.schedule('0 8 * * *', () => {
    sendDueReminders().catch(console.error);
  });
}

module.exports = { sendDueReminders, startReminderJob };