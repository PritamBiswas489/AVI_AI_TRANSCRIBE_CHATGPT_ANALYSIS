import db from "../databases/models/index.js";
import "../config/environment.js";
import DataController from "../controllers/data.controller.js";

const {
  ChatgptConversationScoreAiWhatsappMessages,
  ChatgptConversationScoreAiWhatsappMessagesAnalysis,
} = db;

const getData =
  await ChatgptConversationScoreAiWhatsappMessagesAnalysis.findAll({
    where: {
      status: 3,
    },
    order: [["createdAt", "ASC"]],
  });


   for (const record of getData) {
          DataController.insertMessageSummaryAnalysis(record);
          console.log("Processing record with ticketNumber:", record.ticketNumber);
}
