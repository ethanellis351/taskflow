require('dotenv').config();
const pool = require('./db');
const { sendDueReminders } = require('./reminders');

sendDueReminders()
  .then((count) => console.log(`Found ${count} task(s) needing a reminder.`))
  .catch(console.error)
  .finally(() => pool.end());