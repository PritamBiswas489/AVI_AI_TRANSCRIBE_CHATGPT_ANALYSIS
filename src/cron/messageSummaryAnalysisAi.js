import db from "../databases/models/index.js";
import "../config/environment.js";
import DataController from "../controllers/data.controller.js";

const {ChatgptConversationScoreAiWhatsappMessages,  ChatgptConversationScoreAiWhatsappMessagesAnalysis } = db;

const CHECK_DATE = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
console.log('CHECK_DATE:', CHECK_DATE);
//save ticket id
export const saveTicketId = async () => {
    const start = CHECK_DATE + " 00:00:00";
    const end = CHECK_DATE + " 23:59:59";
    DataController.cronTrack({cronFunction: "saveTicketId", data: {start, end}});

    const tickets = await ChatgptConversationScoreAiWhatsappMessages.findAll({
      attributes: ["ticket"],
      where: {
        createdAt: {
          [db.Op.between]: [start, end],
        },
      },
      group: ["ticket"],
      raw: true,
    });

    
     if (tickets.length === 0) {
        console.log('No tickets found for processing.');
        return;
    }

    const ticketIds = tickets.map(t => t.ticket);
    
    // Fetch existing records in bulk
    const existingRecords = await ChatgptConversationScoreAiWhatsappMessagesAnalysis.findAll({
        attributes: ['ticketNumber'],
        where: {
            ticketNumber: ticketIds,
            messageDate: CHECK_DATE
        },
        raw: true
    });
    
    const existingTicketIds = new Set(existingRecords.map(r => r.ticketNumber));
    
    // Filter out tickets that already exist
    const newTickets = tickets.filter(t => !existingTicketIds.has(t.ticket));
    
    if (newTickets.length === 0) {
        console.log('All tickets already exist, nothing to save.');
        return;
    }
    
    // Bulk insert new tickets
    const recordsToCreate = newTickets.map(t => ({
        ticketNumber: t.ticket,
        messageDate: CHECK_DATE
    }));
    
    await ChatgptConversationScoreAiWhatsappMessagesAnalysis.bulkCreate(recordsToCreate);
    
    console.log(`Saved ${newTickets.length} new ticket(s) for date: ${CHECK_DATE}`);
    existingTicketIds.forEach(id => console.log(`Ticket ID: ${id} already exists, skipped.`));
}
//save messages of ticket
export const saveMessagesOfTicket = async () => {
    DataController.cronTrack({cronFunction: "saveMessagesOfTicket", data: {}});
   
    const getData = await ChatgptConversationScoreAiWhatsappMessagesAnalysis.findAll({
        where: {
           status: 0
        },
        limit: 300,
        order: [['createdAt', 'ASC']]
    });
    if (getData.length === 0) {
        console.log('No ticket records found to process messages.');
        return;
    }
    // Fetch all ticket numbers at once
    const ticketNumbers = getData.map(record => record.ticketNumber);
    
    // Bulk fetch all messages for all tickets
    const allMessages = await ChatgptConversationScoreAiWhatsappMessages.findAll({
        where: {
            ticket: ticketNumbers
        },
        order: [['ticket', 'ASC'], ['createdAt', 'ASC']],
        attributes: ['ticket', 'message', 'type', 'createdAt'],
        raw: true
    });
    
    // Group messages by ticket number
    const messagesByTicket = allMessages.reduce((acc, msg) => {
        if (!acc[msg.ticket]) {
            acc[msg.ticket] = [];
        }
        acc[msg.ticket].push({
            message: msg.message,
            type: msg.type,
            createdAt: msg.createdAt
        });
        return acc;
    }, {});
    
    // Prepare bulk update data
    const updatePromises = getData.map(record => {
        record.messages = JSON.stringify(messagesByTicket[record.ticketNumber] || []);
        record.status = 1;
        return record.save();
    });
    
    // Execute all updates in parallel
    await Promise.all(updatePromises);
    
    console.log(`Saved messages for ${getData.length} ticket(s)`);

}
//summerize messages of ticket
export const summerizeMessagesOfTicket = async () => {
    DataController.cronTrack({cronFunction: "summerizeMessagesOfTicket", data: {}});
    const getData = await ChatgptConversationScoreAiWhatsappMessagesAnalysis.findAll({
        where: {
           status: 1
        },
        limit: 100,
        order: [['messageDate', 'DESC']]
    });
    for (const record of getData) {
        DataController.summarizeMessagesOfTicket(record);
    }
    console.log(`Started summarization for ${getData.length} ticket(s)`);
}
//analyze summary of messages of ticket
export const analyzeSummaryOfMessagesOfTicket = async () => {
    DataController.cronTrack({cronFunction: "analyzeSummaryOfMessagesOfTicket", data: {}});
    const getData = await ChatgptConversationScoreAiWhatsappMessagesAnalysis.findAll({
        where: {
           status: 2,
           gptSummary: {
               [db.Op.ne]: "No summary generated."
           }
        },
        limit: 100,
        order: [['messageDate', 'DESC']]
    });
    for (const record of getData) {
        DataController.analyzeSummaryOfMessagesOfTicket(record);
    }

}
// analyzeSummaryOfMessagesOfTicket();