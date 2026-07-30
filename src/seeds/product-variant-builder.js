// Food portion sizes (pizza, pasta, appetizer, salad, dessert, burger, soup)
const FOOD_SIZE_CONFIGS = [
    {
        size: 'S',
        skuSuffix: 'S',
        priceMultiplier: 0.7,
        recipeMultiplier: 0.7,
        crust: ['thin', 'thick'],
    },
    {
        size: 'M',
        skuSuffix: 'M',
        priceMultiplier: 1,
        recipeMultiplier: 1,
        crust: ['thin', 'medium', 'thick'],
    },
    {
        size: 'L',
        skuSuffix: 'L',
        priceMultiplier: 1.3,
        recipeMultiplier: 1.3,
        crust: ['thin', 'medium', 'thick'],
    },
];

// Drink volume sizes
const DRINK_SIZE_CONFIGS = [
    {
        size: '330ml',
        skuSuffix: '330ML',
        priceMultiplier: 0.5,
        recipeMultiplier: 0.5,
    },
    {
        size: '1L',
        skuSuffix: '1L',
        priceMultiplier: 1,
        recipeMultiplier: 1,
    },
    {
        size: '1.5L',
        skuSuffix: '1.5L',
        priceMultiplier: 1.5,
        recipeMultiplier: 1.5,
    },
];

const toRoundedPrice = (price) => Math.max(0, Math.round(price / 1000) * 1000);

const scaleRecipe = (recipe, multiplier) =>
    recipe.map((item) => ({
        ...item,
        quantity: Number((item.quantity * multiplier).toFixed(3)),
    }));

export const buildSeedVariants = ({
    slug,
    basePrice,
    categorySlug,
    imageUrl,
    recipe,
}) => {
    const variantConfigs =
        categorySlug === 'drink' ? DRINK_SIZE_CONFIGS : FOOD_SIZE_CONFIGS;

    return variantConfigs.map((config) => {
        const variant = {
            sku: `PRD-${slug.toUpperCase()}-${config.skuSuffix}`,
            disscountType: 'percent',
            discount: 0,
            price: toRoundedPrice(basePrice * config.priceMultiplier),
            size: config.size,
            image: {
                url: imageUrl,
                public_id: `seed-csv-${slug}-${config.skuSuffix.toLowerCase()}`,
            },
            recipe: scaleRecipe(recipe, config.recipeMultiplier),
        };

        // Chỉ Pizza mới có crust, các loại khác (pasta, salad, appetizer,...) thì không
        if (categorySlug === 'pizza' && Array.isArray(config.crust)) {
            variant.crust = config.crust;
        }

        return variant;
    });
};
