import cron from "node-cron";
import { executeFailedTranscription } from "./src/cron/executeFailedTransacription.js";
import { executeFailedTranscriptionAnalysis } from "./src/cron/executeFailedTranscriptionAnalysis.js";
import { runDeleteOldMp3Files } from "./src/cron/deleteOldMp3Files.js";
import { runDeleteOldChunkFiles } from "./src/cron/deleteOldChunkFilesFolder.js";
import { sendCronDataToBtcThai } from "./src/cron/sendCronDataToBtcThai.js";
import { sendCronMessageDataToBtcThai } from "./src/cron/sendCronMessageDataToBtcThai.js";  
import { saveTicketId, saveMessagesOfTicket, summerizeMessagesOfTicket , analyzeSummaryOfMessagesOfTicket} from "./src/cron/messageSummaryAnalysisAi.js";
import { saveAgentData } from "./src/cron/saveAgentData.js";


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



// cron.schedule(
//     "0 3 * * *", // Run every day at 03:00 AM
//     async () => {
//         await saveTicketId();
//     }
// );

// cron.schedule(
//     "*/35 * * * *", // Run every 35 minutes
//     async () => {
//         await saveMessagesOfTicket();
//     }
// );


// cron.schedule(
//     "*/8 * * * *", // Run every 8 minutes
//     async () => {
//         await summerizeMessagesOfTicket();
//     }
// );

// cron.schedule(
//     "*/9 * * * *", // Run every 8 minutes
//     async () => {
//         await analyzeSummaryOfMessagesOfTicket();
//     }
// );

// cron.schedule(
//     "0 4 * * *", // Run every day at 04:00 AM
//     async () => {
//         await saveAgentData();
//     }
// );