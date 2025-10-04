const express = require('express');
const db = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Validation middleware
const bookingValidation = [
    body('restaurantId').isInt({ min: 1 }).withMessage('Valid restaurant ID is required'),
    body('tableId').isInt({ min: 1 }).withMessage('Valid table ID is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format (HH:MM) is required'),
    body('guests').isInt({ min: 1, max: 20 }).withMessage('Number of guests must be between 1 and 20'),
    body('specialRequests').optional().isLength({ max: 500 }).withMessage('Special requests must be less than 500 characters')
];

// POST /api/bookings - Create a new booking
router.post('/', authenticateToken, authorizeRole(['customer']), bookingValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { restaurantId, tableId, date, time, guests, specialRequests } = req.body;
        const userId = req.user.id;

        // Verify restaurant exists and is active
        const restaurant = await db.get(
            'SELECT id, name FROM restaurants WHERE id = ? AND is_active = 1',
            [restaurantId]
        );

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        // Verify table exists and belongs to restaurant
        const table = await db.get(
            'SELECT id, table_number, capacity, status FROM restaurant_tables WHERE id = ? AND restaurant_id = ?',
            [tableId, restaurantId]
        );

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        // Check if table has sufficient capacity
        if (guests > table.capacity) {
            return res.status(400).json({
                success: false,
                message: `Table capacity is ${table.capacity}, but you requested ${guests} guests`
            });
        }

        // Check if table is available (basic check - in production, you'd check for specific date/time conflicts)
        if (table.status !== 'available') {
            return res.status(400).json({
                success: false,
                message: 'Table is not available'
            });
        }

        // Create booking
        const result = await db.run(`
            INSERT INTO bookings (user_id, restaurant_id, table_id, date, time, guests, special_requests, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')
        `, [userId, restaurantId, tableId, date, time, guests, specialRequests || null]);

        // Update table status to reserved
        await db.run(
            'UPDATE restaurant_tables SET status = "reserved" WHERE id = ?',
            [tableId]
        );

        console.log(`✅ Booking created: User ${userId} booked table ${table.table_number} at ${restaurant.name}`);

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: {
                bookingId: result.id,
                restaurantName: restaurant.name,
                tableNumber: table.table_number,
                date,
                time,
                guests,
                status: 'confirmed'
            }
        });

    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while creating booking'
        });
    }
});

// GET /api/bookings - Get user's bookings
router.get('/', authenticateToken, authorizeRole(['customer']), async (req, res) => {
    try {
        const userId = req.user.id;

        const bookings = await db.all(`
            SELECT 
                b.id, b.date, b.time, b.guests, b.special_requests, b.status, b.created_at,
                r.name as restaurant_name, r.address as restaurant_address, r.phone as restaurant_phone,
                rt.table_number, rt.capacity as table_capacity
            FROM bookings b
            JOIN restaurants r ON b.restaurant_id = r.id
            JOIN restaurant_tables rt ON b.table_id = rt.id
            WHERE b.user_id = ?
            ORDER BY b.date DESC, b.time DESC
        `, [userId]);

        res.status(200).json({
            success: true,
            message: 'Bookings retrieved successfully',
            data: bookings
        });

    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching bookings'
        });
    }
});

// GET /api/bookings/:id - Get specific booking details
router.get('/:id', authenticateToken, authorizeRole(['customer']), async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const booking = await db.get(`
            SELECT 
                b.id, b.date, b.time, b.guests, b.special_requests, b.status, b.created_at,
                r.name as restaurant_name, r.address as restaurant_address, r.phone as restaurant_phone,
                rt.table_number, rt.capacity as table_capacity
            FROM bookings b
            JOIN restaurants r ON b.restaurant_id = r.id
            JOIN restaurant_tables rt ON b.table_id = rt.id
            WHERE b.id = ? AND b.user_id = ?
        `, [id, userId]);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Booking details retrieved successfully',
            data: booking
        });

    } catch (error) {
        console.error('Get booking details error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching booking details'
        });
    }
});

// PUT /api/bookings/:id/cancel - Cancel a booking
router.put('/:id/cancel', authenticateToken, authorizeRole(['customer']), async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Get booking details
        const booking = await db.get(
            'SELECT id, table_id, status FROM bookings WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Booking is already cancelled'
            });
        }

        // Update booking status
        await db.run(
            'UPDATE bookings SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );

        // Update table status back to available
        await db.run(
            'UPDATE restaurant_tables SET status = "available" WHERE id = ?',
            [booking.table_id]
        );

        console.log(`✅ Booking cancelled: Booking ID ${id} by User ${userId}`);

        res.status(200).json({
            success: true,
            message: 'Booking cancelled successfully'
        });

    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while cancelling booking'
        });
    }
});

// GET /api/bookings/notifications/unread-count - Get unread notification count
router.get('/notifications/unread-count', authenticateToken, authorizeRole(['customer']), async (req, res) => {
    try {
        const userId = req.user.id;

        console.log(`📊 Fetching unread count for user ${userId}`);

        const result = await db.get(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
            [userId]
        );

        console.log(`📊 Unread count for user ${userId}: ${result.count || 0}`);

        // Also check total notifications for this user
        const totalResult = await db.get(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ?',
            [userId]
        );

        console.log(`📊 Total notifications for user ${userId}: ${totalResult.count || 0}`);

        res.status(200).json({
            success: true,
            message: 'Unread notification count retrieved',
            data: {
                count: result.count || 0
            }
        });

    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching unread count'
        });
    }
});

// PUT /api/bookings/notifications/mark-all-read - Mark all notifications as read
router.put('/notifications/mark-all-read', authenticateToken, authorizeRole(['customer']), async (req, res) => {
    try {
        const userId = req.user.id;

        await db.run(
            'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
            [userId]
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });

    } catch (error) {
        console.error('Mark all notifications as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while marking all notifications as read'
        });
    }
});

// GET /api/bookings/notifications - Get customer notifications
router.get('/notifications', authenticateToken, authorizeRole(['customer']), async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 50, unread_only } = req.query;

        console.log(`📩 Fetching notifications for user ${userId}, limit: ${limit}, unread_only: ${unread_only}`);

        let query = `
            SELECT
                n.id, n.title, n.message, n.type, n.is_read, n.created_at,
                r.name as restaurant_name,
                b.date as booking_date, b.time as booking_time,
                o.id as order_id, o.order_type
            FROM notifications n
            LEFT JOIN restaurants r ON n.restaurant_id = r.id
            LEFT JOIN bookings b ON n.booking_id = b.id
            LEFT JOIN orders o ON n.order_id = o.id
            WHERE n.user_id = ?
        `;

        const queryParams = [userId];

        if (unread_only === 'true') {
            query += ' AND n.is_read = 0';
        }

        query += ' ORDER BY n.created_at DESC LIMIT ?';
        queryParams.push(parseInt(limit));

        console.log(`📩 Query: ${query}`);
        console.log(`📩 Params: ${JSON.stringify(queryParams)}`);

        const notifications = await db.all(query, queryParams);

        console.log(`📩 Found ${notifications.length} notifications for user ${userId}`);
        if (notifications.length > 0) {
            console.log(`📩 First notification:`, JSON.stringify(notifications[0], null, 2));
        }

        res.status(200).json({
            success: true,
            message: 'Notifications retrieved successfully',
            data: notifications
        });

    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching notifications'
        });
    }
});

// PUT /api/bookings/notifications/:id/read - Mark notification as read
router.put('/notifications/:id/read', authenticateToken, authorizeRole(['customer']), async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Verify notification belongs to user
        const notification = await db.get(
            'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Mark as read
        await db.run(
            'UPDATE notifications SET is_read = 1 WHERE id = ?',
            [id]
        );

        res.status(200).json({
            success: true,
            message: 'Notification marked as read'
        });

    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while marking notification as read'
        });
    }
});

module.exports = router;