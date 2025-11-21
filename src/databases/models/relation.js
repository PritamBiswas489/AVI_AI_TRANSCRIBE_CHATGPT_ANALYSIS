const relation = (db) => {
  const { 
    ChatgptConversationScoreAi, 
    ChatgptConversationScoreAiCalls, 
    ChatgptConversationScoreAiCallAnalysis,
    ChatgptConversationScoreAiAgents
  } = db;
 
  ChatgptConversationScoreAi.hasMany(ChatgptConversationScoreAiCalls, { foreignKey: "mainRecordId",  as: "calls" });
  ChatgptConversationScoreAiCalls.belongsTo(ChatgptConversationScoreAi, { foreignKey: "mainRecordId",   as: "conversation" });
  ChatgptConversationScoreAiCalls.belongsTo(ChatgptConversationScoreAiAgents, { foreignKey: "userEmail", targetKey: "email", as: "agentData" });
  ChatgptConversationScoreAiAgents.hasMany(ChatgptConversationScoreAiCalls, { foreignKey: "userEmail", sourceKey: "email", as: "calls" });
  ChatgptConversationScoreAiCallAnalysis.belongsTo(ChatgptConversationScoreAiCalls, { foreignKey: "call_id",   as: "callData" });
 
};

export default relation;
