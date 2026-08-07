-- Add archived to title_status enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumtypid = 'public.title_status'::regtype
      AND enumlabel = 'archived'
  ) THEN
    ALTER TYPE "public"."title_status" ADD VALUE 'archived';
  END IF;
END $$;
