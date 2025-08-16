const express = require('express');
const db = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Middleware to ensure super admin access
router.use(authenticateToken);
router.use(authorizeRole(['superadmin']));

// GET /api/super-admin/dashboard - Get platform analytics
router.get('/dashboard', async (req, res) => {
    try {
        // Get platform-wide statistics
        const stats = await Promise.all([
            db.get('SELECT COUNT(*) as total_restaurants FROM restaurants WHERE is_active = 1'),
            db.get('SELECT COUNT(*) as total_customers FROM login_users WHERE role = "customer" AND is_active = 1'),
            db.get('SELECT COUNT(*) as total_orders FROM orders'),
            db.get('SELECT COUNT(*) as total_bookings FROM bookings'),
            db.get('SELECT SUM(total_amount) as total_revenue FROM orders WHERE status = "completed"'),
            db.get('SELECT COUNT(*) as pending_orders FROM orders WHERE status = "pending"'),
            db.get('SELECT COUNT(*) as active_admins FROM users WHERE role = "admin" AND is_active = 1')
        ]);

        const dashboardData = {
            totalRestaurants: stats[0].total_restaurants || 0,
            totalCustomers: stats[1].total_customers || 0,
            totalOrders: stats[2].total_orders || 0,
            totalBookings: stats[3].total_bookings || 0,
            totalRevenue: stats[4].total_revenue || 0,
            pendingOrders: stats[5].pending_orders || 0,
            activeAdmins: stats[6].active_admins || 0
        };

        // Get recent activity
        const recentOrders = await db.all(`
            SELECT 
                o.id, o.order_type, o.status, o.total_amount, o.created_at,
                r.name as restaurant_name,
                lu.name as customer_name
            FROM orders o
            JOIN restaurants r ON o.restaurant_id = r.id
            JOIN login_users lu ON o.user_id = lu.id
            ORDER BY o.created_at DESC
            LIMIT 10
        `);

        const recentBookings = await db.all(`
            SELECT 
                b.id, b.date, b.time, b.guests, b.status, b.created_at,
                r.name as restaurant_name,
                lu.name as customer_name
            FROM bookings b
            JOIN restaurants r ON b.restaurant_id = r.id
            JOIN login_users lu ON b.user_id = lu.id
            ORDER BY b.created_at DESC
            LIMIT 10
        `);

        res.status(200).json({
            success: true,
            message: 'Super admin dashboard data retrieved successfully',
            data: {
                stats: dashboardData,
                recentOrders,
                recentBookings
            }
        });

    } catch (error) {
        console.error('Get super admin dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching dashboard data'
        });
    }
});

// GET /api/super-admin/restaurants - Get all restaurants
router.get('/restaurants', async (req, res) => {
    try {
        const restaurants = await db.all(`
            SELECT 
                r.id, r.name, r.cuisine, r.rating, r.image, r.address, r.phone, 
                r.description, r.admin_id, r.is_active, r.created_at,
                COUNT(o.id) as total_orders,
                COUNT(b.id) as total_bookings,
                SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END) as revenue
            FROM restaurants r
            LEFT JOIN orders o ON r.id = o.restaurant_id
            LEFT JOIN bookings b ON r.id = b.restaurant_id
            GROUP BY r.id
            ORDER BY r.created_at DESC
        `);

        res.status(200).json({
            success: true,
            message: 'Restaurants retrieved successfully',
            data: restaurants
        });

    } catch (error) {
        console.error('Get all restaurants error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching restaurants'
        });
    }
});

// GET /api/super-admin/users - Get all users
router.get('/users', async (req, res) => {
    try {
        const { role, limit = 100 } = req.query;

        let query = `
            SELECT id, name, email, phone, role, is_active, created_at
            FROM login_users
            WHERE 1=1
        `;
        const queryParams = [];

        if (role) {
            query += ' AND role = ?';
            queryParams.push(role);
        }

        query += ' ORDER BY created_at DESC LIMIT ?';
        queryParams.push(parseInt(limit));

        const users = await db.all(query, queryParams);

        // Also get admin users
        const adminUsers = await db.all(`
            SELECT 
                u.id, u.name, u.email, u.phone, u.role, u.is_active, u.created_at,
                r.name as restaurant_name
            FROM users u
            LEFT JOIN restaurants r ON u.restaurant_id = r.id
            WHERE u.role IN ('admin', 'superadmin')
            ORDER BY u.created_at DESC
        `);

        res.status(200).json({
            success: true,
            message: 'Users retrieved successfully',
            data: {
                customers: users,
                admins: adminUsers
            }
        });

    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching users'
        });
    }
});

// GET /api/super-admin/orders - Get all orders
router.get('/orders', async (req, res) => {
    try {
        const { status, restaurantId, limit = 100 } = req.query;

        let query = `
            SELECT 
                o.id, o.order_type, o.status, o.total_amount, o.scheduled_time, 
                o.special_instructions, o.created_at,
                r.name as restaurant_name,
                lu.name as customer_name, lu.email as customer_email
            FROM orders o
            JOIN restaurants r ON o.restaurant_id = r.id
            JOIN login_users lu ON o.user_id = lu.id
            WHERE 1=1
        `;
        const queryParams = [];

        if (status) {
            query += ' AND o.status = ?';
            queryParams.push(status);
        }

        if (restaurantId) {
            query += ' AND o.restaurant_id = ?';
            queryParams.push(restaurantId);
        }

        query += ' ORDER BY o.created_at DESC LIMIT ?';
        queryParams.push(parseInt(limit));

        const orders = await db.all(query, queryParams);

        res.status(200).json({
            success: true,
            message: 'Orders retrieved successfully',
            data: orders
        });

    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching orders'
        });
    }
});

// GET /api/super-admin/analytics - Get detailed analytics
router.get('/analytics', async (req, res) => {
    try {
        // Revenue analytics
        const revenueByMonth = await db.all(`
            SELECT 
                strftime('%Y-%m', created_at) as month,
                SUM(total_amount) as revenue,
                COUNT(*) as order_count
            FROM orders 
            WHERE status = 'completed' 
            AND created_at >= date('now', '-12 months')
            GROUP BY strftime('%Y-%m', created_at)
            ORDER BY month DESC
        `);

        // Restaurant performance
        const restaurantPerformance = await db.all(`
            SELECT 
                r.name,
                COUNT(o.id) as total_orders,
                SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END) as revenue,
                AVG(r.rating) as avg_rating
            FROM restaurants r
            LEFT JOIN orders o ON r.id = o.restaurant_id
            WHERE r.is_active = 1
            GROUP BY r.id, r.name
            ORDER BY revenue DESC
        `);

        // Order status distribution
        const orderStatusDistribution = await db.all(`
            SELECT 
                status,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders), 2) as percentage
            FROM orders
            GROUP BY status
            ORDER BY count DESC
        `);

        // Popular cuisines
        const popularCuisines = await db.all(`
            SELECT 
                r.cuisine,
                COUNT(o.id) as order_count,
                SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END) as revenue
            FROM restaurants r
            LEFT JOIN orders o ON r.id = o.restaurant_id
            GROUP BY r.cuisine
            ORDER BY order_count DESC
        `);

        res.status(200).json({
            success: true,
            message: 'Analytics data retrieved successfully',
            data: {
                revenueByMonth,
// POST /api/super-admin/restaurants - Add new restaurant
router.post('/restaurants', async (req, res) => {
    try {
        const { name, cuisine, address, phone, description, image, admin_id, admin_password } = req.body;

        if (!name || !cuisine || !admin_id || !admin_password) {
            return res.status(400).json({
                success: false,
                message: 'Name, cuisine, admin ID, and admin password are required'
            });
        }
                restaurantPerformance,
        // Check if admin ID already exists
        const existingAdmin = await db.get(
            'SELECT id FROM restaurants WHERE admin_id = ?',
// POST /api/super-admin/restaurants - Create new restaurant
router.post('/restaurants', async (req, res) => {
    try {
        const { name, cuisine, address, phone, description, image, admin_id, admin_password } = req.body;

        if (!name || !cuisine || !admin_id || !admin_password) {
            return res.status(400).json({
                success: false,
                message: 'Name, cuisine, admin ID, and admin password are required'
            });
        }

        // Check if admin ID already exists
        const existingAdmin = await db.get(
            'SELECT id FROM restaurants WHERE admin_id = ?',
            [admin_id]
        );

        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Admin ID already exists'
            });
        }

        // Hash admin password
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(admin_password, 12);

        // Create restaurant
        const result = await db.run(`
            INSERT INTO restaurants (name, cuisine, address, phone, description, image, admin_id, admin_password_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [name, cuisine, address || null, phone || null, description || null, image || null, admin_id, hashedPassword]);

        // Create admin user
        await db.run(`
            INSERT INTO users (name, email, password_hash, role, restaurant_id, admin_id)
            VALUES (?, ?, ?, 'admin', ?, ?)
        `, [`${name} Admin`, `admin@${admin_id.toLowerCase()}.com`, hashedPassword, result.id, admin_id]);

        console.log(`✅ Restaurant created: ${name} with admin ${admin_id} by Super Admin ${req.user.id}`);

        res.status(201).json({
            success: true,
            message: 'Restaurant created successfully',
            data: {
                id: result.id,
                name,
                admin_id
            }
        });

    } catch (error) {
        console.error('Create restaurant error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while creating restaurant'
        });
    }
});

// PUT /api/super-admin/restaurants/:id/status - Toggle restaurant status
router.put('/restaurants/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        const result = await db.run(
            'UPDATE restaurants SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [is_active, id]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        // Also update admin user status
        await db.run(
            'UPDATE users SET is_active = ? WHERE restaurant_id = ? AND role = "admin"',
            [is_active, id]
        );

        console.log(`✅ Restaurant status updated: ID ${id} set to ${is_active ? 'active' : 'inactive'} by Super Admin ${req.user.id}`);

        res.status(200).json({
            success: true,
            message: 'Restaurant status updated successfully'
        });

    } catch (error) {
        console.error('Update restaurant status error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating restaurant status'
        });
    }
});

// PUT /api/super-admin/customers/:id/status - Toggle customer status
router.put('/customers/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        const result = await db.run(
            'UPDATE login_users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [is_active, id]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        console.log(`✅ Customer status updated: ID ${id} set to ${is_active ? 'active' : 'inactive'} by Super Admin ${req.user.id}`);

        res.status(200).json({
            success: true,
            message: 'Customer status updated successfully'
        });

    } catch (error) {
        console.error('Update customer status error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating customer status'
        });
    }
});

// PUT /api/super-admin/admins/:id/status - Toggle admin status
router.put('/admins/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        const result = await db.run(
            'UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND role = "admin"',
            [is_active, id]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        console.log(`✅ Admin status updated: ID ${id} set to ${is_active ? 'active' : 'inactive'} by Super Admin ${req.user.id}`);

        res.status(200).json({
            success: true,
            message: 'Admin status updated successfully'
        });

    } catch (error) {
        console.error('Update admin status error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating admin status'
        });
    }
});
            [admin_id]
        );
                orderStatusDistribution,
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Admin ID already exists'
            });
        }
                popularCuisines
        // Hash admin password
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(admin_password, 12);
            }
        // Create restaurant
        const result = await db.run(`
            INSERT INTO restaurants (name, cuisine, address, phone, description, image, admin_id, admin_password_hash)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [name, cuisine, address || null, phone || null, description || null, image || null, admin_id, hashedPassword]);
        });
        // Create admin user
        await db.run(`
            INSERT INTO users (name, email, password_hash, role, restaurant_id, admin_id)
            VALUES (?, ?, ?, 'admin', ?, ?)
        `, [`${name} Admin`, `admin@${admin_id.toLowerCase()}.com`, hashedPassword, result.id, admin_id]);

        console.log(`✅ Restaurant created: ${name} with admin ${admin_id} by Super Admin ${req.user.id}`);
    } catch (error) {
        res.status(201).json({
            success: true,
            message: 'Restaurant created successfully',
            data: {
                id: result.id,
                name,
                admin_id
            }
        });
        console.error('Get analytics error:', error);
    } catch (error) {
        console.error('Create restaurant error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while creating restaurant'
        });
    }
});
        res.status(500).json({
// PUT /api/super-admin/restaurants/:id/status - Toggle restaurant status
router.put('/restaurants/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;
            success: false,
        const result = await db.run(
            'UPDATE restaurants SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [is_active, id]
        );
            message: 'Internal server error while fetching analytics'
        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }
        });
        console.log(`✅ Restaurant status updated: ID ${id} set to ${is_active ? 'active' : 'inactive'} by Super Admin ${req.user.id}`);
    }
        res.status(200).json({
            success: true,
            message: 'Restaurant status updated successfully'
        });
});
    } catch (error) {
        console.error('Update restaurant status error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating restaurant status'
        });
    }
});

module.exports = router;