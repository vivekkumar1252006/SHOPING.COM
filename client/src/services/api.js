import axios from 'axios';

const getBaseUrl = () => {
    const customUrl = import.meta.env.VITE_API_URL;
    if (customUrl && typeof customUrl === 'string' && customUrl.trim()) {
        const clean = customUrl.trim().replace(/\/+$/, '');
        return clean.endsWith('/api') ? clean : `${clean}/api`;
    }
    return '/api';
};

const api = axios.create({
    baseURL: getBaseUrl(),
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Attach token if present
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('smartcart_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const normalizeProduct = (p) => {
    if (!p) return p;
    const rawId = p._id || p.id || (typeof p.product === 'string' ? p.product : null) || (p.product?._id) || '';
    const price = Number(p.discountPrice !== undefined && p.discountPrice > 0 ? p.discountPrice : (p.price || 0));
    const originalPrice = Number(p.originalPrice || (p.discountPrice !== undefined && p.discountPrice > 0 && p.price > p.discountPrice ? p.price : (p.price || price)));
    const stock = Number(p.countInStock !== undefined ? p.countInStock : (p.stock !== undefined ? p.stock : 10));

    let specs = {};
    if (Array.isArray(p.specifications)) {
        p.specifications.forEach((s) => {
            if (s.key) specs[s.key] = s.value;
            else if (s.name) specs[s.name] = s.value;
        });
    } else if (p.specifications && typeof p.specifications === 'object') {
        specs = p.specifications;
    }

    const images = Array.isArray(p.images) && p.images.length > 0
        ? p.images.map(img => typeof img === 'string' ? img : (img?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'))
        : [p.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'];

    const categoryName = typeof p.category === 'object' && p.category?.name
        ? p.category.name
        : (typeof p.category === 'string' ? p.category : 'General');

    return {
        ...p,
        _id: rawId,
        id: rawId,
        title: p.title || p.name || 'Smart Tech Product',
        name: p.name || p.title || 'Smart Tech Product',
        price,
        originalPrice,
        discountPrice: price,
        stock,
        countInStock: stock,
        images,
        image: images[0],
        category: categoryName,
        brand: p.brand || 'Shoping',
        specifications: specs
    };
};

// Auth Endpoints
export const authApi = {
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res;
  },
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res;
  },
  logout: async () => {
    const res = await api.post('/auth/logout');
    return res;
  },
  sendOTP: (data) => api.post('/auth/send-otp', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  resendOTP: (data) => api.post('/auth/resend-otp', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', typeof data === 'string' ? { email: data } : data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  checkWhatsAppStatus: () => api.get('/auth/whatsapp-status'),
  testWhatsAppOTP: (phone) => api.post('/auth/whatsapp-test', { phone }),
  getProfile: async () => {
    const res = await api.get('/auth/profile');
    return { data: { data: res.data.user } };
  },
  updateProfile: async (data) => {
    const res = await api.put('/auth/profile', data);
    return { data: { data: res.data.user } };
  },
};

// Products Endpoints
export const productApi = {
    getAll: async (params) => {
        const res = await api.get('/products', { params });
        const rawList = res.data.products || res.data.data || [];
        const normalized = rawList.map(normalizeProduct);
        return { data: { data: normalized, total: res.data.totalProducts || normalized.length } };
    },
    getById: async (id) => {
        const res = await api.get(`/products/${id}`);
        const raw = res.data.product || res.data.data;
        const normalized = normalizeProduct(raw);
        if (res.data.reviews) normalized.reviews = res.data.reviews;
        return { data: { data: normalized } };
    },
    getCategories: async () => {
        const res = await api.get('/products/meta/filters');
        const categories = res.data.categories || [];
        return { data: { data: categories } };
    },
    getFeatured: async () => {
        const res = await api.get('/products/sections/featured');
        const rawList = res.data.products || [];
        return { data: { data: rawList.map(normalizeProduct) } };
    },
    getRelated: async (id) => {
        const res = await api.get(`/products/${id}/related`);
        const rawList = res.data.relatedProducts || res.data.products || [];
        return { data: { data: rawList.map(normalizeProduct) } };
    },
    createReview: (id, reviewData) => api.post(`/products/${id}/reviews`, reviewData)
};


// Cart Endpoints
export const cartApi = {
    get: async () => {
        try {
            const res = await api.get('/cart');
            const items = res.data.cart?.items || [];
            return items.map((item) => ({
                product: normalizeProduct(item.product),
                quantity: item.quantity,
            }));
        } catch {
            return [];
        }
    },
    add: async (productId, quantity = 1) => {
        const res = await api.post('/cart', { productId, quantity });
        const items = res.data.cart?.items || [];
        return items.map((item) => ({
            product: normalizeProduct(item.product),
            quantity: item.quantity,
        }));
    },
    update: async (productId, quantity) => {
        const res = await api.put(`/cart/${productId}`, { quantity });
        const items = res.data.cart?.items || [];
        return items.map((item) => ({
            product: normalizeProduct(item.product),
            quantity: item.quantity,
        }));
    },
    remove: async (productId) => {
        const res = await api.delete(`/cart/${productId}`);
        const items = res.data.cart?.items || [];
        return items.map((item) => ({
            product: normalizeProduct(item.product),
            quantity: item.quantity,
        }));
    },
    clear: async () => {
        await api.delete('/cart');
        return [];
    },
};

// Orders Endpoints
export const orderApi = {
    create: async (orderData) => {
        const res = await api.post('/orders', orderData);
        const order = res.data.order || res.data.data;
        return { data: { data: order } };
    },
    getMyOrders: async () => {
        const res = await api.get('/orders/my-orders');
        return { data: { data: res.data.orders || [] } };
    },
    getById: async (id) => {
        const res = await api.get(`/orders/${id}`);
        return { data: { data: res.data.order || res.data.data } };
    },
    trackOrder: async (idOrTracking) => {
        const res = await api.get(`/orders/track/${idOrTracking}`);
        return { data: { data: res.data.order || res.data.data } };
    },
    createRazorpayOrder: async (id) => {
        const res = await api.post(`/orders/${id}/razorpay`);
        return { data: { data: res.data } };
    },
    verifyPayment: async (paymentData) => {
        const res = await api.post(`/orders/${paymentData.orderId}/verify-payment`, paymentData);
        return res;
    },
    simulateDemoPay: async (id) => {
        const res = await api.post(`/orders/${id}/demo-pay`);
        return res;
    },
    resendNotifications: async (id) => {
        const res = await api.post(`/orders/${id}/resend-notifications`);
        return res;
    },
    retryWhatsApp: async (id) => {
        const res = await api.post(`/orders/${id}/retry-whatsapp`);
        return res;
    },
    resendDeliveryOTP: async (id) => {
        const res = await api.post(`/orders/track/${id}/resend-delivery-otp`);
        return res;
    },
    verifyDeliveryOTP: async (id, otp) => {
        const res = await api.post(`/orders/track/${id}/verify-delivery-otp`, { otp });
        return res;
    },
    adminResendDeliveryOTP: async (id) => {
        const res = await api.post(`/admin/orders/${id}/resend-delivery-otp`);
        return res;
    },
    adminVerifyDeliveryOTP: async (id, otp) => {
        const res = await api.post(`/admin/orders/${id}/verify-delivery-otp`, { otp });
        return res;
    },
    updateStatus: (id, statusData) => api.put(`/admin/orders/${id}/status`, statusData)
};

// AI Endpoints
export const aiApi = {
    chat: async (payload) => {
        const res = await api.post('/ai/chat', payload);
        const suggested = (res.data.recommendedProducts || []).map(normalizeProduct);
        return {
            data: {
                data: {
                    reply: res.data.reply,
                    suggestedProducts: suggested
                }
            }
        };
    },
    smartSearch: async (query) => {
        const res = await api.post('/ai/smart-search', { query });
        const products = (res.data.products || []).map(normalizeProduct);
        return {
            data: {
                data: {
                    products,
                    aiReasoning: `Matched ${products.length} products with criteria based on your query.`
                }
            }
        };
    },
    getRecommendations: async () => {
        const res = await api.post('/ai/recommendations', {});
        const raw = res.data.recommendations || res.data.recommendedProducts || res.data.products || [];
        const products = raw.map(normalizeProduct);
        return { data: { data: products } };
    },
    compareProducts: (productIds) => api.post('/products/compare', { productIds })
};

// Coupons Endpoints
export const couponApi = {
    getAll: async () => {
        const res = await api.get('/coupons');
        return { data: { data: res.data.coupons || [] } };
    },
    validate: async (code, orderAmount) => {
        const res = await api.post('/coupons/validate', { code, orderAmount });
        const c = res.data.coupon;
        return {
            data: {
                data: {
                    code: c.code,
                    discountAmount: c.calculatedDiscount
                }
            }
        };
    },
    create: (data) => api.post('/coupons', data),
    delete: (id) => api.delete(`/coupons/${id}`)
};

// Admin Endpoints
export const adminApi = {
    getDashboardStats: async () => {
        const res = await api.get('/admin/dashboard');
        const s = res.data.stats || res.data.data;
        const lowStock = (s.lowStockProducts || []).map(normalizeProduct);
        return {
            data: {
                data: {
                    ...s,
                    lowStockProducts: lowStock
                }
            }
        };
    },
    getAllUsers: async () => {
        const res = await api.get('/admin/users');
        return { data: { data: res.data.users || [] } };
    },
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    getAllOrders: async (params) => {
        const res = await api.get('/admin/orders', { params });
        return { data: { data: res.data.orders || [] } };
    },
    retryWhatsApp: (id) => api.post("/admin/orders/" + id + "/retry-whatsapp"),
    resendDeliveryOTP: (id) => api.post("/admin/orders/" + id + "/resend-delivery-otp"),
    verifyDeliveryOTP: (id, otp) => api.post("/admin/orders/" + id + "/verify-delivery-otp", { otp }),
    createProduct: (data) => api.post('/admin/products', data),
    updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
    deleteProduct: (id) => api.delete(`/admin/products/${id}`)
};

export default api;

// Wishlist Endpoints
export const wishlistApi = {
    get: () => api.get('/wishlist'),
    toggle: (productId) => api.post('/wishlist/toggle', { productId }),
    remove: (productId) => api.delete('/wishlist/' + productId),
    clear: () => api.delete('/wishlist'),
};

// Category Endpoints
export const categoryApi = {
    getAll: () => api.get('/categories'),
    getById: (idOrSlug) => api.get('/categories/' + idOrSlug),
};
