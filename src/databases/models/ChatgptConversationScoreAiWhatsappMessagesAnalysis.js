export default function ChatgptConversationScoreAiWhatsappMessagesAnalysis(
  sequelize,
  DataTypes
) {
  return sequelize.define(
    "ChatgptConversationScoreAiWhatsappMessagesAnalysis",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      ticketNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "ticket_number",
      },
      messages: {
        type: DataTypes.TEXT("long"),
        allowNull: true,
        field: "messages",
      },
      gptSummary: {
        type: DataTypes.TEXT("long"),
        allowNull: true,
        field: "gpt_summary",
      },
      gptAnalysis: {
        type: DataTypes.TEXT("long"),
        allowNull: true,
        field: "gpt_analysis",
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "status",
        defaultValue: 0,
      },
      messageDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "message_date",
      },
    },
    {
      tableName: "chatgpt_conversation_score_ai_whatsapp_messages_analysis",
      timestamps: true,
    }
  );
}
