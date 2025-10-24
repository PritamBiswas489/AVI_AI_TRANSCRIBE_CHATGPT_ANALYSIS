const relation = (db) => {
  const { ChatgptConversationScoreAi, ChatgptConversationScoreAiCalls} = db;
 
  ChatgptConversationScoreAi.hasMany(ChatgptConversationScoreAiCalls, { foreignKey: "mainRecordId",  as: "calls" });
  ChatgptConversationScoreAiCalls.belongsTo(ChatgptConversationScoreAi, { foreignKey: "mainRecordId",   as: "conversation" });
 
};

export default relation;
