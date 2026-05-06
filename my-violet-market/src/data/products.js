import { newCollection } from './newCollection';
import { womensCollection } from './womensCollection';
import { mensCollection } from './mensCollection';
import { engArzonlare } from './engArzonlare';
import { trendingItems } from './trendingItems';
import { electronicsCollection } from './electronicsCollection';
import { booksCollection } from './booksCollection';
import { stationeryCollection } from './stationeryCollection';
import { beautyCareCollection } from './beautyCareCollection';
import { accessoriesCollection } from './accessoriesCollection';
import { giftsToysCollection } from './giftsToysCollection';
import { vitaminsHealthCollection } from './vitaminsHealthCollection';
import { activeLifestyleCollection } from './activeLifestyleCollection';
import { travelGearCollection } from './travelGearCollection';
import { householdAppliancesCollection } from './householdAppliancesCollection';
import { allKindsProductsCollection } from './allKindsProductsCollection';
import { bigDiscountCollection } from './bigDiscountCollection';

export const products = [
    {
        id: 153546,
        categoryName: "products",
        title: { uz: "ayollar uchun yozgen yupkalar va rubashkalar qeshge va ayollar", ru: "Летние юбки и блузки для женщин" },
        price: "127 000UZS",
        originalPrice: "150 000", 
        discount: { uz: "30% chegirma", ru: "30% скидка" },
        video: "video/video-2.mp4",
        category: "Ayollar kiyimi",
        countries: ["USA"],
        productType: "shim",
        productCountry: "USA",
        brandCategories: "nike",
        countriesCategories: "usa",
        weight: 200,
        labels: [
            { text: { uz: "Super narx", ru: "Супер цена" }, icon: "<i class='bx bxs-hot'></i>", color: "#13BE4C" },
          ],
        description: { uz: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum consequatur officia soluta saepe at ullam labore dolore doloremque dolor perferendis! Dolorum, Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum consequatur officia soluta saepe at ullam labore dolore doloremque dolor perferendis! Dolorum, Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum consequatur officia soluta saepe at ullam labore dolore doloremque dolor perferendis! Dolorum, Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum consequatur officia soluta saepe at ullam labore dolore doloremque dolor perferendis! Dolorum, Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum consequatur officia soluta saepe at ullam labore dolore doloremque dolor perferendis! Dolorum,  Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum consequatur officia soluta saepe at ullam labore dolore doloremque dolor perferendis! Dolorum, pariatur? Rerum suscipit eligendi neque at obcaecati eaque ducimus? Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum consequatur officia soluta saepe at ullam labore dolore doloremque dolor perferendis! Dolorum, pariatur? Rerum suscipit eligendi neque at obcaecati eaque ducimus? Lorem ipsum dolor sit amet consectetur adipisicing elit. Et asperiores sed nihil tenetur explicabo sint facilis impedit quidem doloremque veniam delectus ab beatae, nostrum atque laudantium fugit pariatur suscipit? Corrupti!", ru: "Описание товара." },
        descriptionImages: [
            "img/newcollection1.jpg",
            "img/qizililkeyim-3.jfif",
            "img/yashilkeyim-2.jfif",
            "img/yashilkeyim-3.jfif",
            "img/yashilkeyim-2.jfif",
            "img/yashilkeyim-3.jfif",
            "img/yashilkeyim-2.jfif",
            "img/yashilkeyim-3.jfif",
            
          ],
          sizeChart: [
            "img/ayollaryupkasi-oq.jpg",
            "img/ayollaryupkasi-oq.jpg",
            "img/grey-keyim-2.jpg",
        ],
        relatedGroups: [
            { title: { uz: "Pastki kiyimlar", ru: "Нижняя одежда" }, productIds: [455, 5577, 70001] },
            { title: { uz: "Oyoq kiyim", ru: "Обувь" }, productIds: [6578, 18757, 70002] },
            { title: { uz: "Aksessuarlar", ru: "Аксессуары" }, productIds: [757, 85667, 19578] }
        ],
        colors: [
            {
                name: { uz: "Yashil", ru: "Зелёный" },
                colorFilter: "Green",
                price: "110 so'm",
                originalPrice: "$200",
                discount: { uz: "80% chegirma", ru: "80% скидка" },
                mainImage: "img/yashilkeyim-1.jfif",
                thumbnails: [
                    "img/yashilkeyim-2.jfif",
                    "img/yashilkeyim-3.jfif",
                    "img/newcollection1.jpg",
                    "img/qizililkeyim-3.jfif",
                    "img/yashilkeyim-2.jfif",
                    "img/yashilkeyim-3.jfif",
                    "img/yashilkeyim-2.jfif",
                    "img/yashilkeyim-3.jfif",
                    "img/yashilkeyim-2.jfif",
                    "img/yashilkeyim-3.jfif",
                ],
                sizes: ["S", "M", "L", "XL", "XXL"]
            },
            {
                name: { uz: "Sariq", ru: "Жёлтый" },
                colorFilter: "Yellow",
                price: "$156 so'm",
                originalPrice: "400 000",
                discount: { uz: "70% chegirma", ru: "70% скидка" },
                mainImage: "img/sariqkeyim-1.webp",
                thumbnails: [
                    "img/sariqkeyim-2.jfif",
                    "img/sariqkeyim-3.jfif",
                ],
                sizes: ["S", "M", "L", "XL", "XXL"]
            },
            {
                name: { uz: "Qizil", ru: "Красный" },
                colorFilter: "Red",
                price: "$111 so'm",
                originalPrice: "$200",
                discount: { uz: "80% chegirma", ru: "80% скидка" },
                mainImage: "img/qizililkeyim-1.jfif",
                thumbnails: [
                    "img/qizililkeyim-2.jfif",
                    "img/qizililkeyim-3.jfif",
                ],
                sizes: ["S", "M", "L", "XL", "XXL"]
            },
            {
                name: { uz: "Oq", ru: "Белый" },
                colorFilter: "White",
                price: "$180 so'm",
                mainImage: "img/oqkeyim-1.jpg",
                thumbnails: [
                    "img/oqkeyim-2.jfif",
                    "img/oqkeyim-3.webp",
                ],
                sizes: ["S", "M", "L", "XL", "XXL"]
            },
            {
                name: { uz: "To'q qizil", ru: "Тёмно-красный" },
                colorFilter: "Maroon",
                price: "$100 so'm",
                originalPrice: "$2100",
                discount: { uz: "810% chegirma", ru: "810% скидка" },
                mainImage: "img/Maroon-keyim-1.jpg",
                thumbnails: [
                    "img/Maroon-keyim-2.jpg",
                    "img/Maroon-keyim-3.jpg",
                ],
                sizes: ["S", "M", "L", "XL", "XXL"]
            },
            {
                name: { uz: "To'q qizil", ru: "Тёмно-красный" },
                colorFilter: "Maroon",
                price: "$100 so'm",
                originalPrice: "$2100",
                discount: { uz: "810% chegirma", ru: "810% скидка" },
                mainImage: "img/Maroon-keyim-1.jpg",
                thumbnails: [
                    "img/Maroon-keyim-2.jpg",
                    "img/Maroon-keyim-3.jpg",
                ],
                sizes: ["S", "M", "L", "XL", "XXL"]
            },
            {
                name: { uz: "To'q qizil", ru: "Тёмно-красный" },
                colorFilter: "Maroon",
                price: "$100 so'm",
                originalPrice: "$2100",
                discount: { uz: "810% chegirma", ru: "810% скидка" },
                mainImage: "img/Maroon-keyim-1.jpg",
                thumbnails: [
                    "img/Maroon-keyim-2.jpg",
                    "img/Maroon-keyim-3.jpg",
                ],
                sizes: ["S", "M", "L", "XL", "XXL"]
            },
            {
                name: { uz: "Oq", ru: "Белый" },
                colorFilter: "White",
                price: "$180 so'm",
                mainImage: "img/oqkeyim-1.jpg",
                thumbnails: [
                    "img/oqkeyim-2.jfif",
                    "img/oqkeyim-3.webp",
                ],
                sizes: ["S", "M", "L", "XL", "XXL"]
            },
            {
                name: { uz: "Oq", ru: "Белый" },
                colorFilter: "White",
                price: "$180 so'm",
                mainImage: "img/oqkeyim-1.jpg",
                thumbnails: [
                    "img/oqkeyim-2.jfif",
                    "img/oqkeyim-3.webp",
                ],
                sizes: ["S", "M", "L", "XL", "XXL"]
            },
            {
                name: { uz: "Oq", ru: "Белый" },
                colorFilter: "White",
                price: "$180 so'm",
                mainImage: "img/oqkeyim-1.jpg",
                thumbnails: [
                    "img/oqkeyim-2.jfif",
                    "img/oqkeyim-3.webp",
                ],
                sizes: ["S", "M", "L", "XL", "XXL"]
            },
        ]
    },

    {
        id: 2364,
        categoryName: "products",
        discount: { uz: "60% chegirma", ru: "60% скидка" },
        title: { uz: "ayollar uchun yozgen yupkalar va rubashkalar qeshge va ayollar", ru: "Летние юбки и блузки для женщин" },
        price: "700 000UZS",
        originalPrice: "950 000", 
        video: "video/video-2.mp4",
        category: "Ayollar kiyimi",
        countries: ["usa"],
        productType: "kupalnik",
        productCountry: "USA",
        brandCategories: "adidas",
        countriesCategories: "usa",
        weight: 700,
        description: { uz: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum consequatur officia soluta saepe at ullam labore dolore Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum consequatur officia soluta saepe at ullam labore dolore  Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum consequatur officia soluta saepe at ullam labore dolore doloremque dolor perferendis! Dolorum, pariatur? Rerum suscipit eligendi neque at obcaecati eaque ducimus?", ru: "Описание товара." },
        descriptionImages: [
            "img/sariqkeyim-2.jfif",
            "img/qizililkeyim-3.jfif",
            "img/yashilkeyim-2.jfif",
            "img/yashilkeyim-3.jfif",
            "img/yashilkeyim-2.jfif",
            "img/yashilkeyim-3.jfif",
            "img/yashilkeyim-2.jfif",
            "img/yashilkeyim-3.jfif",
          ],
        sizeChart: [
            "img/blue-keyim-3.webp",
            "img/blue-keyim-2.webp",
  ],
        colors: [
            {
                name: "Blue",
                colorFilter: "Blue",
                mainImage: "img/newcollection2.jpg",
                thumbnails: [
                    "img/newcollection2.jpg",
                    "img/newcollection2.jpg",
                ],
                sizes: ["S", "M", "L", "XL", "XXL", "M", "L", "XL", "XXL"]
            }
        ]
    },

    {
        id: 3465,
        categoryName: "products",
        title: { uz: "ayollar uchun yozgen yupkalar va rubashkalar qeshge va ayollar", ru: "Летние юбки и блузки для женщин" },
        discount: { uz: "20% chegirma", ru: "20% скидка" },
        price: "140 000UZS",
        originalPrice: "150 000", 
        video: "video/video-1.mp4",
        countries: ["uzb"],
        productType: "xudi",
        productCountry: "China",
        brandCategories: "zara",
        countriesCategories: "yevropa",
        category: "Erkaklar kiyimi",
        weight: 600,
        deliveryInfo: {
            title: { uz: "Mahsulot o'zbekiston omboreda", ru: "Товар на складе в Узбекистане" },
            text: { uz: "Cargo uchun orteqcha tulovlar yuq. Mahsulot o'zbekiston omboreda yetkazeb berish 1 kundan boshlab 3 kungacha", ru: "Дополнительной платы за груз нет. Доставка со склада в Узбекистане от 1 до 3 дней." }
        },
        relatedGroups: [
            { title: { uz: "Pastki kiyimlar", ru: "Нижняя одежда" }, productIds: [455, 5577] },
            { title: { uz: "Oyoq kiyim", ru: "Обувь" }, productIds: [6578, 18757] },
            { title: { uz: "Aksessuarlar", ru: "Аксессуары" }, productIds: [757, 85667, 19578] }
        ],
        description: { uz: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum consequatur officia soluta saepe at ullam labore dolore doloremque dolor perferendis! Dolorum, pariatur? Rerum suscipit eligendi neque at obcaecati eaque ducimus?", ru: "Описание товара." },
        colors: [
            {
                name: "Grey",
                colorFilter: "Grey",
                mainImage: "img/grey-keyim-1.webp",
                thumbnails: [
                    "img/grey-keyim-2.jpg",
                    "img/grey-keyim-3.jfif",
                ],
                sizes: ["S", "M", "L", "XL", "XXL"]
            },
        ]
    },

    {
        id: 455,
        categoryName: "products",
        title: { uz: "ayollar uchun yozgen yupkalar va rubashkalar qeshge va ayollar", ru: "Летние юбки и блузки для женщин" },
        discount: { uz: "35% chegirma", ru: "35% скидка" },
        price: "120 000",
        originalPrice: "350 000", 
        video: "video/video-2.mp4",
        productType: "yozgi-keyim",
        productCountry: "USA",
        brandCategories: "puma",
        countriesCategories: "usa",
        category: "Erkaklar kiyimi",
        countries: ["USA"],
        sizeChart: [
                    "img/blue-keyim-3.webp",
                    "img/blue-keyim-2.webp",
                    "img/blue-keyim-2.webp",
                    "img/blue-keyim-3.webp",
                    "img/blue-keyim-2.webp"
        ],
        description: { uz: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum consequatur officia soluta saepe at ullam labore dolore doloremque dolor perferendis! Dolorum, pariatur? Rerum suscipit eligendi neque at obcaecati eaque ducimus?", ru: "Описание товара." },
        colors: [
            {
                name: "Grey",
                colorFilter: "Grey",
                mainImage: "img/grey-keyim-1.webp",
                thumbnails: [
                    "img/grey-keyim-2.jpg",
                    "img/grey-keyim-3.jfif",
                ],
                sizes: ["S", "M", "L", "XL", "XXL"]
            },
        ]
    },

    {
        id: 5577,
        categoryName: "products",
        title: { uz: "ayollar uchun yozgen yupkalar va rubashkalar qeshge va ayollar", ru: "Летние юбки и блузки для женщин" },
        discount: { uz: "50% chegirma", ru: "50% скидка" },
        price: "20 00UZS",
        originalPrice: "50 000", 
        countries: ["china"],
        productType: "shim",
        productCountry: "China",
        brandCategories: "apple",
        countriesCategories: "xitoy",
        category: "Erkaklar kiyimi",
        weight: 400,
        relatedGroups: [
            { title: { uz: "Pastki kiyimlar", ru: "Нижняя одежда" }, productIds: [455, 5577] },
            { title: { uz: "Oyoq kiyim", ru: "Обувь" }, productIds: [6578, 18757] },
            { title: { uz: "Aksessuarlar", ru: "Аксессуары" }, productIds: [757, 85667, 19578] }
        ],
        video: "video/video-1.mp4",
        description: { uz: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum consequatur officia soluta saepe at ullam labore dolore doloremque dolor perferendis! Dolorum, pariatur? Rerum suscipit eligendi neque at obcaecati eaque ducimus?", ru: "Описание товара." },
        labels: [
            { text: { uz: "Super narx", ru: "Супер цена" }, icon: "<i class='bx bxs-hot'></i>", color: "#13BE4C" },
          ],
        colors: [
            {
                name: "Black",
                colorFilter: "Black",
                mainImage: "img/black-keyim-1.jfif",
                thumbnails: [
                    "img/black-keyim-2.jpg",
                    "img/black-keyim-3.jpg",
                ],
                sizes: ["S", "M", "L", "XL", "XXL"]
            },
        ]
    },

    {
        id: 6578,
        categoryName: "products",
        title: { uz: "ayollar uchun yozgen yupkalar va rubashkalar qeshge va ayollar", ru: "Летние юбки и блузки для женщин" },
        price: "170000",
        countries: ["turkiya"],
        productType: "shippak",
        productCountry: "Turkiya",
        brandCategories: "gucci",
        countriesCategories: "turkiya",
        category: "Erkaklar poyabzali",
        weight: 1000,
        relatedGroups: [
            { title: { uz: "Pastki kiyimlar", ru: "Нижняя одежда" }, productIds: [455, 5577] },
            { title: { uz: "Oyoq kiyim", ru: "Обувь" }, productIds: [6578, 18757] },
            { title: { uz: "Aksessuarlar", ru: "Аксессуары" }, productIds: [757, 85667, 19578] }
        ],
        video: "video/video-1.mp4",
        description: { uz: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum consequatur officia soluta saepe at ullam labore dolore doloremque dolor perferendis! Dolorum, pariatur? Rerum suscipit eligendi neque at obcaecati eaque ducimus?", ru: "Описание товара." },
        colors: [
            {
                name: "White",
                colorFilter: "White",
                mainImage: "img/oqkeyim-1.jpg",
                thumbnails: [
                    "img/oqkeyim-2.jfif",
                    "img/oqkeyim-3.webp",
                ],
                sizes: ["S", "M", "L", "XL", "XXL"]
            },
        ]
    },

    {
        id: 757,
        categoryName: "products",
        title: { uz: "ayollar uchun yozgen yupkalar va rubashkalar qeshge va ayollar", ru: "Летние юбки и блузки для женщин" },
        price: "12000UZS",
        discount: { uz: "70% chegirma", ru: "70% скидка" },
        weight: 1000,
        originalPrice: "$900",
        video: "video/video-1.mp4",
        productType: "qo'lqop",
        productCountry: "USA",
        brandCategories: "huawe",
        countriesCategories: "usa",
        category: "Aksessuarlar",
        description: { uz: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum consequatur officia soluta saepe at ullam labore dolore doloremque dolor perferendis! Dolorum, pariatur? Rerum suscipit eligendi neque at obcaecati eaque ducimus?", ru: "Описание товара." },
        labels: [
            { text: { uz: "Original", ru: "Оригинал" }, icon: "&#10004;", color: "#f30cfb" },
            {
                text: { uz: "Chegirma", ru: "Скидка" },
                icon: `<span class="animated-hourglass"></span>`,
                color: "#ff3333"
              }
        ],
        colors: [
            {
                name: "Grey",
                colorFilter: "Grey",
                mainImage: "img/grey-keyim-1.webp",
                thumbnails: [
                    "img/grey-keyim-2.jpg",
                    "img/grey-keyim-3.jfif",
                ],
                sizes: ["S", "M", "L", "XL", "XXL"]
            },
        ]
    },

    {
        id: 85667,
        categoryName: "products",
        title: { uz: "ayollar uchun yozgen yupkalar va rubashkalar qeshge va ayollar", ru: "Летние юбки и блузки для женщин" },
        price: "$140",
        video: "video/SaveVid.Net_184F7EA2857F4536CE03EA92B582BDAE_video_dashinit.mp4",
        category: "Erkaklar kiyimi",
        countries: ["USA"],
        productType: "qo'lqop",
        productCountry: "USA",
        brandCategories: "amazon",
        countriesCategories: "usa",
        sizeChart: "",
        description: { uz: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum consequatur officia soluta saepe at ullam labore dolore doloremque dolor perferendis! Dolorum, pariatur? Rerum suscipit eligendi neque at obcaecati eaque ducimus?", ru: "Описание товара." },
        labels: [
            {
              text: { uz: "Chegirma -40%", ru: "Скидка -40%" },
              icon: `<span class="animated-hourglass"></span>`,
              color: "#ff3333"
            }
          ],
        colors: [
            {
                name: "",
                colorFilter: "Rangsiz",
                mainImage: "img/grey-keyim-1.webp",
                thumbnails: [
                    "img/grey-keyim-2.jpg",
                    "img/grey-keyim-3.jfif",
                ],
                sizes: ["S", "M", "L", "XL", "XXL"]
            },
        ]
    },

    {
        id: 9675,
        categoryName: "products",
        title: { uz: "ayollar uchun yozgen yupkalar va rubashkalar qeshge va ayollar", ru: "Летние юбки и блузки для женщин" },
        price: "$10",
        video: "video/SaveVid.Net_184F7EA2857F4536CE03EA92B582BDAE_video_dashinit.mp4",
        category: "Aksessuarlar", 
        countries: ["Xitoy"],
        productType: "chexol",
        productCountry: "China",
        brandCategories: "nike",
        countriesCategories: "xitoy",
        description: { uz: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum consequatur officia soluta saepe at ullam labore dolore doloremque dolor perferendis! Dolorum, pariatur? Rerum suscipit eligendi neque at obcaecati eaque ducimus?", ru: "Описание товара." },
        colors: [
            {
                name: "Grey",
                colorFilter: "Grey",
                mainImage: "img/grey-keyim-1.webp",
                thumbnails: [
                    "img/grey-keyim-2.jpg",
                    "img/grey-keyim-3.jfif",
                ],
                models: [
                    { name: "S20", price: "90 000 so'm", originalPrice: "95 000 so'm", discount: { uz: "18% chegirma", ru: "18% скидка" } },
                    { name: "A30", price: "85 000 so'm", originalPrice: "99 000 so'm",discount: { uz: "28% chegirma", ru: "28% скидка" } },
                    { name: "S24 ULTRA", price: "100 000 so'm", originalPrice: "105 000 so'm", discount: { uz: "56% chegirma", ru: "56% скидка" } },
                    { name: "A10", price: "80 000 so'm", originalPrice: "95 000 so'm", discount: { uz: "65% chegirma", ru: "65% скидка" } },
                    { name: "S25 ULTRA", price: "105 000 so'm", originalPrice: "150 000 so'm", discount: { uz: "44% chegirma", ru: "44% скидка" }}
                ]
            }
        ],
        models: [
            { name: "S20", price: "90 000 so'm", originalPrice: "95 000 so'm", discount: { uz: "18% chegirma", ru: "18% скидка" } },
            { name: "A30", price: "85 000 so'm", originalPrice: "99 000 so'm",discount: { uz: "28% chegirma", ru: "28% скидка" } },
            { name: "S24 ULTRA", price: "100 000 so'm", originalPrice: "105 000 so'm", discount: { uz: "56% chegirma", ru: "56% скидка" } },
            { name: "A10", price: "80 000 so'm", originalPrice: "95 000 so'm", discount: { uz: "65% chegirma", ru: "65% скидка" } },
            { name: "S25 ULTRA", price: "105 000 so'm", originalPrice: "150 000 so'm", discount: { uz: "44% chegirma", ru: "44% скидка" }}
        ],
    },
    

    {
        id: 10575,
        categoryName: "products",
        title: { uz: "ayollar uchun yozgen yupkalar va rubashkalar qeshge va ayollar", ru: "Летние юбки и блузки для женщин" },
        price: "$10",
        video: "video/SaveVid.Net_184F7EA2857F4536CE03EA92B582BDAE_video_dashinit.mp4",
        category: "Smart gadjetlar", 
        countries: ["Xitoy"],
        productType: "soat",
        productCountry: "China",
        brandCategories: "adidas",
        countriesCategories: "xitoy",
        description: { uz: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum consequatur officia soluta saepe at ullam labore dolore doloremque dolor perferendis! Dolorum, pariatur? Rerum suscipit eligendi neque at obcaecati eaque ducimus?", ru: "Описание товара." },
        colors: [
            {
                name: "Grey",
                colorFilter: "Grey",
                mainImage: "img/grey-keyim-1.webp",
                thumbnails: [
                    "img/grey-keyim-2.jpg",
                    "img/grey-keyim-3.jfif",
                ],
                storage: [
                    { size: "12/256", price: "1 500 000 so'm",originalPrice: "20 000 so'm", discount: { uz: "18% chegirma", ru: "18% скидка" }  },
                    { size: "12/512", price: "1 700 000 so'm", originalPrice: "19 000 so'm", discount: { uz: "16% chegirma", ru: "16% скидка" }  }
                ]
            },
        ]
    },

    {
        id: 15651,
        categoryName: "products",
        discount: { uz: "30% chegirma", ru: "30% скидка" },
        title: { uz: "ayollar uchun yozgen yupkalar va rubashkalar qeshge va ayollar", ru: "Летние юбки и блузки для женщин" },
        price: "27000UZS",
        video: "video/video-2.mp4",
        category: "Smart gadjetlar",
        countries: ["Korea"],
        productType: "telifon",
        productCountry: "Korea",
        brandCategories: "zara",
        countriesCategories: "koreya",
        description: { uz: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum consequatur officia soluta saepe at ullam labore dolore doloremque dolor perferendis! Dolorum, pariatur? Rerum suscipit eligendi neque at obcaecati eaque ducimus?", ru: "Описание товара." },
        colors: [
            {
                name: "Green",
                colorFilter: "Green",
                mainImage: "img/yashilkeyim-1.jfif",
                thumbnails: [
                    "img/yashilkeyim-2.jfif",
                    "img/yashilkeyim-3.jfif",
                ],
                storage: [
                    { size: "12/256", price: "1 500 000 so'm", originalPrice: "105 000 so'm", discount: { uz: "3550% chegirma", ru: "3550% скидка" }, },
                    { size: "12/512", price: "1 700 000 so'm", originalPrice: "105 000 so'm", discount: { uz: "220% chegirma", ru: "220% скидка" },  }
                ]
            },
            {
                name: "Yellow",
                colorFilter: "Yellow",
                mainImage: "img/sariqkeyim-1.webp",
                thumbnails: [
                    "img/sariqkeyim-2.jfif",
                    "img/sariqkeyim-3.jfif",
                ],
                storage: [
                    { size: "12/256", price: "1 550 000 so'm" },
                    { size: "12/512", price: "1 750 000 so'm" }
                ]
            },
            {
                name: "Red",
                colorFilter: "Red",
                mainImage: "img/qizililkeyim-1.jfif",
                thumbnails: [
                    "img/qizililkeyim-2.jfif",
                    "img/qizililkeyim-3.jfif",
                ],
                storage: [
                    { size: "12/256", price: "1 600 000 so'm" },
                    { size: "12/512", price: "1 800 000 so'm" }
                ]
            },
            {
                name: "White",
                colorFilter: "White",
                mainImage: "img/oqkeyim-1.jpg",
                thumbnails: [
                    "img/oqkeyim-2.jfif",
                    "img/oqkeyim-3.webp",
                ],
                storage: [
                    { size: "12/256", price: "1 450 000 so'm" },
                    { size: "12/512", price: "1 650 000 so'm" }
                ]
            },
            {
                name: "Maroon",
                colorFilter: "Maroon",
                mainImage: "img/Maroon-keyim-1.jpg",
                thumbnails: [
                    "img/Maroon-keyim-2.jpg",
                    "img/Maroon-keyim-3.jpg",
                ],
                storage: [
                    { size: "12/256", price: "1 600 000 so'm" },
                    { size: "12/512", price: "1 850 000 so'm" }
                ]
            }
        ]
    },

    {
        id: 157672,
        categoryName: "products",
        title: { uz: "ayollar uchun yozgen yupkalar va rubashkalar qeshge va ayollar", ru: "Летние юбки и блузки для женщин" },
        price: "120 000UZS",
        countries: ["uzb"],
        productType: "rubashka",
        productCountry: "Uzbekistan",
        brandCategories: "apple",
        countriesCategories: "yevropa",
        category: "Erkaklar kiyimi",
        deliveryInfo: {
            title: { uz: "Mahsulot O'zbekiston omboreda", ru: "Товар на складе в Узбекистане" },
            text: { uz: "Mahsulot O'zbekiston bo'ylab 1 kundan 3 kungacha yetkazib beriladi mahsulot uchun qo'shimcha cargo narxlari yo'q.", ru: "Доставка по Узбекистану от 1 до 3 дней. Дополнительная плата за груз не взимается." }
        },
        video: "video/video-1.mp4",
        description: { uz: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum consequatur officia soluta saepe at ullam labore dolore doloremque dolor perferendis! Dolorum, pariatur?", ru: "Описание товара." },
        labels: [
            { text: { uz: "Original", ru: "Оригинал" }, icon: "&#10004;", color: "#f30cfb" },
            { text: { uz: "Super narx", ru: "Супер цена" }, icon: "<i class='bx bxs-hot'></i>", color: "#13BE4C" },
            {
                text: { uz: "Chegirma 70%", ru: "Скидка 70%" },
                icon: `<span class="animated-hourglass"></span>`,
                color: "#ff9800"
              }
        ],
        colors: [
            {
                name: "Grey",
                colorFilter: "Grey",
                price: "190 000UZS",
                mainImage: "img/grey-keyim-1.webp",
                discount: { uz: "70% chegirma", ru: "70% скидка" },
                originalPrice: "900 000",
                thumbnails: [
                    "img/grey-keyim-2.jpg",
                    "img/grey-keyim-3.jfif",
                ],
                sizes: ["S", "M", "L", "XL", "XXL"]
            },
        ]
    },

    {
        id: 13577,
        categoryName: "products",
        title: { uz: "ayollar uchun yozgen yupkalar va rubashkalar qeshge va ayollar", ru: "Летние юбки и блузки для женщин" },
        price: "150 000UZS",
        countries: ["uzb"],
        productType: "yupka",
        productCountry: "Uzbekistan",
        brandCategories: "puma",
        countriesCategories: "yevropa",
        category: "Ayollar kiyimi",
        deliveryInfo: {
            title: { uz: "Mahsulot O'zbekiston omboreda", ru: "Товар на складе в Узбекистане" },
            text: { uz: "Mahsulot O'zbekiston bo'ylab 1 kundan 3 kungacha yetkazib beriladi mahsulot uchun qo'shimcha cargo narxlari yo'q.", ru: "Доставка по Узбекистану от 1 до 3 дней. Дополнительная плата за груз не взимается." }
        },
        video: "video/video-1.mp4",
        description: { uz: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum consequatur officia soluta saepe at ullam labore dolore doloremque dolor perferendis! Dolorum, pariatur?", ru: "Описание товара." },
        labels: [
            { text: { uz: "Original", ru: "Оригинал" }, icon: "&#10004;", color: "#f30cfb" },
            { text: { uz: "Super narx", ru: "Супер цена" }, icon: "<i class='bx bxs-hot'></i>", color: "#13BE4C" },
          ],
        colors: [
            {
                name: "Black",
                colorFilter: "Black",
                price: "150 000UZS",
                mainImage: "img/ayollaryupkasi-qora.jpg",
                discount: { uz: "70% chegirma", ru: "70% скидка" },
                originalPrice: "900 000",
                thumbnails: [
                    "img/ayollaryupkasi-oqish.jpg",
                    "img/ayollaryupkasi-qizl.jpg",
                    "img/ayollaryupkasi-oq.jpg",
                ],
                sizes: ["S", "M", "L", "XL", "XXL", "XXXL"]
            },
        ]
    },

    {
        id: 145768,
        categoryName: "products",
        title: { uz: "ayollar uchun yozgen yupkalar va rubashkalar qeshge va ayollar", ru: "Летние юбки и блузки для женщин" },
        price: "5000 000UZS",
        countries: ["uzb"],
        productType: "xudi",
        productCountry: "Uzbekistan",
        brandCategories: "gucci",
        countriesCategories: "yevropa",
        category: "Erkaklar kiyimi",
        deliveryInfo: {
            title: { uz: "Mahsulot O'zbekiston omboreda", ru: "Товар на складе в Узбекистане" },
            text: { uz: "Mahsulot O'zbekiston bo'ylab 1 kundan 3 kungacha yetkazib beriladi mahsulot uchun qo'shimcha cargo narxlari yo'q.", ru: "Доставка по Узбекистану от 1 до 3 дней. Дополнительная плата за груз не взимается." }
        },
        video: "video/video-1.mp4",
        description: { uz: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum consequatur officia soluta saepe at ullam labore dolore doloremque dolor perferendis! Dolorum, pariatur?", ru: "Описание товара." },
        labels: [
            {
                text: { uz: "Chegirma 70%", ru: "Скидка 70%" },
                icon: `<span class="animated-hourglass"></span>`,
                color: "#ff9800"
              },
            { text: { uz: "Super narx", ru: "Супер цена" }, icon: "<i class='bx bxs-hot'></i>", color: "#13BE4C" },
          ],
        colors: [
            {
                name: "Black",
                colorFilter: "Black",
                price: "200 000UZS",
                mainImage: "img/erkaklaruchun-xudi-tiyomni.jpg",
                discount: { uz: "70% chegirma", ru: "70% скидка" },
                originalPrice: "900 000",
                thumbnails: [
                    "img/erkaklaruchun-xudi-qora.jpg",
                    "img/erkaklaruchun-xudi-oq.jpg",
                ],
                sizes: ["S", "M", "L", "XL", "XXL", "XXXL"]
            },
        ]
    },

    {
        id: 15675,
        categoryName: "products",
        discount: { uz: "90% chegirma", ru: "90% скидка" },
        title: { uz: "S 24 Ultra telifoni ", ru: "Летние юбки и блузки для женщин" },
        price: "127000UZS",
        video: "video/video-2.mp4",
        category: "Smart gadjetlar",
        countries: ["Korea"],
        productType: "telifon",
        productCountry: "Korea",
        brandCategories: "huawe",
        countriesCategories: "koreya",
        description: { uz: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum consequatur officia soluta saepe at ullam labore dolore doloremque dolor perferendis! Dolorum, pariatur? Rerum suscipit eligendi neque at obcaecati eaque ducimus?", ru: "Описание товара." },
        colors: [
            {
                name: "Green",
                colorFilter: "Green",
                mainImage: "img/yashilkeyim-1.jfif",
                thumbnails: [
                    "img/yashilkeyim-2.jfif",
                    "img/yashilkeyim-3.jfif",
                ],
                models: [
                    { name: "S20", price: "90 000 so'm", originalPrice: "95 000 so'm", discount: { uz: "18% chegirma", ru: "18% скидка" } },
                    { name: "A30", price: "85 000 so'm", originalPrice: "99 000 so'm",discount: { uz: "28% chegirma", ru: "28% скидка" } },
                    { name: "S24 ULTRA", price: "100 000 so'm", originalPrice: "105 000 so'm", discount: { uz: "56% chegirma", ru: "56% скидка" } },
                    { name: "A10", price: "80 000 so'm", originalPrice: "95 000 so'm", discount: { uz: "65% chegirma", ru: "65% скидка" } },
                    { name: "S25 ULTRA", price: "105 000 so'm", originalPrice: "150 000 so'm", discount: { uz: "44% chegirma", ru: "44% скидка" }}
                ]
            },
            {
                name: "Yellow",
                colorFilter: "Yellow",
                mainImage: "img/sariqkeyim-1.webp",
                thumbnails: [
                    "img/sariqkeyim-2.jfif",
                    "img/sariqkeyim-3.jfif",
                ],
                models: [
                    { name: "S20", price: "90 000 so'm", originalPrice: "95 000 so'm", discount: { uz: "18% chegirma", ru: "18% скидка" } },
                    { name: "A30", price: "85 000 so'm", originalPrice: "99 000 so'm",discount: { uz: "28% chegirma", ru: "28% скидка" } },
                    { name: "S24 ULTRA", price: "100 000 so'm", originalPrice: "105 000 so'm", discount: { uz: "56% chegirma", ru: "56% скидка" } },
                    { name: "A10", price: "80 000 so'm", originalPrice: "95 000 so'm", discount: { uz: "65% chegirma", ru: "65% скидка" } },
                    { name: "S25 ULTRA", price: "105 000 so'm", originalPrice: "150 000 so'm", discount: { uz: "44% chegirma", ru: "44% скидка" }}
                ]
            },
            {
                name: "Red",
                colorFilter: "Red",
                mainImage: "img/qizililkeyim-1.jfif",
                thumbnails: [
                    "img/qizililkeyim-2.jfif",
                    "img/qizililkeyim-3.jfif",
                ],
                models: [
                    { name: "S20", price: "90 000 so'm", originalPrice: "95 000 so'm", discount: { uz: "18% chegirma", ru: "18% скидка" } },
                    { name: "A30", price: "85 000 so'm", originalPrice: "99 000 so'm",discount: { uz: "28% chegirma", ru: "28% скидка" } },
                    { name: "S24 ULTRA", price: "100 000 so'm", originalPrice: "105 000 so'm", discount: { uz: "56% chegirma", ru: "56% скидка" } },
                    { name: "A10", price: "80 000 so'm", originalPrice: "95 000 so'm", discount: { uz: "65% chegirma", ru: "65% скидка" } },
                    { name: "S25 ULTRA", price: "105 000 so'm", originalPrice: "150 000 so'm", discount: { uz: "44% chegirma", ru: "44% скидка" }}
                ]
            },
            {
                name: "White",
                colorFilter: "White",
                mainImage: "img/oqkeyim-1.jpg",
                thumbnails: [
                    "img/oqkeyim-2.jfif",
                    "img/oqkeyim-3.webp",
                ],
                models: [
                    { name: "S20", price: "90 000 so'm", originalPrice: "95 000 so'm", discount: { uz: "18% chegirma", ru: "18% скидка" } },
                    { name: "A30", price: "85 000 so'm", originalPrice: "99 000 so'm",discount: { uz: "28% chegirma", ru: "28% скидка" } },
                    { name: "S24 ULTRA", price: "100 000 so'm", originalPrice: "105 000 so'm", discount: { uz: "56% chegirma", ru: "56% скидка" } },
                    { name: "A10", price: "80 000 so'm", originalPrice: "95 000 so'm", discount: { uz: "65% chegirma", ru: "65% скидка" } },
                    { name: "S25 ULTRA", price: "105 000 so'm", originalPrice: "150 000 so'm", discount: { uz: "44% chegirma", ru: "44% скидка" }}
                ]
            },
            {
                name: "Maroon",
                colorFilter: "Maroon",
                mainImage: "img/Maroon-keyim-1.jpg",
                thumbnails: [
                    "img/Maroon-keyim-2.jpg",
                    "img/Maroon-keyim-3.jpg",
                ],
                models: [
                    { name: "S20", price: "90 000 so'm", originalPrice: "95 000 so'm", discount: { uz: "18% chegirma", ru: "18% скидка" } },
                    { name: "A30", price: "85 000 so'm", originalPrice: "99 000 so'm",discount: { uz: "28% chegirma", ru: "28% скидка" } },
                    { name: "S24 ULTRA", price: "100 000 so'm", originalPrice: "105 000 so'm", discount: { uz: "56% chegirma", ru: "56% скидка" } },
                    { name: "A10", price: "80 000 so'm", originalPrice: "95 000 so'm", discount: { uz: "65% chegirma", ru: "65% скидка" } },
                    { name: "S25 ULTRA", price: "105 000 so'm", originalPrice: "150 000 so'm", discount: { uz: "44% chegirma", ru: "44% скидка" }}
                ]
            }
        ]
    },

    {
        id: 1678,
        categoryName: "products",
        discount: { uz: "10% chegirma", ru: "10% скидка" },
        title: { uz: "S 24 Ultra ", ru: "Летние юбки и блузки для женщин" },
        price: "70000UZS",
        video: "video/video-2.mp4",
        category: "Smart gadjetlar",
        countries: ["Korea"],
        productType: "telifon",
        productCountry: "Korea",
        brandCategories: "amazon",
        countriesCategories: "koreya",
        description: { uz: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum consequatur officia soluta saepe at ullam labore dolore doloremque dolor perferendis! Dolorum, pariatur? Rerum suscipit eligendi neque at obcaecati eaque ducimus?", ru: "Описание товара." },
        colors: [
            {
                name: "Green",
                colorFilter: "Green",
                mainImage: "img/yashilkeyim-1.jfif",
                thumbnails: [
                    "img/yashilkeyim-2.jfif",
                    "img/yashilkeyim-3.jfif",
                ],
                models: [
                    { name: "S20", price: "90 000 so'm", originalPrice: "95 000 so'm", discount: { uz: "18% chegirma", ru: "18% скидка" } },
                    { name: "A30", price: "85 000 so'm", originalPrice: "99 000 so'm",discount: { uz: "28% chegirma", ru: "28% скидка" } },
                    { name: "S24 ULTRA", price: "100 000 so'm", originalPrice: "105 000 so'm", discount: { uz: "56% chegirma", ru: "56% скидка" } },
                    { name: "A10", price: "80 000 so'm", originalPrice: "95 000 so'm", discount: { uz: "65% chegirma", ru: "65% скидка" } },
                    { name: "S25 ULTRA", price: "105 000 so'm", originalPrice: "150 000 so'm", discount: { uz: "44% chegirma", ru: "44% скидка" }}
                ]
            },
            {
                name: "Yellow",
                colorFilter: "Yellow",
                mainImage: "img/sariqkeyim-1.webp",
                thumbnails: [
                    "img/sariqkeyim-2.jfif",
                    "img/sariqkeyim-3.jfif",
                ],
                models: [
                    { name: "S20", price: "90 000 so'm", originalPrice: "95 000 so'm", discount: { uz: "18% chegirma", ru: "18% скидка" } },
                    { name: "A30", price: "85 000 so'm", originalPrice: "99 000 so'm",discount: { uz: "28% chegirma", ru: "28% скидка" } },
                    { name: "S24 ULTRA", price: "100 000 so'm", originalPrice: "105 000 so'm", discount: { uz: "56% chegirma", ru: "56% скидка" } },
                    { name: "A10", price: "80 000 so'm", originalPrice: "95 000 so'm", discount: { uz: "65% chegirma", ru: "65% скидка" } },
                    { name: "S25 ULTRA", price: "105 000 so'm", originalPrice: "150 000 so'm", discount: { uz: "44% chegirma", ru: "44% скидка" }}
                ]
            },
            {
                name: "Red",
                colorFilter: "Red",
                mainImage: "img/qizililkeyim-1.jfif",
                thumbnails: [
                    "img/qizililkeyim-2.jfif",
                    "img/qizililkeyim-3.jfif",
                ],
                models: [
                    { name: "S20", price: "90 000 so'm", originalPrice: "95 000 so'm", discount: { uz: "18% chegirma", ru: "18% скидка" } },
                    { name: "A30", price: "85 000 so'm", originalPrice: "99 000 so'm",discount: { uz: "28% chegirma", ru: "28% скидка" } },
                    { name: "S24 ULTRA", price: "100 000 so'm", originalPrice: "105 000 so'm", discount: { uz: "56% chegirma", ru: "56% скидка" } },
                    { name: "A10", price: "80 000 so'm", originalPrice: "95 000 so'm", discount: { uz: "65% chegirma", ru: "65% скидка" } },
                    { name: "S25 ULTRA", price: "105 000 so'm", originalPrice: "150 000 so'm", discount: { uz: "44% chegirma", ru: "44% скидка" }}
                ]
            },
            {
                name: "White",
                colorFilter: "White",
                mainImage: "img/oqkeyim-1.jpg",
                thumbnails: [
                    "img/oqkeyim-2.jfif",
                    "img/oqkeyim-3.webp",
                ],
                models: [
                    { name: "S20", price: "90 000 so'm", originalPrice: "95 000 so'm", discount: { uz: "18% chegirma", ru: "18% скидка" } },
                    { name: "A30", price: "85 000 so'm", originalPrice: "99 000 so'm",discount: { uz: "28% chegirma", ru: "28% скидка" } },
                    { name: "S24 ULTRA", price: "100 000 so'm", originalPrice: "105 000 so'm", discount: { uz: "56% chegirma", ru: "56% скидка" } },
                    { name: "A10", price: "80 000 so'm", originalPrice: "95 000 so'm", discount: { uz: "65% chegirma", ru: "65% скидка" } },
                    { name: "S25 ULTRA", price: "105 000 so'm", originalPrice: "150 000 so'm", discount: { uz: "44% chegirma", ru: "44% скидка" }}
                ]
            },
            {
                name: "Maroon",
                colorFilter: "Maroon",
                mainImage: "img/Maroon-keyim-1.jpg",
                thumbnails: [
                    "img/Maroon-keyim-2.jpg",
                    "img/Maroon-keyim-3.jpg",
                ],
                models: [
                    { name: "S20", price: "90 000 so'm", originalPrice: "95 000 so'm", discount: { uz: "18% chegirma", ru: "18% скидка" } },
                    { name: "A30", price: "85 000 so'm", originalPrice: "99 000 so'm",discount: { uz: "28% chegirma", ru: "28% скидка" } },
                    { name: "S24 ULTRA", price: "100 000 so'm", originalPrice: "105 000 so'm", discount: { uz: "56% chegirma", ru: "56% скидка" } },
                    { name: "A10", price: "80 000 so'm", originalPrice: "95 000 so'm", discount: { uz: "65% chegirma", ru: "65% скидка" } },
                    { name: "S25 ULTRA", price: "105 000 so'm", originalPrice: "150 000 so'm", discount: { uz: "44% chegirma", ru: "44% скидка" }}
                ]
            }
        ]
    },

    {
        id: 15767,
        categoryName: "products",
        title: { uz: "ayollar uchun yozgen yupkalar va rubashkalar qeshge va ayollar", ru: "Летние юбки и блузки для женщин" },
        price: "150 000UZS",
        countries: ["uzb"],
        productType: "yupka",
        productCountry: "Uzbekistan",
        brandCategories: "nike",
        countriesCategories: "yevropa",
        category: "Ayollar kiyimi",
        deliveryInfo: {
            title: { uz: "Mahsulot O'zbekiston omboreda", ru: "Товар на складе в Узбекистане" },
            text: { uz: "Mahsulot O'zbekiston bo'ylab 1 kundan 3 kungacha yetkazib beriladi mahsulot uchun qo'shimcha cargo narxlari yo'q.", ru: "Доставка по Узбекистану от 1 до 3 дней. Дополнительная плата за груз не взимается." }
        },
        description: { uz: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum consequatur officia soluta saepe at ullam labore dolore doloremque dolor perferendis! Dolorum, pariatur?", ru: "Описание товара." },
        labels: [
            { text: { uz: "Original", ru: "Оригинал" }, icon: "<i class='bx bxs-check-circle'></i>", color: "#f30cfb" },
            { text: { uz: "Super narx", ru: "Супер цена" }, icon: "<i class='bx bxs-hot'></i>", color: "#13BE4C" },
          ],
        colors: [
            {
                name: "Black",
                colorFilter: "Black",
                price: "150 000UZS",
                mainImage: "img/ayollaryupkasi-qora.jpg",
                discount: { uz: "70% chegirma", ru: "70% скидка" },
                originalPrice: "900 000",
                thumbnails: [
                    "img/ayollaryupkasi-oqish.jpg",
                    "img/ayollaryupkasi-qizl.jpg",
                    "img/ayollaryupkasi-oq.jpg",
                ],
                sizes: ["S", "M", "L", "XL", "XXL", "XXXL"]
            },
        ]
    },

    {
        id: 18757,
        categoryName: "products",
        title: { uz: "ayollar uchun yozgen yupkalar va rubashkalar qeshge va ayollar", ru: "Летние юбки и блузки для женщин" },
        discount: { uz: "20% chegirma", ru: "20% скидка" },
        price: "140 000UZS",
        originalPrice: "150 000", 
        video: "video/video-1.mp4",
        countries: ["china"],
        productType: "krossovka",
        productCountry: "China",
        brandCategories: "adidas",
        countriesCategories: "xitoy",
        category: "Erkaklar poyabzali",
        weight: 600,
        relatedGroups: [
            { title: { uz: "Pastki kiyimlar", ru: "Нижняя одежда" }, productIds: [455, 5577] },
            { title: { uz: "Oyoq kiyim", ru: "Обувь" }, productIds: [6578, 18757] },
            { title: { uz: "Aksessuarlar", ru: "Аксессуары" }, productIds: [757, 85667, 19578] }
        ],
        description: { uz: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum consequatur officia soluta saepe at ullam labore dolore doloremque dolor perferendis! Dolorum, pariatur? Rerum suscipit eligendi neque at obcaecati eaque ducimus?", ru: "Описание товара." },
        colors: [
            {
                name: "Grey",
                colorFilter: "Grey",
                mainImage: "img/grey-keyim-1.webp",
                thumbnails: [
                    "img/grey-keyim-2.jpg",
                    "img/grey-keyim-3.jfif",
                ],
                sizes: ["S", "M", "L", "XL", "XXL"]
            },
        ]
    },

    {
        id: 19578,
        categoryName: "products",
        title: { uz: "ayollar uchun yozgen yupkalar va rubashkalar qeshge va ayollar", ru: "Летние юбки и блузки для женщин" },
        discount: { uz: "20% chegirma", ru: "20% скидка" },
        price: "140 000UZS",
        originalPrice: "150 000", 
        video: "video/video-1.mp4",
        countries: ["china"],
        productType: "kepka",
        productCountry: "China",
        brandCategories: "zara",
        countriesCategories: "xitoy",
        category: "Aksessuarlar",
        weight: 600,
        relatedGroups: [
            { title: { uz: "Pastki kiyimlar", ru: "Нижняя одежда" }, productIds: [455, 5577] },
            { title: { uz: "Oyoq kiyim", ru: "Обувь" }, productIds: [6578, 18757] },
            { title: { uz: "Aksessuarlar", ru: "Аксессуары" }, productIds: [757, 85667, 19578] }
        ],
        description: { uz: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum consequatur officia soluta saepe at ullam labore dolore doloremque dolor perferendis! Dolorum, pariatur? Rerum suscipit eligendi neque at obcaecati eaque ducimus?", ru: "Описание товара." },
        colors: [
            {
                name: "Grey",
                colorFilter: "Grey",
                mainImage: "img/grey-keyim-1.webp",
                thumbnails: [
                    "img/grey-keyim-2.jpg",
                    "img/grey-keyim-3.jfif",
                ],
                sizes: ["S", "M", "L", "XL", "XXL"]
            },
        ]
    },

    {
        id: 20875,
        categoryName: "products",
        title: { uz: "ayollar uchun yozgen yupkalar va rubashkalar qeshge va ayollar", ru: "Летние юбки и блузки для женщин" },
        price: "150 000UZS",
        countries: ["uzb"],
        productType: "yupka",
        productCountry: "Uzbekistan",
        brandCategories: "apple",
        countriesCategories: "yevropa",
        category: "Ayollar kiyimi",
        deliveryInfo: {
            title: { uz: "Mahsulot O'zbekiston omboreda", ru: "Товар на складе в Узбекистане" },
            text: { uz: "Mahsulot O'zbekiston bo'ylab 1 kundan 3 kungacha yetkazib beriladi mahsulot uchun qo'shimcha cargo narxlari yo'q.", ru: "Доставка по Узбекистану от 1 до 3 дней. Дополнительная плата за груз не взимается." }
        },
        description: { uz: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum consequatur officia soluta saepe at ullam labore dolore doloremque dolor perferendis! Dolorum, pariatur?", ru: "Описание товара." },
        labels: [
            { text: { uz: "Original", ru: "Оригинал" }, icon: "<i class='bx bxs-check-circle'></i>", color: "#f30cfb" },
            { text: { uz: "Super narx", ru: "Супер цена" }, icon: "<i class='bx bxs-hot'></i>", color: "#13BE4C" },
          ],
        colors: [
            {
                name: "Black",
                colorFilter: "Black",
                price: "150 000UZS",
                mainImage: "img/ayollaryupkasi-qora.jpg",
                discount: { uz: "70% chegirma", ru: "70% скидка" },
                originalPrice: "900 000",
                thumbnails: [
                    "img/ayollaryupkasi-oqish.jpg",
                    "img/ayollaryupkasi-qizl.jpg",
                    "img/ayollaryupkasi-oq.jpg",
                ],
                sizes: ["S", "M", "L", "XL", "XXL", "XXXL"]
            },
        ]
    },

    {
        id: 21676,
        categoryName: "products",
        title: { uz: "ayollar uchun yozgen yupkalar va rubashkalar qeshge va ayollar", ru: "Летние юбки и блузки для женщин" },
        price: "150 000UZS",
        countries: ["uzb"],
        productType: "yupka",
        productCountry: "Uzbekistan",
        brandCategories: "puma",
        countriesCategories: "yevropa",
        category: "Ayollar kiyimi",
        deliveryInfo: {
            title: { uz: "Mahsulot O'zbekiston omboreda", ru: "Товар на складе в Узбекистане" },
            text: { uz: "Mahsulot O'zbekiston bo'ylab 1 kundan 3 kungacha yetkazib beriladi mahsulot uchun qo'shimcha cargo narxlari yo'q.", ru: "Доставка по Узбекистану от 1 до 3 дней. Дополнительная плата за груз не взимается." }
        },
        description: { uz: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum consequatur officia soluta saepe at ullam labore dolore doloremque dolor perferendis! Dolorum, pariatur?", ru: "Описание товара." },
        labels: [
            { text: { uz: "Original", ru: "Оригинал" }, icon: "<i class='bx bxs-check-circle'></i>", color: "#f30cfb" },
            { text: { uz: "Super narx", ru: "Супер цена" }, icon: "<i class='bx bxs-hot'></i>", color: "#13BE4C" },
          ],
        colors: [
            {
                name: "Black",
                colorFilter: "Black",
                price: "150 000UZS",
                mainImage: "img/ayollaryupkasi-qora.jpg",
                discount: { uz: "70% chegirma", ru: "70% скидка" },
                originalPrice: "900 000",
                thumbnails: [
                    "img/ayollaryupkasi-oqish.jpg",
                    "img/ayollaryupkasi-qizl.jpg",
                    "img/ayollaryupkasi-oq.jpg",
                ],
                sizes: ["S", "M", "L", "XL", "XXL", "XXXL"]
            },
        ]
    },

    {
        id: 22678,
        categoryName: "products",
        title: { uz: "ayollar uchun yozgen yupkalar va rubashkalar qeshge va ayollar", ru: "Летние юбки и блузки для женщин" },
        price: "5000 000UZS",
        productType: "xudi",
        productCountry: "USA",
        brandCategories: "gucci",
        countriesCategories: "usa",
        category: "Erkaklar kiyimi",
        video: "video/video-1.mp4",
        description: { uz: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum consequatur officia soluta saepe at ullam labore dolore doloremque dolor perferendis! Dolorum, pariatur?", ru: "Описание товара." },
        labels: [
            {
                text: { uz: "Chegirma 70%", ru: "Скидка 70%" },
                icon: `<span class="animated-hourglass"></span>`,
                color: "#ff9800"
              },
            { text: { uz: "Super narx", ru: "Супер цена" }, icon: "<i class='bx bxs-hot'></i>", color: "#13BE4C" },
          ],
        colors: [
            {
                name: "Black",
                colorFilter: "Black",
                price: "200 000UZS",
                mainImage: "img/erkaklaruchun-xudi-tiyomni.jpg",
                discount: { uz: "70% chegirma", ru: "70% скидка" },
                originalPrice: "900 000",
                thumbnails: [
                    "img/erkaklaruchun-xudi-qora.jpg",
                    "img/erkaklaruchun-xudi-oq.jpg",
                ],
                sizes: ["S", "M", "L", "XL", "XXL", "XXXL"]
            },
        ]
    },

    {
        id: 23685,
        categoryName: "products",
        title: { uz: "ayollar uchun yozgen yupkalar va rubashkalar qeshge va ayollar", ru: "Летние юбки и блузки для женщин" },
        price: "5000 000UZS",
        productType: "makasino",
        productCountry: "USA",
        brandCategories: "huawe",
        countriesCategories: "usa",
        category: "Erkaklar kiyimi",
        video: "video/video-1.mp4",
        description: { uz: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum consequatur officia soluta saepe at ullam labore dolore doloremque dolor perferendis! Dolorum, pariatur?", ru: "Описание товара." },
        labels: [
            {
                text: { uz: "Chegirma 70%", ru: "Скидка 70%" },
                icon: `<span class="animated-hourglass"></span>`,
                color: "#ff3333"
              },
            { text: { uz: "Super narx", ru: "Супер цена" }, icon: "<i class='bx bxs-hot'></i>", color: "#13BE4C" },
          ],
        colors: [
            {
                name: "Black",
                colorFilter: "Black",
                price: "200 000UZS",
                mainImage: "img/product1.jpg",
                discount: { uz: "70% chegirma", ru: "70% скидка" },
                originalPrice: "900 000",
                thumbnails: [
                    "img/product2.jpg",
                    "img/product3.jpg",
                    "img/product4.jpg",
                    "img/product5.jpg",
                ],
                sizes: ["S", "M", "L", "XL", "XXL", "XXXL"]
            },
        ]
    },

    {
        id: 23686,
        categoryName: "products",
        title: { uz: "ayollar uchun yozgen yupkalar va rubashkalar qeshge va ayollar", ru: "Летние юбки и блузки для женщин" },
        price: "60 000UZS",
        productType: "makasino",
        productCountry: "USA",
        brandCategories: "amazon",
        countriesCategories: "usa",
        category: "Erkaklar kiyimi",
        video: "video/video-1.mp4",
        description: { uz: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum consequatur officia soluta saepe at ullam labore dolore doloremque dolor perferendis! Dolorum, pariatur?", ru: "Описание товара." },
        labels: [
            {
                text: { uz: "Chegirma 70%", ru: "Скидка 70%" },
                icon: `<span class="animated-hourglass"></span>`,
                color: "#ff3333"
              },
            { text: { uz: "Super narx", ru: "Супер цена" }, icon: "<i class='bx bxs-hot'></i>", color: "#13BE4C" },
          ],
        colors: [
            {
                name: "Black",
                colorFilter: "Black",
                price: "600 000UZS",
                mainImage: "img/product1.jpg",
                discount: { uz: "70% chegirma", ru: "70% скидка" },
                originalPrice: "900 000",
                thumbnails: [
                    "img/product2.jpg",
                    "img/product3.jpg",
                    "img/product4.jpg",
                    "img/product5.jpg",
                    "img/product2.jpg",
                    "img/product3.jpg",
                    "img/product4.jpg",
                    "img/product5.jpg",
                    "img/product2.jpg",
                    "img/product3.jpg",
                    "img/product4.jpg",
                    "img/product5.jpg",
                ],
                sizes: ["S", "M", "L", "XL", "XXL", "XXXL"]
            },
        ]
    },

];

/** Barcha bo'limlar ro'yxati – yangi bo'lim qo'shsangiz import qilib shu massivga qo'shing, allProducts avtomatik yangilanadi */
const allProductCollections = [
  products,
  newCollection,
  womensCollection,
  mensCollection,
  trendingItems,
  engArzonlare,
  electronicsCollection,
  booksCollection,
  stationeryCollection,
  beautyCareCollection,
  accessoriesCollection,
  giftsToysCollection,
  vitaminsHealthCollection,
  activeLifestyleCollection,
  travelGearCollection,
  householdAppliancesCollection,
  allKindsProductsCollection,
  bigDiscountCollection,
];

/** Barcha bo'limlar mahsulotlari birlashmasi – navbar kategoriya, davlat, brend, banner va qidiruvda ishlatiladi */
export const allProducts = allProductCollections.flat();

export { newCollection, womensCollection, mensCollection, engArzonlare, trendingItems, electronicsCollection, booksCollection, stationeryCollection, beautyCareCollection, accessoriesCollection, giftsToysCollection, vitaminsHealthCollection, activeLifestyleCollection, travelGearCollection, householdAppliancesCollection, allKindsProductsCollection, bigDiscountCollection };
