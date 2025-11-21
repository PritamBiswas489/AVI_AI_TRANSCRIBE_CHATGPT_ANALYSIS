import db from "../databases/models/index.js";
import "../config/environment.js";
import DataController from "../controllers/data.controller.js";
import axios from "axios";
const { ChatgptConversationScoreAiAgents } = db;

export const saveAgentData = async () => {
  const limit = 1000;
  const page = 1;

  let currentPage = page;
  let hasData = true;

  while (hasData) {
    const api_key = "fg24ww0h6fvdcb26jrf3il5oany6didy";
    console.log(`Fetching data for page: ${currentPage}`);
    const url = `https://tickets.lametayel-thailand.com/api/v3/agents?_page=${currentPage}&_perPage=${limit}&_from=0&_to=0&_sortDir=ASC`;
    let agentData = [];
    try {
      const response = await axios.get(url, {
        headers: {
          "cache-control": "no-cache",
          "content-type": "application/json",
          apikey: api_key,
        },
      });

      agentData = response?.data || [];

      if (!agentData || agentData.length === 0) {
        console.log("No more agent data found. Stopping the loop.");
        hasData = false;
        break;
      }
      for (const agent of agentData) {
        const existingAgent = await ChatgptConversationScoreAiAgents.findOne({
          where: { apiId: agent.id },
        });
        if (existingAgent) {
          // Update existing agent
          await existingAgent.update({
            name: agent?.name,
            email: agent.email,
            role: agent?.role,
            roleId: agent?.roleId,
            avatarUrl: agent?.avatar_url,
            onlineStatus: agent?.online_status,
            status: agent?.status,
            gender: agent?.gender,
            lastPswdChange: agent?.last_pswd_change,
            twofactorAuth: agent?.twofactor_auth,
            voiceStatus: agent?.voice_status,
            sipPhoneId: agent?.sip_phone_id,
            apiPhoneId: agent?.api_phone_id,
          });
          console.log(`Updated agent with apiId: ${agent.id}`);
        } else {
          // Create new agent
          await ChatgptConversationScoreAiAgents.create({
            apiId: agent.id,
            name: agent?.name,
            email: agent.email,
            role: agent?.role,
            roleId: agent?.roleId,
            avatarUrl: agent?.avatar_url,
            onlineStatus: agent?.online_status,
            status: agent?.status,
            gender: agent?.gender,
            lastPswdChange: agent?.last_pswd_change,
            twofactorAuth: agent?.twofactor_auth,
            voiceStatus: agent?.voice_status,
            sipPhoneId: agent?.sip_phone_id,
            apiPhoneId: agent?.api_phone_id,
          });
          console.log(`Created new agent with apiId: ${agent.id}`);
        }
      }
    } catch (error) {
      console.error("Error:", error.message);
      break;
    }
    currentPage++;
  }
};

