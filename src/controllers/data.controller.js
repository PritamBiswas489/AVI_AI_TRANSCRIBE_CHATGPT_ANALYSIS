import db from "../databases/models/index.js";
import "../config/environment.js";
import * as Sentry from "@sentry/node";
import { execSync } from "child_process";
import axios from "axios";
import FormData from "form-data";
import { promptTranscriptSummary, promptTranscriptSummaryGpt4_1 , promptTranscriptSummaryProcess} from "../config/prompt.js";
import { transcribeWithDiarization, extractSegments } from "../transcribe.js";

import {
  resolve as pathResolve,
  dirname,
  basename,
  join as pathJoin,
} from "path";
import fetch from "node-fetch";
import fs from "fs";
import { or } from "sequelize";
const {
  ChatgptConversationScoreAi,
  ChatgptConversationScoreAiCalls,
  ChatgptConversationScoreAiChat,
  ChatgptConversationScoreAiChatMessages,
} = db;

export default class DataController {
  //call list
  static ffprobePath = process.env.FFPROBE_PATH; // Update this path to your ffprobe location
  static ffmpegPath = process.env.FFMPEG_PATH; // Update this path to your ffmpeg location
  static chatGptModel = "gpt-5-mini"; // or "gpt-4o" or "gpt-4o-mini"
  constructor() {}
  static async callList(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;
    try {
      const { page = 1, limit = 10 } = payload;
      const offset = (page - 1) * limit;
      const { count, rows } =
        await ChatgptConversationScoreAiCalls.findAndCountAll({
          include: [{ model: ChatgptConversationScoreAi, as: "conversation" }],
          offset,
          limit: parseInt(limit, 10),
          order: [["id", "DESC"]],
        });
      return {
        status: 200,
        data: { total: count, list: rows },
        error: null,
      };
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: error.message },
      };
    }
  }
  static async getPhoneCalls(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;
    try {
      const phoneNumbers = (payload?.phoneNumbers || "").split(",").map((num) => num.trim()).filter(Boolean);
      

      const includeCalls = { model: ChatgptConversationScoreAiCalls, as: "calls", required: false };
      includeCalls.where = { operationName: {
        [db.Sequelize.Op.notIn]: [
          "ERROR_IN_CHUNKING_FILES",
          "ERROR_IN_CHATGPT_TRANSCRIPTION",
          "ERROR_IN_CHATGPT_TRANSCRIPTION_ANALYSIS",
          "CHATGPT_TRANSCRIPTION_RETRIED",
          "CHATGPT_TRANSCRIPTION_ANALYSIS_RETRIED"
        ],
      }, };
      includeCalls.order = [["id", "DESC"]];
       

      const { count, rows } = await ChatgptConversationScoreAi.findAndCountAll({
        include: [includeCalls],
        where: {
          phoneNumber: {
        [db.Sequelize.Op.in]: phoneNumbers,
          },
        },
        order: [["createdAt", "DESC"]],
      });
      let organizedData = {};
      for (let row of rows) {
        
        if (typeof organizedData[row.phoneNumber] === "undefined") {
          organizedData[row.phoneNumber] = [];
        }

        // Process calls data if it exists
        if (row.calls && row.calls.length > 0) {
           
          const callDataList = row.calls.map((call) => {
            const callData = call.toJSON ? call.toJSON() : call;
            
            // Parse JSON fields
            try {
              if (callData.chunkFolderPath) {
                callData.chunkFolderPath = JSON.parse(callData.chunkFolderPath);
              }
            } catch (e) {
              console.error(
                "Error parsing chunkFolderPath for call",
                callData.id,
                e
              );
            }

            try {
              if (callData.chatgptText) {
                callData.chatgptText = JSON.parse(callData.chatgptText);
              }
            } catch (e) {
              console.error(
                "Error parsing chatgptText for call",
                callData.id,
                e
              );
            }

            try {
              if (callData.hookTwoRequest) {
                callData.hookTwoRequest = JSON.parse(callData.hookTwoRequest);
              }
            } catch (e) {
              console.error(
                "Error parsing hookTwoRequest for call",
                callData.id,
                e
              );
            }

            return callData;
          });
          // Sort callDataList by id in descending order
          callDataList.sort((a, b) => b.id - a.id);
          row = { ...row.toJSON(), calls: callDataList };
        }

        organizedData[row.phoneNumber].push(row);
      }

      return {
        status: 200,
        data: { total: count, list: organizedData },
        error: null,
      };
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: error.message },
      };
    }
  }
  static async getCallDetails(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    const callId = payload?.callId || null;

    try {
      const record = await ChatgptConversationScoreAiCalls.findOne({
        include: [{ model: ChatgptConversationScoreAi, as: "conversation" }],
        where: { id: callId },
      });
      if (!record) {
        return {
          status: 404,
          data: null,
          error: { message: "Call record not found" },
        };
      }
      return {
        status: 200,
        data: record,
        error: null,
      };
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: error.message },
      };
    }
  }
  static async getPendingCalls(request) {
    const {
      payload,
      headers: { i18n },
    } = request;
    try {
       const { page = 1, limit = 10 } = payload;
      const offset = (page - 1) * limit;
      const { count, rows } =
        await ChatgptConversationScoreAiCalls.findAndCountAll({
          include: [{ model: ChatgptConversationScoreAi, as: "conversation" }],
          where: {
            operationName: {
              [db.Sequelize.Op.notIn]: [
                "ERROR_IN_CHUNKING_FILES",
                "ERROR_IN_CHATGPT_TRANSCRIPTION",
                "ERROR_IN_CHATGPT_TRANSCRIPTION_ANALYSIS",
                "COMPLETED_SEND_TRANSCRIPT_TO_CLIENT",
              ],
            },
          },
          offset,
          limit: parseInt(limit, 10),
          order: [["id", "DESC"]],
        });
         // Parse JSON fields for each row
       const processedRows = rows.map((row) => {
         const rowData = row.toJSON();
         try {
           if (rowData.chatgptText) {
             rowData.chatgptText = JSON.parse(rowData.chatgptText);
           }
         } catch (e) {
           console.error("Error parsing chatgptText for row", rowData.id, e);
         }

         try {
           if (rowData.chunkFolderPath) {
             rowData.chunkFolderPath = JSON.parse(rowData.chunkFolderPath);
           }
         } catch (e) {
           console.error(
             "Error parsing chunkFolderPath for row",
             rowData.id,
             e
           );
         }

         try {
           if (rowData.hookTwoRequest) {
             rowData.hookTwoRequest = JSON.parse(rowData.hookTwoRequest);
           }
         } catch (e) {
           console.error(
             "Error parsing hookTwoRequest for row",
             rowData.id,
             e
           );
         }

         return rowData;
       });
      return {
        status: 200,
        data: { total: count, list: processedRows },
        error: null,
      };
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: error.message },
      };
    }
  }

  static async getCompletedCalls(request) {
     const {
      payload,
      headers: { i18n },
    } = request;
    try {
       const { page = 1, limit = 10 } = payload;
       const offset = (page - 1) * limit;
       const { count, rows } =
         await ChatgptConversationScoreAiCalls.findAndCountAll({
           include: [{ model: ChatgptConversationScoreAi, as: "conversation" }],
           where: {
             operationName: {
               [db.Sequelize.Op.in]: ["COMPLETED_SEND_TRANSCRIPT_TO_CLIENT"],
             },
           },
           offset,
           limit: parseInt(limit, 10),
           order: [["id", "DESC"]],
         });

       // Parse JSON fields for each row
       const processedRows = rows.map((row) => {
         const rowData = row.toJSON();
         try {
           if (rowData.chatgptText) {
             rowData.chatgptText = JSON.parse(rowData.chatgptText);
           }
         } catch (e) {
           console.error("Error parsing chatgptText for row", rowData.id, e);
         }

         try {
           if (rowData.chunkFolderPath) {
             rowData.chunkFolderPath = JSON.parse(rowData.chunkFolderPath);
           }
         } catch (e) {
           console.error(
             "Error parsing chunkFolderPath for row",
             rowData.id,
             e
           );
         }
         try {
           if (rowData.hookTwoRequest) {
             rowData.hookTwoRequest = JSON.parse(rowData.hookTwoRequest);
           }
         } catch (e) {
           console.error(
             "Error parsing hookTwoRequest for row",
             rowData.id,
             e
           );
         }

         

         return rowData;
       });
      
      return {
      status: 200,
      data: { total: count, list: processedRows },
      error: null,
      };
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: error.message },
      };
    }


  }
  //phone and ticket number webhook
  static async webhookOne(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    try {
      const code = payload?.code || null;
      const phone = payload?.phone || null;
      if (code && phone) {
        // Remove any quotes from the values
        const ticketNumber = code.replace(/"/g, "");
        const phoneNumber = phone.replace(/"/g, "");

        // Check if record exists
        let record = await ChatgptConversationScoreAi.findOne({
          where: {
            ticketNumber: ticketNumber,
            phoneNumber: phoneNumber,
          },
        });

        // If no record exists, create one
        if (!record) {
          record = await ChatgptConversationScoreAi.create({
            ticketNumber: ticketNumber,
            phoneNumber: phoneNumber,
          });
        }

        return {
          status: 200,
          data: {
            status: "success",
            message: "Webhook One processed successfully",
            record,
          },
          error: null,
        };
      }
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: error.message },
      };
    }
  }
  //call data webhook
  static async webhookTwo(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    const sequelize = db.sequelize; // get sequelize instance

    let transaction;
    try {
      transaction = await db.sequelize.transaction();

      const data = payload;
      if (data.Status === "ANSWER" && data.Direction === "OUT") {
        const contact = data.Contact || "";
        const Username = data.Username || "";
        // Check if Username contains @btcthailand.onmicrosoft.com and return 500 status
        if (Username && Username.includes("@btcthailand.onmicrosoft.com")) {
          await transaction.rollback();
          return {
            status: 500,
            data: null,
            error: { message: "Username not allowed", reason: "Username contains @btcthailand.onmicrosoft.com" },
          };
        }


        const folderPathMp3Files = pathResolve(
          pathJoin(dirname("./"), "uploads", "score_ai", "mp3Files")
        );

        // Create directory if it doesn't exist
        if (!fs.existsSync(folderPathMp3Files)) {
          fs.mkdirSync(folderPathMp3Files, { recursive: true });
        }

        if (!contact) {
          throw new Error("Contact not found in webhook data");
        }

        const record = await ChatgptConversationScoreAi.findOne({
          where: { phoneNumber: contact },
          order: [["createdAt", "DESC"]],
          transaction,
        });

        if (!record) {
          await transaction.rollback();
          return {
            status: 404,
            data: null,
            error: { message: "Record not found" },
          };
        }

        if (!fs.existsSync(folderPathMp3Files)) {
          throw new Error(
            "Mp3 files Directory does not exist or is not accessible"
          );
        }

        // Download and save MP3 file
        const recUrlLimited = data.RecUrlLimited || "";
        const fileName = basename(recUrlLimited.split("?")[0]);

        const response = await fetch(recUrlLimited);
        const mp3Data = await response.buffer();

        const filePath = `${folderPathMp3Files}/${fileName}`;
        fs.writeFileSync(filePath, mp3Data);

        if (!fs.existsSync(filePath)) {
          throw new Error("Failed to save MP3 file");
        }

        // Create new call record
        const callRecord = await ChatgptConversationScoreAiCalls.create(
          {
            mainRecordId: record.id,
            ticketNumber: record.ticketNumber,
            hookTwoRequest: JSON.stringify(data),
            userEmail: data.Username || "",
            durations: data.Duration || 0,
            operationName: "SEND_TRANSCRIPT_TO_CLIENT",
            mp3File: `${folderPathMp3Files}/${fileName}`,
          },
          { transaction }
        );

        await transaction.commit();
        if (!callRecord) {
          await transaction.rollback();
          return {
            status: 404,
            data: null,
            error: { message: "Call record not found" },
          };
        }

        console.log(
          "================= mp3 file chunking started in background ================="
        );
        this.sendRecordToClient(callRecord); // Not awaited, runs in background
        this.chunkmediafiles(callRecord); // Not awaited, runs in background
        console.log(
          "================= mp3 file chunking ended ================="
        );

        return {
          status: 200,
          data: {
            status: "success",
            message: fileName,
            mp3: filePath,
            record: record,
            callRecord: callRecord,
          },
          error: null,
        };
      } else {
        await transaction.rollback();
      }
    } catch (error) {
      if (transaction) await transaction.rollback();
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return {
        status: 500,
        data: [],
        error: { message: i18n.__("CATCH_ERROR"), reason: error.message },
      };
    }
  }
  static async getAudioDuration(filePath) {
    try {
      const normalizedPath = pathResolve(filePath).replace(/\\/g, "/");

      // Update ffprobe path to your actual location
      const cmd = `${this.ffprobePath} -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${normalizedPath}"`;

      const output = execSync(cmd).toString().trim();
      return Math.floor(parseFloat(output));
    } catch (error) {
      console.error("Error getting duration:", error.message);
      return 0;
    }
  }
  //chunking mp3 file
  static async chunkmediafiles(callrecord) {
    try {
      console.log("================= mp3 file chunking =================");
      const ticketNumber = callrecord.ticketNumber;
      const mp3File = callrecord.mp3File;
      const chunkSubFolderName = `chunk_${ticketNumber}_${callrecord.id}`;
      const chunkSubFolderPath = pathResolve(
        pathJoin(
          dirname("./"),
          "uploads",
          "score_ai",
          "chunkFiles",
          chunkSubFolderName
        )
      );

      if (fs.existsSync(chunkSubFolderPath)) {
        const files = fs.readdirSync(chunkSubFolderPath);
        for (const file of files) {
          const filePath = pathJoin(chunkSubFolderPath, file);
          if (fs.lstatSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
          }
        }
      } else {
        fs.mkdirSync(chunkSubFolderPath, { recursive: true });
      }

      const sourceFile = mp3File;
      const chunkLengthMinutes = 10;
      const chunkSeconds = chunkLengthMinutes * 60;
      const outputDir = chunkSubFolderPath;
      const duration = await this.getAudioDuration(callrecord.mp3File);
      const chunks = [];
      console.log("Duration:", duration);

      const normalizedPath = pathResolve(sourceFile).replace(/\\/g, "/");

      for (let i = 0, chunk = 1; i < duration; i += chunkSeconds, chunk++) {
        const outputFile = pathJoin(outputDir, `chunk_${chunk}.mp3`);
        const cmd = `${this.ffmpegPath} -y -i ${sourceFile} -ss ${i} -t ${chunkSeconds} -acodec copy ${outputFile}`;
        execSync(cmd).toString().trim();
        chunks.push(outputFile);
      }
      console.log("Chunks created:", chunks);
      if (chunks.length === 0) {
        throw new Error("NO_CHUNK_FILES_CREATED");
      }
      // Update record
      callrecord.chunkFolderPath = JSON.stringify(chunks);
      callrecord.operationName =
        "START_PROCESS_CHUNK_FILES_TO_CHATGPT_TRANSCRIPT";
      await callrecord.save();
      this.chatgptTranscription(callrecord); // Not awaited, runs in background
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      callrecord.operationName = "ERROR_IN_CHUNKING_FILES";
      await callrecord.save();
      console.error("Error in chunkmediafiles:", error.message);
    }
  }
  //chatgpt transcription
  static async chatgptTranscription(callrecord) {
    console.log(
      "=============== chatgpt transcription start ================="
    );
    try {
      const chunkFolderPath = JSON.parse(callrecord.chunkFolderPath || "[]");
      let fullText = "";
      for (const filePath of chunkFolderPath) {
        console.log("Processing file:", filePath);

        const formData = new FormData();
        formData.append("model", "gpt-4o-transcribe"); // or "whisper-1"
        formData.append("file", fs.createReadStream(filePath), {
          filename: basename(filePath),
          contentType: "audio/mp3",
        });
        const response = await axios.post(
          "https://api.openai.com/v1/audio/transcriptions",
          formData,
          {
            headers: {
              Authorization: `Bearer ${process.env.CHATGPT_API_KEY}`,
              ...formData.getHeaders(),
            },
            timeout: 60000, // 60s timeout per file
          }
        );
        // 5️⃣ Extract text
        const data = response?.data;
        const chunkText = (data.text || "").trim();
        fullText += chunkText.replace(/\n/g, "\r\n") + "\r\n\r\n";
      }
      console.log(
        `Full transcript for record id ${callrecord.id}:\n`,
        fullText
      );
      if (fullText.trim().length > 0) {
        callrecord.speechText = fullText;
        callrecord.operationName = "COMPLETED_SPEECH_TO_TEXT";
        await callrecord.save();
        this.deleteCallFiles(callrecord); // Not awaited, runs in background
        this.chatgptTranscriptionAnalysis(callrecord);
      } else {
        throw new Error("NO_TRANSCRIPTION_TEXT_FOUND");
      }
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      callrecord.operationName = "ERROR_IN_CHATGPT_TRANSCRIPTION";
      await callrecord.save();
      console.error("Error in chatgptTranscription:", error.message);
    }
    console.log("=============== chatgpt transcription end =================");
  }

  static async chatgptTranscriptionTranscribeDiarize(callrecord) {
    console.log("=============== chatgpt transcription transcribe diarize start =================");
    try {
      const chunkFolderPath = JSON.parse(callrecord.chunkFolderPath || "[]");
      const transcribeJsonResults = [];
      for (const filePath of chunkFolderPath) {
        console.log("Processing file for diarization:", filePath);
        const resp = await transcribeWithDiarization(filePath);
        const segments = extractSegments(resp);
        console.log(`Diarized segments for file ${filePath}:`, segments);
        transcribeJsonResults.push(...segments);
      }
      console.log("============== Diarized segments =================================");
      console.log(transcribeJsonResults);
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      // callrecord.operationName = "ERROR_IN_CHATGPT_TRANSCRIPTION_TRANSCRIBE_DIARIZE";
      // await callrecord.save();
      console.error("Error in chatgptTranscriptionTranscribeDiarize:", error.message);
    }
  }
  //chatgpt transcription analysis
  static async chatgptTranscriptionAnalysis(callrecord) {
    console.log(
      "================= chatgpt transcription analysis start ================="
    );
    try {
      const speechText = callrecord.speechText;
      const prompt = promptTranscriptSummaryProcess(speechText);
      const pData = {
        model: this.chatGptModel, // "gpt-4o" or "gpt-4o-mini" or "gpt-5-mini".
        messages: [
          {
            role: "system",
            content:
              "You are a conversation analysis assistant for a travel agency.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_completion_tokens: 32000,
      };
      console.log("Prompt to GPT:", pData); // Log first 1000 chars of prompt
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        pData,
        {
          headers: {
            Authorization: `Bearer ${process.env.CHATGPT_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 120000,
        }
      );
      console.log("GPT Response:", response);
      const gptMessage =
        response.data?.choices?.[0]?.message?.content ||
        JSON.stringify({ error: "No content returned from GPT" });

      // Step 4: Parse JSON safely
      let parsed = {};
      try {
        parsed = JSON.parse(gptMessage);
      } catch {
        parsed = { summary: gptMessage };
      }
      console.log("GPT Response:", parsed);
      await callrecord.update({
        chatgptText: JSON.stringify(parsed, null, 2),
        chatgptModel: this.chatGptModel,
        satisfaction: parsed?.service_score?.expected_satisfaction || 0,
        operationName: "COMPLETED_SEND_TRANSCRIPT_TO_CLIENT",
      });
      
      console.log(
        "================= chatgpt transcription analysis end ================="
      );
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      callrecord.operationName = "ERROR_IN_CHATGPT_TRANSCRIPTION_ANALYSIS";
      callrecord.chatgptModel = this.chatGptModel;
      await callrecord.save();
      console.error("Error in chatgptTranscriptionAnalysis:", error.message);
    }
  }
  static async chatgptTranscriptionAnalysis_gpt_4_1(callrecord) {
    const modelversion = "gpt-4.1";
    console.log(
      "============= start transcription analysis with model " +
        modelversion +
        " ============="
    );
    try {
      const speechText = callrecord.speechText;
      const prompt = promptTranscriptSummaryGpt4_1(speechText);
      const pData = {
        model: modelversion,
        messages: [
          {
            role: "system",
            content:
              "You are a conversation analysis assistant for a travel agency.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 32000,
        temperature: 0.7,
      };
      // console.log("Prompt to GPT:", pData);
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        pData,
        {
          headers: {
            Authorization: `Bearer ${process.env.CHATGPT_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 120000,
        }
      );
      console.log("GPT Response:", response);
      const gptMessage =
        response.data?.choices?.[0]?.message?.content ||
        JSON.stringify({ error: "No content returned from GPT" });

      // Step 4: Parse JSON safely
      let parsed = {};
      try {
        parsed = JSON.parse(gptMessage);
      } catch {
        parsed = { summary: gptMessage };
      }
      console.log("GPT Response:", parsed);
      await callrecord.update({
        chatgptText: JSON.stringify(parsed, null, 2),
        chatgptModel: modelversion,
        satisfaction: parsed?.service_score?.expected_satisfaction || 0,
        operationName: "COMPLETED_SEND_TRANSCRIPT_TO_CLIENT",
      });
      this.deleteCallFiles(callrecord); // Not awaited, runs in background
      console.log(
        "================= chatgpt transcription analysis end ================="
      );
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      callrecord.operationName = "ERROR_IN_CHATGPT_TRANSCRIPTION_ANALYSIS";
      callrecord.chatgptModel = this.chatGptModel;
      await callrecord.save();
      console.error("Error in chatgptTranscriptionAnalysis:", error.message);
    }
  }
  static async chatgptTranscriptionAnalysis_gpt_4_1_mini(callrecord) {
    const modelversion = "gpt-4.1-mini";
    console.log(
      "============= start transcription analysis with model " +
        modelversion +
        " ============="
    );
    try {
      const speechText = callrecord.speechText;
      const prompt = promptTranscriptSummaryGpt4_1(speechText);
      const pData = {
        model: modelversion,
        messages: [
          {
            role: "system",
            content:
              "You are a conversation analysis assistant for a travel agency.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 32000,
        temperature: 0.7,
      };
      // console.log("Prompt to GPT:", pData);
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        pData,
        {
          headers: {
            Authorization: `Bearer ${process.env.CHATGPT_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 120000,
        }
      );
      console.log("GPT Response:", response);
      const gptMessage =
        response.data?.choices?.[0]?.message?.content ||
        JSON.stringify({ error: "No content returned from GPT" });

      // Step 4: Parse JSON safely
      let parsed = {};
      try {
        parsed = JSON.parse(gptMessage);
      } catch {
        parsed = { summary: gptMessage };
      }
      console.log("GPT Response:", parsed);
      await callrecord.update({
        chatgptText: JSON.stringify(parsed, null, 2),
        chatgptModel: modelversion,
        satisfaction: parsed?.service_score?.expected_satisfaction || 0,
        operationName: "COMPLETED_SEND_TRANSCRIPT_TO_CLIENT",
      });
      this.deleteCallFiles(callrecord); // Not awaited, runs in background
      console.log(
        "================= chatgpt transcription analysis end ================="
      );
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      callrecord.operationName = "ERROR_IN_CHATGPT_TRANSCRIPTION_ANALYSIS";
      callrecord.chatgptModel = this.chatGptModel;
      await callrecord.save();
      console.error("Error in chatgptTranscriptionAnalysis:", error.message);
    }
  }
  static async chatgptTranscriptionAnalysis_gpt_4_1_nano(callrecord) {
    const modelversion = "gpt-4.1-nano";
    console.log(
      "============= start transcription analysis with model " +
        modelversion +
        " ============="
    );
  }
  static async chatgptTranscriptionAnalysis_gpt_3_5_turbo(callrecord) {
    const modelversion = "gpt-3.5-turbo";
    console.log(
      "============= start transcription analysis with model " +
        modelversion +
        " ============="
    );
  }
  static async chatgptTranscriptionAnalysis_gpt_5(callrecord) {
    const modelversion = "gpt-5";
    console.log(
      "============= start transcription analysis with model " +
        modelversion +
        " ============="
    );
  }
  static async chatgptTranscriptionAnalysis_gpt_5_mini(callrecord) {
    const modelversion = "gpt-5-mini";
    console.log(
      "============= start transcription analysis with model " +
        modelversion +
        " ============="
    );
  }

  static async sendRecordToClient(callrecord) {
    console.log(
      "================= send record to client start ================="
    );
    try {
      const hookTwoRequestArray = JSON.parse(callrecord.hookTwoRequest || "{}");

      // 3️⃣ Extract fields safely
      const callType = hookTwoRequestArray?.Direction || "";
      const startTime = hookTwoRequestArray?.StartTimeUTC || "";
      const endTime = hookTwoRequestArray?.EndTimeUTC || "";
      const duration = hookTwoRequestArray?.Duration || "";
      const customerNumber = hookTwoRequestArray?.Contact || "";
      const calledFrom = hookTwoRequestArray?.Agent || "";
      const userEmail = hookTwoRequestArray?.Username || "";
      const recordingUrl = `https://btc-thai.com/offer/iw/user/dashboard/chatgptdbscore_transcript?phno=${customerNumber}&ticket=${callrecord.ticketNumber}&cid=${callrecord.id}`;

      const parts = [];
      if (callType) parts.push(`Call type: ${callType}`);
      if (startTime) parts.push(`Start time: ${startTime}`);
      if (endTime) parts.push(`End time: ${endTime}`);
      if (duration) parts.push(`Duration: ${duration} seconds`);
      if (customerNumber) parts.push(`Customer Number: ${customerNumber}`);
      if (calledFrom) parts.push(`Called From: ${calledFrom}`);
      if (userEmail) parts.push(`User: ${userEmail}`);
      if (recordingUrl) parts.push(`transcript: ${recordingUrl}`);

      const finalText = parts.join(", ");
      console.log("Final text to send:", finalText);

      const apiKey = "zbyc88srdipq5lye48p1to1pnjvj65ld";
      const url = `https://tickets.lametayel-thailand.com/api/conversations/${callrecord.ticketNumber}/messages`;

      const apiUrl = `${url}?apikey=${apiKey}`;

      const { data } = await axios.post(
        apiUrl,
        { message: finalText, apiKey: apiKey },
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      console.log("Response from client API:", data);

      const responseStatus = data?.response?.status?.toLowerCase?.() || "";
      console.log(`Ticket Number: ${callrecord.ticketNumber}, Response:`, data);
      if (responseStatus === "ok") {
        await callrecord.update({
          operation_name: "SONIX_START_UPLOAD_MP3_FILES",
          send_return: 1,
        });
        console.log(`✅ Updated record for Ticket ${callrecord.ticketNumber}`);
      } else {
        console.warn(
          `⚠️ Failed response for Ticket ${callrecord.ticketNumber}`
        );
      }

      console.log(
        "================= send record to client end ================="
      );
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      console.error("Error in sendRecordToClient:", error.message);
    }
  }
  static async deleteCallFiles(callrecord) {
    try {
      const mp3File = callrecord.mp3File;
      console.log("Deleting MP3 file:", mp3File);
      if (mp3File && fs.existsSync(mp3File)) {
        fs.unlinkSync(mp3File);
        console.log(`Deleted MP3 file: ${mp3File}`);
      }
      const chunkFolderPath = JSON.parse(callrecord.chunkFolderPath || "[]");
      for (const filePath of chunkFolderPath) {
        if (filePath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted chunk file: ${filePath}`);
        }
      }
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      console.error("Error deleting call files:", error.message);
    }
  }

  static async getScoreAllUnSummrizedMessages(ticketNumber, callId) {
    try {
      // ✅ Find the chat session
      const session = await ChatgptConversationScoreAiChat.findOne({
        where: { ticketNumber, callId },
      });

      if (!session) {
        return { summary: "", messages: [] };
      }

      // ✅ Fetch unsummarized messages ordered by creation time
      const messages = await ChatgptConversationScoreAiChatMessages.findAll({
        where: {
          chatId: session.id,
          summarized: 0,
        },
        order: [["createdAt", "ASC"]],
        limit: 100, // optional limit, you can chunk manually if huge dataset
      });

      const allMessages = messages.map((msg) => ({
        role: msg.sender,
        content: msg.message.replace(/\n/g, "<br>"), // same as nl2br
      }));

      return {
        summary: session.summary || "",
        messages: allMessages,
      };
    } catch (err) {
      console.error("Error in getScoreAllUnSummrizedMessages:", err);
      return { summary: "", messages: [] };
    }
  }

  static async createScoreNewMessage(ticketNumber, callId, sender, message) {
    try {
      let session = await ChatgptConversationScoreAiChat.findOne({
        where: { ticketNumber, callId },
      });

      if (!session) {
        session = await ChatgptConversationScoreAiChat.create({
          ticketNumber,
          callId,
        });
      }

      const newMessage = await ChatgptConversationScoreAiChatMessages.create({
        chatId: session.id,
        ticketNumber,
        callId,
        sender,
        message,
      });

      return newMessage;
    } catch (err) {
      console.error("Error in createScoreNewMessage:", err);
      throw err;
    }
  }
  static async summarizeChatMessages(ticketNumber, callId) {
    try {
      const chatGptModel = "gpt-4o-mini"; // replace with your model if needed
      const session = await ChatgptConversationScoreAiChat.findOne({
        where: { ticketNumber, callId },
      });

      if (!session) return;

      const summarizedMessageLimit = 6;
      let allMessages = [];
      let content = "";
      let summarized_messages_ids = [];

      // Count unsummarized messages
      const countUnSummarizedMessages =
        await ChatgptConversationScoreAiChatMessages.count({
          where: { chatId: session.id, summarized: 0 },
        });
      console.log("Count of unsummarized messages:", countUnSummarizedMessages);
      if (countUnSummarizedMessages > 2) {
        const messages = await ChatgptConversationScoreAiChatMessages.findAll({
          where: { chatId: session.id, summarized: 0 },
          order: [["createdAt", "ASC"]],
          limit: summarizedMessageLimit,
        });

        messages.forEach((m) => {
          summarized_messages_ids.push(m.id);
          content += `${m.sender}: ${m.message}\n`;
        });

        if (session.summary) {
          const existingSummary = session.summary;
          const combinedInput = `Previous summary:\n${existingSummary}\n\nNew messages:\n${content}`;
          allMessages = [
            {
              role: "system",
              content:
                "Please update the existing summary by including the new messages.",
            },
            { role: "user", content: combinedInput },
          ];
        } else {
          allMessages = [
            {
              role: "system",
              content: "Summarize the following conversation:",
            },
            { role: "user", content },
          ];
        }

        const postData = {
          model: chatGptModel,
          messages: allMessages,
          max_tokens: 1024,
          temperature: 0.7,
        };

        const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          postData,
          {
            headers: {
              Authorization: `Bearer ${process.env.CHATGPT_API_KEY}`,
              "Content-Type": "application/json",
            },
            timeout: 120000,
          }
        );

        const message = response?.data?.choices?.[0]?.message?.content;

        if (message) {
          // Update session summary
          session.summary = message;
          await session.save();

          // Mark messages as summarized
          await ChatgptConversationScoreAiChatMessages.update(
            { summarized: 1 },
            { where: { id: summarized_messages_ids } }
          );
        }
      }
    } catch (err) {
      console.error("Error in summarizeChatMessages:", err.message);
    }
  }

  static promptTranscriptQuestionAnswer(conversationString, userQuestion) {
    return `
You are a smart assistant working for a travel agency.  
You have access to a full **Hebrew-language** transcript of a conversation between a **travel agent** and a **customer**.

The user will now ask a **specific question** about this conversation.  
Your job is to answer that question **based solely on the content of the conversation transcript**.

Your answer should:
- Be written in **Hebrew**
- Be as accurate and detailed as possible
- Rely only on what is present or inferable from the transcript
- Avoid guessing or introducing outside knowledge not mentioned in the conversation
- If the question cannot be answered, say so clearly and explain why

---

**Conversation Transcript**:
${conversationString}

---

**User Question**:
${userQuestion}

---

**Answer (in Hebrew):**
    `.trim();
  }

  static async chatgptChatTranscription(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    try {
      const { ticketNumber, callId, message: inputMessage } = payload;

      console.log("Received chat transcription request:", payload);
      const getAllChatMessages = await this.getScoreAllUnSummrizedMessages(
        ticketNumber,
        callId
      );
      console.log("Fetched chat messages:", getAllChatMessages);
      await this.createScoreNewMessage(
        ticketNumber,
        callId,
        "user",
        inputMessage
      );
      const record = await ChatgptConversationScoreAiCalls.findOne({
        where: { ticketNumber, id: callId },
      });

      const speechText = record?.speechText || "";
      let conversationString = speechText;

      let aiMessagesFormat = [
        { role: "system", content: "You are a helpful assistant." },
      ];

      if (getAllChatMessages?.summary) {
        aiMessagesFormat.push({
          role: "user",
          content: `Summary of our previous conversation: ${getAllChatMessages.summary}`,
        });

        if (getAllChatMessages.messages?.length) {
          let content = "";
          for (const m of getAllChatMessages.messages) {
            content += `${m.role}: ${m.content}\n`;
          }
          aiMessagesFormat.push({
            role: "user",
            content: `Other conversations between us after previous conversation: ${content}`,
          });
        }
      } else {
        aiMessagesFormat = aiMessagesFormat.concat(
          getAllChatMessages.messages || []
        );
      }

      const prompt = this.promptTranscriptQuestionAnswer(
        conversationString,
        inputMessage
      );
      aiMessagesFormat.push({ role: "system", content: prompt });

      // console.log("Messages to send to GPT:", aiMessagesFormat);

      const postData = {
        model: "gpt-5-mini", // "gpt-4o" or "gpt-4o-mini" or "gpt-5-mini".
        messages: aiMessagesFormat,
        max_completion_tokens: 5000,
      };
      console.log("======= Start GPT Call =======");
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        postData,
        {
          headers: {
            Authorization: `Bearer ${process.env.CHATGPT_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 120000,
        }
      );

      const gptMessage =
        response.data?.choices?.[0]?.message?.content ||
        "No content returned from GPT";

      if (gptMessage) {
        const newMsg = await this.createScoreNewMessage(
          ticketNumber,
          callId,
          "assistant",
          gptMessage
        );

        this.summarizeChatMessages(ticketNumber, callId);

        const responseMessages = [
          {
            id: newMsg.id,
            role: "assistant",
            content: gptMessage.replace(/\n/g, "<br>"),
          },
        ];

        return {
          status: 200,
          data: {
            status: "success",
            message: "Message processed successfully",
            responseMessages,
          },
          error: null,
        };
      } else {
        return {
          status: 500,
          data: null,
          error: { message: "No response from GPT" },
        };
      }
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return {
        status: 500,
        data: null,
        error: { message: i18n.__("CATCH_ERROR"), reason: error.message },
      };
    }
  }
  static async getAllScoreChatMessages(ticketNumber, callId) {
    const session = await ChatgptConversationScoreAiChat.findOne({
      where: { ticketNumber, callId },
    });
    if (!session) {
      return { summary: "", messages: [] };
    }

    // Fetch all related messages ordered by creation date
    const messages = await ChatgptConversationScoreAiChatMessages.findAll({
      where: { chatId: session.id }, // assuming relation via callId
      order: [["createdAt", "ASC"]],
      attributes: ["id", "sender", "message"], // fetch only needed fields
    });

    // Format messages to match Laravel output
    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      role: msg.sender,
      content: msg.message,
    }));

    // Return the result
    return {
      summary: session.summary || "",
      messages: formattedMessages,
    };
  }

  static async getChatgptChatTranscriptionMessages(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    try {
      const messages = await this.getAllScoreChatMessages(
        payload.ticketNumber,
        payload.callId
      );
      return {
        status: 200,
        data: {
          status: "success",
          message: "Messages retrieved successfully",
          messages,
        },
        error: null,
      };
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return {
        status: 500,
        data: null,
        error: { message: i18n.__("CATCH_ERROR"), reason: error.message },
      };
    }
  }
  static async insertOldCsvData(payload) {
    const ticket_number = payload.ticket_number || "";
    const phone_number = payload.phone_number || "";
    const created_at = payload.created_at || null;
    const updated_at = payload.updated_at || null;
    
    const checkDataExisting = await ChatgptConversationScoreAi.findOne({
      where: { ticketNumber: ticket_number },
    });
    if (!checkDataExisting) {
      const newRecord = await ChatgptConversationScoreAi.create({
        ticketNumber: ticket_number,
        phoneNumber: phone_number,
        createdAt: created_at,
        updatedAt: updated_at,
      });
      console.log("New record created:", newRecord.id);
    } else {
      console.log("Record already exists for ticket number:", ticket_number);
    }
  }
}
