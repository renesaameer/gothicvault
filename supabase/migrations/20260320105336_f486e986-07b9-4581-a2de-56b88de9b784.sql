ALTER TABLE product_tabs RENAME COLUMN content_type TO display_style;
ALTER TABLE product_tabs ALTER COLUMN display_style SET DEFAULT 'text';
UPDATE product_tabs SET display_style = 'list' WHERE display_style = 'bullet';