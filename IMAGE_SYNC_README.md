# SOP Manager - Image Management Scripts

This document describes the scripts available for managing images in the Supabase `part-images` bucket and the `part_images` database table.

## 🎯 Current Issue

- **Estimated total images**: ~4000 in the `part-images` bucket
- **Current database records**: 196
- **Current signed URLs**: 196
- **Problem**: Only 196 of ~4000 images are represented in the database with signed URLs

## 📋 Available Scripts

### 1. `analyze_image_status.py` - Status Analysis
**Purpose**: Analyze the current state of images in bucket vs database
**Usage**: `python analyze_image_status.py`
**Output**: Detailed report showing:
- Total files in bucket
- .jpg vs .png vs other files
- Database records count
- Missing records
- Orphaned records
- Recommendations

### 2. `comprehensive_image_sync.py` - Main Sync Script
**Purpose**: Complete sync of all images with pagination support
**Usage**: `python comprehensive_image_sync.py`
**Features**:
- ✅ Handles pagination for large file counts
- ✅ Inserts missing database records
- ✅ Generates signed URLs for all records
- ✅ Progress indicators
- ✅ Error handling
- ✅ Batch processing to avoid timeouts

### 3. `cleanup_orphaned_records.py` - Database Cleanup
**Purpose**: Remove database records that don't exist in the bucket
**Usage**: `python cleanup_orphaned_records.py`
**Features**:
- 🔍 Dry run mode (default)
- ✅ Safe deletion with confirmation
- ✅ Shows what would be deleted before doing it

### 4. Legacy Scripts (Limited to 100 files)
- `sync_and_sign_part_images.py` - Original sync script (limited)
- `insert_missing_part_images.py` - Original insert script (limited)

## 🚀 Recommended Workflow

### Step 1: Analyze Current Status
```bash
python analyze_image_status.py
```
This will show you exactly what needs to be done.

### Step 2: Run Comprehensive Sync
```bash
python comprehensive_image_sync.py
```
This will:
- Scan all ~4000 images in the bucket
- Insert missing database records
- Generate signed URLs for all records
- Show progress and final summary

### Step 3: Verify Results
```bash
python analyze_image_status.py
```
Should show all images are now synced.

### Step 4: Optional Cleanup
```bash
python cleanup_orphaned_records.py
```
Only if there are orphaned database records.

## 🔧 Technical Details

### Pagination Implementation
The new scripts handle Supabase's 100-file limit by:
- Using `offset` and `limit` parameters
- Looping until all files are retrieved
- Adding small delays to avoid rate limiting

### Batch Processing
- Database inserts: 100 records per batch
- Signed URL generation: Individual with progress tracking
- Error handling for each operation

### Error Handling
- Network timeouts
- Rate limiting
- Invalid file names
- Database constraints

## 📊 Expected Results

After running `comprehensive_image_sync.py`, you should see:
- ~4000 database records (one per .jpg file)
- ~4000 signed URLs generated
- All bucket images represented in database
- Progress indicators showing completion

## ⚠️ Important Notes

1. **Service Role Key**: All scripts use the service role key for full access
2. **Rate Limiting**: Scripts include delays to avoid Supabase rate limits
3. **Backup**: Consider backing up the `part_images` table before major operations
4. **Testing**: The cleanup script runs in dry-run mode by default

## 🔄 Future Maintenance

### Regular Sync
Run `comprehensive_image_sync.py` periodically to:
- Add new images to database
- Regenerate expired signed URLs
- Keep everything in sync

### Monitoring
Use `analyze_image_status.py` to:
- Check sync status
- Identify issues
- Plan maintenance

## 🛠️ Troubleshooting

### Common Issues

1. **"No files found in bucket"**
   - Check bucket name and permissions
   - Verify Supabase credentials

2. **"Error listing files"**
   - Check network connection
   - Verify service role key permissions

3. **"Error signing URLs"**
   - Check bucket permissions
   - Verify file names are valid

4. **Script stops at 100 files**
   - Use `comprehensive_image_sync.py` instead of legacy scripts

### Performance Tips

- Run scripts during off-peak hours
- Monitor Supabase dashboard for rate limits
- Use dry-run mode first for cleanup operations

## 📈 Success Metrics

After successful sync:
- ✅ Database records ≈ Bucket .jpg files
- ✅ All records have signed URLs
- ✅ No orphaned records
- ✅ Excel integration working with signed URLs 