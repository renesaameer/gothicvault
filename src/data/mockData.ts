import type { Product } from "@/types/database";

export interface Testimonial {
  id: string;
  name: string;
  review: string;
  rating: number;
  image?: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Royal Quilted Tote Bag",
    slug: "royal-quilted-tote-bag",
    price: 4500,
    sale_price: 3800,
    images: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&h=400&fit=crop",
    ],
    category_id: null,
    brand_id: null,
    short_description: "Elegant quilted tote with gold-tone hardware and premium leather finish.",
    description: "Our Royal Quilted Tote is crafted from premium faux leather with meticulous quilted stitching. Featuring gold-tone chain accents, a spacious interior with zip pocket, and magnetic snap closure.",
    rating: 4.9,
    review_count: 87,
    stock: 25,
    sku: "SS-TT-001",
    featured: true,
    best_seller: true,
    variants: [{ type: "Color", options: ["Black", "Cream", "Burgundy"] }],
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Elegance Chain Crossbody",
    slug: "elegance-chain-crossbody",
    price: 3200,
    sale_price: null,
    images: [
      "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400&h=400&fit=crop",
    ],
    category_id: null,
    brand_id: null,
    short_description: "Chic crossbody with detachable gold chain strap.",
    description: "A statement piece for every occasion. The Elegance Chain Crossbody features a sleek silhouette with a detachable gold chain strap.",
    rating: 4.7,
    review_count: 64,
    stock: 30,
    sku: "SS-CB-002",
    featured: true,
    best_seller: false,
    variants: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Luxe Evening Clutch",
    slug: "luxe-evening-clutch",
    price: 2800,
    sale_price: null,
    images: [
      "https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=400&h=400&fit=crop",
    ],
    category_id: null,
    brand_id: null,
    short_description: "Sparkling evening clutch perfect for special occasions.",
    description: "Make a grand entrance with our Luxe Evening Clutch. Adorned with subtle metallic accents and a satin-lined interior.",
    rating: 4.8,
    review_count: 52,
    stock: 40,
    sku: "SS-CL-003",
    featured: true,
    best_seller: true,
    variants: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Classic Leather Handbag",
    slug: "classic-leather-handbag",
    price: 5500,
    sale_price: 4800,
    images: [
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop",
    ],
    category_id: null,
    brand_id: null,
    short_description: "Timeless structured handbag in rich leather finish.",
    description: "The Classic Leather Handbag is the epitome of sophistication. Structured silhouette, premium hardware, and a versatile design.",
    rating: 4.9,
    review_count: 118,
    stock: 15,
    sku: "SS-HB-004",
    featured: true,
    best_seller: true,
    variants: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Mini Sling Bag",
    slug: "mini-sling-bag",
    price: 1800,
    sale_price: null,
    images: [
      "https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=400&h=400&fit=crop",
    ],
    category_id: null,
    brand_id: null,
    short_description: "Compact and trendy mini sling for everyday outings.",
    description: "Small but mighty — our Mini Sling Bag carries your phone, cards, and keys in style.",
    rating: 4.5,
    review_count: 95,
    stock: 60,
    sku: "SS-SL-005",
    featured: false,
    best_seller: true,
    variants: [{ type: "Color", options: ["Black", "Tan", "Blush Pink", "Olive"] }],
    created_at: new Date().toISOString(),
  },
  {
    id: "6",
    name: "Woven Bucket Bag",
    slug: "woven-bucket-bag",
    price: 3800,
    sale_price: null,
    images: [
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=400&h=400&fit=crop",
    ],
    category_id: null,
    brand_id: null,
    short_description: "Artisan-inspired woven bucket bag with drawstring closure.",
    description: "A bohemian-meets-luxury piece. Our Woven Bucket Bag features intricate woven detailing.",
    rating: 4.6,
    review_count: 38,
    stock: 22,
    sku: "SS-BB-006",
    featured: false,
    best_seller: false,
    variants: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "7",
    name: "Executive Laptop Tote",
    slug: "executive-laptop-tote",
    price: 5200,
    sale_price: null,
    images: [
      "https://images.unsplash.com/photo-1614179689702-355944cd0918?w=400&h=400&fit=crop",
    ],
    category_id: null,
    brand_id: null,
    short_description: "Professional tote designed for the working woman.",
    description: "Power-dress your accessories. The Executive Laptop Tote fits up to a 15-inch laptop.",
    rating: 4.8,
    review_count: 76,
    stock: 18,
    sku: "SS-LT-007",
    featured: true,
    best_seller: true,
    variants: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "8",
    name: "Pearl Handle Party Bag",
    slug: "pearl-handle-party-bag",
    price: 3500,
    sale_price: null,
    images: [
      "https://images.unsplash.com/photo-1612902456551-404b5b8e9c8f?w=400&h=400&fit=crop",
    ],
    category_id: null,
    brand_id: null,
    short_description: "Statement party bag with faux pearl handle.",
    description: "Turn heads at every event with this show-stopping party bag.",
    rating: 4.4,
    review_count: 45,
    stock: 35,
    sku: "SS-PB-008",
    featured: false,
    best_seller: false,
    variants: null,
    created_at: new Date().toISOString(),
  },
];

export const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Fariha A.",
    review: "The Royal Quilted Tote is absolutely stunning! The quality is unbelievable for the price. Got so many compliments at work.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  },
  {
    id: "2",
    name: "Nusrat J.",
    review: "Ordered the Elegance Chain Crossbody and it arrived beautifully packaged. Feels so premium — my new favourite bag!",
    rating: 5,
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
  },
  {
    id: "3",
    name: "Tasnim R.",
    review: "Step & Style has the best collection in Bangladesh. The bags look exactly like the photos. Will definitely order again!",
    rating: 4,
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
  },
  {
    id: "4",
    name: "Sumaiya K.",
    review: "I've been searching for affordable luxury bags and finally found Step & Style. The Executive Laptop Tote is perfect for office.",
    rating: 5,
  },
];

export const homeFAQs: FAQ[] = [
  {
    question: "Are the bags made of genuine leather?",
    answer: "We offer both premium faux leather and genuine leather options. Each product description clearly mentions the material used.",
  },
  {
    question: "Do you deliver all over Bangladesh?",
    answer: "Yes! We deliver nationwide across Bangladesh. Dhaka deliveries take 1-2 business days, and outside Dhaka takes 3-5 business days.",
  },
  {
    question: "What is your return & exchange policy?",
    answer: "We offer a 7-day easy return & exchange policy. If the product is damaged or doesn't match the description, we'll arrange a free return.",
  },
  {
    question: "Can I see the bag before purchasing?",
    answer: "We regularly post detailed photos and videos on our Facebook and Instagram pages. For Dhaka customers, you can also visit our showroom by appointment.",
  },
  {
    question: "Do you offer gift wrapping?",
    answer: "Yes! We offer complimentary premium gift wrapping on all orders. Simply mention 'Gift Wrap' in the order notes at checkout.",
  },
];

export const categories = ["All", "Tote Bags", "Handbags", "Crossbody Bags", "Clutches", "Sling Bags", "Bucket Bags"];
