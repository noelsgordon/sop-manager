-- SQL to check the actual number of files in the part-images bucket
-- Run this in your Supabase SQL editor

-- Method 1: Count all files in the bucket
SELECT 
    COUNT(*) as total_files
FROM storage.objects 
WHERE bucket_id = 'part-images';

-- Method 2: Get detailed breakdown by file type
SELECT 
    CASE 
        WHEN name LIKE '%.jpg' OR name LIKE '%.JPG' THEN 'JPG'
        WHEN name LIKE '%.png' OR name LIKE '%.PNG' THEN 'PNG'
        WHEN name LIKE '%.jpeg' OR name LIKE '%.JPEG' THEN 'JPEG'
        WHEN name LIKE '%.webp' OR name LIKE '%.WEBP' THEN 'WEBP'
        WHEN name LIKE '%.gif' OR name LIKE '%.GIF' THEN 'GIF'
        ELSE 'OTHER'
    END as file_type,
    COUNT(*) as count
FROM storage.objects 
WHERE bucket_id = 'part-images'
GROUP BY 
    CASE 
        WHEN name LIKE '%.jpg' OR name LIKE '%.JPG' THEN 'JPG'
        WHEN name LIKE '%.png' OR name LIKE '%.PNG' THEN 'PNG'
        WHEN name LIKE '%.jpeg' OR name LIKE '%.JPEG' THEN 'JPEG'
        WHEN name LIKE '%.webp' OR name LIKE '%.WEBP' THEN 'WEBP'
        WHEN name LIKE '%.gif' OR name LIKE '%.GIF' THEN 'GIF'
        ELSE 'OTHER'
    END
ORDER BY count DESC;

-- Method 3: Get total size of bucket (FIXED)
SELECT 
    COUNT(*) as total_files,
    SUM(CAST(metadata->>'size' AS BIGINT)) as total_size_bytes,
    ROUND(SUM(CAST(metadata->>'size' AS BIGINT)) / 1024.0 / 1024.0, 2) as total_size_mb
FROM storage.objects 
WHERE bucket_id = 'part-images';

-- Method 4: Sample of file names (first 20)
SELECT name, 
       metadata->>'size' as size_bytes,
       created_at
FROM storage.objects 
WHERE bucket_id = 'part-images'
ORDER BY created_at DESC
LIMIT 20;

-- Method 5: Simple count with file type filter
SELECT 
    COUNT(*) as total_jpg_files
FROM storage.objects 
WHERE bucket_id = 'part-images' 
  AND (name LIKE '%.jpg' OR name LIKE '%.JPG'); 