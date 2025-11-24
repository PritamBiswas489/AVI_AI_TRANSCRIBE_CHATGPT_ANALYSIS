import db from "../databases/models/index.js";
import "../config/environment.js";
import * as Sentry from "@sentry/node";
import { execSync } from "child_process";
import axios from "axios";
import DataController from '../controllers/data.controller.js';

const {
  ChatgptConversationScoreAiCalls
} = db;

export const executeFailedTranscription = async () => {
  DataController.cronTrack({cronFunction: "executeFailedTranscription", data: {}});
  try {
    const failedTranscriptions = await ChatgptConversationScoreAiCalls.findAll({
      where: {
        operationName: "ERROR_IN_CHATGPT_TRANSCRIPTION"
      },
      limit: 1
    });

     
       for (const transcription of failedTranscriptions) {
        console.log(`Retrying transcription for record ID: ${transcription.id}`);
         try {
           await DataController.chatgptTranscription(transcription);
           console.log(
             `Retried transcription for record ID: ${transcription.id}`
           );
           const getcall = await ChatgptConversationScoreAiCalls.findOne({
             where: { id: transcription.id },
           });
           if (getcall.operationName === "ERROR_IN_CHATGPT_TRANSCRIPTION") {
             getcall.operationName = "CHATGPT_TRANSCRIPTION_RETRIED";
             await getcall.save();
           }
         } catch (error) {
         
           const getcall = await ChatgptConversationScoreAiCalls.findOne({
             where: { id: transcription.id },
           });

          
           if (getcall.operationName === "ERROR_IN_CHATGPT_TRANSCRIPTION") {
             getcall.operationName = "CHATGPT_TRANSCRIPTION_RETRIED";
             await getcall.save();
           }
         }
       }

   
  } catch (error) {
     console.error("Error executing failed transcriptions:", error.message);
  }
};



