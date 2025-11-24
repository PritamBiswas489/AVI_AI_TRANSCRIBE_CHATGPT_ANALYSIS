import db from "../databases/models/index.js";
import "../config/environment.js";
import * as Sentry from "@sentry/node";
import { execSync } from "child_process";
import axios from "axios";
import DataController from "../controllers/data.controller.js";

const { ChatgptConversationScoreAiCalls } = db;

export const executeFailedTranscriptionAnalysis = async () => {
  DataController.cronTrack({cronFunction: "executeFailedTranscriptionAnalysis", data: {}});
  
  try {
    const failedTranscriptions = await ChatgptConversationScoreAiCalls.findAll({
      where: {
        operationName: "ERROR_IN_CHATGPT_TRANSCRIPTION_ANALYSIS",
      },
      limit: 1,
    });

    for (const transcription of failedTranscriptions) {
      try {
        await DataController.chatgptTranscriptionAnalysis(transcription);
        const getcall = await ChatgptConversationScoreAiCalls.findOne({
          where: { id: transcription.id },
        });
        if (
          getcall.operationName === "ERROR_IN_CHATGPT_TRANSCRIPTION_ANALYSIS"
        ) {
          getcall.operationName = "CHATGPT_TRANSCRIPTION_ANALYSIS_RETRIED";
          await getcall.save();
        }
        console.log(`Retried transcription for record ID: ${transcription.id}`);
      } catch (error) {
        const getcall = await ChatgptConversationScoreAiCalls.findOne({
          where: { id: transcription.id },
        });
        if (
          getcall.operationName === "ERROR_IN_CHATGPT_TRANSCRIPTION_ANALYSIS"
        ) {
          getcall.operationName = "CHATGPT_TRANSCRIPTION_ANALYSIS_RETRIED";
          await getcall.save();
        }
      }
    }
  } catch (error) {
    console.error(
      "Error executing failed transcriptions analysis:",
      error.message
    );
  }
};
