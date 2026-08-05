import mongoose from 'mongoose';

export const Ingredient_category_list = [
    { name: 'Bột', slug: 'dough' },
    { name: 'Hải sản', slug: 'seafood' },
    { name: 'Thịt', slug: 'meat' },
    { name: 'Sốt', slug: 'sauce' },
    { name: 'Rau củ', slug: 'vegetable' },
    { name: 'Đồ uống', slug: 'drink' },
    { name: 'Khác', slug: 'other' },
];

export const Unit_Base = [
    { name: 'Gram', slug: 'gram' },
    { name: 'Kí', slug: 'kg' },
    { name: 'Ml', slug: 'ml' },
    { name: 'Lít', slug: 'lit' },
    { name: 'Cái', slug: 'piece' },
    { name: 'Hộp', slug: 'box' },
    { name: 'Lon', slug: 'can' },
    { name: 'Bao', slug: 'bag' },
    { name: 'Gói', slug: 'package' },
];

const INGREDIENT_CATEGORY_SLUGS = Ingredient_category_list.map(
    (item) => item.slug,
);
const UNIT_BASE_SLUGS = Unit_Base.map((item) => item.slug);

const ingredientSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        unit: {
            type: String,
            enum: UNIT_BASE_SLUGS,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            enum: INGREDIENT_CATEGORY_SLUGS,
            trim: true,
        },
        costPerUnit: {
            type: Number,
            default: 0,
            min: 0,
        },
        quantityExtra: {
            type: Number,
            default: 0,
            min: 0,
        },
        price: {
            type: Number,
            default: 0,
            min: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
);

export const Ingredient = mongoose.model('Ingredient', ingredientSchema);
