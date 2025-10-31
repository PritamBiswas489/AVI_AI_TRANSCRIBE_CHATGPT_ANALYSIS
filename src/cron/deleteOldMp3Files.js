import fs from "fs/promises";
import {
  resolve as pathResolve,
  dirname,
  basename,
  join as pathJoin,
} from "path";

 
async function deleteOldFiles(daysOld) {
  try {
    const folderPath = pathResolve(
      pathJoin(dirname("./"), "uploads", "score_ai", "mp3Files")
    );
    // Calculate the cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    console.log(`Scanning folder: ${folderPath}`);
    console.log(`Deleting files older than ${daysOld} days (before ${cutoffDate.toLocaleString()})\n`);

    // Read all files in the directory
    const files = await fs.readdir(folderPath);
    
    let deletedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
      const filePath = pathJoin(folderPath, file);
      
      // Get file stats
      const stats = await fs.stat(filePath);
      
      // Skip directories
      if (stats.isDirectory()) {
        console.log(`⊘ Skipped (directory): ${file}`);
        skippedCount++;
        continue;
      }
      
      // Check if file is older than cutoff date
      if (stats.mtime < cutoffDate) {
        await fs.unlink(filePath);
        console.log(`✓ Deleted: ${file} (Last modified: ${stats.mtime.toLocaleString()})`);
        deletedCount++;
      } else {
        console.log(`⊘ Kept: ${file} (Last modified: ${stats.mtime.toLocaleString()})`);
        skippedCount++;
      }
    }

    console.log(`\n--- Summary ---`);
    console.log(`Files deleted: ${deletedCount}`);
    console.log(`Files/folders kept: ${skippedCount}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

 
 

export const runDeleteOldMp3Files = () =>{
    const daysOld = 7; // Delete files older than 7 days
    deleteOldFiles( daysOld)
            .then(() => console.log('\nOperation completed successfully!'))
            .catch(err => console.error('Operation failed:', err));

} 
 
