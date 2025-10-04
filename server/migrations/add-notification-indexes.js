const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'restaurant.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('Connected to SQLite database');
});

const runQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this);
            }
        });
    });
};

async function addNotificationIndexes() {
    try {
        console.log('Adding indexes to notifications table for performance optimization...');

        await runQuery(`
            CREATE INDEX IF NOT EXISTS idx_notifications_user_id
            ON notifications(user_id)
        `);
        console.log('✅ Index on user_id created');

        await runQuery(`
            CREATE INDEX IF NOT EXISTS idx_notifications_created_at
            ON notifications(created_at DESC)
        `);
        console.log('✅ Index on created_at created');

        await runQuery(`
            CREATE INDEX IF NOT EXISTS idx_notifications_user_read
            ON notifications(user_id, is_read)
        `);
        console.log('✅ Composite index on user_id and is_read created');

        console.log('✅ All notification indexes added successfully!');
        console.log('Migration completed. Notification queries will now be faster.');

    } catch (error) {
        console.error('Error adding notification indexes:', error);
        process.exit(1);
    } finally {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database connection closed.');
            }
            process.exit(0);
        });
    }
}

addNotificationIndexes();
