-- Idempotent demo content seed for RAREFINDS.
INSERT INTO categories (id, name, slug, sort_order) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Side Bags',   'side-bags',   1),
  ('11111111-0000-0000-0000-000000000002', 'Chest Bags',  'chest-bags',  2),
  ('11111111-0000-0000-0000-000000000003', 'Clutch Bags', 'clutch-bags', 3),
  ('11111111-0000-0000-0000-000000000004', 'Duffel Bags', 'duffel-bags', 4)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, sort_order = EXCLUDED.sort_order;

DELETE FROM products WHERE id::text LIKE '22222222-%';
INSERT INTO products (id, name, slug, short_description, description, price, sale_price, stock, sku, category_id, images, featured, best_seller, rating, review_count, option_groups, stock_status_text, shipping_text, additional_info)
VALUES
  ('22222222-0000-0000-0000-000000000001','Atelier Crossbody — Tan','atelier-crossbody-tan','Vegetable-tanned full-grain leather crossbody.','A quietly confident everyday companion. Cut from Italian vegetable-tanned full-grain leather, hand-burnished edges, and solid brass hardware. Built to soften beautifully with use.',8900,7650,24,'RF-SB-001','11111111-0000-0000-0000-000000000001',ARRAY['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1200&q=80','https://images.unsplash.com/photo-1591561954557-26941169b49e?w=1200&q=80'],true,true,4.8,126,'[{"name":"Color","values":["Tan","Cognac","Black"]}]'::jsonb,'In Stock — Ready to ship','Complimentary shipping over ৳5,000','Dimensions: 24 × 18 × 7 cm. Adjustable strap. Interior zip pocket.'),
  ('22222222-0000-0000-0000-000000000002','Meridian Sling — Espresso','meridian-sling-espresso','Minimalist sling in deep espresso pebble grain.','Architectural lines meet supple pebble-grain leather. Magnetic closure, suede-lined interior, and a webbed adjustable strap finished in matte gunmetal.',7400,NULL,18,'RF-SB-002','11111111-0000-0000-0000-000000000001',ARRAY['https://images.unsplash.com/photo-1591561954557-26941169b49e?w=1200&q=80','https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1200&q=80'],true,false,4.7,84,'[{"name":"Color","values":["Espresso","Black"]}]'::jsonb,'In Stock — Ready to ship','Complimentary shipping over ৳5,000','Dimensions: 22 × 16 × 6 cm.'),
  ('22222222-0000-0000-0000-000000000003','Noir Compact — Onyx','noir-compact-onyx','Compact side bag with sculpted silhouette.','A sculpted everyday compact in jet-black smooth calfskin. Hand-stitched details and a polished palladium clasp give it a quietly modern presence.',6900,5900,30,'RF-SB-003','11111111-0000-0000-0000-000000000001',ARRAY['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1200&q=80'],false,true,4.9,211,'[{"name":"Color","values":["Onyx","Bone"]}]'::jsonb,'In Stock — Ready to ship','Complimentary shipping over ৳5,000',NULL),
  ('22222222-0000-0000-0000-000000000004','Vector Chest Pack — Stone','vector-chest-pack-stone','Utility-luxe chest pack in soft stone leather.','Engineered for movement. Crafted from milled Italian leather with a tactical-inspired silhouette, dual-zip compartments, and a magnetic side-release buckle.',8200,NULL,22,'RF-CB-001','11111111-0000-0000-0000-000000000002',ARRAY['https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=1200&q=80','https://images.unsplash.com/photo-1547949003-9792a18a2601?w=1200&q=80'],true,true,4.8,167,'[{"name":"Color","values":["Stone","Black","Olive"]}]'::jsonb,'In Stock — Ready to ship','Complimentary shipping over ৳5,000','Fits up to 8" tablet. RFID-blocking interior pocket.'),
  ('22222222-0000-0000-0000-000000000005','Apex Chest Rig — Black','apex-chest-rig-black','Modular chest rig with brass hardware.','A bold, modern silhouette in matte black bridle leather. Ergonomic strap geometry, brushed brass hardware, and a cavernous main compartment.',9800,8900,14,'RF-CB-002','11111111-0000-0000-0000-000000000002',ARRAY['https://images.unsplash.com/photo-1547949003-9792a18a2601?w=1200&q=80'],true,false,4.7,92,'[{"name":"Color","values":["Black","Tan"]}]'::jsonb,'In Stock — Ready to ship','Complimentary shipping over ৳5,000',NULL),
  ('22222222-0000-0000-0000-000000000006','Linea Chest Bag — Cognac','linea-chest-bag-cognac','Slim chest bag in cognac saddle leather.','Hand-finished cognac saddle leather with contrast tonal stitching. Slim, body-skimming proportions and a magnetic flap closure.',7100,NULL,26,'RF-CB-003','11111111-0000-0000-0000-000000000002',ARRAY['https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=1200&q=80'],false,true,4.6,73,'[{"name":"Color","values":["Cognac","Espresso"]}]'::jsonb,'In Stock — Ready to ship','Complimentary shipping over ৳5,000',NULL),
  ('22222222-0000-0000-0000-000000000007','Sable Evening Clutch — Bone','sable-evening-clutch-bone','Architectural evening clutch in bone nappa.','A sculptural evening piece in supple bone-coloured nappa. Concealed magnetic closure, satin lining, and a slim detachable wrist strap.',6400,NULL,16,'RF-CL-001','11111111-0000-0000-0000-000000000003',ARRAY['https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=1200&q=80','https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=1200&q=80'],true,false,4.9,58,'[{"name":"Color","values":["Bone","Onyx","Champagne"]}]'::jsonb,'In Stock — Ready to ship','Complimentary shipping over ৳5,000','Dimensions: 28 × 14 × 4 cm.'),
  ('22222222-0000-0000-0000-000000000008','Halo Fold Clutch — Champagne','halo-fold-clutch-champagne','Foldover clutch with hand-pleated detailing.','A foldover silhouette with hand-pleated detailing in liquid-champagne metallic leather. Designed in collaboration with our atelier in Florence.',7800,6900,12,'RF-CL-002','11111111-0000-0000-0000-000000000003',ARRAY['https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=1200&q=80'],true,true,4.8,41,'[{"name":"Color","values":["Champagne","Onyx"]}]'::jsonb,'In Stock — Ready to ship','Complimentary shipping over ৳5,000',NULL),
  ('22222222-0000-0000-0000-000000000009','Verse Minaudière — Onyx','verse-minaudiere-onyx','Structured minaudière in lacquered onyx.','A structured minaudière in lacquered onyx leather with a polished gold-tone clasp. The quiet centerpiece of an evening look.',8600,NULL,9,'RF-CL-003','11111111-0000-0000-0000-000000000003',ARRAY['https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=1200&q=80'],false,false,4.7,27,'[{"name":"Color","values":["Onyx","Bone"]}]'::jsonb,'Low Stock — Only a few left','Complimentary shipping over ৳5,000',NULL),
  ('22222222-0000-0000-0000-000000000010','Voyager Weekender — Cognac','voyager-weekender-cognac','Hand-burnished weekender in full-grain leather.','Built for considered travel. Full-grain Italian leather, brass YKK Excella zippers, leather-wrapped handles, and a removable shoulder strap.',18900,16500,11,'RF-DF-001','11111111-0000-0000-0000-000000000004',ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&q=80','https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=1200&q=80'],true,true,4.9,312,'[{"name":"Color","values":["Cognac","Espresso","Black"]}]'::jsonb,'In Stock — Ready to ship','Complimentary shipping included','Dimensions: 52 × 28 × 26 cm. 38L capacity.'),
  ('22222222-0000-0000-0000-000000000011','Atlas Duffel — Espresso','atlas-duffel-espresso','Heritage-inspired duffel with brass hardware.','A heritage-inspired silhouette reimagined for the modern traveler. Vegetable-tanned leather, brass hardware, and a canvas-lined interior.',17400,NULL,8,'RF-DF-002','11111111-0000-0000-0000-000000000004',ARRAY['https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=1200&q=80'],true,false,4.8,144,'[{"name":"Color","values":["Espresso","Tan"]}]'::jsonb,'Low Stock — Only a few left','Complimentary shipping included',NULL),
  ('22222222-0000-0000-0000-000000000012','Monolith Travel Duffel — Black','monolith-travel-duffel-black','Architectural duffel in matte-black bridle.','An architectural duffel in matte-black bridle leather. Reinforced base, magnetic side pockets, and a trolley sleeve for seamless travel.',21500,19500,6,'RF-DF-003','11111111-0000-0000-0000-000000000004',ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&q=80'],false,true,4.9,88,'[{"name":"Color","values":["Black"]}]'::jsonb,'Low Stock — Only a few left','Complimentary shipping included','Dimensions: 56 × 30 × 28 cm. 45L capacity.');

DELETE FROM hero_slides WHERE id::text LIKE '33333333-%';
INSERT INTO hero_slides (id, headline, subheadline, cta_text, cta_link, image_url, sort_order, enabled) VALUES
  ('33333333-0000-0000-0000-000000000001','Quiet Luxury, Crafted in Leather','New Season — The Atelier Edit. Hand-finished pieces in vegetable-tanned full-grain leather.','Shop The Edit','/shop','https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=1920&q=85',1,true),
  ('33333333-0000-0000-0000-000000000002','The Voyager Collection','Considered travel essentials in full-grain Italian leather.','Discover Voyager','/shop?category=duffel-bags','https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1920&q=85',2,true),
  ('33333333-0000-0000-0000-000000000003','Evening, Reimagined','Sculptural clutches in nappa, lacquered onyx, and liquid champagne.','Shop Clutches','/shop?category=clutch-bags','https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=1920&q=85',3,true);

DELETE FROM testimonials WHERE id::text LIKE '44444444-%';
INSERT INTO testimonials (id, name, review, rating, sort_order) VALUES
  ('44444444-0000-0000-0000-000000000001','Anika R.','The Atelier Crossbody is exquisite. The leather has softened beautifully after three months of daily wear — a true heirloom piece.',5,1),
  ('44444444-0000-0000-0000-000000000002','Tahmid H.','My Voyager Weekender turns heads in every airport. Quiet, considered, impeccably made.',5,2),
  ('44444444-0000-0000-0000-000000000003','Saira K.','The Halo Fold Clutch is the most thoughtful gift I have ever received. The detailing is unmatched.',5,3),
  ('44444444-0000-0000-0000-000000000004','Imran S.','Apex Chest Rig replaced three of my bags. Build quality rivals brands at three times the price.',5,4);

DELETE FROM why_choose_us_cards WHERE id::text LIKE '55555555-%';
INSERT INTO why_choose_us_cards (id, title, description, icon_name, sort_order) VALUES
  ('55555555-0000-0000-0000-000000000001','Full-Grain Leather','Sourced from Tuscan and Florentine tanneries with century-long heritage.','Shield',1),
  ('55555555-0000-0000-0000-000000000002','Hand-Finished','Every edge burnished, every stitch hand-checked in our atelier.','Sparkles',2),
  ('55555555-0000-0000-0000-000000000003','Lifetime Repair','Complimentary leather conditioning and lifetime hardware repair.','Heart',3),
  ('55555555-0000-0000-0000-000000000004','Considered Shipping','Carbon-conscious courier across Bangladesh. Free over ৳5,000.','Truck',4);

DELETE FROM home_faqs WHERE id::text LIKE '66666666-%';
INSERT INTO home_faqs (id, question, answer, sort_order) VALUES
  ('66666666-0000-0000-0000-000000000001','What leather do you use?','We work exclusively with vegetable-tanned full-grain leather sourced from heritage Italian tanneries in Tuscany.',1),
  ('66666666-0000-0000-0000-000000000002','How long does delivery take?','Most orders within Dhaka arrive in 1–2 days. Outside-Dhaka orders are delivered within 3–5 business days.',2),
  ('66666666-0000-0000-0000-000000000003','Do you offer repairs?','Yes — every RAREFINDS. piece comes with complimentary lifetime hardware repair and leather conditioning.',3),
  ('66666666-0000-0000-0000-000000000004','What is your return policy?','We accept unused returns within 7 days of delivery. See our Return & Exchange policy for details.',4);

INSERT INTO homepage_sections (id, title, enabled, sort_order, content) VALUES
  ('hero','Hero',true,1,'{}'::jsonb),
  ('featured','Featured Collection',true,2,'{"subtitle":"Pieces selected by our atelier"}'::jsonb),
  ('categories','Shop by Category',true,3,'{"subtitle":"Crafted for every occasion"}'::jsonb),
  ('best_sellers','Best Sellers',true,4,'{"subtitle":"Loved by our community"}'::jsonb),
  ('promo_banner','The Voyager Edit',true,5,'{"image":"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1920&q=85","headline":"The Voyager Edit","subtext":"Heritage travel goods, reimagined.","cta_text":"Shop Voyager","cta_link":"/shop?category=duffel-bags"}'::jsonb),
  ('new_arrivals','New Arrivals',true,6,'{"subtitle":"Just landed in the atelier"}'::jsonb),
  ('why_choose_us','The RAREFINDS Standard',true,7,'{}'::jsonb),
  ('testimonials','From Our Community',true,8,'{}'::jsonb),
  ('faqs','Considered Questions',true,9,'{}'::jsonb),
  ('newsletter','Join the Atelier',true,10,'{"subtitle":"Early access to new collections, private events, and the occasional letter from our founder."}'::jsonb)
ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, enabled=EXCLUDED.enabled, sort_order=EXCLUDED.sort_order, content=EXCLUDED.content;

INSERT INTO about_sections (id, title, enabled, sort_order, content) VALUES
  ('hero','Our Story',true,1,'{"headline":"Quiet Luxury, Crafted in Leather","body":"RAREFINDS. was born from a simple belief — that the most beautiful objects are the ones built to outlast trend. Each piece is hand-finished in our atelier from vegetable-tanned full-grain leather sourced in Tuscany.","image":"https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=1600&q=85"}'::jsonb),
  ('mission','Our Philosophy',true,2,'{"body":"We design fewer pieces, made better. Every silhouette is studied for years before release. Every component — leather, hardware, thread — is chosen for how it will age, not how it photographs."}'::jsonb),
  ('craft','The Craft',true,3,'{"body":"Our master leatherworkers train for over a decade before joining the atelier. Edges are hand-burnished. Stitches are hand-checked. Hardware is brass, palladium, or gunmetal — never plated."}'::jsonb),
  ('values','Our Values',true,4,'{"items":[{"title":"Considered","body":"Fewer, better pieces."},{"title":"Honest","body":"Transparent sourcing and pricing."},{"title":"Lifetime","body":"Repair, condition, restore — for life."}]}'::jsonb)
ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, enabled=EXCLUDED.enabled, sort_order=EXCLUDED.sort_order, content=EXCLUDED.content;

INSERT INTO policies (id, title, content, enabled, sort_order) VALUES
  ('return-exchange','Return & Exchange','We accept returns and exchanges on unused items within 7 days of delivery. To initiate a return, email care@rarefinds.shop with your order number. Items must be in original condition with all packaging and tags intact. Made-to-order and personalised pieces are final sale.

Refunds are processed within 5 business days of receiving the returned item.',true,1),
  ('privacy-policy','Privacy Policy','RAREFINDS. respects your privacy. We collect only the information necessary to fulfill your order and improve your experience — name, contact details, delivery address, and order history. We do not sell or share your data with third parties beyond delivery and payment partners. You may request deletion of your data at any time by writing to care@rarefinds.shop.',true,2),
  ('terms-of-service','Terms of Service','By using rarefinds.shop you agree to these terms. All product imagery, copy, and designs are the intellectual property of RAREFINDS. Prices are listed in BDT and are subject to change. We reserve the right to refuse or cancel orders at our discretion.',true,3),
  ('shipping-policy','Shipping Policy','Complimentary shipping on orders over ৳5,000. Inside Dhaka: 1–2 business days. Outside Dhaka: 3–5 business days. All orders are dispatched in signature RAREFINDS. packaging with tracking provided via SMS and email.',true,4)
ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, content=EXCLUDED.content, enabled=EXCLUDED.enabled, sort_order=EXCLUDED.sort_order;

INSERT INTO contact_settings (id, page_title, page_intro, receiving_email, email_address, phone_number, business_address, show_address, social_section_enabled, social_links, submit_button_text)
VALUES ('default','Get in Touch','Our client care team responds within one business day. For atelier visits, please book in advance.','care@rarefinds.shop','care@rarefinds.shop','+880 1700-000000','Atelier RAREFINDS., Gulshan-2, Dhaka 1212, Bangladesh',true,true,
  '[{"label":"Instagram","url":"https://instagram.com/rarefinds","icon":"instagram"},{"label":"Facebook","url":"https://facebook.com/rarefinds","icon":"facebook"},{"label":"WhatsApp","url":"https://wa.me/8801700000000","icon":"whatsapp"}]'::jsonb,
  'Send Message')
ON CONFLICT (id) DO UPDATE SET page_title=EXCLUDED.page_title, page_intro=EXCLUDED.page_intro, receiving_email=EXCLUDED.receiving_email, email_address=EXCLUDED.email_address, phone_number=EXCLUDED.phone_number, business_address=EXCLUDED.business_address, show_address=EXCLUDED.show_address, social_section_enabled=EXCLUDED.social_section_enabled, social_links=EXCLUDED.social_links, submit_button_text=EXCLUDED.submit_button_text;

INSERT INTO footer_settings (id, store_name, description, email, phone, address, copyright_text, newsletter_enabled, quick_links, customer_care_links, social_links)
VALUES ('default','RAREFINDS.','Crafted leather goods for collectors of quiet luxury.','care@rarefinds.shop','+880 1700-000000','Gulshan-2, Dhaka 1212, Bangladesh','© {year} RAREFINDS. All rights reserved.',true,
  '[{"label":"Shop","url":"/shop"},{"label":"About","url":"/about"},{"label":"Contact","url":"/contact"},{"label":"Track Order","url":"/track-order"}]'::jsonb,
  '[{"label":"Shipping Policy","url":"/policies/shipping-policy"},{"label":"Return & Exchange","url":"/policies/return-exchange"},{"label":"Privacy Policy","url":"/policies/privacy-policy"},{"label":"Terms of Service","url":"/policies/terms-of-service"}]'::jsonb,
  '[{"label":"Instagram","url":"https://instagram.com/rarefinds","icon":"instagram"},{"label":"Facebook","url":"https://facebook.com/rarefinds","icon":"facebook"},{"label":"WhatsApp","url":"https://wa.me/8801700000000","icon":"whatsapp"}]'::jsonb)
ON CONFLICT (id) DO UPDATE SET store_name=EXCLUDED.store_name, description=EXCLUDED.description, email=EXCLUDED.email, phone=EXCLUDED.phone, address=EXCLUDED.address, copyright_text=EXCLUDED.copyright_text, newsletter_enabled=EXCLUDED.newsletter_enabled, quick_links=EXCLUDED.quick_links, customer_care_links=EXCLUDED.customer_care_links, social_links=EXCLUDED.social_links;

INSERT INTO announcement_bar (id, text, link, enabled, dismissible, bg_color, text_color)
VALUES ('default','Complimentary shipping on orders over ৳5,000 — Inside Dhaka delivered next day','/shop',true,true,'#0d0d0d','#f5f0e0')
ON CONFLICT (id) DO UPDATE SET text=EXCLUDED.text, link=EXCLUDED.link, enabled=EXCLUDED.enabled, bg_color=EXCLUDED.bg_color, text_color=EXCLUDED.text_color;

DELETE FROM delivery_zones WHERE id::text LIKE '77777777-%';
INSERT INTO delivery_zones (id, zone_name, areas, delivery_charge, free_delivery_minimum, estimated_days, enabled, sort_order) VALUES
  ('77777777-0000-0000-0000-000000000001','Inside Dhaka','Dhaka, Gulshan, Banani, Dhanmondi, Uttara, Mirpur, Mohammadpur', 80, 5000, '1-2 days', true, 1),
  ('77777777-0000-0000-0000-000000000002','Outside Dhaka','All other districts in Bangladesh', 150, 5000, '3-5 days', true, 2);