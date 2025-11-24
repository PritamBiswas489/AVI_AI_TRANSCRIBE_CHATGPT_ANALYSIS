import db from "../databases/models/index.js";
import "../config/environment.js";
import * as Sentry from "@sentry/node";
import { execSync } from "child_process";
import axios from "axios";
import DataController from "../controllers/data.controller.js";
import { or } from "sequelize";

const { ChatgptConversationScoreAiCalls } = db;


export const sendCronDataToBtcThai = async () => {
    DataController.cronTrack({cronFunction: "sendCronDataToBtcThai", data: {}});
     

    const getcalls = await ChatgptConversationScoreAiCalls.findAll(
        { 
            where: { sendToBtc: false },
            attributes: ['id', 'ticketNumber','hookTwoRequest'],
            limit:100,
            order: [['createdAt', 'DESC']]
        },
    );
    if (getcalls.length === 0) {
        console.log('No call records found to send to BTC Thai.');
        return;
    }
     const d = [];
         const callIds = []; 
         
         for (const call of getcalls) {
            d.push({ ticket_code: call.ticketNumber, data: JSON.parse(call.hookTwoRequest)});
            callIds.push(call.id);
         }
         console.log('Prepared call data for BTC Thai:', JSON.stringify(d));
         console.log('Call IDs to update after sending:', JSON.stringify(callIds));
        const result = await DataController.sendCallDataBtcThai(d, callIds);
        console.log('Call data sent to BTC Thai started', JSON.stringify(result));
}
// sendCronDataToBtcThai();