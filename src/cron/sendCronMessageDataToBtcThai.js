import db from "../databases/models/index.js";
import "../config/environment.js";
import * as Sentry from "@sentry/node";
import { execSync } from "child_process";
import axios from "axios";
import DataController from "../controllers/data.controller.js";
import { or } from "sequelize";


const { ChatgptConversationScoreAiWhatsappMessages } = db;



export const sendCronMessageDataToBtcThai = async () => {
    DataController.cronTrack({cronFunction: "sendCronMessageDataToBtcThai", data: {}});
    const getmessages  = await ChatgptConversationScoreAiWhatsappMessages.findAll({ 
            where: { sendToBtc: false, type: 'agent' },
            attributes: ['id', 'message','ticket', 'agent', 'createdAt'],
            limit:100,
            order: [['createdAt', 'DESC']]
        },
    );

    if (getmessages.length === 0) {
           console.log('Messages not found');
        }
    
        const d = [];
        const messageIds = [];
    
        for (const message of getmessages) {
            d.push({ ticket: message.ticket, agent: message.agent, message: message.message, createdAt: message.createdAt });
            messageIds.push(message.id);
        }
    
        console.log("Messages to send:", d);
        console.log("Message IDs:", messageIds);
    
        const result = await DataController.sendMessageDataBtcThai(d, messageIds);
        console.log('Call data sent to BTC Thai started', result);
}