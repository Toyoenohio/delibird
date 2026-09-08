import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { neon } from "@neondatabase/serverless";

async function applyTriggers() {
  const dbUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;
  if (!dbUrl) {
    console.error("❌ DATABASE_URL is not set.");
    process.exit(1);
  }

  const sql = neon(dbUrl);

  console.log("⚡ Applying PostgreSQL trigger for automatic website creation & linking...");

  await sql`
    CREATE OR REPLACE FUNCTION fn_auto_create_or_link_website()
    RETURNS TRIGGER AS $$
    DECLARE
      extracted_domain TEXT;
      extracted_clean TEXT;
      found_website_id UUID;
      palette TEXT[] := ARRAY['#ea580c', '#f97316', '#d97706', '#0284c7', '#8b5cf6', '#10b981', '#ec4899', '#6366f1', '#14b8a6'];
      chosen_color TEXT;
    BEGIN
      -- If website_id is already provided, keep it
      IF NEW.website_id IS NOT NULL THEN
        RETURN NEW;
      END IF;

      -- If source_url is empty or NULL, set a fallback
      IF NEW.source_url IS NULL OR trim(NEW.source_url) = '' THEN
        NEW.source_url := 'General / Sin Origen';
      END IF;

      -- Clean domain extraction
      extracted_domain := lower(trim(NEW.source_url));
      -- Strip protocol
      extracted_domain := regexp_replace(extracted_domain, '^https?://', '');
      -- Strip www.
      extracted_domain := regexp_replace(extracted_domain, '^www\.', '');
      -- Strip path/query
      extracted_clean := split_part(extracted_domain, '/', 1);
      extracted_clean := split_part(extracted_clean, '?', 1);
      extracted_clean := split_part(extracted_clean, ':', 1);

      IF extracted_clean = '' THEN
        extracted_clean := 'general';
      END IF;

      -- 1. Try finding existing website by name or domain in url
      SELECT id INTO found_website_id
      FROM websites
      WHERE lower(name) = extracted_clean
         OR lower(url) LIKE '%' || extracted_clean || '%'
      ORDER BY created_at ASC
      LIMIT 1;

      -- 2. If not found, automatically insert the website record
      IF found_website_id IS NULL THEN
        chosen_color := palette[1 + (abs(hashtext(extracted_clean)) % array_length(palette, 1))];
        
        INSERT INTO websites (id, name, url, color_tag, created_at, updated_at)
        VALUES (
          gen_random_uuid(),
          initcap(replace(extracted_clean, '-', ' ')),
          CASE 
            WHEN NEW.source_url LIKE 'http%' THEN NEW.source_url 
            ELSE 'https://' || extracted_clean 
          END,
          chosen_color,
          NOW(),
          NOW()
        )
        RETURNING id INTO found_website_id;
      END IF;

      -- 3. Link the found or newly created website to this email
      NEW.website_id := found_website_id;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `;

  await sql`
    DROP TRIGGER IF EXISTS trg_emails_auto_website ON emails;
  `;

  await sql`
    CREATE TRIGGER trg_emails_auto_website
    BEFORE INSERT ON emails
    FOR EACH ROW
    EXECUTE FUNCTION fn_auto_create_or_link_website();
  `;

  console.log("✅ Trigger 'trg_emails_auto_website' successfully installed in Neon PostgreSQL!");
}

applyTriggers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error applying trigger:", err);
    process.exit(1);
  });
