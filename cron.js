import cron from "node-cron";
import { executeFailedTranscription } from "./src/cron/executeFailedTransacription.js";
import { executeFailedTranscriptionAnalysis } from "./src/cron/executeFailedTranscriptionAnalysis.js";


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