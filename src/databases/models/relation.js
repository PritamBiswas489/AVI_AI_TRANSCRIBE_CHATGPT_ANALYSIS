const relation = (db) => {
  const { 
    ChatgptConversationScoreAi, 
    ChatgptConversationScoreAiCalls, 
    ChatgptConversationScoreAiCallAnalysis
  } = db;
 
  ChatgptConversationScoreAi.hasMany(ChatgptConversationScoreAiCalls, { foreignKey: "mainRecordId",  as: "calls" });
  ChatgptConversationScoreAiCalls.belongsTo(ChatgptConversationScoreAi, { foreignKey: "mainRecordId",   as: "conversation" });
  ChatgptConversationScoreAiCallAnalysis.belongsTo(ChatgptConversationScoreAiCalls, { foreignKey: "call_id",   as: "callData" });
 
};

export default relation;
