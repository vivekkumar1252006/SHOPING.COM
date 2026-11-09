import Category from '../models/Category.js';
import Product from '../models/Product.js';

/**
 * Get all categories with product counts
 * GET /api/categories
 */
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });

    // Aggregate real product counts per category
    const categoryCounts = await Product.aggregate([
      { $group: { _id: { $toLower: '$category' }, count: { $sum: 1 } } },
    ]);

    const countMap = {};
    categoryCounts.forEach((c) => {
      countMap[c._id] = c.count;
    });

    const enriched = categories.map((cat) => ({
      ...cat.toObject(),
      productCount: countMap[cat.name.toLowerCase()] || 0,
    }));

    res.json({
      success: true,
      categories: enriched,
      count: enriched.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get single category by slug or ID
 * GET /api/categories/:idOrSlug
 */
export const getCategoryById = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let category = null;

    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      category = await Category.findById(idOrSlug);
    }
    if (!category) {
      category = await Category.findOne({ slug: idOrSlug.toLowerCase() });
    }

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const products = await Product.find({
      category: { $regex: new RegExp(`^${category.name}$`, 'i') },
    }).limit(12);

    res.json({
      success: true,
      category,
      products,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Create new category
 * POST /api/categories
 */
export const createCategory = async (req, res) => {
  try {
    const { name, description, image, icon, featured } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const exists = await Category.findOne({ name: name.trim() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description || '',
      image: image || '',
      icon: icon || 'Layers',
      featured: featured !== undefined ? Boolean(featured) : true,
    });

    res.status(201).json({ success: true, category, message: 'Category created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Update category
 * PUT /api/categories/:id
 */
export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (req.body.name) category.name = req.body.name.trim();
    if (req.body.description !== undefined) category.description = req.body.description;
    if (req.body.image !== undefined) category.image = req.body.image;
    if (req.body.icon !== undefined) category.icon = req.body.icon;
    if (req.body.featured !== undefined) category.featured = req.body.featured;

    const updated = await category.save();
    res.json({ success: true, category: updated, message: 'Category updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Delete category
 * DELETE /api/categories/:id
 */
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

