const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'restaurant.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('Connected to SQLite database');
});

async function createTestNotifications() {
    console.log('\n=== Creating Test Notifications ===\n');

    const notifications = [
        {
            user_id: 1,
            restaurant_id: 1,
            booking_id: null,
            order_id: null,
            title: 'Welcome to RestaurantAI!',
            message: 'Thank you for signing up. Start exploring our restaurants.',
            type: 'info'
        },
        {
            user_id: 1,
            restaurant_id: 1,
            booking_id: null,
            order_id: null,
            title: 'Special Promotion',
            message: 'Get 20% off on your next booking at Golden Spoon Bistro!',
            type: 'success'
        },
        {
            user_id: 1,
            restaurant_id: 2,
            booking_id: null,
            order_id: null,
            title: 'New Restaurant Available',
            message: 'Seaside Seafood Shack is now accepting reservations.',
            type: 'info'
        }
    ];

    for (const notification of notifications) {
        await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO notifications (user_id, restaurant_id, booking_id, order_id, title, message, type, is_read)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
                [
                    notification.user_id,
                    notification.restaurant_id,
                    notification.booking_id,
                    notification.order_id,
                    notification.title,
                    notification.message,
                    notification.type
                ],
                function(err) {
                    if (err) {
                        console.error(`Error creating notification: ${err.message}`);
                        reject(err);
                    } else {
                        console.log(`✓ Created notification: "${notification.title}" (ID: ${this.lastID})`);
                        resolve();
                    }
                }
            );
        });
    }

    console.log('\n=== Querying Notifications ===\n');

    db.all(
        `SELECT COUNT(*) as total,
                COUNT(CASE WHEN is_read = 0 THEN 1 END) as unread
         FROM notifications
         WHERE user_id = 1`,
        [],
        (err, rows) => {
            if (err) {
                console.error('Error querying notifications:', err.message);
            } else {
                console.log(`Total notifications for user 1: ${rows[0].total}`);
                console.log(`Unread notifications for user 1: ${rows[0].unread}`);
            }

            db.all(
                `SELECT n.id, n.title, n.message, n.type, n.is_read, r.name as restaurant_name
                 FROM notifications n
                 LEFT JOIN restaurants r ON n.restaurant_id = r.id
                 WHERE n.user_id = 1
                 ORDER BY n.created_at DESC`,
                [],
                (err, rows) => {
                    if (err) {
                        console.error('Error querying notification details:', err.message);
                    } else {
                        console.log('\nNotifications:');
                        rows.forEach(row => {
                            console.log(`  - [${row.is_read ? 'READ' : 'UNREAD'}] ${row.title}`);
                            console.log(`    Restaurant: ${row.restaurant_name || 'N/A'}`);
                            console.log(`    Message: ${row.message}`);
                            console.log('');
                        });
                    }

                    console.log('=== Test Complete ===\n');

                    db.close((err) => {
                        if (err) {
                            console.error('Error closing database:', err.message);
                        }
                        process.exit(0);
                    });
                }
            );
        }
    );
}

createTestNotifications().catch(err => {
    console.error('Failed to create test notifications:', err);
    process.exit(1);
});
