import cron from "node-cron";
import { executeFailedTranscription } from "./src/cron/executeFailedTransacription.js";
import { executeFailedTranscriptionAnalysis } from "./src/cron/executeFailedTranscriptionAnalysis.js";
import { runDeleteOldMp3Files } from "./src/cron/deleteOldMp3Files.js";
import { runDeleteOldChunkFiles } from "./src/cron/deleteOldChunkFilesFolder.js";
import { sendCronDataToBtcThai } from "./src/cron/sendCronDataToBtcThai.js";
import { sendCronMessageDataToBtcThai } from "./src/cron/sendCronMessageDataToBtcThai.js";  
import { saveTicketId, saveMessagesOfTicket, summerizeMessagesOfTicket , analyzeSummaryOfMessagesOfTicket} from "./src/cron/messageSummaryAnalysisAi.js";
import { saveAgentData } from "./src/cron/saveAgentData.js";


// cron.schedule(
//     "*/30 * * * *", // Run every 30 minutes
//      () => {
//          executeFailedTranscription();
//     }
// );

// cron.schedule(
//     "*/45 * * * *", // Run every 45 minutes
//      () => {
//          executeFailedTranscriptionAnalysis();
//     }
// );


// cron.schedule(
//     "0 0 */10 * *", // Run every 10 days at midnight
//      () => {
//         runDeleteOldMp3Files();
//     }
// );

// cron.schedule(
//     "0 0 */10 * *", // Run every 10 days at midnight
//       () => {
//         runDeleteOldChunkFiles();
//     }
// );

// cron.schedule(
//     "*/10 * * * *", // Run every 10 minutes
//       () => {
//           sendCronDataToBtcThai();
//     }
// );


// cron.schedule(
//     "*/11 * * * *", // Run every 11 minutes
//       () => {
//           sendCronMessageDataToBtcThai();
//     }
// );



// cron.schedule(
//     "0 3 * * *", // Run every day at 03:00 AM (UTC)
//       () => {
//         const yesterday = new Date();
//         yesterday.setDate(yesterday.getDate() - 1);
//         const formattedDate = yesterday.toISOString().split('T')[0];
//         saveTicketId(formattedDate);
//     },
//     {
//         timezone: "UTC"
//     }
// );

// cron.schedule(
//     "*/35 * * * *", // Run every 35 minutes
//       () => {
//           saveMessagesOfTicket();
//     }
// );



// cron.schedule(
//     "*/5 * * * *", // Run every 5 minutes
//       () => {
//           summerizeMessagesOfTicket();
//     }
// );

// cron.schedule(
//     "*/6 * * * *", // Run every 6 minutes
//       () => {
//           analyzeSummaryOfMessagesOfTicket();
//     }
// );

// cron.schedule(
//     "0 4 * * *", // Run every day at 04:00 AM
//       () => {
//           saveAgentData();
//     }
// );


saveAgentData();

 