const relation = (db) => {
  const { 
    ChatgptConversationScoreAi, 
    ChatgptConversationScoreAiCalls, 
    ChatgptConversationScoreAiCallAnalysis,
    ChatgptConversationScoreAiAgents,
    ChatgptConversationScoreAiWhatsappMessagesAnalysisData,
    ChatgptConversationScoreAiWhatsappMessages
  } = db;
 
  ChatgptConversationScoreAi.hasMany(ChatgptConversationScoreAiCalls, { foreignKey: "mainRecordId",  as: "calls" });
  ChatgptConversationScoreAiCalls.belongsTo(ChatgptConversationScoreAi, { foreignKey: "mainRecordId",   as: "conversation" });
  ChatgptConversationScoreAiCalls.belongsTo(ChatgptConversationScoreAiAgents, { foreignKey: "userEmail", targetKey: "email", as: "agentData" });
  ChatgptConversationScoreAiAgents.hasMany(ChatgptConversationScoreAiCalls, { foreignKey: "userEmail", sourceKey: "email", as: "calls" });
  ChatgptConversationScoreAiCallAnalysis.belongsTo(ChatgptConversationScoreAiCalls, { foreignKey: "call_id",   as: "callData" });
  ChatgptConversationScoreAiWhatsappMessagesAnalysisData.hasMany(ChatgptConversationScoreAiWhatsappMessages, { foreignKey: "ticket", sourceKey: "ticket_number", as: "messageData" });


  ChatgptConversationScoreAiWhatsappMessages.belongsTo(ChatgptConversationScoreAiAgents, { foreignKey: "agent", targetKey: "apiId", as: "agentDetails" });

  
 
};

export default relation;
