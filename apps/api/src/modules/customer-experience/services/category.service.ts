import { Category, ICategory } from '../models/category.model.js';

export interface CategoryTreeNode {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  iconUrl?: string | null;
  displayOrder: number;
  subcategories: CategoryTreeNode[];
}

export class CategoryService {
  public async getCategoryTree(): Promise<CategoryTreeNode[]> {
    const categories = await Category.find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    const categoryMap = new Map<string, CategoryTreeNode>();
    const rootNodes: CategoryTreeNode[] = [];

    // Map all categories
    for (const cat of categories) {
      const node: CategoryTreeNode = {
        id: cat._id.toString(),
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        iconUrl: cat.iconUrl,
        displayOrder: cat.displayOrder,
        subcategories: [],
      };
      categoryMap.set(node.id, node);
    }

    // Connect children to parents
    for (const cat of categories) {
      const node = categoryMap.get(cat._id.toString())!;
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId.toString());
        if (parent) {
          parent.subcategories.push(node);
          continue;
        }
      }
      rootNodes.push(node);
    }

    return rootNodes;
  }

  public async getCategoryById(id: string): Promise<ICategory | null> {
    return Category.findById(id);
  }

  public async createCategory(data: Partial<ICategory>): Promise<ICategory> {
    const existing = await Category.findOne({ slug: data.slug });
    if (existing) {
      const err = new Error('A category with this slug already exists');
      (err as any).statusCode = 409;
      (err as any).code = 'CATEGORY_SLUG_EXISTS';
      throw err;
    }

    return Category.create(data);
  }

  public async updateCategory(id: string, data: Partial<ICategory>): Promise<ICategory | null> {
    if (data.slug) {
      const existing = await Category.findOne({ slug: data.slug, _id: { $ne: id } });
      if (existing) {
        const err = new Error('A category with this slug already exists');
        (err as any).statusCode = 409;
        (err as any).code = 'CATEGORY_SLUG_EXISTS';
        throw err;
      }
    }

    return Category.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  }
}

export const categoryService = new CategoryService();
