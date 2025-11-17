export default function ChatgptConversationScoreAiWhatsappMessages(
  sequelize,
  DataTypes
) {
  return sequelize.define(
    "ChatgptConversationScoreAiWhatsappMessages",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      type: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: "type",
      },
      message: {
        type: DataTypes.TEXT("long"),
        allowNull: true,
        field: "message",
      },
      ticket: {
        type: DataTypes.TEXT("long"),
        allowNull: true,
        field: "ticket",
      },
      agent: {
        type: DataTypes.TEXT("long"),
        allowNull: true,
        field: "agent",
      },
      sendToBtc: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
        field: "send_to_btc",
      },
    },
    {
      tableName: "chatgpt_conversation_score_ai_whatsapp_messages",
      timestamps: true,
    }
  );
}
