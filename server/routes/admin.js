const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authenticateToken, authorizeRole, authorizeRestaurantAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Middleware to ensure admin access and set restaurant_id
router.use(authenticateToken);
router.use(authorizeRole(['admin']));

// Middleware to ensure restaurant_id is available
router.use((req, res, next) => {
    if (!req.user || !req.user.restaurant_id) {
        return res.status(403).json({
            success: false,
            message: 'Restaurant ID not found in user context'
        });
    }
    next();
});

// GET /api/admin/notifications - Get restaurant notifications
router.get('/notifications', async (req, res) => {
    try {
        const restaurantId = req.user.restaurant_id;
        const { limit = 50 } = req.query;

        // Get all notifications relevant to this restaurant's admin
        // This includes: system-wide notifications from super admin + restaurant-specific notifications
        const notifications = await db.all(`
            SELECT
                n.id, n.title, n.message, n.type, n.is_read as read, n.created_at,
                CASE
                    WHEN n.restaurant_id IS NOT NULL THEN 'restaurant'
                    ELSE 'system'
                END as source,
                r.name as restaurant_name
            FROM notifications n
            LEFT JOIN restaurants r ON n.restaurant_id = r.id
            LEFT JOIN login_users lu ON n.user_id = lu.id
            WHERE (n.restaurant_id = ? OR n.restaurant_id IS NULL)
            AND (lu.role = 'admin' OR n.user_id IN (
                SELECT id FROM login_users WHERE role = 'admin' AND id IN (
                    SELECT id FROM users WHERE restaurant_id = ?
                )
            ))
            ORDER BY n.created_at DESC
            LIMIT ?
        `, [restaurantId, restaurantId, parseInt(limit)]);

        res.status(200).json({
            success: true,
            message: 'Notifications retrieved successfully',
            data: notifications || []
        });

    } catch (error) {
        console.error('Get admin notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching notifications',
            data: []
        });
    }
});

// PUT /api/admin/notifications/:id/read - Mark notification as read
router.put('/notifications/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        const restaurantId = req.user.restaurant_id;

        // Verify notification exists and is accessible by this admin
        const notification = await db.get(`
            SELECT n.id
            FROM notifications n
            LEFT JOIN login_users lu ON n.user_id = lu.id
            WHERE n.id = ?
            AND (n.restaurant_id = ? OR n.restaurant_id IS NULL)
            AND (lu.role = 'admin' OR n.user_id IN (
                SELECT id FROM login_users WHERE role = 'admin' AND id IN (
                    SELECT id FROM users WHERE restaurant_id = ?
                )
            ))
        `, [id, restaurantId, restaurantId]);

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
            message: 'Notification marked as read',
            data: { id: parseInt(id), read: true }
        });

    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while marking notification as read'
        });
    }
});

// DELETE /api/admin/notifications/:id - Delete notification
router.delete('/notifications/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const restaurantId = req.user.restaurant_id;

        // Verify notification exists and is accessible by this admin
        const notification = await db.get(`
            SELECT n.id
            FROM notifications n
            LEFT JOIN login_users lu ON n.user_id = lu.id
            WHERE n.id = ?
            AND (n.restaurant_id = ? OR n.restaurant_id IS NULL)
            AND (lu.role = 'admin' OR n.user_id IN (
                SELECT id FROM login_users WHERE role = 'admin' AND id IN (
                    SELECT id FROM users WHERE restaurant_id = ?
                )
            ))
        `, [id, restaurantId, restaurantId]);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Delete notification
        await db.run('DELETE FROM notifications WHERE id = ?', [id]);

        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully',
            data: { id: parseInt(id), deleted: true }
        });

    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting notification'
        });
    }
});

// PUT /api/admin/restaurant - Update restaurant information
router.put('/restaurant', [
    body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Restaurant name must be less than 100 characters'),
    body('cuisine').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Cuisine type is required'),
    body('address').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Address is required'),
    body('phone').optional().trim().isLength({ min: 1, max: 20 }).withMessage('Phone number is required'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('image').optional().isURL().withMessage('Image must be a valid URL')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const restaurantId = req.user.restaurant_id;

        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];

        const allowedFields = ['name', 'cuisine', 'address', 'phone', 'description', 'image'];
        
        for (const field of allowedFields) {
            if (req.body.hasOwnProperty(field)) {
                updateFields.push(`${field} = ?`);
                updateValues.push(req.body[field]);
            }
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        updateValues.push(restaurantId);

        await db.run(
            `UPDATE restaurants SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        console.log(`✅ Restaurant updated: ID ${restaurantId} by Admin ${req.user.id}`);

        res.status(200).json({
            success: true,
            message: 'Restaurant updated successfully',
            data: {
                id: restaurantId,
                updated: true
            }
        });

    } catch (error) {
        console.error('Update restaurant error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating restaurant'
        });
    }
});

// GET /api/admin/customers - Get restaurant customers
router.get('/customers', async (req, res) => {
    try {
        const restaurantId = req.user.restaurant_id;

        const customers = await db.all(`
            SELECT DISTINCT 
                lu.id, lu.name, lu.email, lu.phone, lu.created_at, lu.is_active,
                COUNT(DISTINCT o.id) as total_orders,
                SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END) as total_spent
            FROM login_users lu
            LEFT JOIN orders o ON lu.id = o.user_id AND o.restaurant_id = ?
            LEFT JOIN bookings b ON lu.id = b.user_id AND b.restaurant_id = ?
            WHERE (o.id IS NOT NULL OR b.id IS NOT NULL)
            GROUP BY lu.id
            ORDER BY lu.created_at DESC
        `, [restaurantId, restaurantId]);

        res.status(200).json({
            success: true,
            message: 'Customers retrieved successfully',
            data: customers
        });

    } catch (error) {
        console.error('Get admin customers error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching customers'
        });
    }
});

// GET /api/admin/analytics - Get restaurant analytics
router.get('/analytics', async (req, res) => {
    try {
        const restaurantId = req.user.restaurant_id;
        const { range = '7days' } = req.query;

        // Calculate date range
        let dateFilter = '';
        switch (range) {
            case '7days':
                dateFilter = "AND created_at >= date('now', '-7 days')";
                break;
            case '30days':
                dateFilter = "AND created_at >= date('now', '-30 days')";
                break;
            case '90days':
                dateFilter = "AND created_at >= date('now', '-90 days')";
                break;
            case '1year':
                dateFilter = "AND created_at >= date('now', '-1 year')";
                break;
        }

        // Get revenue and order analytics
        const revenueData = await db.get(`
            SELECT 
                SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as total,
                COUNT(*) as order_count
            FROM orders 
            WHERE restaurant_id = ? ${dateFilter}
        `, [restaurantId]);

        const ordersData = await db.get(`
            SELECT 
                COUNT(*) as total,
                AVG(total_amount) as avg_value
            FROM orders 
            WHERE restaurant_id = ? ${dateFilter}
        `, [restaurantId]);

        const customersData = await db.get(`
            SELECT COUNT(DISTINCT user_id) as new
            FROM orders 
            WHERE restaurant_id = ? ${dateFilter}
        `, [restaurantId]);

        // Get popular items
        const popularItems = await db.all(`
            SELECT 
                mi.name,
                COUNT(oi.id) as orders,
                SUM(oi.price * oi.quantity) as revenue,
                ROUND(COUNT(oi.id) * 100.0 / (SELECT COUNT(*) FROM order_items oi2 JOIN orders o2 ON oi2.order_id = o2.id WHERE o2.restaurant_id = ? ${dateFilter.replace('created_at', 'o2.created_at')}), 2) as percentage
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN menu_items mi ON oi.menu_item_id = mi.id
            WHERE o.restaurant_id = ? ${dateFilter.replace('created_at', 'o.created_at')}
            GROUP BY mi.id, mi.name
            ORDER BY orders DESC
            LIMIT 10
        `, [restaurantId, restaurantId]);

        // Get daily stats
        const dailyStats = await db.all(`
            SELECT 
                date(created_at) as date,
                SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as revenue,
                COUNT(*) as orders,
                AVG(total_amount) as avg_order,
                COUNT(DISTINCT user_id) as new_customers
            FROM orders 
            WHERE restaurant_id = ? ${dateFilter}
            GROUP BY date(created_at)
            ORDER BY date DESC
            LIMIT 30
        `, [restaurantId]);

        const analyticsData = {
            revenue: {
                total: revenueData?.total || 0,
                growth: 15.2 // Mock growth percentage
            },
            orders: {
                total: ordersData?.total || 0,
                avg_value: ordersData?.avg_value || 0,
                growth: 8.5 // Mock growth percentage
            },
            customers: {
                new: customersData?.new || 0,
                growth: 12.3 // Mock growth percentage
            },
            popular_items: popularItems,
            daily_stats: dailyStats
        };

        res.status(200).json({
            success: true,
            message: 'Analytics data retrieved successfully',
            data: analyticsData
        });

    } catch (error) {
        console.error('Get admin analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching analytics'
        });
    }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'table-images');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'table-img-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// GET /api/admin/tables - Get restaurant tables
router.get('/tables', async (req, res) => {
    try {
        const restaurantId = req.user.restaurant_id;
        const { limit } = req.query;

        const tables = await db.all(`
            SELECT 
                rt.id, rt.table_number, rt.capacity, rt.status, rt.type, 
                rt.features, rt.x_position, rt.y_position, rt.created_at,
                COUNT(ti.id) as image_count,
                MIN(ti.image_path) as thumbnail_image
            FROM restaurant_tables rt
            LEFT JOIN table_images ti ON rt.id = ti.table_id AND ti.is_active = 1
            WHERE rt.restaurant_id = ?
            GROUP BY rt.id
            ORDER BY rt.created_at DESC
            ${limit ? 'LIMIT ?' : ''}
        `, limit ? [restaurantId, parseInt(limit)] : [restaurantId]);

        // Get all images for each table
        for (const table of tables) {
            const images = await db.all(`
                SELECT id, image_path, description, is_primary, created_at
                FROM table_images 
                WHERE table_id = ? AND is_active = 1
                ORDER BY is_primary DESC, created_at ASC
            `, [table.id]);
            table.images = images;
        }

        res.status(200).json({
            success: true,
            message: 'Tables retrieved successfully',
            data: tables
        });

    } catch (error) {
        console.error('Get admin tables error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching tables'
        });
    }
});

// POST /api/admin/tables - Create new table
router.post('/tables', [
    body('table_number').isInt({ min: 1 }).withMessage('Valid table number is required'),
    body('capacity').isInt({ min: 1, max: 20 }).withMessage('Capacity must be between 1 and 20'),
    body('type').isLength({ min: 1, max: 50 }).withMessage('Table type is required'),
    body('features').optional().isLength({ max: 500 }).withMessage('Features must be less than 500 characters'),
    body('x_position').optional().isInt().withMessage('X position must be a number'),
    body('y_position').optional().isInt().withMessage('Y position must be a number')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const restaurantId = req.user.restaurant_id;
        const { table_number, capacity, type, features, x_position, y_position } = req.body;

        // Check if table number already exists for this restaurant
        const existingTable = await db.get(
            'SELECT id FROM restaurant_tables WHERE restaurant_id = ? AND table_number = ?',
            [restaurantId, table_number]
        );

        if (existingTable) {
            return res.status(400).json({
                success: false,
                message: 'Table number already exists'
            });
        }

        const result = await db.run(`
            INSERT INTO restaurant_tables (restaurant_id, table_number, capacity, type, features, x_position, y_position, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'available')
        `, [restaurantId, table_number, capacity, type, features || null, x_position || 0, y_position || 0]);

        console.log(`✅ Table created: Table ${table_number} by Admin ${req.user.id}`);

        res.status(201).json({
            success: true,
            message: 'Table created successfully',
            data: {
                id: result.id,
                table_number,
                capacity,
                type,
                status: 'available'
            }
        });

    } catch (error) {
        console.error('Create table error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while creating table'
        });
    }
});

// PUT /api/admin/tables/:id - Update table
router.put('/tables/:id', [
    body('table_number').optional().isInt({ min: 1 }).withMessage('Valid table number is required'),
    body('capacity').optional().isInt({ min: 1, max: 20 }).withMessage('Capacity must be between 1 and 20'),
    body('type').optional().isLength({ min: 1, max: 50 }).withMessage('Table type is required'),
    body('features').optional().isLength({ max: 500 }).withMessage('Features must be less than 500 characters'),
    body('status').optional().isIn(['available', 'reserved', 'occupied', 'cleaning']).withMessage('Invalid status'),
    body('x_position').optional().isInt().withMessage('X position must be a number'),
    body('y_position').optional().isInt().withMessage('Y position must be a number')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const restaurantId = req.user.restaurant_id;

        // Check if table exists and belongs to admin's restaurant
        const existingTable = await db.get(
            'SELECT id FROM restaurant_tables WHERE id = ? AND restaurant_id = ?',
            [id, restaurantId]
        );

        if (!existingTable) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];

        const allowedFields = ['table_number', 'capacity', 'type', 'features', 'status', 'x_position', 'y_position'];
        
        for (const field of allowedFields) {
            if (req.body.hasOwnProperty(field)) {
                updateFields.push(`${field} = ?`);
                updateValues.push(req.body[field]);
            }
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        updateValues.push(id);

        await db.run(
            `UPDATE restaurant_tables SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        console.log(`✅ Table updated: ID ${id} by Admin ${req.user.id}`);

        res.status(200).json({
            success: true,
            message: 'Table updated successfully',
            data: {
                id: parseInt(id),
                updated: true
            }
        });

    } catch (error) {
        console.error('Update table error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating table'
        });
    }
});

// DELETE /api/admin/tables/:id - Delete table
router.delete('/tables/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const restaurantId = req.user.restaurant_id;

        // Check if table has any active bookings
        const activeBookings = await db.get(
            'SELECT COUNT(*) as count FROM bookings WHERE table_id = ? AND status = "confirmed" AND date >= date("now")',
            [id]
        );

        if (activeBookings.count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete table with active bookings'
            });
        }

        // Delete table images first
        const tableImages = await db.all(
            'SELECT image_path FROM table_images WHERE table_id = ?',
            [id]
        );

        for (const image of tableImages) {
            const filePath = path.join(__dirname, '..', image.image_path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await db.run('DELETE FROM table_images WHERE table_id = ?', [id]);

        const result = await db.run(
            'DELETE FROM restaurant_tables WHERE id = ? AND restaurant_id = ?',
            [id, restaurantId]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        console.log(`✅ Table deleted: ID ${id} by Admin ${req.user.id}`);

        res.status(200).json({
            success: true,
            message: 'Table deleted successfully',
            data: {
                id: parseInt(id),
                deleted: true
            }
        });

    } catch (error) {
        console.error('Delete table error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting table'
        });
    }
});

// POST /api/admin/tables/:id/images - Upload table images
router.post('/tables/:id/images', upload.array('images', 10), async (req, res) => {
    try {
        const { id } = req.params;
        const restaurantId = req.user.restaurant_id;
        const { descriptions = [] } = req.body;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one image file is required'
            });
        }

        // Check if table exists and belongs to admin's restaurant
        const table = await db.get(
            'SELECT id FROM restaurant_tables WHERE id = ? AND restaurant_id = ?',
            [id, restaurantId]
        );

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        // Check if this is the first image for the table (will be primary)
        const existingImages = await db.get(
            'SELECT COUNT(*) as count FROM table_images WHERE table_id = ? AND is_active = 1',
            [id]
        );

        const isFirstImage = existingImages.count === 0;
        const uploadedImages = [];

        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const imagePath = `/uploads/table-images/${file.filename}`;
            const description = Array.isArray(descriptions) ? descriptions[i] : descriptions;
            const isPrimary = isFirstImage && i === 0; // First uploaded image becomes primary

            const result = await db.run(`
                INSERT INTO table_images (table_id, image_path, description, is_primary, is_active)
                VALUES (?, ?, ?, ?, 1)
            `, [id, imagePath, description || null, isPrimary]);

            uploadedImages.push({
                id: result.id,
                image_path: imagePath,
                description,
                is_primary: isPrimary
            });
        }

        console.log(`✅ Table images uploaded: ${req.files.length} images for table ${id} by Admin ${req.user.id}`);

        res.status(201).json({
            success: true,
            message: `${req.files.length} image(s) uploaded successfully`,
            data: {
                images: uploadedImages,
                table_id: parseInt(id),
                count: req.files.length
            }
        });

    } catch (error) {
        console.error('Upload table images error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while uploading images'
        });
    }
});

// DELETE /api/admin/tables/:tableId/images/:imageId - Delete table image
router.delete('/tables/:tableId/images/:imageId', async (req, res) => {
    try {
        const { tableId, imageId } = req.params;
        const restaurantId = req.user.restaurant_id;

        // Verify table belongs to admin's restaurant
        const table = await db.get(
            'SELECT id FROM restaurant_tables WHERE id = ? AND restaurant_id = ?',
            [tableId, restaurantId]
        );

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        // Get image details
        const image = await db.get(
            'SELECT image_path, is_primary FROM table_images WHERE id = ? AND table_id = ?',
            [imageId, tableId]
        );

        if (!image) {
            return res.status(404).json({
                success: false,
                message: 'Image not found'
            });
        }

        // Delete from database
        await db.run(
            'UPDATE table_images SET is_active = 0 WHERE id = ?',
            [imageId]
        );

        // If this was the primary image, make the next image primary
        if (image.is_primary) {
            const nextImage = await db.get(
                'SELECT id FROM table_images WHERE table_id = ? AND is_active = 1 AND id != ? ORDER BY created_at ASC LIMIT 1',
                [tableId, imageId]
            );
            
            if (nextImage) {
                await db.run(
                    'UPDATE table_images SET is_primary = 1 WHERE id = ?',
                    [nextImage.id]
                );
            }
        }

        // Delete file from filesystem
        const filePath = path.join(__dirname, '..', image.image_path);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        console.log(`✅ Table image deleted: Image ${imageId} from table ${tableId} by Admin ${req.user.id}`);

        res.status(200).json({
            success: true,
            message: 'Image deleted successfully',
            data: {
                image_id: parseInt(imageId),
                table_id: parseInt(tableId),
                deleted: true
            }
        });

    } catch (error) {
        console.error('Delete table image error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting image'
        });
    }
});

// PUT /api/admin/tables/:tableId/images/:imageId/primary - Set image as primary
router.put('/tables/:tableId/images/:imageId/primary', async (req, res) => {
    try {
        const { tableId, imageId } = req.params;
        const restaurantId = req.user.restaurant_id;

        // Verify table belongs to admin's restaurant
        const table = await db.get(
            'SELECT id FROM restaurant_tables WHERE id = ? AND restaurant_id = ?',
            [tableId, restaurantId]
        );

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        // Remove primary status from all images for this table
        await db.run(
            'UPDATE table_images SET is_primary = 0 WHERE table_id = ?',
            [tableId]
        );

        // Set new primary image
        const result = await db.run(
            'UPDATE table_images SET is_primary = 1 WHERE id = ? AND table_id = ?',
            [imageId, tableId]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Image not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Primary image updated successfully'
        });

    } catch (error) {
        console.error('Set primary image error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while setting primary image'
        });
    }
});

// GET /api/admin/restaurant - Get admin's restaurant details
router.get('/restaurant', async (req, res) => {
    try {
        const restaurantId = req.user.restaurant_id;

        const restaurant = await db.get(`
            SELECT id, name, cuisine, rating, image, address, phone, description, is_active, created_at
            FROM restaurants 
            WHERE id = ?
        `, [restaurantId]);

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Restaurant details retrieved successfully',
            data: restaurant
        });

    } catch (error) {
        console.error('Get admin restaurant error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching restaurant details'
        });
    }
});

// GET /api/admin/dashboard - Get dashboard analytics
router.get('/dashboard', async (req, res) => {
    try {
        const restaurantId = req.user.restaurant_id;

        // Get basic stats
        const stats = await Promise.all([
            db.get('SELECT COUNT(*) as total_orders FROM orders WHERE restaurant_id = ?', [restaurantId]),
            db.get('SELECT COUNT(*) as pending_orders FROM orders WHERE restaurant_id = ? AND status = "pending"', [restaurantId]),
            db.get('SELECT COUNT(*) as total_bookings FROM bookings WHERE restaurant_id = ?', [restaurantId]),
            db.get('SELECT COUNT(*) as todays_bookings FROM bookings WHERE restaurant_id = ? AND date = date("now")', [restaurantId]),
            db.get('SELECT SUM(total_amount) as total_revenue FROM orders WHERE restaurant_id = ? AND status = "completed"', [restaurantId]),
            db.get('SELECT COUNT(*) as total_menu_items FROM menu_items WHERE restaurant_id = ?', [restaurantId]),
            db.get('SELECT COUNT(*) as available_tables FROM restaurant_tables WHERE restaurant_id = ? AND status = "available"', [restaurantId])
        ]);

        const dashboardData = {
            totalOrders: stats[0].total_orders || 0,
            pendingOrders: stats[1].pending_orders || 0,
            totalBookings: stats[2].total_bookings || 0,
            todaysBookings: stats[3].todays_bookings || 0,
            totalRevenue: stats[4].total_revenue || 0,
            totalMenuItems: stats[5].total_menu_items || 0,
            availableTables: stats[6].available_tables || 0
        };

        // Get recent orders
        const recentOrders = await db.all(`
            SELECT 
                o.id, o.order_type, o.status, o.total_amount, o.created_at,
                lu.name as customer_name
            FROM orders o
            JOIN login_users lu ON o.user_id = lu.id
            WHERE o.restaurant_id = ?
            ORDER BY o.created_at DESC
            LIMIT 10
        `, [restaurantId]);

        // Get recent bookings
        const recentBookings = await db.all(`
            SELECT 
                b.id, b.date, b.time, b.guests, b.status, b.created_at,
                lu.name as customer_name, rt.table_number
            FROM bookings b
            JOIN login_users lu ON b.user_id = lu.id
            JOIN restaurant_tables rt ON b.table_id = rt.id
            WHERE b.restaurant_id = ?
            ORDER BY b.created_at DESC
            LIMIT 10
        `, [restaurantId]);

        res.status(200).json({
            success: true,
            message: 'Dashboard data retrieved successfully',
            data: {
                stats: dashboardData,
                recentOrders,
                recentBookings
            }
        });

    } catch (error) {
        console.error('Get admin dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching dashboard data'
        });
    }
});

// GET /api/admin/menu - Get restaurant menu items
router.get('/menu', async (req, res) => {
    try {
        const restaurantId = req.user.restaurant_id;

        const menuItems = await db.all(`
            SELECT id, name, category, cuisine, price, description, image, dietary, chef_special, available, created_at, updated_at
            FROM menu_items 
            WHERE restaurant_id = ?
            ORDER BY category, name
        `, [restaurantId]);

        res.status(200).json({
            success: true,
            message: 'Menu items retrieved successfully',
            data: menuItems
        });

    } catch (error) {
        console.error('Get admin menu error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching menu items'
        });
    }
});

// POST /api/admin/menu - Create new menu item
router.post('/menu', [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required and must be less than 100 characters'),
    body('category').trim().isLength({ min: 1, max: 50 }).withMessage('Category is required and must be less than 50 characters'),
    body('cuisine').optional().trim().isLength({ max: 50 }).withMessage('Cuisine must be less than 50 characters'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('image').optional().isString().withMessage('Image is optional'),
    body('dietary').optional().isLength({ max: 100 }).withMessage('Dietary info must be less than 100 characters'),
    body('chef_special').optional().isBoolean().withMessage('Chef special must be a boolean')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const restaurantId = req.user.restaurant_id;
        const { name, category, cuisine, price, description, image, dietary, chef_special } = req.body;

        const result = await db.run(`
            INSERT INTO menu_items (restaurant_id, name, category, cuisine, price, description, image, dietary, chef_special, available)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [restaurantId, name, category, cuisine || null, price, description || null, image || null, dietary || null, chef_special || false]);

        console.log(`✅ Menu item created: ${name} by Admin ${req.user.id}`);

        res.status(201).json({
            success: true,
            message: 'Menu item created successfully',
            data: {
                id: result.id,
                name,
                category,
                cuisine,
                price
            }
        });

    } catch (error) {
        console.error('Create menu item error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while creating menu item'
        });
    }
});

// PUT /api/admin/menu/:id - Update menu item
router.put('/menu/:id', [
    body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be less than 100 characters'),
    body('category').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Category must be less than 50 characters'),
    body('cuisine').optional().trim().isLength({ max: 50 }).withMessage('Cuisine must be less than 50 characters'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('image').optional().isString().withMessage('Image is optional'),
    body('dietary').optional().isLength({ max: 100 }).withMessage('Dietary info must be less than 100 characters'),
    body('chef_special').optional().isBoolean().withMessage('Chef special must be a boolean'),
    body('available').optional().isBoolean().withMessage('Available must be a boolean')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const restaurantId = req.user.restaurant_id;

        // Check if menu item exists and belongs to admin's restaurant
        const existingItem = await db.get(
            'SELECT id FROM menu_items WHERE id = ? AND restaurant_id = ?',
            [id, restaurantId]
        );

        if (!existingItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];

        const allowedFields = ['name', 'category', 'cuisine', 'price', 'description', 'image', 'dietary', 'chef_special', 'available'];
        
        for (const field of allowedFields) {
            if (req.body.hasOwnProperty(field)) {
                updateFields.push(`${field} = ?`);
                updateValues.push(req.body[field]);
            }
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(id);

        await db.run(
            `UPDATE menu_items SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        console.log(`✅ Menu item updated: ID ${id} by Admin ${req.user.id}`);

        res.status(200).json({
            success: true,
            message: 'Menu item updated successfully',
            data: {
                id: parseInt(id),
                updated: true
            }
        });

    } catch (error) {
        console.error('Update menu item error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating menu item'
        });
    }
});

// DELETE /api/admin/menu/:id - Delete menu item
router.delete('/menu/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const restaurantId = req.user.restaurant_id;

        const result = await db.run(
            'DELETE FROM menu_items WHERE id = ? AND restaurant_id = ?',
            [id, restaurantId]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        console.log(`✅ Menu item deleted: ID ${id} by Admin ${req.user.id}`);

        res.status(200).json({
            success: true,
            message: 'Menu item deleted successfully',
            data: {
                id: parseInt(id),
                deleted: true
            }
        });

    } catch (error) {
        console.error('Delete menu item error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting menu item'
        });
    }
});

// GET /api/admin/orders - Get restaurant orders
router.get('/orders', async (req, res) => {
    try {
        const restaurantId = req.user.restaurant_id;
        const { status, limit = 50 } = req.query;

        let query = `
            SELECT 
                o.id, o.order_type, o.status, o.total_amount, o.scheduled_time, 
                o.special_instructions, o.created_at,
                lu.name as customer_name, lu.email as customer_email, lu.phone as customer_phone
            FROM orders o
            JOIN login_users lu ON o.user_id = lu.id
            WHERE o.restaurant_id = ?
        `;
        
        const queryParams = [restaurantId];

        if (status) {
            query += ' AND o.status = ?';
            queryParams.push(status);
        }

        query += ' ORDER BY o.created_at DESC LIMIT ?';
        queryParams.push(parseInt(limit));

        const orders = await db.all(query, queryParams);

        // Get order items for each order
        for (const order of orders) {
            const orderItems = await db.all(`
                SELECT 
                    oi.quantity, oi.price,
                    mi.name as item_name
                FROM order_items oi
                JOIN menu_items mi ON oi.menu_item_id = mi.id
                WHERE oi.order_id = ?
            `, [order.id]);
            
            order.items = orderItems;
        }

        res.status(200).json({
            success: true,
            message: 'Orders retrieved successfully',
            data: orders
        });

    } catch (error) {
        console.error('Get admin orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching orders'
        });
    }
});

// PUT /api/admin/orders/:id/status - Update order status
router.put('/orders/:id/status', [
    body('status').isIn(['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']).withMessage('Invalid status')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const { status } = req.body;
        const restaurantId = req.user.restaurant_id;

        // Check if order exists and belongs to admin's restaurant
        const existingOrder = await db.get(
            'SELECT id, status as current_status FROM orders WHERE id = ? AND restaurant_id = ?',
            [id, restaurantId]
        );

        if (!existingOrder) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Update order status
        await db.run(
            'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, id]
        );

        // Add to status history
        await db.run(`
            INSERT INTO order_status_history (order_id, status, changed_by, notes)
            VALUES (?, ?, ?, ?)
        `, [id, status, req.user.id, `Status changed from ${existingOrder.current_status} to ${status}`]);

        console.log(`✅ Order status updated: Order ${id} changed to ${status} by Admin ${req.user.id}`);

        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            data: {
                orderId: id,
                newStatus: status,
                updated: true
            }
        });

    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating order status'
        });
    }
});

// GET /api/admin/bookings - Get restaurant bookings
router.get('/bookings', async (req, res) => {
    try {
        const restaurantId = req.user.restaurant_id;
        const { date, status, limit = 50 } = req.query;

        let query = `
            SELECT
                b.id, b.date, b.time, b.guests, b.special_requests, b.status, b.created_at,
                lu.name as customer_name, lu.email as customer_email, lu.phone as customer_phone,
                rt.table_number, rt.capacity as table_capacity
            FROM bookings b
            JOIN login_users lu ON b.user_id = lu.id
            JOIN restaurant_tables rt ON b.table_id = rt.id
            WHERE b.restaurant_id = ?
        `;

        const queryParams = [restaurantId];

        if (date) {
            query += ' AND b.date = ?';
            queryParams.push(date);
        }

        if (status) {
            query += ' AND b.status = ?';
            queryParams.push(status);
        }

        query += ' ORDER BY b.date DESC, b.time DESC LIMIT ?';
        queryParams.push(parseInt(limit));

        const bookings = await db.all(query, queryParams);

        res.status(200).json({
            success: true,
            message: 'Bookings retrieved successfully',
            data: bookings
        });

    } catch (error) {
        console.error('Get admin bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching bookings'
        });
    }
});

// PUT /api/admin/bookings/:id/status - Update booking status
router.put('/bookings/:id/status', [
    body('status').isIn(['confirmed', 'cancelled', 'completed', 'pending']).withMessage('Invalid status')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const { status } = req.body;
        const restaurantId = req.user.restaurant_id;

        // Check if booking exists and belongs to admin's restaurant
        const existingBooking = await db.get(`
            SELECT
                b.id, b.user_id, b.status as current_status, b.date, b.time, b.table_id,
                lu.name as customer_name,
                rt.table_number,
                r.name as restaurant_name
            FROM bookings b
            JOIN login_users lu ON b.user_id = lu.id
            JOIN restaurant_tables rt ON b.table_id = rt.id
            JOIN restaurants r ON b.restaurant_id = r.id
            WHERE b.id = ? AND b.restaurant_id = ?
        `, [id, restaurantId]);

        if (!existingBooking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Update booking status
        await db.run(
            'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, id]
        );

        // Update table status based on booking status
        if (status === 'cancelled' || status === 'completed') {
            await db.run(
                'UPDATE restaurant_tables SET status = "available" WHERE id = ?',
                [existingBooking.table_id]
            );
        } else if (status === 'confirmed') {
            await db.run(
                'UPDATE restaurant_tables SET status = "reserved" WHERE id = ?',
                [existingBooking.table_id]
            );
        }

        // Create notification for the customer
        const notificationMessages = {
            confirmed: `Your booking at ${existingBooking.restaurant_name} for table ${existingBooking.table_number} on ${existingBooking.date} at ${existingBooking.time} has been confirmed.`,
            cancelled: `Your booking at ${existingBooking.restaurant_name} for table ${existingBooking.table_number} on ${existingBooking.date} at ${existingBooking.time} has been cancelled.`,
            completed: `Your booking at ${existingBooking.restaurant_name} for table ${existingBooking.table_number} has been completed. Thank you for dining with us!`,
            pending: `Your booking at ${existingBooking.restaurant_name} for table ${existingBooking.table_number} is now pending confirmation.`
        };

        const notificationTitles = {
            confirmed: 'Booking Confirmed',
            cancelled: 'Booking Cancelled',
            completed: 'Booking Completed',
            pending: 'Booking Pending'
        };

        await db.run(`
            INSERT INTO notifications (user_id, restaurant_id, booking_id, title, message, type, is_read)
            VALUES (?, ?, ?, ?, ?, ?, 0)
        `, [
            existingBooking.user_id,
            restaurantId,
            id,
            notificationTitles[status] || 'Booking Status Update',
            notificationMessages[status] || `Your booking status has been updated to ${status}.`,
            status === 'confirmed' ? 'success' : status === 'cancelled' ? 'error' : 'info'
        ]);

        console.log(`✅ Booking status updated: Booking ${id} changed to ${status} by Admin ${req.user.id}`);
        console.log(`✅ Notification sent to user ${existingBooking.user_id}`);

        res.status(200).json({
            success: true,
            message: 'Booking status updated successfully',
            data: {
                bookingId: id,
                newStatus: status,
                updated: true
            }
        });

    } catch (error) {
        console.error('Update booking status error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating booking status'
        });
    }
});

module.exports = router;