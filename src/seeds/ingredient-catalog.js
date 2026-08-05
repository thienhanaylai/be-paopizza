const fallbackIngredientImage = (label) =>
    `https://placehold.co/600x600/f6efe8/8a5a44?text=${encodeURIComponent(label)}`;

const ingredientImages = {
    spicyBeef:
        'https://media.dodostatic.net/image/01991530635b73ecb1a22658b49e1653.png',
    mozzarella:
        'https://media.dodostatic.net/image/0199ae74f2fd783b8fb21bb0af7d09e6.png',
    cheddarParmesan:
        'https://media.dodostatic.net/image/0199152f32e47035aefbe8c971c54502.png',
    jalapenos:
        'https://media.dodostatic.net/image/0199152c7eb27553a08f57c8c9861ac3.png',
    chicken:
        'https://media.dodostatic.net/image/0199152e59157089adb89948280ebb10.png',
    mushrooms:
        'https://media.dodostatic.net/image/0199152bfda5723f8bbecc43a35f83f1.png',
    bacon: 'https://media.dodostatic.net/image/019c570e36ff78f4ba36a75d85000d7e.png',
    ham: 'https://media.dodostatic.net/image/0199152d7fd075a9b11d17f8acaf1670.png',
    pepperoni:
        'https://media.dodostatic.net/image/0199ae74b6d6761f972e9a60b63044bc.png',
    pickles:
        'https://media.dodostatic.net/image/0199152e33ee7722ac038fa5bc26e630.png',
    tomatoes:
        'https://media.dodostatic.net/image/0199152a8428737d9f6b19c1b2329749.png',
    redOnion:
        'https://media.dodostatic.net/image/0199ae747c85710abcf2950497834b01.png',
    pineapple:
        'https://media.dodostatic.net/image/0199152b81587495b19ba8008c567f5d.png',
    italianSeasoning:
        'https://media.dodostatic.net/image/0199152ced7677fcb0e49edd0ebf6c90.png',
    sweetPepper:
        'https://media.dodostatic.net/image/0199152ced7677fcb0e49edd0ebf6c90.png',
    bryndza:
        'https://media.dodostatic.net/image/0199152ced7677fcb0e49edd0ebf6c90.png',
    shrimps:
        'https://media.dodostatic.net/image/019c570e238d751dbe68f7d540857d16.png',
    porkNeck:
        'https://media.dodostatic.net/image/0199e7d1cd977499a410e7a4f0495221.png',
    balyk: 'https://media.dodostatic.net/image/019cb4960da771ed94fba307e44fa33b.png',
};

const coreIngredientSeedData = [
    // ── Nguyên liệu nền (không phải topping) ──────────────────────────
    // cost_per_unit = giá nhập sỉ (VNĐ/đơn vị), price = giá bán extra topping (VNĐ/phần)
    {
        name: 'Bot Mi',
        unit: 'kg',
        category: 'dough',
        cost_per_unit: 24000, // Bột mì ~24k/kg
        price: 0,
        image: fallbackIngredientImage('Bot Mi'),
    },
    {
        name: 'Pho Mai Mozzarella',
        unit: 'kg',
        category: 'other',
        cost_per_unit: 135000, // Mozzarella nhập khẩu ~135k/kg
        price: 20000,
        image: ingredientImages.mozzarella,
    },
    {
        name: 'Sot Ca Chua Napoli',
        unit: 'lit',
        category: 'sauce',
        cost_per_unit: 55000, // Sốt cà chua Ý ~55k/lít
        price: 0,
        image: ingredientImages.tomatoes,
    },
    {
        name: 'Pepperoni',
        unit: 'kg',
        category: 'meat',
        cost_per_unit: 135000, // Pepperoni nhập ~135k/kg
        price: 25000,
        image: ingredientImages.pepperoni,
    },
    {
        name: 'Uc Ga Phi Le',
        unit: 'kg',
        category: 'meat',
        cost_per_unit: 89000, // Ức gà phi lê ~89k/kg
        price: 20000,
        image: ingredientImages.chicken,
    },
    {
        name: 'Thit Bo Xay',
        unit: 'kg',
        category: 'meat',
        cost_per_unit: 195000, // Thịt bò xay ~195k/kg
        price: 25000,
        image: ingredientImages.spicyBeef,
    },
    {
        name: 'Tom Tuoi',
        unit: 'kg',
        category: 'seafood',
        cost_per_unit: 265000, // Tôm sú tươi ~265k/kg
        price: 35000,
        image: ingredientImages.shrimps,
    },
    {
        name: 'Muc Ong Cat Khoanh',
        unit: 'kg',
        category: 'seafood',
        cost_per_unit: 230000, // Mực ống ~230k/kg
        price: 35000,
        image: ingredientImages.shrimps,
    },
    {
        name: 'Nam Mo',
        unit: 'kg',
        category: 'vegetable',
        cost_per_unit: 65000, // Nấm mỡ tươi ~65k/kg
        price: 15000,
        image: ingredientImages.mushrooms,
    },
    {
        name: 'Ot Chuong Do',
        unit: 'kg',
        category: 'vegetable',
        cost_per_unit: 55000, // Ớt chuông đỏ ~55k/kg
        price: 15000,
        image: ingredientImages.sweetPepper,
    },
    {
        name: 'Ot Chuong Vang',
        unit: 'kg',
        category: 'vegetable',
        cost_per_unit: 55000, // Ớt chuông vàng ~55k/kg
        price: 15000,
        image: ingredientImages.sweetPepper,
    },
    {
        name: 'Hanh Tay',
        unit: 'kg',
        category: 'vegetable',
        cost_per_unit: 28000, // Hành tây ~28k/kg
        price: 10000,
        image: ingredientImages.redOnion,
    },
    {
        name: 'Toi Bam',
        unit: 'kg',
        category: 'vegetable',
        cost_per_unit: 75000, // Tỏi băm sẵn ~75k/kg
        price: 10000,
        image: fallbackIngredientImage('Toi Bam'),
    },
    {
        name: 'La Que Kho',
        unit: 'package',
        category: 'other',
        cost_per_unit: 65000, // Lá quế khô Ý ~65k/gói
        price: 10000,
        image: ingredientImages.italianSeasoning,
    },
    // ── Nguyên liệu phụ trợ (không phải topping) ──────────────────────
    {
        name: 'Dau Olive',
        unit: 'lit',
        category: 'other',
        cost_per_unit: 215000, // Dầu olive extra virgin ~215k/lít
        price: 0,
        image: fallbackIngredientImage('Dau Olive'),
    },
    {
        name: 'Duong Nau',
        unit: 'kg',
        category: 'other',
        cost_per_unit: 38000, // Đường nâu ~38k/kg
        price: 0,
        image: fallbackIngredientImage('Duong Nau'),
    },
    {
        name: 'Muoi Bien',
        unit: 'kg',
        category: 'other',
        cost_per_unit: 20000, // Muối biển ~20k/kg
        price: 0,
        image: fallbackIngredientImage('Muoi Bien'),
    },
    {
        name: 'Tieu Den Xay',
        unit: 'kg',
        category: 'other',
        cost_per_unit: 240000, // Tiêu đen xay ~240k/kg
        price: 0,
        image: fallbackIngredientImage('Tieu Den Xay'),
    },
    {
        name: 'Sot Mayonnaise',
        unit: 'lit',
        category: 'sauce',
        cost_per_unit: 75000, // Mayo ~75k/lít
        price: 10000,
        image: fallbackIngredientImage('Sot Mayonnaise'),
    },
    {
        name: 'Sot BBQ',
        unit: 'lit',
        category: 'sauce',
        cost_per_unit: 85000, // Sốt BBQ ~85k/lít
        price: 10000,
        image: fallbackIngredientImage('Sot BBQ'),
    },
];

const illustrativeIngredientSeedData = [
    // ── Nhóm Thịt (Meat) – extra topping 20k-25k/phần ──────────────
    {
        name: 'Ham Spicy Beef',
        unit: 'kg',
        category: 'meat',
        cost_per_unit: 165000, // Bò cay ~165k/kg
        price: 25000,
        image: ingredientImages.spicyBeef,
    },
    {
        name: 'Chicken',
        unit: 'kg',
        category: 'meat',
        cost_per_unit: 89000, // Gà phi lê ~89k/kg
        price: 20000,
        image: ingredientImages.chicken,
    },
    {
        name: 'Bacon',
        unit: 'kg',
        category: 'meat',
        cost_per_unit: 145000, // Bacon xông khói ~145k/kg
        price: 25000,
        image: ingredientImages.bacon,
    },
    {
        name: 'Ham',
        unit: 'kg',
        category: 'meat',
        cost_per_unit: 125000, // Jambon ~125k/kg
        price: 20000,
        image: ingredientImages.ham,
    },
    {
        name: 'Pork Neck',
        unit: 'kg',
        category: 'meat',
        cost_per_unit: 145000, // Thịt cổ heo ~145k/kg
        price: 25000,
        image: ingredientImages.porkNeck,
    },
    {
        name: 'Balyk Sausages',
        unit: 'kg',
        category: 'meat',
        cost_per_unit: 210000, // Xúc xích Balyk cao cấp ~210k/kg
        price: 30000,
        image: ingredientImages.balyk,
    },
    // ── Nhóm Hải sản (Seafood) – extra topping 30k-35k/phần ─────────
    {
        name: 'Shrimps',
        unit: 'kg',
        category: 'seafood',
        cost_per_unit: 265000, // Tôm sú tươi ~265k/kg
        price: 35000,
        image: ingredientImages.shrimps,
    },
    // ── Nhóm Phô mai (Cheese) – extra topping 20k-25k/phần ──────────
    {
        name: 'Mozzarella Cheese',
        unit: 'kg',
        category: 'other',
        cost_per_unit: 135000, // Mozzarella ~135k/kg
        price: 20000,
        image: ingredientImages.mozzarella,
    },
    {
        name: 'Cheddar And Parmesan Cheeses',
        unit: 'kg',
        category: 'other',
        cost_per_unit: 185000, // Cheddar + Parmesan blend ~185k/kg
        price: 25000,
        image: ingredientImages.cheddarParmesan,
    },
    {
        name: 'Bryndza Cheese',
        unit: 'kg',
        category: 'other',
        cost_per_unit: 130000, // Bryndza ~130k/kg
        price: 20000,
        image: ingredientImages.bryndza,
    },
    // ── Nhóm Rau củ (Vegetable) – extra topping 10k-15k/phần ────────
    {
        name: 'Jalapenos',
        unit: 'kg',
        category: 'vegetable',
        cost_per_unit: 65000, // Jalapeños ~65k/kg
        price: 15000,
        image: ingredientImages.jalapenos,
    },
    {
        name: 'Mushrooms',
        unit: 'kg',
        category: 'vegetable',
        cost_per_unit: 65000, // Nấm mỡ ~65k/kg
        price: 15000,
        image: ingredientImages.mushrooms,
    },
    {
        name: 'Pickles',
        unit: 'kg',
        category: 'vegetable',
        cost_per_unit: 55000, // Dưa chua ~55k/kg
        price: 10000,
        image: ingredientImages.pickles,
    },
    {
        name: 'Tomatoes',
        unit: 'kg',
        category: 'vegetable',
        cost_per_unit: 38000, // Cà chua tươi ~38k/kg
        price: 10000,
        image: ingredientImages.tomatoes,
    },
    {
        name: 'Pineapple',
        unit: 'kg',
        category: 'vegetable',
        cost_per_unit: 40000, // Dứa tươi ~40k/kg
        price: 15000,
        image: ingredientImages.pineapple,
    },
    {
        name: 'Sweet Pepper',
        unit: 'kg',
        category: 'vegetable',
        cost_per_unit: 55000, // Ớt chuông ngọt ~55k/kg
        price: 15000,
        image: ingredientImages.sweetPepper,
    },
    {
        name: 'Red Onion',
        unit: 'kg',
        category: 'vegetable',
        cost_per_unit: 28000, // Hành tím ~28k/kg
        price: 10000,
        image: ingredientImages.redOnion,
    },
    // ── Nhóm Gia vị / Khác – extra topping 10k/phần ─────────────────
    {
        name: 'Italian Seasoning',
        unit: 'package',
        category: 'other',
        cost_per_unit: 75000, // Gia vị Ý tổng hợp ~75k/gói
        price: 10000,
        image: ingredientImages.italianSeasoning,
    },
];

// ── Nhóm Đồ uống (Drink) – không phải topping ──────────────────────
const drinkIngredientSeedData = [
    {
        name: 'Coca-Cola',
        unit: 'can',
        category: 'drink',
        cost_per_unit: 8000, // ~8k/lon
        price: 0,
        image: fallbackIngredientImage('Coca-Cola'),
    },
    {
        name: 'Pepsi',
        unit: 'can',
        category: 'drink',
        cost_per_unit: 7500, // ~7.5k/lon
        price: 0,
        image: fallbackIngredientImage('Pepsi'),
    },
    {
        name: 'Sprite',
        unit: 'can',
        category: 'drink',
        cost_per_unit: 7500, // ~7.5k/lon
        price: 0,
        image: fallbackIngredientImage('Sprite'),
    },
    {
        name: '7Up',
        unit: 'can',
        category: 'drink',
        cost_per_unit: 7500, // ~7.5k/lon
        price: 0,
        image: fallbackIngredientImage('7Up'),
    },
    {
        name: 'Fanta',
        unit: 'can',
        category: 'drink',
        cost_per_unit: 7500, // ~7.5k/lon
        price: 0,
        image: fallbackIngredientImage('Fanta'),
    },
    {
        name: 'Nuoc Suoi',
        unit: 'piece',
        category: 'drink',
        cost_per_unit: 3000, // ~3k/chai
        price: 0,
        image: fallbackIngredientImage('Nuoc Suoi'),
    },
    {
        name: 'Tra Da',
        unit: 'piece',
        category: 'drink',
        cost_per_unit: 1000, // ~1k/ly
        price: 0,
        image: fallbackIngredientImage('Tra Da'),
    },
    {
        name: 'Nuoc Cam Ep',
        unit: 'piece',
        category: 'drink',
        cost_per_unit: 15000, // ~15k/ly
        price: 0,
        image: fallbackIngredientImage('Nuoc Cam Ep'),
    },
    {
        name: 'Sua Tuoi',
        unit: 'box',
        category: 'drink',
        cost_per_unit: 12000, // ~12k/hộp
        price: 0,
        image: fallbackIngredientImage('Sua Tuoi'),
    },
];

export const ingredientSeedCatalog = [
    ...coreIngredientSeedData,
    ...illustrativeIngredientSeedData,
    ...drinkIngredientSeedData,
].map(({ cost_per_unit, ...ingredient }) => {
    // quantityExtra: lượng trừ kho mỗi lần thêm extra topping
    // Quy ước: kg → tính theo gam, lit → tính theo ml
    const quantityExtra =
        ingredient.quantityExtra ??
        (ingredient.price > 0
            ? ingredient.unit === 'kg'
                ? 30 // ~30g cho thịt/phô mai
                : ingredient.unit === 'lit'
                  ? 15 // ~15ml cho sốt
                  : 1
            : 0);

    return {
        ...ingredient,
        costPerUnit: cost_per_unit ?? 0,
        quantityExtra,
        suppliers: ingredient.suppliers ?? [],
        isActive: true,
        isDeleted: false,
    };
});
