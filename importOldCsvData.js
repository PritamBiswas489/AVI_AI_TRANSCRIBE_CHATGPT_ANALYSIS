import fs from 'fs';
import csv from 'csv-parser'; 
import DataController from './src/controllers/data.controller.js';

// Function to process a single row
async function processRow(row) {
    try {
        console.log('=================================================================================');
         await DataController.insertOldCsvData(row);
        return true;
    } catch (error) {
        console.error(`Error processing row: ${error.message}`);
        return false;
    }
}

// Function for batch inserts (keeping for reference)
async function batchInsert(rows) {
    try {
        console.log(`Batch inserting ${rows.length} rows`);
        // await db.insertMany(rows); // Your actual batch insert logic
        return true;
    } catch (error) {
        console.error(`Error batch inserting: ${error.message}`);
        return false;
    }
}

async function selectRowsWithParser(filePath, fromRow, toRow) {
  return new Promise((resolve, reject) => {
    const selectedRows = [];
    let currentRow = 0;
    let headers = [];

    const stream = fs.createReadStream(filePath)
      .pipe(csv())
      .on('headers', (hdrs) => {
        headers = hdrs;
      })
      .on('data', (row) => {
        currentRow++;
        
        if (currentRow >= fromRow && currentRow <= toRow) {
          selectedRows.push(row);
        }

        // Stop streaming if we've passed toRow
        if (currentRow > toRow) {
          stream.destroy();
        }
      })
      .on('end', () => {
        resolve({ headers, rows: selectedRows, total: currentRow });
      })
      .on('close', () => {
        resolve({ headers, rows: selectedRows, total: currentRow });
      })
      .on('error', reject);
  });
}
const result = await selectRowsWithParser('./public/chatgpt_conversation_score_ai.csv', 10000, 10100)
// Helper function to sleep for a specified time
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

if(result.rows.length) {
        for(const row of result.rows) {
                await processRow(row);
                // Sleep for 100ms between each row to avoid overwhelming resources
                await sleep(100);
        }
}