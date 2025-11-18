import cron from "node-cron";
import { executeFailedTranscription } from "./src/cron/executeFailedTransacription.js";
import { executeFailedTranscriptionAnalysis } from "./src/cron/executeFailedTranscriptionAnalysis.js";
import { runDeleteOldMp3Files } from "./src/cron/deleteOldMp3Files.js";
import { runDeleteOldChunkFiles } from "./src/cron/deleteOldChunkFilesFolder.js";
import { sendCronDataToBtcThai } from "./src/cron/sendCronDataToBtcThai.js";
import { sendCronMessageDataToBtcThai } from "./src/cron/sendCronMessageDataToBtcThai.js";  


cron.schedule(
    "*/30 * * * *", // Run every 30 minutes
    async () => {
        await executeFailedTranscription();
    }
);

cron.schedule(
    "*/45 * * * *", // Run every 45 minutes
    async () => {
        await executeFailedTranscriptionAnalysis();
    }
);


cron.schedule(
    "0 0 */10 * *", // Run every 10 days at midnight
    async () => {
        runDeleteOldMp3Files();
    }
);

cron.schedule(
    "0 0 */10 * *", // Run every 10 days at midnight
    async () => {
        runDeleteOldChunkFiles();
    }
);

// cron.schedule(
//     "*/10 * * * *", // Run every 10 minutes
//     async () => {
//         await sendCronDataToBtcThai();
//     }
// );


// cron.schedule(
//     "*/11 * * * *", // Run every 11 minutes
//     async () => {
//         await sendCronMessageDataToBtcThai();
//     }
// );