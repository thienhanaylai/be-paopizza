import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import environment from '../config/environment.js';
import { Category } from '../modules/category/category.model.js';
import { Product } from '../modules/product/product.model.js';
import { Ingredient } from '../modules/ingredient/ingredient.model.js';
import { ingredientSeedCatalog } from './ingredient-catalog.js';
import { buildSeedVariants } from './product-variant-builder.js';

const connectDatabase = async () => {
    await mongoose.connect(environment.mongoUri, {
        dbName: 'express_app',
    });
};

const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
};

const categoryTemplates = [
    {
        name: 'Pizza',
        slug: 'pizza',
        icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXBpenphLWljb24gbHVjaWRlLXBpenphIj48cGF0aCBkPSJtMTIgMTQtMSAxIi8+PHBhdGggZD0ibTEzLjc1IDE4LjI1LTEuMjUgMS40MiIvPjxwYXRoIGQ9Ik0xNy43NzUgNS42NTRhMTUuNjggMTUuNjggMCAwIDAtMTIuMTIxIDEyLjEyIi8+PHBhdGggZD0iTTE4LjggOS4zYTEgMSAwIDAgMCAyLjEgNy43Ii8+PHBhdGggZD0iTTIxLjk2NCAyMC43MzJhMSAxIDAgMCAxLTEuMjMyIDEuMjMybC0xOC01YTEgMSAwIDAgMS0uNjk1LTEuMjMyQTE5LjY4IDE5LjY4IDAgMCAxIDE1LjczMiAyLjAzN2ExIDEgMCAwIDEgMS4yMzIuNjk1eiIvPjwvc3ZnPg==',
        is_active: true,
        isDeleted: false,
    },
    {
        name: 'Drink',
        slug: 'drink',
        icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWN1cC1zb2RhLWljb24gbHVjaWRlLWN1cC1zb2RhIj48cGF0aCBkPSJtNiA4IDEuNzUgMTIuMjhwMiAyIDAgMCAwIDIgMS43Mmg0LjU0YTIgMiAwIDAgMCAyLTEuNzJMMTggOCIvPjxwYXRoIGQ9Ik05IDhoMTQiLz48cGF0aCBkPSJNNyAxNWE2LjQ3IDYuNDcgMCAwIDEgNSAwIDYuNDcgNi40NyAwIDAgMCA1IDAiLz48cGF0aCBkPSJtMTIgOCAxLTZoMiIvPjwvc3ZnPg==',
        is_active: true,
        isDeleted: false,
    },
    {
        name: 'Appetizer',
        slug: 'appetizer',
        icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWNha2Utc2xpY2UtaWNvbiBsdWNpZGUtY2FrZS1zbGljZSI+PHBhdGggZD0iTTE2IDEzSDMiLz48cGF0aCBkPSJNMTYgMTdIMyIvPjxwYXRoIGQ9Im03LjIgNy45LTMuMzg4IDIuNUEyIDIgMCAwIDAgMyAxMi4wMVYyMGExIDEgMCAwIDAgMSAxaDE2YTEgMSAwIDAgMCAxLTF2LTguNjU0YzAtMi0yLjQ0LTYuMDI2LTYuNDQtOC4wMjZhMSAxIDAgMCAwLTEuMDgyLjA1N0wxMC40IDUuNiIvPjxjaXJjbGUgY3g9IjkiIGN5PSI3IiByPSIyIi8+PC9zdmc+',
        is_active: true,
        isDeleted: false,
    },
    {
        name: 'Dessert',
        slug: 'dessert',
        icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWRlc3NlcnQtaWNvbiBsdWNpZGUtZGVzc2VydCI+PHBhdGggZD0iTTEwLjE2MiAzLjE2N0ExMCAxMCAwIDAgMCAyIDEzYTIgMiAwIDAgMCA0IDB2LTFhMiAyIDAgMCAxIDQgMHY0YTIgMiAwIDAgMCA0IDB2LTRhMiAyIDAgMCAxIDQgMHYxYTIgMiAwIDAgMCA0LS4wMDYgMTAgMTAgMCAwIDAtOC4xNjEtOS44MjYiLz48cGF0aCBkPSJNMjAuODA0IDE0Ljg2OWE5IDkgMCAwIDEtMTcuNjA4IDAiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjQiIHI9IjIiLz48L3N2Zz4=',
        is_active: true,
        isDeleted: false,
    },
    {
        name: 'Pasta',
        slug: 'pasta',
        icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXNoZWxsLWljb24gbHVjaWRlLXNoZWxsIj48cGF0aCBkPSJNMTQgMTFhMiAyIDAgMSAxLTQgMCA0IDQgMCAwIDEgOCAwIDYgNiAwIDAgMS0xMiAwIDggOCAwIDAgMSAxNiAwIDEwIDEwIDAgMSAxLTIwIDAgMTEuOTMgMTEuOTMgMCAwIDEgMi40Mi03LjIyIDIgMiAwIDEgMSAzLjE2IDIuNDQiLz48L3N2Zz4=',
        is_active: true,
        isDeleted: false,
    },
    {
        name: 'Burger',
        slug: 'burger',
        icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWhhbWJ1cmdlci1pY29uIGx1Y2lkZS1oYW1idXJnZXIiPjxwYXRoIGQ9Ik0xMiAxNkg0YTIgMiAwIDEgMSAwLTRoMTZhMiAyIDAgMSAxIDAgNGgtNC4yNSIvPjxwYXRoIGQ9Ik05IDEyaDIiLz48cGF0aCBkPSJNNSAxMmEyIDYgMCAwIDEgMC02aDE0YTIgNiAwIDAgMSAwIDYiLz48cGF0aCBkPSJNNSAxNmEyIDYgMCAwIDAgMCA2aDE0YTIgNiAwIDAgMCAwLTYiLz48L3N2Zz4=',
        is_active: true,
        isDeleted: false,
    },
    {
        name: 'Salad',
        slug: 'salad',
        icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWhvcC1pY29uIGx1Y2lkZS1ob3AiPjxwYXRoIGQ9Ik0xMC44MiAxNi4xMmMxLjY5LjYgMy45MS43OSA1LjE4Ljg1LjU1LjAzIDEtLjQyLjk3LS45Ny0uMDYtMS4yNy0uMjYtMy41LS44NS01LjE4Ii8+PHBhdGggZD0iTTExLjUgNi41YzEuNjQgMCA1LS4zOEM2LjcxLTEuMDcuNTItLjIuNTUtLjgyLjExLTEuMTdBMTAgMTAgMCAwIDAgNC4yNiAxOC4zM2MuMzUuNDMuOTYuNCAxLjE3LS4xMi42OS0xLjcxIDEuMDctNS4wNyAxLjA3LTYuNzEgMS4zNC40NSAzLjEuOSA0Ljg4LjYyYS44OC44OCAwIDAgMCAuNzMtLjc0Yy4zLTIuMTQtLjE1LTMuNS0uNjEtNC44OCIvPjxwYXRoIGQ9Ik0xNS42MiAxNi45NWMuMi44NS42MiAyLjc2LjUgNC4yOGEuNzcuNzcgMCAwIDEtLjkuNyAxNi42NCAxNi42NCAwIDAgMS00LjA4LTEuMzYiLz48cGF0aCBkPSJNMTYuMTMgMjEuMDVjMS42NS42MyAzLjY4Ljg0IDQuODcuOTFhLjkuOSAwIDAgMCAuOTYtLjk2IDE3LjY4IDE3LjY4IDAgMCAwLS45LTQuODciLz48cGF0aCBkPSJNMTYu5QgMTUuNjJjLjg2LjIgMi43Ny42MiA0LjI5LjVhLjc3Ljc3IDAgMCAwIC43LS45IDE2LjY0IDE2LjY0IDAgMCAwLTEuMzYtNC4wOCIvPjxwYXRoIGQ9Ik0xNy45OSA1LjUyYTIwLjgyIDIwLjgyIDAgMCAxIDMuMTUgNC41LjguOCAwIDAgMS0uNjggMS4xM2MtMi4zMy4yLTUuMy0uMzItOC4yNy0xLjU3Ii8+PHBhdGggZD0iTTQuOTMgNC45MyAzIDNhLjcuNyAwIDAgMSAwLTEiLz48cGF0aCBkPSJNOS41OCAxMi4xOGMxLjI0IDIuOTggMS43NyA1Ljk1IDEuNTcgOC4yOGEuOC44IDAgMCAxLTEuMTMuNjggMjAuODIgMjAuODIgMCAwIDEtNC41LTMuMTUiLz48L3N2Zz4=',
        is_active: true,
        isDeleted: false,
    },
    {
        name: 'Soup',
        slug: 'soup',
        icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXNvdXAtaWNvbiBsdWNpZGUtc291cCI+PHBhdGggZD0iTTEyIDIxYTkgOSAwIDAgMCA5LTlIM2E5IDkgMCAwIDAgOSA5WiIvPjxwYXRoIGQ9Ik03IDIxaDEwIi8+PHBhdGggZD0iTTE5LjUgMTIgMjIgNiIvPjxwYXRoIGQ9Ik0xNi4yNSAzYy4yNy4xLjguNTMuNzUgMS4zNi0uMDYuODMtLjkzIDEuMi0xIDIuMDItLjA1Ljc4LjM0IDEuMjQuNzMgMS42MiIvPjxwYXRoIGQ9Ik0xMS4yNSAzYy4yNy4xLjguNTMuNzQgMS4zNi0uMDUuODMtLjkzIDEuMi0.OTggMi4wMi0uMDYuNzguMzMgMS4yNC43MiAxLjYyIi8+PHBhdGggZD0iTTYuMjUgM2MuMjcuMS44LjUzLjc1IDEuMzYtLjA2LjgzLS45MyAxLjItMSAyLjAyLS4wNS43OC4zNCAxLjI0Ljc0IDEuNjIiLz48L3N2Zz4=',
        is_active: true,
        isDeleted: false,
    },
];

// ── Công thức pizza tường minh (định lượng cho size M) ──────────────
// Định lượng thực tế cho 1 pizza 12" (size M):
//   - Bột: 250g, Phô mai base: 150g, Sốt cà chua: 80ml, Muối: 5g
//   - Topping thịt: 60-80g/loại, Hải sản: 50-70g, Rau củ: 40-60g
//   - Extra cheese: 60-80g, Sốt thêm: 30-40ml, Dầu olive: 15ml
//   - Gia vị khô (tiêu, lá quế): 2-3g
// ─────────────────────────────────────────────────────────────────────
const PIZZA_RECIPES = {
    // ── Classic (169k-189k M) ─────────────────────────────────────────
    'create your own pizza': [],
    'ham and pickles': [
        { name: 'Ham', quantity: 0.07 },
        { name: 'Pickles', quantity: 0.04 },
    ],
    'pepperoni fresh': [
        { name: 'Pepperoni', quantity: 0.07 },
        { name: 'Tomatoes', quantity: 0.05 },
        { name: 'La Que Kho', quantity: 0.002 },
    ],
    pepperoni: [{ name: 'Pepperoni', quantity: 0.08 }],
    cheesy: [
        { name: 'Pho Mai Mozzarella', quantity: 0.08 },
        { name: 'Cheddar And Parmesan Cheeses', quantity: 0.05 },
    ],
    'ham & cheese': [
        { name: 'Ham', quantity: 0.07 },
        { name: 'Pho Mai Mozzarella', quantity: 0.06 },
    ],
    hawaiian: [
        { name: 'Ham', quantity: 0.07 },
        { name: 'Pineapple', quantity: 0.05 },
    ],
    margherita: [
        { name: 'Tomatoes', quantity: 0.06 },
        { name: 'Pho Mai Mozzarella', quantity: 0.05 },
        { name: 'La Que Kho', quantity: 0.003 },
        { name: 'Dau Olive', quantity: 0.01 },
    ],
    // ── Mid-range (199k-239k M) ──────────────────────────────────────
    'garlic chicken': [
        { name: 'Uc Ga Phi Le', quantity: 0.07 },
        { name: 'Toi Bam', quantity: 0.01 },
        { name: 'Sot Mayonnaise', quantity: 0.02 },
    ],
    'ham & mushroom': [
        { name: 'Ham', quantity: 0.07 },
        { name: 'Nam Mo', quantity: 0.05 },
    ],
    'double chicken': [
        { name: 'Uc Ga Phi Le', quantity: 0.12 },
        { name: 'Sot Mayonnaise', quantity: 0.02 },
    ],
    'masala pizza': [
        { name: 'Uc Ga Phi Le', quantity: 0.07 },
        { name: 'Toi Bam', quantity: 0.01 },
        { name: 'Tieu Den Xay', quantity: 0.003 },
        { name: 'Sot Mayonnaise', quantity: 0.02 },
        { name: 'Hanh Tay', quantity: 0.04 },
    ],
    'burger pizza': [
        { name: 'Thit Bo Xay', quantity: 0.08 },
        { name: 'Pickles', quantity: 0.04 },
        { name: 'Hanh Tay', quantity: 0.04 },
        { name: 'Sot BBQ', quantity: 0.03 },
    ],
    vegetarian: [
        { name: 'Nam Mo', quantity: 0.05 },
        { name: 'Ot Chuong Do', quantity: 0.04 },
        { name: 'Ot Chuong Vang', quantity: 0.04 },
        { name: 'Hanh Tay', quantity: 0.04 },
        { name: 'Tomatoes', quantity: 0.05 },
    ],
    // ── Premium (259k-299k M) ────────────────────────────────────────
    'bbq chicken': [
        { name: 'Uc Ga Phi Le', quantity: 0.07 },
        { name: 'Sot BBQ', quantity: 0.04 },
        { name: 'Hanh Tay', quantity: 0.04 },
    ],
    'chicken ranch': [
        { name: 'Uc Ga Phi Le', quantity: 0.07 },
        { name: 'Sot Mayonnaise', quantity: 0.03 },
        { name: 'Toi Bam', quantity: 0.008 },
        { name: 'Tieu Den Xay', quantity: 0.002 },
    ],
    teriyaki: [
        { name: 'Uc Ga Phi Le', quantity: 0.07 },
        { name: 'Sot BBQ', quantity: 0.04 },
        { name: 'Hanh Tay', quantity: 0.04 },
        { name: 'Toi Bam', quantity: 0.008 },
    ],
    julienne: [
        { name: 'Uc Ga Phi Le', quantity: 0.07 },
        { name: 'Nam Mo', quantity: 0.05 },
        { name: 'Pho Mai Mozzarella', quantity: 0.06 },
        { name: 'Sot Mayonnaise', quantity: 0.02 },
    ],
    'four cheese': [
        { name: 'Pho Mai Mozzarella', quantity: 0.06 },
        { name: 'Mozzarella Cheese', quantity: 0.05 },
        { name: 'Cheddar And Parmesan Cheeses', quantity: 0.05 },
        { name: 'Bryndza Cheese', quantity: 0.04 },
    ],
    'cheesy chicken': [
        { name: 'Uc Ga Phi Le', quantity: 0.07 },
        { name: 'Pho Mai Mozzarella', quantity: 0.06 },
        { name: 'Cheddar And Parmesan Cheeses', quantity: 0.05 },
    ],
    'double pepperoni': [{ name: 'Pepperoni', quantity: 0.13 }],
    carbonara: [
        { name: 'Bacon', quantity: 0.07 },
        { name: 'Pho Mai Mozzarella', quantity: 0.05 },
        { name: 'Sot Mayonnaise', quantity: 0.02 },
        { name: 'Tieu Den Xay', quantity: 0.002 },
    ],
    'arriva!': [
        { name: 'Pepperoni', quantity: 0.06 },
        { name: 'Ham', quantity: 0.06 },
        { name: 'Bacon', quantity: 0.05 },
        { name: 'Nam Mo', quantity: 0.04 },
        { name: 'Ot Chuong Do', quantity: 0.04 },
    ],
    'pesto pizza': [
        { name: 'Dau Olive', quantity: 0.02 },
        { name: 'La Que Kho', quantity: 0.004 },
        { name: 'Toi Bam', quantity: 0.008 },
        { name: 'Tomatoes', quantity: 0.05 },
    ],
    'shrimp and pesto': [
        { name: 'Tom Tuoi', quantity: 0.06 },
        { name: 'Dau Olive', quantity: 0.015 },
        { name: 'La Que Kho', quantity: 0.003 },
        { name: 'Toi Bam', quantity: 0.008 },
    ],
    'sweet chilli shrimp': [
        { name: 'Tom Tuoi', quantity: 0.07 },
        { name: 'Ot Chuong Do', quantity: 0.04 },
        { name: 'Sot BBQ', quantity: 0.03 },
    ],
    diablo: [
        { name: 'Pepperoni', quantity: 0.07 },
        { name: 'Ham Spicy Beef', quantity: 0.06 },
        { name: 'Jalapenos', quantity: 0.04 },
        { name: 'Ot Chuong Do', quantity: 0.04 },
        { name: 'Toi Bam', quantity: 0.01 },
    ],
    // ── Feast (329k-399k M) ──────────────────────────────────────────
    'meat feast': [
        { name: 'Pepperoni', quantity: 0.06 },
        { name: 'Thit Bo Xay', quantity: 0.06 },
        { name: 'Ham', quantity: 0.06 },
        { name: 'Bacon', quantity: 0.05 },
        { name: 'Pork Neck', quantity: 0.05 },
    ],
    'four seasons': [
        { name: 'Nam Mo', quantity: 0.05 },
        { name: 'Ham', quantity: 0.05 },
        { name: 'Pepperoni', quantity: 0.05 },
        { name: 'Ot Chuong Do', quantity: 0.04 },
        { name: 'Hanh Tay', quantity: 0.04 },
    ],
    dodo: [
        { name: 'Pepperoni', quantity: 0.06 },
        { name: 'Ham', quantity: 0.06 },
        { name: 'Nam Mo', quantity: 0.05 },
        { name: 'Ot Chuong Do', quantity: 0.04 },
        { name: 'Hanh Tay', quantity: 0.04 },
        { name: 'Bacon', quantity: 0.04 },
    ],
    'meat mix': [
        { name: 'Pepperoni', quantity: 0.06 },
        { name: 'Thit Bo Xay', quantity: 0.06 },
        { name: 'Ham', quantity: 0.06 },
        { name: 'Bacon', quantity: 0.05 },
        { name: 'Pork Neck', quantity: 0.05 },
    ],
    'dodo mix': [
        { name: 'Pepperoni', quantity: 0.06 },
        { name: 'Ham', quantity: 0.06 },
        { name: 'Uc Ga Phi Le', quantity: 0.06 },
        { name: 'Thit Bo Xay', quantity: 0.05 },
        { name: 'Nam Mo', quantity: 0.04 },
        { name: 'Ot Chuong Do', quantity: 0.04 },
        { name: 'Hanh Tay', quantity: 0.04 },
    ],
};

// ── Nguyên liệu nền (base) cho mọi pizza size M ────────────────────
const PIZZA_BASE = [
    { name: 'Bot Mi', quantity: 0.25 },
    { name: 'Pho Mai Mozzarella', quantity: 0.15 },
    { name: 'Sot Ca Chua Napoli', quantity: 0.08 },
    { name: 'Muoi Bien', quantity: 0.005 },
];

// ── Map tên drink CSV → ingredient trong catalog ──────────────────
const DRINK_INGREDIENT_MAP = {
    'dobry cola': 'Coca-Cola',
    'dobry cola zero': 'Coca-Cola',
    'dobry cola ice lemon': 'Coca-Cola',
    'dobry lemon-lime': 'Sprite',
    'dobry orange': 'Fanta',
    'dobry kiwi-grapes': 'Fanta',
    'bonaaqua still water': 'Nuoc Suoi',
    'pulpy orange juice drink': 'Nuoc Cam Ep',
    'dobry apple juice': 'Nuoc Cam Ep',
    'nectar dobry orange': 'Nuoc Cam Ep',
    'nectar dobry multifruit': 'Nuoc Cam Ep',
    'nectar dobry apple-cherry-chokeberry': 'Nuoc Cam Ep',
    'fig-elderflower iced tea': 'Tra Da',
    'rich black tea lemon': 'Tra Da',
    'rich green tea': 'Tra Da',
    'black currant fruit drink': 'Nuoc Cam Ep',
    'blueberry-lime lemonade': 'Sprite',
    'cherry fruit drink': 'Nuoc Cam Ep',
    'cranberry fruit drink': 'Nuoc Cam Ep',
};

/**
 * Tạo công thức (recipe) cho một sản phẩm dựa trên tên và danh mục.
 * Với pizza: dùng công thức tường minh từ PIZZA_RECIPES.
 * Với các danh mục khác: dùng keyword matching (đã sửa lỗi tên nguyên liệu).
 */
const generateRecipe = (productName, categorySlug, ingMap) => {
    const recipe = [];
    const lowerName = productName.toLowerCase();

    const addIng = (name, quantity) => {
        const ing = ingMap[name];
        if (ing) {
            recipe.push({
                ingredient: ing._id,
                quantity,
                unit: ing.unit,
            });
        } else {
            console.warn(
                `  ⚠ Ingredient "${name}" not found in catalog, skipping.`,
            );
        }
    };

    if (categorySlug === 'pizza') {
        // Thêm nguyên liệu nền
        for (const base of PIZZA_BASE) {
            addIng(base.name, base.quantity);
        }

        // Tra cứu công thức tường minh theo tên pizza
        const pizzaRecipe = PIZZA_RECIPES[lowerName];
        if (pizzaRecipe) {
            for (const topping of pizzaRecipe) {
                addIng(topping.name, topping.quantity);
            }
        } else {
            console.warn(
                `  ⚠ No explicit recipe for "${productName}", using base only.`,
            );
        }
    } else if (categorySlug === 'pasta') {
        addIng('Dau Olive', 0.02);
        addIng('Muoi Bien', 0.005);
        addIng('Tieu Den Xay', 0.002);

        if (lowerName.includes('carbonara')) {
            addIng('Pho Mai Mozzarella', 0.05);
        }
        if (lowerName.includes('meat')) {
            addIng('Thit Bo Xay', 0.1);
            addIng('Sot Ca Chua Napoli', 0.1);
        }
        if (lowerName.includes('shrimp')) {
            addIng('Tom Tuoi', 0.08);
        }
        if (lowerName.includes('pesto')) {
            addIng('La Que Kho', 0.002);
            addIng('Dau Olive', 0.01);
        }
    } else if (categorySlug === 'salad') {
        addIng('Dau Olive', 0.015);
        addIng('Muoi Bien', 0.002);

        if (lowerName.includes('caesar')) {
            addIng('Uc Ga Phi Le', 0.08);
            addIng('Sot Mayonnaise', 0.03);
        }
        if (lowerName.includes('shrimp')) {
            addIng('Tom Tuoi', 0.06);
        }
    } else if (categorySlug === 'dessert') {
        addIng('Duong Nau', 0.05);
    } else if (categorySlug === 'appetizer') {
        if (lowerName.includes('dodster')) {
            addIng('Pho Mai Mozzarella', 0.05);
            if (lowerName.includes('masala')) {
                addIng('Toi Bam', 0.005);
            }
            if (lowerName.includes('spicy')) {
                addIng('Tieu Den Xay', 0.003);
            }
            if (lowerName.includes('ham')) {
                addIng('Ham', 0.04);
            }
        }
        if (lowerName.includes('nugget') || lowerName.includes('bite')) {
            addIng('Uc Ga Phi Le', 0.15);
        }
        if (lowerName.includes('potato')) {
            addIng('Muoi Bien', 0.005);
            if (lowerName.includes('cheese')) {
                addIng('Pho Mai Mozzarella', 0.06);
            }
        }
        if (lowerName.includes('omelette')) {
            addIng('Muoi Bien', 0.002);
            if (lowerName.includes('ham')) {
                addIng('Ham', 0.03);
            }
            if (lowerName.includes('cheese')) {
                addIng('Pho Mai Mozzarella', 0.05);
            }
            if (lowerName.includes('mushroom')) {
                addIng('Nam Mo', 0.03);
            }
        }
        if (lowerName.includes('shrimp')) {
            addIng('Tom Tuoi', 0.1);
        }
    } else if (categorySlug === 'drink') {
        // Map tên drink từ CSV sang ingredient name trong catalog
        const ingName = DRINK_INGREDIENT_MAP[lowerName];
        if (ingName) {
            addIng(ingName, 1);
        }
    }

    return recipe;
};

const seedProductsFromCSV = async () => {
    // 1. Prepare Categories
    const categoriesMap = {};
    for (const catTpl of categoryTemplates) {
        let cat = await Category.findOne({ slug: catTpl.slug });
        if (!cat) {
            cat = await Category.create(catTpl);
            console.log(`Created Category: ${cat.name}`);
        }
        categoriesMap[catTpl.slug] = cat._id;
    }

    // 2. Prepare Ingredients
    let ingredients = await Ingredient.find({});
    if (ingredients.length === 0) {
        console.log('No ingredients found. Seeding standard ingredients...');
        ingredients = await Ingredient.insertMany(ingredientSeedCatalog);
    }

    const ingMap = {};
    for (const ing of ingredients) {
        ingMap[ing.name] = ing;
    }

    // 3. Read and Parse CSVs
    const csvFiles = ['pizza.csv', 'pasta_deset_salad_.csv', 'drink.csv'];
    const productsData = [];
    const seenNames = new Set();

    for (const fileName of csvFiles) {
        const csvPath = path.join(process.cwd(), fileName);
        if (!fs.existsSync(csvPath)) {
            console.warn(`CSV file not found at ${csvPath}, skipping...`);
            continue;
        }

        const fileContent = fs.readFileSync(csvPath, 'utf8');
        const lines = fileContent
            .split(/\r?\n/)
            .filter((line) => line.trim() !== '');
        if (lines.length <= 1) continue;

        const headers = lines[0].split(',').map((h) => h.trim());
        const nameIndex =
            headers.indexOf('@name') !== -1
                ? headers.indexOf('@name')
                : headers.indexOf('name');
        const priceIndex = headers.indexOf('price');
        const imageIndex = headers.indexOf('image');

        if (nameIndex === -1 || priceIndex === -1 || imageIndex === -1) {
            console.error(`Invalid CSV headers in ${fileName}. Skipping.`);
            continue;
        }

        for (let i = 1; i < lines.length; i++) {
            const row = lines[i].split(',');
            if (row.length < 3) continue;

            const rawName = row[nameIndex].trim();
            const rawPrice = parseFloat(
                row[priceIndex].trim().replace(/[^\d.]/g, ''),
            );
            const rawImage = row[imageIndex].trim();

            if (!rawName || Number.isNaN(rawPrice)) {
                console.warn(
                    `Skipping invalid row in ${fileName} at line ${i + 1}: ${lines[i]}`,
                );
                continue;
            }

            if (seenNames.has(rawName)) {
                console.log(
                    `Duplicate product found: "${rawName}". Keeping first occurrence.`,
                );
                continue;
            }
            seenNames.add(rawName);

            // Determine category matching
            let categoryId;
            let categorySlug;
            const lowerFileName = fileName.toLowerCase();
            if (lowerFileName.includes('pizza')) {
                categoryId = categoriesMap['pizza'];
                categorySlug = 'pizza';
            } else if (lowerFileName.includes('drink')) {
                categoryId = categoriesMap['drink'];
                categorySlug = 'drink';
            } else {
                const lowerName = rawName.toLowerCase();
                if (
                    lowerName.includes('pasta') ||
                    lowerName.includes('carbonara')
                ) {
                    categoryId = categoriesMap['pasta'];
                    categorySlug = 'pasta';
                } else if (lowerName.includes('salad')) {
                    categoryId = categoriesMap['salad'];
                    categorySlug = 'salad';
                } else if (
                    lowerName.includes('dessert') ||
                    lowerName.includes('cake') ||
                    lowerName.includes('cookie') ||
                    lowerName.includes('deset')
                ) {
                    categoryId = categoriesMap['dessert'];
                    categorySlug = 'dessert';
                } else {
                    categoryId = categoriesMap['appetizer'];
                    categorySlug = 'appetizer';
                }
            }

            const finalPrice = rawPrice * 1000;
            const slug = slugify(rawName);
            const recipe = generateRecipe(rawName, categorySlug, ingMap);

            productsData.push({
                category: categoryId,
                name: rawName,
                description: `${rawName} made with premium fresh ingredients.`,
                is_active: true,
                isDeleted: false,
                variants: buildSeedVariants({
                    slug,
                    basePrice: finalPrice,
                    categorySlug,
                    imageUrl: rawImage,
                    recipe,
                }),
            });
        }
    }

    // 4. Clear existing Product database
    console.log('Clearing existing products...');
    const deleteResult = await Product.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} products.`);

    // 5. Insert new products
    console.log(`Inserting ${productsData.length} products from CSVs...`);
    const insertedProducts = await Product.insertMany(productsData);
    console.log(
        `Successfully seeded ${insertedProducts.length} products with recipe toppings.`,
    );

    // 6. Build summary table output
    const summary = insertedProducts.map((p) => ({
        Name: p.name,
        Category:
            Object.keys(categoriesMap).find(
                (key) =>
                    categoriesMap[key].toString() === p.category.toString(),
            ) || 'unknown',
        Price: p.variants[0].price,
        SKU: p.variants[0].sku,
        IngredientsCount: p.variants[0].recipe.length,
    }));
    console.table(summary);
};

const run = async () => {
    try {
        await connectDatabase();
        console.log('Database connected successfully');
        await seedProductsFromCSV();
        console.log('Product CSV Seeding Completed Successfully');
    } catch (error) {
        console.error('Seeding products from CSV failed:', error);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
};

run();
