import db from "../databases/models/index.js";
import "../config/environment.js";
import * as Sentry from "@sentry/node";
import { execSync } from "child_process";
import axios from "axios";
import FormData from "form-data";
import {
  promptTranscriptSummary,
  promptTranscriptSummaryGpt4_1,
  promptTranscriptSummaryProcess,
} from "../config/prompt.js";
import { transcribeWithDiarization, extractSegments } from "../transcribe.js";
import {
  getEmbedding,
  getGeminiEmbedding,
  embeddingToBuffer,
  bufferToEmbedding,
  cosineSimilarity,
} from "../embedding.js";
import OpenAI from "openai";
import {
  resolve as pathResolve,
  dirname,
  basename,
  join as pathJoin,
} from "path";
import fetch from "node-fetch";
import fs from "fs";
import e from "express";
import { type } from "os";
import { or } from "sequelize";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

const {
  ChatgptConversationScoreAi,
  ChatgptConversationScoreAiCalls,
  ChatgptConversationScoreAiChat,
  ChatgptConversationScoreAiChatMessages,
  ChatgptConversationScoreAiCallAnalysis,
  ChatgptConversationScoreAiMultipleCallQa,
  ChatgptConversationScoreAiWhatsappMessages,
  ChatgptConversationScoreAiWhatsappMessagesAnalysis,
  ChatgptConversationScoreAiWhatsappMessagesAnalysisData,
  ChatgptConversationScoreAiAgents,
  ChatgptConversationScoreAiCronTrack,
  ChatgptConversationScoreAiWhatsappMessagesAnalysisDataSendRecord,
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
  static async countPhoneCalls(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;
    try {
      const phoneNumbers = (payload?.phoneNumbers || "")
        .split(",")
        .map((num) => num.trim())
        .filter(Boolean);

      const counts = await ChatgptConversationScoreAi.findAll({
        attributes: [
          "phoneNumber",
          [db.Sequelize.fn("COUNT", db.Sequelize.col("id")), "count"],
        ],
        where: {
          phoneNumber: {
            [db.Sequelize.Op.in]: phoneNumbers,
          },
        },
        group: ["phoneNumber"],
      });

      console.log("Counts:", counts);

      return {
        status: 200,
        data: counts.reduce((acc, item) => {
          acc[item.phoneNumber] = parseInt(item.dataValues.count);
          return acc;
        }, {}),
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
  static async getPhoneCalls(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;
    try {
      const phoneNumbers = (payload?.phoneNumbers || "")
        .split(",")
        .map((num) => num.trim())
        .filter(Boolean);

      const includeCalls = {
        model: ChatgptConversationScoreAiCalls,
        as: "calls",
        required: false,
        attributes: {
          exclude: ["speechText", "chatgptText", "embedding"],
        },
      };
      includeCalls.where = {
        operationName: {
          [db.Sequelize.Op.notIn]: [
            "ERROR_IN_CHUNKING_FILES",
            "ERROR_IN_CHATGPT_TRANSCRIPTION",
            "ERROR_IN_CHATGPT_TRANSCRIPTION_ANALYSIS",
            "CHATGPT_TRANSCRIPTION_RETRIED",
            "CHATGPT_TRANSCRIPTION_ANALYSIS_RETRIED",
          ],
        },
      };
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
        attributes: { exclude: ["embedding"] },
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
          console.error("Error parsing chunkFolderPath for row", rowData.id, e);
        }

        try {
          if (rowData.hookTwoRequest) {
            rowData.hookTwoRequest = JSON.parse(rowData.hookTwoRequest);
          }
        } catch (e) {
          console.error("Error parsing hookTwoRequest for row", rowData.id, e);
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
          attributes: { exclude: ["embedding"] },
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
          console.error("Error parsing chunkFolderPath for row", rowData.id, e);
        }
        try {
          if (rowData.hookTwoRequest) {
            rowData.hookTwoRequest = JSON.parse(rowData.hookTwoRequest);
          }
        } catch (e) {
          console.error("Error parsing hookTwoRequest for row", rowData.id, e);
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
  //
  static async emailAnalysis(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    try {
      const exchange_rate_resistance_data = [];
      const competitors_mentioned_data = [];
      const payment_terms_resistance_data = [];
      const cancellation_policy_resistance_data = [];
      const agent_advised_independent_flight_booking_data = [];

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Set time to 18:00 for both dates
      yesterday.setHours(18, 0, 0, 0);
      today.setHours(18, 0, 0, 0);

      console.log("Fetching records created between:", yesterday, "and", today);

      const records = await ChatgptConversationScoreAiCallAnalysis.findAll({
        where: {
          [db.Sequelize.Op.and]: [
            {
              createdAt: {
                [db.Sequelize.Op.gte]: yesterday,
                [db.Sequelize.Op.lte]: today,
              },
            },
            {
              [db.Sequelize.Op.or]: [
                { exchange_rate_resistance: "YES" },
                { competitors_mentioned: "YES" },
                { payment_terms_resistance: "YES" },
                { cancellation_policy_resistance: "YES" },
                { agent_advised_independent_flight_booking: "YES" },
              ],
            },
          ],
        },
        include: [
          {
            model: ChatgptConversationScoreAiCalls,
            as: "callData",
            attributes: { exclude: ["embedding", "speechText", "chatgptText"] },
            include: [
              { model: ChatgptConversationScoreAiAgents, as: "agentData" },
            ],
          },
        ],
      });
      for (const record of records) {
        const hookTwoRequest = JSON.parse(
          record.callData?.hookTwoRequest || "{}"
        );
        const d = {
          userName: hookTwoRequest.Username || "",
          ticket_number: record.ticket_number || "",
          call_id: record.call_id || "",
          agent_phone_number: hookTwoRequest.Agent || "",
          contact: hookTwoRequest.Contact || "",
          callStartTimeUTC: hookTwoRequest.StartTimeUTC || "",
          callEndTimeUTC: hookTwoRequest.EndTimeUTC || "",
          agentName: record.callData?.agentData?.name || "",
          agentId: record.callData?.agentData?.apiId || "",
          agentEmail: record.callData?.agentData?.email || "",
        };
        if (record.exchange_rate_resistance === "YES") {
          const c = { ...d };
          Object.assign(c, {
            details: record.exchange_rate_resistance_details || "",
          });
          exchange_rate_resistance_data.push(c);
        }
        if (record.competitors_mentioned === "YES") {
          const f = { ...d };
          Object.assign(f, { details: record.competitor_names || "" });
          competitors_mentioned_data.push(f);
        }
        if (record.payment_terms_resistance === "YES") {
          const g = { ...d };
          Object.assign(g, {
            details: record.payment_terms_resistance_details || "",
          });
          payment_terms_resistance_data.push(g);
        }
        if (record.cancellation_policy_resistance === "YES") {
          const h = { ...d };
          Object.assign(h, {
            details: record.cancellation_policy_resistance_details || "",
          });
          cancellation_policy_resistance_data.push(h);
        }
        if (record.agent_advised_independent_flight_booking === "YES") {
          const i = { ...d };
          Object.assign(i, {
            details:
              record.agent_advised_independent_flight_booking_details || "",
          });
          agent_advised_independent_flight_booking_data.push(i);
        }
      }

      return {
        status: 200,
        data: {
          dateFrom: yesterday,
          dateTo: today,
          exchange_rate_resistance_data,
          competitors_mentioned_data,
          payment_terms_resistance_data,
          cancellation_policy_resistance_data,
          agent_advised_independent_flight_booking_data,
        },
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
  static async exchangeRateResistanceData(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    const fromDate = payload?.fromDate || null;
    const toDate = payload?.toDate || null;

    const dateFrom = fromDate ? new Date(fromDate) : null;
    const dateTo = toDate ? new Date(toDate) : null;

    console.log("dateFrom:", dateFrom, "dateTo:", dateTo);

    const page = payload?.page || 1;
    const limit = payload?.limit || 1000;
    const offset = (page - 1) * limit;

    console.log("Fetching records with dateFrom:", dateFrom, "dateTo:", dateTo);
    try {
      const records =
        await ChatgptConversationScoreAiCallAnalysis.findAndCountAll({
          where: {
            exchange_rate_resistance: "YES",
            ...(dateFrom &&
              dateTo && {
                createdAt: {
                  [db.Sequelize.Op.gte]: dateFrom,
                  [db.Sequelize.Op.lte]: dateTo,
                },
              }),
          },
          include: [{ model: ChatgptConversationScoreAiCalls, as: "callData" }],
          offset,
          limit: parseInt(limit, 10),
        });

      const exchange_rate_resistance_data = [];
      for (const record of records.rows) {
        const hookTwoRequest = JSON.parse(
          record.callData?.hookTwoRequest || "{}"
        );
        const d = {
          userName: hookTwoRequest.Username || "",
          ticket_number: record.ticket_number || "",
          call_id: record.call_id || "",
          agent_phone_number: hookTwoRequest.Agent || "",
          contact: hookTwoRequest.Contact || "",
          callStartTimeUTC: hookTwoRequest.StartTimeUTC || "",
          callEndTimeUTC: hookTwoRequest.EndTimeUTC || "",
          details: record.exchange_rate_resistance_details || "",
        };
        exchange_rate_resistance_data.push(d);
      }
      return {
        status: 200,
        totalCount: records.count,
        data: exchange_rate_resistance_data,
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

  static async competitorsMentionedData(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    const fromDate = payload?.fromDate || null;
    const toDate = payload?.toDate || null;

    const dateFrom = fromDate ? new Date(fromDate) : null;
    const dateTo = toDate ? new Date(toDate) : null;

    const emails = payload?.emails
      ? payload.emails
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean)
      : [];

    console.log(emails);

    const page = payload?.page || 1;
    const limit = payload?.limit || 1000;
    const offset = (page - 1) * limit;

    console.log("Fetching records with dateFrom:", dateFrom, "dateTo:", dateTo);
    try {
      const records =
        await ChatgptConversationScoreAiCallAnalysis.findAndCountAll({
          where: {
            competitors_mentioned: "YES",
            ...(dateFrom &&
              dateTo && {
                createdAt: {
                  [db.Sequelize.Op.gte]: dateFrom,
                  [db.Sequelize.Op.lte]: dateTo,
                },
              }),
          },
          include: [
            {
              model: ChatgptConversationScoreAiCalls,
              as: "callData",
              ...(emails.length > 0 && {
                where: {
                  userEmail: {
                    [db.Sequelize.Op.in]: emails,
                  },
                },
              }),
              attributes: {
                exclude: ["embedding", "speechText", "chatgptText"],
              },
              include: [
                { model: ChatgptConversationScoreAiAgents, as: "agentData" },
              ],
            },
          ],
          offset,
          limit: parseInt(limit, 10),
          order: [
            ["createdAt", "DESC"],
            [
              { model: ChatgptConversationScoreAiCalls, as: "callData" },
              { model: ChatgptConversationScoreAiAgents, as: "agentData" },
              "name",
              "ASC",
            ],
          ],
        });
      const competitors_mentioned_data = [];
      for (const record of records.rows) {
        console.log(record.callData);
        const hookTwoRequest = JSON.parse(
          record.callData?.hookTwoRequest || "{}"
        );
        const d = {
          userName: hookTwoRequest.Username || "",
          ticket_number: record.ticket_number || "",
          call_id: record.call_id || "",
          agent_phone_number: hookTwoRequest.Agent || "",
          contact: hookTwoRequest.Contact || "",
          callStartTimeUTC: hookTwoRequest.StartTimeUTC || "",
          callEndTimeUTC: hookTwoRequest.EndTimeUTC || "",
          details: record.competitor_names || "",
          agentName: record.callData?.agentData?.name || "",
          agentId: record.callData?.agentData?.apiId || "",
          agentEmail: record.callData?.agentData?.email || "",
        };
        competitors_mentioned_data.push(d);
      }
      return {
        status: 200,
        totalCount: records.count,
        data: competitors_mentioned_data,
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

  static async whatappmessageCompetitorsMentionedData(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    const fromDate = payload?.fromDate || null;
    const toDate = payload?.toDate || null;

    const dateFrom = fromDate ? new Date(fromDate) : null;
    const dateTo = toDate ? new Date(toDate) : null;

    const emails = payload?.emails
      ? payload.emails
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean)
      : [];

    console.log(emails);

    const page = payload?.page || 1;
    const limit = payload?.limit || 1000;
    const offset = (page - 1) * limit;

    console.log("Fetching records with dateFrom:", dateFrom, "dateTo:", dateTo);
    try {
      const records =
        await ChatgptConversationScoreAiWhatsappMessagesAnalysisData.findAndCountAll(
          {
            where: {
              competitors_mentioned: "YES",
              ...(dateFrom &&
                dateTo && {
                  messageDate: {
                    [db.Sequelize.Op.gte]: dateFrom,
                    [db.Sequelize.Op.lte]: dateTo,
                  },
                }),
            },
            include: [
              {
                model: ChatgptConversationScoreAiWhatsappMessages,
                as: "messageData",

                attributes: ["ticket", "agent"],
                include: [
                  {
                    model: ChatgptConversationScoreAiAgents,
                    as: "agentDetails",
                    required: emails.length > 0,
                    attributes: ["name", "apiId", "email"],
                    ...(emails.length > 0 && {
                      where: {
                        email: {
                          [db.Sequelize.Op.in]: emails,
                        },
                      },
                    }),
                  },
                ],
              },
            ],
            offset,
            limit: parseInt(limit, 10),
            order: [["createdAt", "DESC"]],
          }
        );
      const competitors_mentioned_data = [];
      for (const record of records.rows) {
        let agents = [];
        if (record.messageData && record.messageData.length > 0) {
          const uniqueAgents = new Map();
          record.messageData.forEach((msg) => {
            const agentId = msg.agentDetails?.apiId || "";
            if (agentId && !uniqueAgents.has(agentId)) {
              uniqueAgents.set(agentId, {
                agentName: msg.agentDetails?.name || "",
                agentId: agentId,
                agentEmail: msg.agentDetails?.email || "",
              });
            }
          });
          agents = Array.from(uniqueAgents.values());
        }
        const d = {
          msg_id: record.message_id || "",
          ticket_number: record.ticket_number || "",
          details: record.competitor_names || "",
          messageDate: record.messageDate || "",
          assignedAgents: agents,
        };
        competitors_mentioned_data.push(d);
      }
      return {
        status: 200,
        totalCount: records.count,
        data: competitors_mentioned_data,
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

  static async paymentTermsResistanceData(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    const fromDate = payload?.fromDate || null;
    const toDate = payload?.toDate || null;

    const dateFrom = fromDate ? new Date(fromDate) : null;
    const dateTo = toDate ? new Date(toDate) : null;

    const emails = payload?.emails
      ? payload.emails
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean)
      : [];

    const page = payload?.page || 1;
    const limit = payload?.limit || 1000;
    const offset = (page - 1) * limit;

    console.log("Fetching records with dateFrom:", dateFrom, "dateTo:", dateTo);
    try {
      const records =
        await ChatgptConversationScoreAiCallAnalysis.findAndCountAll({
          where: {
            payment_terms_resistance: "YES",
            ...(dateFrom &&
              dateTo && {
                createdAt: {
                  [db.Sequelize.Op.gte]: dateFrom,
                  [db.Sequelize.Op.lte]: dateTo,
                },
              }),
          },
          include: [
            {
              model: ChatgptConversationScoreAiCalls,
              as: "callData",
              ...(emails.length > 0 && {
                where: {
                  userEmail: {
                    [db.Sequelize.Op.in]: emails,
                  },
                },
              }),
              attributes: {
                exclude: ["embedding", "speechText", "chatgptText"],
              },
              include: [
                { model: ChatgptConversationScoreAiAgents, as: "agentData" },
              ],
            },
          ],
          offset,
          limit: parseInt(limit, 10),
          order: [
            ["createdAt", "DESC"],
            [
              { model: ChatgptConversationScoreAiCalls, as: "callData" },
              { model: ChatgptConversationScoreAiAgents, as: "agentData" },
              "name",
              "ASC",
            ],
          ],
        });
      const payment_terms_resistance_data = [];
      for (const record of records.rows) {
        const hookTwoRequest = JSON.parse(
          record.callData?.hookTwoRequest || "{}"
        );
        const d = {
          userName: hookTwoRequest.Username || "",
          ticket_number: record.ticket_number || "",
          call_id: record.call_id || "",
          agent_phone_number: hookTwoRequest.Agent || "",
          contact: hookTwoRequest.Contact || "",
          callStartTimeUTC: hookTwoRequest.StartTimeUTC || "",
          callEndTimeUTC: hookTwoRequest.EndTimeUTC || "",
          details: record.payment_terms_resistance_details || "",
          agentName: record.callData?.agentData?.name || "",
          agentId: record.callData?.agentData?.apiId || "",
          agentEmail: record.callData?.agentData?.email || "",
        };
        payment_terms_resistance_data.push(d);
      }
      return {
        status: 200,
        totalCount: records.count,
        data: payment_terms_resistance_data,
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

  static async whatappmessagePaymentTermsResistanceData(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    const fromDate = payload?.fromDate || null;
    const toDate = payload?.toDate || null;

    const dateFrom = fromDate ? new Date(fromDate) : null;
    const dateTo = toDate ? new Date(toDate) : null;

    const emails = payload?.emails
      ? payload.emails
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean)
      : [];

    const page = payload?.page || 1;
    const limit = payload?.limit || 1000;
    const offset = (page - 1) * limit;

    console.log("Fetching records with dateFrom:", dateFrom, "dateTo:", dateTo);
    try {
      const records =
        await ChatgptConversationScoreAiWhatsappMessagesAnalysisData.findAndCountAll(
          {
            where: {
              payment_terms_resistance: "YES",
              ...(dateFrom &&
                dateTo && {
                  messageDate: {
                    [db.Sequelize.Op.gte]: dateFrom,
                    [db.Sequelize.Op.lte]: dateTo,
                  },
                }),
            },
            include: [
              {
                model: ChatgptConversationScoreAiWhatsappMessages,
                as: "messageData",

                attributes: ["ticket", "agent"],
                include: [
                  {
                    model: ChatgptConversationScoreAiAgents,
                    as: "agentDetails",
                    required: emails.length > 0,
                    attributes: ["name", "apiId", "email"],
                    ...(emails.length > 0 && {
                      where: {
                        email: {
                          [db.Sequelize.Op.in]: emails,
                        },
                      },
                    }),
                  },
                ],
              },
            ],
            offset,
            limit: parseInt(limit, 10),
            order: [["createdAt", "DESC"]],
          }
        );
      const payment_terms_resistance_data = [];
      for (const record of records.rows) {
        let agents = [];
        if (record.messageData && record.messageData.length > 0) {
          const uniqueAgents = new Map();
          record.messageData.forEach((msg) => {
            const agentId = msg.agentDetails?.apiId || "";
            if (agentId && !uniqueAgents.has(agentId)) {
              uniqueAgents.set(agentId, {
                agentName: msg.agentDetails?.name || "",
                agentId: agentId,
                agentEmail: msg.agentDetails?.email || "",
              });
            }
          });
          agents = Array.from(uniqueAgents.values());
        }

        const d = {
          msg_id: record.message_id || "",
          ticket_number: record.ticket_number || "",
          details: record.payment_terms_resistance_details || "",
          messageDate: record.messageDate || "",
          assignedAgents: agents,
        };
        payment_terms_resistance_data.push(d);
      }
      return {
        status: 200,
        totalCount: records.count,
        data: payment_terms_resistance_data,
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

  static async cancellationPolicyResistanceData(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    const fromDate = payload?.fromDate || null;
    const toDate = payload?.toDate || null;

    const dateFrom = fromDate ? new Date(fromDate) : null;
    const dateTo = toDate ? new Date(toDate) : null;

    const emails = payload?.emails
      ? payload.emails
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean)
      : [];

    const page = payload?.page || 1;
    const limit = payload?.limit || 1000;
    const offset = (page - 1) * limit;

    console.log("Fetching records with dateFrom:", dateFrom, "dateTo:", dateTo);
    try {
      const records =
        await ChatgptConversationScoreAiCallAnalysis.findAndCountAll({
          where: {
            cancellation_policy_resistance: "YES",
            ...(dateFrom &&
              dateTo && {
                createdAt: {
                  [db.Sequelize.Op.gte]: dateFrom,
                  [db.Sequelize.Op.lte]: dateTo,
                },
              }),
          },
          include: [
            {
              model: ChatgptConversationScoreAiCalls,
              as: "callData",
              ...(emails.length > 0 && {
                where: {
                  userEmail: {
                    [db.Sequelize.Op.in]: emails,
                  },
                },
              }),
              attributes: {
                exclude: ["embedding", "speechText", "chatgptText"],
              },
              include: [
                { model: ChatgptConversationScoreAiAgents, as: "agentData" },
              ],
            },
          ],
          offset,
          limit: parseInt(limit, 10),
          order: [
            ["createdAt", "DESC"],
            [
              { model: ChatgptConversationScoreAiCalls, as: "callData" },
              { model: ChatgptConversationScoreAiAgents, as: "agentData" },
              "name",
              "ASC",
            ],
          ],
        });
      const cancellation_policy_resistance_data = [];
      for (const record of records.rows) {
        const hookTwoRequest = JSON.parse(
          record.callData?.hookTwoRequest || "{}"
        );
        const d = {
          userName: hookTwoRequest.Username || "",
          ticket_number: record.ticket_number || "",
          call_id: record.call_id || "",
          agent_phone_number: hookTwoRequest.Agent || "",
          contact: hookTwoRequest.Contact || "",
          callStartTimeUTC: hookTwoRequest.StartTimeUTC || "",
          callEndTimeUTC: hookTwoRequest.EndTimeUTC || "",
          details: record.cancellation_policy_resistance_details || "",
          agentName: record.callData?.agentData?.name || "",
          agentId: record.callData?.agentData?.apiId || "",
          agentEmail: record.callData?.agentData?.email || "",
        };
        cancellation_policy_resistance_data.push(d);
      }
      return {
        status: 200,
        totalCount: records.count,
        data: cancellation_policy_resistance_data,
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

  static async whatsappMessageCancellationPolicyResistanceData(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    const fromDate = payload?.fromDate || null;
    const toDate = payload?.toDate || null;

    const dateFrom = fromDate ? new Date(fromDate) : null;
    const dateTo = toDate ? new Date(toDate) : null;

    const emails = payload?.emails
      ? payload.emails
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean)
      : [];

    const page = payload?.page || 1;
    const limit = payload?.limit || 1000;
    const offset = (page - 1) * limit;

    console.log("Fetching records with dateFrom:", dateFrom, "dateTo:", dateTo);
    try {
      const records =
        await ChatgptConversationScoreAiWhatsappMessagesAnalysisData.findAndCountAll(
          {
            where: {
              cancellation_policy_resistance: "YES",
              ...(dateFrom &&
                dateTo && {
                  messageDate: {
                    [db.Sequelize.Op.gte]: dateFrom,
                    [db.Sequelize.Op.lte]: dateTo,
                  },
                }),
            },
            include: [
              {
                model: ChatgptConversationScoreAiWhatsappMessages,
                as: "messageData",

                attributes: ["ticket", "agent"],
                include: [
                  {
                    model: ChatgptConversationScoreAiAgents,
                    as: "agentDetails",
                    required: emails.length > 0,
                    attributes: ["name", "apiId", "email"],
                    ...(emails.length > 0 && {
                      where: {
                        email: {
                          [db.Sequelize.Op.in]: emails,
                        },
                      },
                    }),
                  },
                ],
              },
            ],
            offset,
            limit: parseInt(limit, 10),
            order: [
              ["createdAt", "DESC"],
              // [
              //   { model: ChatgptConversationScoreAiCalls, as: "callData" },
              //   { model: ChatgptConversationScoreAiAgents, as: "agentData" },
              //   "name",
              //   "ASC",
              // ],
            ],
          }
        );
      const cancellation_policy_resistance_data = [];
      for (const record of records.rows) {
        let agents = [];
        if (record.messageData && record.messageData.length > 0) {
          const uniqueAgents = new Map();
          record.messageData.forEach((msg) => {
            const agentId = msg.agentDetails?.apiId || "";
            if (agentId && !uniqueAgents.has(agentId)) {
              uniqueAgents.set(agentId, {
                agentName: msg.agentDetails?.name || "",
                agentId: agentId,
                agentEmail: msg.agentDetails?.email || "",
              });
            }
          });
          agents = Array.from(uniqueAgents.values());
        }
        const d = {
          msg_id: record.message_id || "",
          ticket_number: record.ticket_number || "",
          details: record.cancellation_policy_resistance_details || "",
          messageDate: record.messageDate || "",
          assignedAgents: agents,
        };
        cancellation_policy_resistance_data.push(d);
      }
      return {
        status: 200,
        totalCount: records.count,
        data: cancellation_policy_resistance_data,
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
  static async agentAdvisedIndependentFlightBookingData(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    const fromDate = payload?.fromDate || null;
    const toDate = payload?.toDate || null;

    const dateFrom = fromDate ? new Date(fromDate) : null;
    const dateTo = toDate ? new Date(toDate) : null;

    const emails = payload?.emails
      ? payload.emails
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean)
      : [];

    const page = payload?.page || 1;
    const limit = payload?.limit || 1000;
    const offset = (page - 1) * limit;

    console.log("Fetching records with dateFrom:", dateFrom, "dateTo:", dateTo);
    try {
      const records =
        await ChatgptConversationScoreAiCallAnalysis.findAndCountAll({
          where: {
            agent_advised_independent_flight_booking: "YES",
            ...(dateFrom &&
              dateTo && {
                createdAt: {
                  [db.Sequelize.Op.gte]: dateFrom,
                  [db.Sequelize.Op.lte]: dateTo,
                },
              }),
          },
          include: [
            {
              model: ChatgptConversationScoreAiCalls,
              as: "callData",
              ...(emails.length > 0 && {
                where: {
                  userEmail: {
                    [db.Sequelize.Op.in]: emails,
                  },
                },
              }),
              attributes: {
                exclude: ["embedding", "speechText", "chatgptText"],
              },
              include: [
                { model: ChatgptConversationScoreAiAgents, as: "agentData" },
              ],
            },
          ],
          offset,
          limit: parseInt(limit, 10),
          order: [
            ["createdAt", "DESC"],
            [
              { model: ChatgptConversationScoreAiCalls, as: "callData" },
              { model: ChatgptConversationScoreAiAgents, as: "agentData" },
              "name",
              "ASC",
            ],
          ],
        });
      const agent_advised_independent_flight_booking_data = [];
      for (const record of records.rows) {
        const hookTwoRequest = JSON.parse(
          record.callData?.hookTwoRequest || "{}"
        );
        const d = {
          userName: hookTwoRequest.Username || "",
          ticket_number: record.ticket_number || "",
          call_id: record.call_id || "",
          agent_phone_number: hookTwoRequest.Agent || "",
          contact: hookTwoRequest.Contact || "",
          callStartTimeUTC: hookTwoRequest.StartTimeUTC || "",
          callEndTimeUTC: hookTwoRequest.EndTimeUTC || "",
          details:
            record.agent_advised_independent_flight_booking_details || "",
          agentName: record.callData?.agentData?.name || "",
          agentId: record.callData?.agentData?.apiId || "",
          agentEmail: record.callData?.agentData?.email || "",
        };
        agent_advised_independent_flight_booking_data.push(d);
      }
      return {
        status: 200,
        totalCount: records.count,
        data: agent_advised_independent_flight_booking_data,
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
  static async whatappmessageAgentAdvisedIndependentFlightBookingData(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    const fromDate = payload?.fromDate || null;
    const toDate = payload?.toDate || null;

    const dateFrom = fromDate ? new Date(fromDate) : null;
    const dateTo = toDate ? new Date(toDate) : null;

    const emails = payload?.emails
      ? payload.emails
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean)
      : [];

    const page = payload?.page || 1;
    const limit = payload?.limit || 1000;
    const offset = (page - 1) * limit;

    console.log("Fetching records with dateFrom:", dateFrom, "dateTo:", dateTo);
    try {
      const records =
        await ChatgptConversationScoreAiWhatsappMessagesAnalysisData.findAndCountAll(
          {
            where: {
              agent_advised_independent_flight_booking: "YES",
              ...(dateFrom &&
                dateTo && {
                  messageDate: {
                    [db.Sequelize.Op.gte]: dateFrom,
                    [db.Sequelize.Op.lte]: dateTo,
                  },
                }),
            },
            include: [
              {
                model: ChatgptConversationScoreAiWhatsappMessages,
                as: "messageData",

                attributes: ["ticket", "agent"],
                include: [
                  {
                    model: ChatgptConversationScoreAiAgents,
                    as: "agentDetails",
                    required: emails.length > 0,
                    attributes: ["name", "apiId", "email"],
                    ...(emails.length > 0 && {
                      where: {
                        email: {
                          [db.Sequelize.Op.in]: emails,
                        },
                      },
                    }),
                  },
                ],
              },
            ],
            offset,
            limit: parseInt(limit, 10),
            order: [
              ["createdAt", "DESC"],
              // [
              //   { model: ChatgptConversationScoreAiCalls, as: "callData" },
              //   { model: ChatgptConversationScoreAiAgents, as: "agentData" },
              //   "name",
              //   "ASC",
              // ],
            ],
          }
        );
      const agent_advised_independent_flight_booking_data = [];
      for (const record of records.rows) {
        let agents = [];
        if (record.messageData && record.messageData.length > 0) {
          const uniqueAgents = new Map();
          record.messageData.forEach((msg) => {
            const agentId = msg.agentDetails?.apiId || "";
            if (agentId && !uniqueAgents.has(agentId)) {
              uniqueAgents.set(agentId, {
                agentName: msg.agentDetails?.name || "",
                agentId: agentId,
                agentEmail: msg.agentDetails?.email || "",
              });
            }
          });
          agents = Array.from(uniqueAgents.values());
        }
        const d = {
          msg_id: record.message_id || "",
          ticket_number: record.ticket_number || "",
          details:
            record.agent_advised_independent_flight_booking_details || "",
          messageDate: record.messageDate || "",
          assignedAgents: agents,
        };
        agent_advised_independent_flight_booking_data.push(d);
      }
      return {
        status: 200,
        totalCount: records.count,
        data: agent_advised_independent_flight_booking_data,
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
            error: {
              message: "Username not allowed",
              reason: "Username contains @btcthailand.onmicrosoft.com",
            },
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
        if (process.env.MODEL_TYPE === "chatgpt") {
          this.chunkmediafiles(callRecord); // If you use chatgpt transcription
        }
        if (process.env.MODEL_TYPE === "gemini") {
          this.geminiTranscribe(callRecord); // if you use gemini transcription
        }
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
  static async webhookMessage(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;
    try {
      if (payload?.message.trim().length === 0) {
        return {
          status: 400,
          data: null,
          error: { message: "Message cannot be empty" },
        };
      }
      const response = await ChatgptConversationScoreAiWhatsappMessages.create({
        type: payload?.type || "",
        message: payload?.message || "",
        ticket: payload?.ticket || "",
        agent: payload?.agent || "",
      });
      return {
        status: 200,
        data: {
          status: "success",
          message: "Webhook Message processed successfully",
          response,
        },
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
        this.generateEmbeddings(callrecord); // Not awaited, runs in background
      } else {
        throw new Error("NO_TRANSCRIPTION_TEXT_FOUND");
      }
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      callrecord.operationName = "ERROR_IN_CHATGPT_TRANSCRIPTION";
      await callrecord.save();
      console.error("Error in chatgptTranscription:", error.message);
      throw error;
    }
    console.log("=============== chatgpt transcription end =================");
  }

  static async chatgptTranscriptionTranscribeDiarize(callrecord) {
    console.log(
      "=============== chatgpt transcription transcribe diarize start ================="
    );
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
      console.log(
        "============== Diarized segments ================================="
      );
      console.log(transcribeJsonResults);
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      // callrecord.operationName = "ERROR_IN_CHATGPT_TRANSCRIPTION_TRANSCRIBE_DIARIZE";
      // await callrecord.save();
      console.error(
        "Error in chatgptTranscriptionTranscribeDiarize:",
        error.message
      );
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
      callrecord.chatgptText = JSON.stringify(parsed, null, 2);
      callrecord.chatgptModel = this.chatGptModel;
      callrecord.satisfaction =
        parsed?.service_score?.expected_satisfaction || 0;
      callrecord.operationName = "COMPLETED_SEND_TRANSCRIPT_TO_CLIENT";
      await callrecord.save();
      this.insertAnalysisRecord(callrecord); // Not awaited, runs in background

      console.log(
        "================= chatgpt transcription analysis end ================="
      );
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      callrecord.operationName = "ERROR_IN_CHATGPT_TRANSCRIPTION_ANALYSIS";
      callrecord.chatgptModel = this.chatGptModel;
      await callrecord.save();
      throw error;
      console.error("Error in chatgptTranscriptionAnalysis:", error.message);
    }
  }
  static async insertAnalysisRecord(callrecord) {
    const analysisJSON = JSON.parse(callrecord.chatgptText || "{}");
    console.log("Financial analysis:", analysisJSON?.financial_analysis);
    console.log("Booking details:", analysisJSON?.booking_details);
    const callId = callrecord.id;
    const exchange_rate_resistance =
      analysisJSON?.financial_analysis?.exchange_rate_resistance === true
        ? "YES"
        : "NO";
    const exchange_rate_resistance_details =
      analysisJSON?.financial_analysis?.exchange_rate_resistance_details ||
      null;
    const competitors_mentioned =
      analysisJSON?.financial_analysis?.competitors_mentioned === true
        ? "YES"
        : "NO";
    const competitor_names =
      analysisJSON?.financial_analysis?.competitors_details || null;
    const payment_terms_resistance =
      analysisJSON?.financial_analysis
        ?.payment_terms_or_exchange_rates_resistance === true
        ? "YES"
        : "NO";
    const payment_terms_resistance_details =
      analysisJSON?.financial_analysis
        ?.payment_terms_or_exchange_rates_resistance_details || null;
    const cancellation_policy_resistance =
      analysisJSON?.financial_analysis?.cancellation_policy_resistance === true
        ? "YES"
        : "NO";
    const cancellation_policy_resistance_details =
      analysisJSON?.financial_analysis
        ?.cancellation_policy_resistance_details || null;
    const agent_advised_independent_flight_booking =
      analysisJSON?.booking_details
        ?.agent_advised_independent_flight_booking === true
        ? "YES"
        : "NO";

    const agent_advised_independent_flight_booking_details =
      analysisJSON?.booking_details
        ?.agent_advised_independent_flight_booking_details || null;

    try {
      // Check if analysis record already exists for this call
      let existingAnalysis =
        await ChatgptConversationScoreAiCallAnalysis.findOne({
          where: { call_id: callId },
        });

      const analysisData = {
        exchange_rate_resistance: null,
        exchange_rate_resistance_details: null,
        competitors_mentioned,
        competitor_names,
        payment_terms_resistance,
        payment_terms_resistance_details,
        cancellation_policy_resistance,
        cancellation_policy_resistance_details,
        agent_advised_independent_flight_booking,
        agent_advised_independent_flight_booking_details,
      };

      if (existingAnalysis) {
        // Update existing record
        await existingAnalysis.update(analysisData);
        console.log(`Updated analysis record for call ID: ${callId}`);
      } else {
        // Create new record
        Object.assign(analysisData, {
          call_id: callId,
          ticket_number: callrecord.ticketNumber,
        });
        await ChatgptConversationScoreAiCallAnalysis.create(analysisData);
        console.log(`Created new analysis record for call ID: ${callId}`);
      }
    } catch (error) {
      console.error("Error inserting/updating analysis record:", error.message);
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
    }
  }
  static async generateEmbeddings(callrecord) {
    const speechText = callrecord.speechText;
    if (!speechText || speechText.trim().length === 0) {
      console.error("No speech text available for embeddings generation");
      return;
    }

    const chunkSize = 500; // approx. 300–500 tokens depending on language
    const overlap = 50; // 10% overlap for context retention

    const chunks = [];

    for (let i = 0; i < speechText.length; i += chunkSize - overlap) {
      let end = i + chunkSize;

      // Avoid cutting in the middle of a word
      if (end < speechText.length) {
        while (end < speechText.length && speechText[end] !== " ") {
          end++;
        }
      }

      const chunk = speechText.slice(i, end).trim();
      chunks.push(chunk);
    }

    // console.log(`Created ${chunks.length} text chunks`);

    try {
      const embeddings = [];

      // Process each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`Processing chunk ${i + 1}/${chunks.length}`);

        const embeddingResponse = await getEmbedding(chunk);
        // console.log(`Embedding response for chunk ${i + 1}:`, embeddingResponse);
        embeddings.push({
          chunkIndex: i,
          text: chunk,
          embedding: embeddingResponse,
        });

        console.log(`Embedding generated for chunk ${i + 1}`);
      }

      if (embeddings.length > 0) {
        try {
          callrecord.embedding = JSON.stringify(embeddings);
          await callrecord.save();
          console.log("All embeddings generated and saved to call record");
        } catch (error) {
          console.error("Error saving embeddings:", error.message);
          // If embeddings field doesn't exist or JSON too large, save to file instead
          // const embeddingsPath = `./uploads/score_ai/embeddings/embeddings_${callrecord.id}.json`;
          // fs.writeFileSync(embeddingsPath, JSON.stringify(embeddings, null, 0), 'utf8');
          // console.log("Embeddings saved to file:", embeddingsPath);
        }
      }
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      console.error("Error in generateEmbeddings:", error.message);
    }
  }
  static async generateEmbeddingsAskQuestion(callrecords, question) {
    try {
      const matchedChunks = [];
      const query = question;
      const topK = 5;
      const threshold = 0.3;
      const ticket_number = callrecords?.[0]?.ticketNumber || "Unknown";
      const call_ids = [];
      for (const callrecord of callrecords) {
        call_ids.push(callrecord.id);
        console.log(
          "===============  Processing call record ID:=====================",
          callrecord.id
        );
        const embeddingData = callrecord.embedding;
        if (!embeddingData) {
          console.error(
            "No embedding data found for call record ID:",
            callrecord.id
          );
          continue;
        }

        const chunkEmbeddingJSON = JSON.parse(embeddingData);
        const queryEmbedding = await getEmbedding(query);

        const results = chunkEmbeddingJSON
          .map((chunk) => {
            const score = cosineSimilarity(queryEmbedding, chunk.embedding);
            if (score >= threshold) {
              return { ...chunk, score, callrecordId: callrecord.id };
            }
          })
          .filter((r) => r !== undefined);

        matchedChunks.push(...results);
      }
      matchedChunks.sort((a, b) => b.score - a.score).slice(0, topK);

      for (const chunk of matchedChunks) {
        console.log(
          `Record ID: ${chunk.callrecordId} \n Matched Chunk (Score: ${chunk.score.toFixed(4)}): ${JSON.stringify(chunk.text, null, 2)} \n  `
        );
      }

      const context = matchedChunks
        .map((item, idx) => `[${item.callrecordId}] ${item.text}`)
        .join("\n\n");

      // Detect query language and adjust response language accordingly
      const isEnglish = /^[a-zA-Z\s.,!?'"()-]+$/.test(query.trim());

      const systemPrompt = `You are a helpful assistant that answers questions based on the provided context. 
        Use only the information from the context to answer. If the context doesn't contain enough information, say so.
        Always cite which source number [1], [2], etc. you used for each piece of information.
        ${isEnglish ? "Answer in English." : "Answer in Hebrew."}`;

      const userPrompt = `Context:
        ${context}

        Question: ${query}

        Please provide a clear, accurate answer based on the context above.Cite your sources using [1], [2], etc.`;
      const OPENAI_OBJECT = new OpenAI({ apiKey: process.env.CHATGPT_API_KEY });

      const response = await OPENAI_OBJECT.chat.completions.create({
        model: this.chatGptModel, // Fast and cost-effective, use 'gpt-4o' for better quality
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_completion_tokens: 1500,
      });
      const answer = response.choices[0].message.content;
      console.log("Answer:", answer);
      ChatgptConversationScoreAiMultipleCallQa.create({
        ticket_number,
        call_ids: JSON.stringify(call_ids),
        question: query,
        answer: answer,
      });
      return { answer };
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      console.error("Error in generateEmbeddingsAskQuestion:", error.message);
      return { answer: "Error generating answer." };
    }
  }
  static async embeddingQaList(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    const ticket_number = payload?.ticketNumber || null;
    const limit = payload?.limit || 100;
    const page = payload?.page || 1;
    const offset = (page - 1) * limit;
    try {
      const records =
        await ChatgptConversationScoreAiMultipleCallQa.findAndCountAll({
          where: {
            ...(ticket_number && { ticket_number }),
          },
          offset,
          limit: parseInt(limit, 10),
          order: [["createdAt", "DESC"]],
        });
      return {
        status: 200,
        totalCount: records.count,
        data: records.rows,
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
  static async sendCallDataBtcThai(callrecords, callIds) {
    const postdata = {
      api_key: "VHNXjTLh86A96iPVK56C",
      call_data: JSON.stringify(callrecords, null, 2),
    };

    try {
      const api_url =
        "https://btc-thai.com/offer/api/dashbi_add_crm_ticket_call";
      const response = await axios.post(api_url, postdata, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      await ChatgptConversationScoreAiCalls.update(
        {
          sendToBtc: true,
        },
        {
          where: {
            id: {
              [db.Sequelize.Op.in]: callIds,
            },
          },
        }
      );
      return { request: postdata, response: response?.data };
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      console.error("Error in sendCallDataBtcThai:", error.message);
    }
  }

  static async sendMessageDataBtcThai(messageRecords, messageIds) {
    const postdata = {
      api_key: "VHNXjTLh86A96iPVK56C",
      msg_data: JSON.stringify(messageRecords, null, 2),
    };

    // console.log("Post data to BTC Thai:", postdata);
    // return;

    try {
      const api_url =
        "https://btc-thai.com/offer/api/dashbi_add_crm_ticket_message";
      const response = await axios.post(api_url, postdata, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      await ChatgptConversationScoreAiWhatsappMessages.update(
        {
          sendToBtc: true,
        },
        {
          where: {
            id: {
              [db.Sequelize.Op.in]: messageIds,
            },
          },
        }
      );
      return { request: postdata, response: response?.data };
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      console.error("Error in sendMessageDataBtcThai:", error.message);
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

  static async getScoreAllUnSummrizedMessages(
    ticketNumber,
    callId,
    messageType
  ) {
    try {
      // ✅ Find the chat session
      const session = await ChatgptConversationScoreAiChat.findOne({
        where: { ticketNumber, callId, messageType },
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

  static async createScoreNewMessage(
    ticketNumber,
    callId,
    sender,
    message,
    messageType
  ) {
    try {
      let session = await ChatgptConversationScoreAiChat.findOne({
        where: { ticketNumber, callId, messageType },
      });

      if (!session) {
        session = await ChatgptConversationScoreAiChat.create({
          ticketNumber,
          callId,
          messageType,
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
  static async summarizeChatMessages(ticketNumber, callId, messageType) {
    try {
      const chatGptModel = "gpt-4o-mini"; // replace with your model if needed
      const session = await ChatgptConversationScoreAiChat.findOne({
        where: { ticketNumber, callId, messageType },
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
      if (countUnSummarizedMessages > 10) {
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

  static async summarizeGeminiChatMessages(ticketNumber, callId, messageType) {
    try {
      const geminiModel = "gemini-2.5-flash"; // or "gemini-1.5-flash" / "gemini-1.5-pro"
      const session = await ChatgptConversationScoreAiChat.findOne({
        where: { ticketNumber, callId, messageType },
      });
      if (!session) return;
      const summarizedMessageLimit = 10;
      let content = "";
      let summarized_messages_ids = [];

      // Count unsummarized messages
      const countUnSummarizedMessages =
        await ChatgptConversationScoreAiChatMessages.count({
          where: { chatId: session.id, summarized: 0 },
        });
      console.log("Count of unsummarized messages:", countUnSummarizedMessages);

      if (countUnSummarizedMessages > 20) {
        const messages = await ChatgptConversationScoreAiChatMessages.findAll({
          where: { chatId: session.id, summarized: 0 },
          order: [["createdAt", "ASC"]],
          limit: summarizedMessageLimit,
        });

        messages.forEach((m) => {
          summarized_messages_ids.push(m.id);
          content += `${m.sender}: ${m.message}\n`;
        });

        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
          model: geminiModel,
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.7,
          },
        });

        let prompt = "";

        if (session.summary) {
          const existingSummary = session.summary;
          prompt = `Please update the existing summary by including the new messages.

Previous summary:
${existingSummary}

New messages:
${content}

Please provide an updated summary that incorporates both the previous summary and the new messages.`;
        } else {
          prompt = `Summarize the following conversation:

${content}

Please provide a concise summary of the key points from this conversation.`;
        }

        console.log("======= Start Gemini Summarization =======");

        const message = await this.retryWithBackoff(async () => {
          const result = await model.generateContent(prompt);
          return result.response.text();
        });

        if (message) {
          // Update session summary
          session.summary = message;
          await session.save();

          // Mark messages as summarized
          await ChatgptConversationScoreAiChatMessages.update(
            { summarized: 1 },
            { where: { id: summarized_messages_ids } }
          );

          console.log("Summary updated successfully");
        }
      }
    } catch (err) {
      console.error("Error in summarizeGeminiChatMessages:", err.message);
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
      const {
        ticketNumber,
        callId,
        message: inputMessage,
        messageType,
      } = payload;

      console.log("Received chat transcription request:", payload);
      const getAllChatMessages = await this.getScoreAllUnSummrizedMessages(
        ticketNumber,
        callId,
        messageType
      );
      console.log("Fetched chat messages:", getAllChatMessages);
      await this.createScoreNewMessage(
        ticketNumber,
        callId,
        "user",
        inputMessage,
        messageType
      );
      let speechText = "";
      if (messageType === "call") {
        const record = await ChatgptConversationScoreAiCalls.findOne({
          where: { ticketNumber, id: callId },
        });
        speechText = record?.speechText || "";
      }
      if (messageType === "message") {
        const record =
          await ChatgptConversationScoreAiWhatsappMessagesAnalysis.findOne({
            where: { ticketNumber, id: callId },
          });
        speechText = record?.gptSummary || "";
      }
      console.log("Using speech text for context:", speechText);
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
        max_completion_tokens: 1500,
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
          gptMessage,
          messageType
        );

        this.summarizeChatMessages(ticketNumber, callId, messageType);

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
  static async geminiChatTranscription(request) {
    const {
      payload,
      headers: { i18n },
      user,
    } = request;

    try {
      const {
        ticketNumber,
        callId,
        message: inputMessage,
        messageType,
      } = payload;

      console.log("Received chat transcription request:", payload);
      const getAllChatMessages = await this.getScoreAllUnSummrizedMessages(
        ticketNumber,
        callId,
        messageType
      );
      console.log("Fetched chat messages:", getAllChatMessages);
      await this.createScoreNewMessage(
        ticketNumber,
        callId,
        "user",
        inputMessage,
        messageType
      );
      let speechText = "";
      if (messageType === "call") {
        const record = await ChatgptConversationScoreAiCalls.findOne({
          where: { ticketNumber, id: callId },
        });
        speechText = record?.speechText || "";
      }
      if (messageType === "message") {
        const record =
          await ChatgptConversationScoreAiWhatsappMessagesAnalysis.findOne({
            where: { ticketNumber, id: callId },
          });
        speechText = record?.gptSummary || "";
      }
      console.log("Using speech text for context:", speechText);
      let conversationString = speechText;

      // Build conversation history for Gemini
      let conversationHistory = [];
      let systemPrompt = "You are a helpful assistant.";

      if (getAllChatMessages?.summary) {
        conversationHistory.push({
          role: "user",
          parts: [
            {
              text: `Summary of our previous conversation: ${getAllChatMessages.summary}`,
            },
          ],
        });

        if (getAllChatMessages.messages?.length) {
          let content = "";
          for (const m of getAllChatMessages.messages) {
            content += `${m.role}: ${m.content}\n`;
          }
          conversationHistory.push({
            role: "user",
            parts: [
              {
                text: `Other conversations between us after previous conversation: ${content}`,
              },
            ],
          });
        }
      } else if (getAllChatMessages.messages?.length) {
        // Convert OpenAI format to Gemini format
        for (const msg of getAllChatMessages.messages) {
          if (msg.role === "system") {
            systemPrompt += `\n${msg.content}`;
          } else {
            conversationHistory.push({
              role: msg.role === "assistant" ? "model" : "user",
              parts: [{ text: msg.content }],
            });
          }
        }
      }

      const prompt = this.promptTranscriptQuestionAnswer(
        conversationString,
        inputMessage
      );

      // Combine system prompts
      const fullSystemPrompt = `${systemPrompt}\n\n${prompt}`;

      // Initialize Gemini
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash", // Fast and cost-effective, use 'gemini-1.5-pro' for better quality
        generationConfig: {
          maxOutputTokens: 1500,
        },
        systemInstruction: fullSystemPrompt,
      });

      console.log("======= Start Gemini Call =======");

      // Start chat with history and send message with retry logic
      const gptMessage = await this.retryWithBackoff(async () => {
        const chat = model.startChat({
          history: conversationHistory,
        });
        const result = await chat.sendMessage(inputMessage);
        return result.response.text();
      });

      if (gptMessage) {
        const newMsg = await this.createScoreNewMessage(
          ticketNumber,
          callId,
          "assistant",
          gptMessage,
          messageType
        );

        this.summarizeGeminiChatMessages(ticketNumber, callId, messageType);

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
          error: { message: "No response from Gemini" },
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
  static async getAllScoreChatMessages(ticketNumber, callId, messageType) {
    const session = await ChatgptConversationScoreAiChat.findOne({
      where: { ticketNumber, callId, messageType },
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
        payload.callId,
        payload.messageType
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
  static async summarizeMessagesOfTicket(record) {
    try {
      const messagesData = JSON.parse(record.messages);
      // console.log('Messages data for summarization:', messagesData);
      const conversationString = messagesData
        .map((msg) => `${msg.type}: ${msg.message}`)
        .join("\n");
      console.log("Constructed conversation string:", conversationString);

      const systemPrompt = `You are a helpful assistant that summarizes conversations between travel agents and customers. 
        Summarize the following conversation in Hebrew, focusing on key points, customer needs, and any action items for the travel agent.
        Provide a concise summary that captures the essence of the conversation without adding any external information.`;

      const userPrompt = `Conversation:
        ${conversationString}`;

      const OPENAI_OBJECT = new OpenAI({ apiKey: process.env.CHATGPT_API_KEY });

      const response = await OPENAI_OBJECT.chat.completions.create({
        model: this.chatGptModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_completion_tokens: 2000,
      });

      const summary =
        response?.choices?.[0]?.message.content || "No summary generated.";
      console.log("Generated summary:", summary);

      // Update the record with the summary
      record.gptSummary = summary;
      record.status = 2; // Mark as summarized
      await record.save();
      console.log("Record updated with summary:", record.id);

      return { id: record.id, summary };
    } catch (err) {
      console.error("Error in summarizeMessagesOfTicket:", err.message);
    }
  }
  static async summarizeMessagesOfTicketGemini(record) {
    try {
      const messagesData = JSON.parse(record.messages);
      // console.log('Messages data for summarization:', messagesData);
      const conversationString = messagesData
        .map((msg) => `${msg.type}: ${msg.message}`)
        .join("\n");
      console.log("Constructed conversation string:", conversationString);

      const systemPrompt = `You are a helpful assistant that summarizes conversations between travel agents and customers. 
      Summarize the following conversation in Hebrew, focusing on key points, customer needs, and any action items for the travel agent.
      Provide a concise summary that captures the essence of the conversation without adding any external information.`;

      const userPrompt = `Conversation:
      ${conversationString}`;

      // Initialize Gemini

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash", // or "gemini-1.5-flash" / "gemini-1.5-pro"
        generationConfig: {
          maxOutputTokens: 2000,
        },
        systemInstruction: systemPrompt,
      });

      console.log("======= Start Gemini Summarization =======");

      const summary =
        (await this.retryWithBackoff(async () => {
          const result = await model.generateContent(userPrompt);
          return result.response.text();
        })) || "No summary generated.";

      console.log("Generated summary:", summary);

      // Update the record with the summary
      record.gptSummary = summary;
      record.status = 2; // Mark as summarized
      await record.save();

      console.log("Record updated with summary:", record.id);

      return { id: record.id, summary };
    } catch (err) {
      console.error("Error in summarizeMessagesOfTicket:", err.message);
    }
  }
  static async analyzeSummaryOfMessagesOfTicket(record) {
    console.log(
      `============= start analysis of message summary ${record.id} =================`
    );
    try {
      const summaryText = record.gptSummary || "";
      const prompt = promptTranscriptSummaryProcess(summaryText);
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
        max_completion_tokens: 4000,
      };
      //console.log("Prompt to GPT:", pData); // Log first 1000 chars of prompt
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
      // console.log("GPT Response:", response);
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
      record.gptAnalysis = JSON.stringify(parsed, null, 2);
      record.status = 3;
      await record.save();
      this.insertMessageSummaryAnalysis(record);
      console.log(
        "================= chatgpt transcription analysis end ================="
      );
    } catch (err) {
      console.error("Error in analyzeSummaryOfMessagesOfTicket:", err.message);
    }
  }
  static async analyzeSummaryOfMessagesOfTicketGemini(record) {
    console.log(
      `============= start analysis of message summary ${record.id} =================`
    );
    try {
      const summaryText = record.gptSummary || "";
      const prompt = promptTranscriptSummaryProcess(summaryText);

      // Initialize Gemini
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash", // or "gemini-1.5-flash" / "gemini-1.5-pro"
        generationConfig: {
          maxOutputTokens: 4000,
          responseMimeType: "application/json", // Request JSON response
        },
        systemInstruction:
          "You are a conversation analysis assistant for a travel agency.",
      });

      console.log("======= Start Gemini Analysis =======");

      const gptMessage =
        (await this.retryWithBackoff(async () => {
          const result = await model.generateContent(prompt);
          return result.response.text();
        })) || JSON.stringify({ error: "No content returned from Gemini" });

      // Step 4: Parse JSON safely
      let parsed = {};
      try {
        parsed = JSON.parse(gptMessage);
      } catch {
        parsed = { summary: gptMessage };
      }

      console.log("Gemini Response:", parsed);

      record.gptAnalysis = JSON.stringify(parsed, null, 2);
      record.status = 3;
      await record.save();

      this.insertMessageSummaryAnalysis(record);

      console.log(
        "================= gemini transcription analysis end ================="
      );
    } catch (err) {
      console.error("Error in analyzeSummaryOfMessagesOfTicket:", err.message);
    }
  }
  static async insertMessageSummaryAnalysis(record) {
    const analysisJSON = JSON.parse(record.gptAnalysis || "{}");
    console.log("Financial analysis:", analysisJSON?.financial_analysis);
    console.log("Booking details:", analysisJSON?.booking_details);
    const message_id = record.id;
    const exchange_rate_resistance =
      analysisJSON?.financial_analysis?.exchange_rate_resistance === true
        ? "YES"
        : "NO";
    const exchange_rate_resistance_details =
      analysisJSON?.financial_analysis?.exchange_rate_resistance_details ||
      null;
    const competitors_mentioned =
      analysisJSON?.financial_analysis?.competitors_mentioned === true
        ? "YES"
        : "NO";
    const competitor_names =
      analysisJSON?.financial_analysis?.competitors_details || null;
    const payment_terms_resistance =
      analysisJSON?.financial_analysis
        ?.payment_terms_or_exchange_rates_resistance === true
        ? "YES"
        : "NO";
    const payment_terms_resistance_details =
      analysisJSON?.financial_analysis
        ?.payment_terms_or_exchange_rates_resistance_details || null;
    const cancellation_policy_resistance =
      analysisJSON?.financial_analysis?.cancellation_policy_resistance === true
        ? "YES"
        : "NO";
    const cancellation_policy_resistance_details =
      analysisJSON?.financial_analysis
        ?.cancellation_policy_resistance_details || null;
    const agent_advised_independent_flight_booking =
      analysisJSON?.booking_details
        ?.agent_advised_independent_flight_booking === true
        ? "YES"
        : "NO";

    const agent_advised_independent_flight_booking_details =
      analysisJSON?.booking_details
        ?.agent_advised_independent_flight_booking_details || null;

    try {
      // Check if analysis record already exists for this call
      let existingAnalysis =
        await ChatgptConversationScoreAiWhatsappMessagesAnalysisData.findOne({
          where: { message_id: message_id },
        });

      const analysisData = {
        exchange_rate_resistance: null,
        exchange_rate_resistance_details: null,
        competitors_mentioned,
        competitor_names,
        payment_terms_resistance,
        payment_terms_resistance_details,
        cancellation_policy_resistance,
        cancellation_policy_resistance_details,
        agent_advised_independent_flight_booking,
        agent_advised_independent_flight_booking_details,
        ticket_number: record.ticketNumber,
      };

      if (existingAnalysis) {
        // Update existing record
        await existingAnalysis.update(analysisData);
        console.log(`Updated analysis record for message ID: ${message_id}`);
      } else {
        // Create new record
        Object.assign(analysisData, {
          message_id: message_id,
          messageDate: record.messageDate,
        });
        await ChatgptConversationScoreAiWhatsappMessagesAnalysisData.create(
          analysisData
        );
        console.log(
          `Created new analysis record for message ID: ${message_id}`
        );
      }
    } catch (error) {
      console.error("Error inserting/updating analysis record:", error.message);
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
    }
  }
  static async cronTrack(data) {
    try {
      await ChatgptConversationScoreAiCronTrack.create({
        cronFunction: data.cronFunction,
        data: JSON.stringify(data.data) || null,
      });
    } catch (error) {
      console.error("Error in cronTrack:", error.message);
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
    }
  }
  static async getCronTrackData({ payload }) {
    console.log("Fetching cron track data with payload:", payload);

    const limit = parseInt(payload?.limit) || 10;
    const page = parseInt(payload?.page) || 1;

    const offset = (page - 1) * limit;
    const cronFunction = payload?.cron_function || null;
    const date = payload?.date || null;

    try {
      const records = await ChatgptConversationScoreAiCronTrack.findAndCountAll(
        {
          where: {
            ...(cronFunction ? { cronFunction } : {}),
            ...(date
              ? {
                  createdAt: {
                    [db.Sequelize.Op.gte]: new Date(date + " 00:00:00"),
                    [db.Sequelize.Op.lte]: new Date(date + " 23:59:59"),
                  },
                }
              : {}),
          },
          limit,
          offset,
          order: [["createdAt", "DESC"]],
        }
      );
      return records;
    } catch (error) {
      console.error("Error in getCronTrackData:", error.message);
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return { count: 0, rows: [] };
    }
  }
  static async getWhatsappMessagesDateIdByTktno({ payload }) {
    try {
      const ticketNumber = payload?.ticketNumber || "";

      if (!ticketNumber) {
        return {
          status: 400,
          data: null,
          error: { message: "Ticket number is required" },
        };
      }
      const records =
        await ChatgptConversationScoreAiWhatsappMessagesAnalysis.findAll({
          where: { ticketNumber: ticketNumber },
          attributes: ["id", "messageDate"],
          order: [["messageDate", "DESC"]],
        });
      return {
        status: 200,
        data: {
          status: "success",
          message: "Messages retrieved successfully",
          records,
        },
        error: null,
      };
    } catch (error) {
      console.error(
        "Error in getWhatsappMessagesDateIdByTktno:",
        error.message
      );
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return {
        status: 500,
        data: null,
        error: { message: "CATCH_ERROR", reason: error.message },
      };
    }
  }
  static async getWhatsappMessageWithSummaryAnalysisById({ payload }) {
    try {
      const messageId = payload?.id || "";

      if (!messageId) {
        return {
          status: 400,
          data: null,
          error: { message: "Message ID is required" },
        };
      }
      const record =
        await ChatgptConversationScoreAiWhatsappMessagesAnalysis.findOne({
          where: { id: messageId },
        });

      if (!record) {
        return {
          status: 404,
          data: null,
          error: { message: "Message not found" },
        };
      }
      const d = {
        ...record?.dataValues,
        messages: JSON.parse(record?.messages || "[]"),
        gptAnalysis: JSON.parse(record?.gptAnalysis || "{}"),
      };
      return {
        status: 200,
        data: {
          status: "success",
          message: "Message retrieved successfully",
          record: d,
        },
        error: null,
      };
    } catch (error) {
      console.error(
        "Error in getWhatsappMessageWithSummaryAnalysisById:",
        error.message
      );
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      return {
        status: 500,
        data: null,
        error: { message: "CATCH_ERROR", reason: error.message },
      };
    }
  }

  static async retryWithBackoff(fn, maxRetries = 10, initialDelay = 2000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;

        if (
          error.message.includes("overloaded") ||
          error.message.includes("503")
        ) {
          const delay = initialDelay * Math.pow(2, i);
          console.log(
            `Model overloaded. Retrying in ${delay / 1000}s... (${i + 1}/${maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
  }

  static async geminiTranscribe(callrecord) {
    const transcribeModel = "gemini-2.5-flash";
    const analysisModel = "gemini-2.5-pro";
    const transcription_prompt = `
              You are a professional transcriber. Your task is to transcribe the attached audio file in Hebrew.
              
              **Instructions:**
              1. **Speaker Identification:** Listen for names introduced at the start of the call. If speakers identify themselves (e.g., "This is Ofek"), use their names as labels. If names are not mentioned, use "Speaker 1" and "Speaker 2".
              2. **Format:** Output the text as a script with clear line breaks (e.g., "**Name:** [Text]").
              3. **Entity Accuracy:** Pay strict attention to dates, numbers, and location names. Transcribe them exactly as spoken.
              4. **Verbatim:** Do not summarize. Transcribe every word spoken, including filler words if they are significant to the tone, but keep it readable.
`;
    console.log(
      `============= start transcription analysis with model ${transcribeModel} =============`
    );
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
      const audioFilePath = callrecord.mp3File;
      const uploadResult = await fileManager.uploadFile(audioFilePath, {
        mimeType: "audio/mp3",
        displayName: "Audio File",
      });
      console.log("Upload Result:", uploadResult);
      const modelInstance = genAI.getGenerativeModel({
        model: transcribeModel,
      });

      const transcription = await this.retryWithBackoff(async () => {
        const result = await modelInstance.generateContent([
          {
            fileData: {
              mimeType: uploadResult.file.mimeType,
              fileUri: uploadResult.file.uri,
            },
          },
          "Transcribe this Hebrew conversation accurately. Include speaker labels if possible.",
        ]);
        return result.response.text();
      });

      const modelInstance2 = genAI.getGenerativeModel({ model: analysisModel });

      const analysisText = await this.retryWithBackoff(async () => {
        const analysisPrompt = promptTranscriptSummaryProcess(transcription);
        const result = await modelInstance2.generateContent([
          analysisPrompt,
          "\nReturn ONLY valid JSON, no markdown code blocks.",
        ]);
        return result.response.text();
      });

      // Clean JSON response (remove markdown if present)
      let jsonText = analysisText.trim();
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?$/g, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```\n?/g, "");
      }

      const analysis = JSON.parse(jsonText);
      console.log("Transcription and analysis completed.");
      callrecord.speechText = transcription;
      callrecord.chatgptText = JSON.stringify(analysis, null, 2);
      callrecord.chatgptModel = "gemini";
      callrecord.satisfaction =
        analysis?.service_score?.expected_satisfaction || 0;
      callrecord.operationName = "COMPLETED_SEND_TRANSCRIPT_TO_CLIENT";
      await callrecord.save();
      this.insertAnalysisRecord(callrecord);
      this.generateGeminiEmbeddings(callrecord);

      return {
        transcription,
        analysis,
      };
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      console.error("Error in geminiTranscribe:", error.message);
    }
  }
  static async generateGeminiEmbeddings(callrecord) {
    const speechText = callrecord.speechText;
    if (!speechText || speechText.trim().length === 0) {
      console.error("No speech text available for embeddings generation");
      return;
    }
    const chunkSize = 500; // approx. 300–500 tokens depending on language
    const overlap = 50; // 10% overlap for context retention
    const chunks = [];
    for (let i = 0; i < speechText.length; i += chunkSize - overlap) {
      let end = i + chunkSize;
      // Avoid cutting in the middle of a word
      if (end < speechText.length) {
        while (end < speechText.length && speechText[end] !== " ") {
          end++;
        }
      }
      const chunk = speechText.slice(i, end).trim();
      chunks.push(chunk);
    }
    // console.log(`Created ${chunks.length} text chunks`);
    try {
      const embeddings = [];
      // Process each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`Processing chunk ${i + 1}/${chunks.length}`);
        const embeddingResponse = await getGeminiEmbedding(chunk);
        // console.log(`Embedding response for chunk ${i + 1}:`, embeddingResponse);
        embeddings.push({
          chunkIndex: i,
          text: chunk,
          embedding: embeddingResponse,
        });
        console.log(`Embedding generated for chunk ${i + 1}`);
      }
      if (embeddings.length > 0) {
        try {
          callrecord.embedding = JSON.stringify(embeddings);
          await callrecord.save();
          console.log("All embeddings generated and saved to call record");
        } catch (error) {
          console.error("Error saving embeddings:", error.message);
          // If embeddings field doesn't exist or JSON too large, save to file instead
          // const embeddingsPath = `./uploads/score_ai/embeddings/embeddings_${callrecord.id}.json`;
          // fs.writeFileSync(embeddingsPath, JSON.stringify(embeddings, null, 0), 'utf8');
          // console.log("Embeddings saved to file:", embeddingsPath);
        }
      }
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      console.error("Error in generateEmbeddings:", error.message);
    }
  }
  static async generateGeminiEmbeddingsAskQuestion(callrecords, question) {
    try {
      const matchedChunks = [];
      const query = question;
      const topK = 5;
      const threshold = 0.3;
      const ticket_number = callrecords?.[0]?.ticketNumber || "Unknown";
      const call_ids = [];

      for (const callrecord of callrecords) {
        call_ids.push(callrecord.id);
        console.log(
          "===============  Processing call record ID:=====================",
          callrecord.id
        );
        const embeddingData = callrecord.embedding;
        if (!embeddingData) {
          console.error(
            "No embedding data found for call record ID:",
            callrecord.id
          );
          continue;
        }
        const chunkEmbeddingJSON = JSON.parse(embeddingData);
        const queryEmbedding = await getGeminiEmbedding(query);
        const results = chunkEmbeddingJSON
          .map((chunk) => {
            const score = cosineSimilarity(queryEmbedding, chunk.embedding);
            if (score >= threshold) {
              return { ...chunk, score, callrecordId: callrecord.id };
            }
          })
          .filter((r) => r !== undefined);
        matchedChunks.push(...results);
      }

      matchedChunks.sort((a, b) => b.score - a.score).slice(0, topK);

      for (const chunk of matchedChunks) {
        console.log(
          `Record ID: ${chunk.callrecordId} \n Matched Chunk (Score: ${chunk.score.toFixed(4)}): ${JSON.stringify(chunk.text, null, 2)} \n  `
        );
      }

      const context = matchedChunks
        .map((item, idx) => `[${item.callrecordId}] ${item.text}`)
        .join("\n\n");

      // Detect query language and adjust response language accordingly
      const isEnglish = /^[a-zA-Z\s.,!?'"()-]+$/.test(query.trim());

      const systemPrompt = `You are a helpful assistant that answers questions based on the provided context. 
      Use only the information from the context to answer. If the context doesn't contain enough information, say so.
      Always cite which source number [1], [2], etc. you used for each piece of information.
      ${isEnglish ? "Answer in English." : "Answer in Hebrew."}`;

      const userPrompt = `Context:
      ${context}
      
      Question: ${query}
      
      Please provide a clear, accurate answer based on the context above. Cite your sources using [1], [2], etc.`;

      // Initialize Gemini
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          maxOutputTokens: 1500,
        },
      });

      // Combine system and user prompts for Gemini (it doesn't have separate system role)
      const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;

      const result = await model.generateContent(combinedPrompt);
      const answer = result.response.text();

      console.log("Answer:", answer);

      ChatgptConversationScoreAiMultipleCallQa.create({
        ticket_number,
        call_ids: JSON.stringify(call_ids),
        question: query,
        answer: answer,
      });

      return { answer };
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      console.error("Error in generateEmbeddingsAskQuestion:", error.message);
      return { answer: "Error generating answer." };
    }
  }
  static async whatappmessageEmailAnalysis() {
    try {
      const exchange_rate_resistance_data = [];
      const competitors_mentioned_data = [];
      const payment_terms_resistance_data = [];
      const cancellation_policy_resistance_data = [];
      const agent_advised_independent_flight_booking_data = [];

      const records =
        await ChatgptConversationScoreAiWhatsappMessagesAnalysisData.findAll({
          where: {
            [db.Sequelize.Op.or]: [
              { exchange_rate_resistance: "YES" },
              { competitors_mentioned: "YES" },
              { payment_terms_resistance: "YES" },
              { cancellation_policy_resistance: "YES" },
              { agent_advised_independent_flight_booking: "YES" },
            ],
            isSent: 0,
          },
          include: [
            {
              model: ChatgptConversationScoreAiWhatsappMessages,
              as: "messageData",
              attributes: ["ticket", "agent"],
              include: [
                {
                  model: ChatgptConversationScoreAiAgents,
                  as: "agentDetails",
                  attributes: ["name", "apiId", "email"],
                },
              ],
            },
          ],
          limit: 500,
        });

      const recordIds = [];

      for (const record of records) {
        let agents = [];
        recordIds.push(record.id);
        if (record.messageData && record.messageData.length > 0) {
          const uniqueAgents = new Map();
          record.messageData.forEach((msg) => {
            const agentId = msg.agentDetails?.apiId || "";
            if (agentId && !uniqueAgents.has(agentId)) {
              uniqueAgents.set(agentId, {
                agentName: msg.agentDetails?.name || "",
                agentId: agentId,
                agentEmail: msg.agentDetails?.email || "",
              });
            }
          });
          agents = Array.from(uniqueAgents.values());
        }
        const d = {
          ticket_number: record.ticket_number || "",
          messageDate: record.messageDate || "",
          assignedAgents: agents,
        };
        if (record.exchange_rate_resistance === "YES") {
          const c = { ...d };
          Object.assign(c, {
            details: record.exchange_rate_resistance_details || "",
          });
          exchange_rate_resistance_data.push(c);
        }
        if (record.competitors_mentioned === "YES") {
          const f = { ...d };
          Object.assign(f, { details: record.competitor_names || "" });
          competitors_mentioned_data.push(f);
        }
        if (record.payment_terms_resistance === "YES") {
          const g = { ...d };
          Object.assign(g, {
            details: record.payment_terms_resistance_details || "",
          });
          payment_terms_resistance_data.push(g);
        }
        if (record.cancellation_policy_resistance === "YES") {
          const h = { ...d };
          Object.assign(h, {
            details: record.cancellation_policy_resistance_details || "",
          });
          cancellation_policy_resistance_data.push(h);
        }
        if (record.agent_advised_independent_flight_booking === "YES") {
          const i = { ...d };
          Object.assign(i, {
            details:
              record.agent_advised_independent_flight_booking_details || "",
          });
          agent_advised_independent_flight_booking_data.push(i);
        }
      }

      const dt =
        await ChatgptConversationScoreAiWhatsappMessagesAnalysisDataSendRecord.create(
          {
            recordIds: JSON.stringify(recordIds),
          }
        );

      return {
        status: 200,
        data: {
          recordId: dt.id,
          competitors_mentioned_data,
          payment_terms_resistance_data,
          cancellation_policy_resistance_data,
          agent_advised_independent_flight_booking_data,
        },
        error: null,
      };
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      console.error("Error in whatappmessageEmailAnalysis:", error.message);
    }
  }
  static async markWhatsappMessageAnalysisDataAsSent({ payload }) {
    try {
      const recordId = payload?.recordId || null;
      if (!recordId) {
        return {
          status: 400,
          data: null,
          error: { message: "Record ID is required" },
        };
      }
      const record =
        await ChatgptConversationScoreAiWhatsappMessagesAnalysisDataSendRecord.findOne(
          {
            where: { id: recordId },
          }
        );
      if (!record) {
        return {
          status: 404,
          data: null,
          error: { message: "Record not found" },
        };
      }

      const recordIds = JSON.parse(record.recordIds || "[]");

      await ChatgptConversationScoreAiWhatsappMessagesAnalysisData.update(
        { isSent: 1 },
        { where: { id: recordIds } }
      );
      return {
        status: 200,
        data: {
          status: "success",
          recordIds: recordIds,
          message: "Records marked as sent successfully",
        },
        error: null,
      };
    } catch (error) {
      process.env.SENTRY_ENABLED === "true" && Sentry.captureException(error);
      console.error(
        "Error in markWhatsappMessageAnalysisDataAsSent:",
        error.message
      );
    }
  }
}
