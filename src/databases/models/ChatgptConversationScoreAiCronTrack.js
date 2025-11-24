export default function ChatgptConversationScoreAiCronTrack(
  sequelize,
  DataTypes
) {
  return sequelize.define(
    "ChatgptConversationScoreAiCronTrack",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      cronFunction:{
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "cron_function",
      },
      data:{
        type: DataTypes.TEXT("long"),
        allowNull: true,
        field: "data",
      }
    },
    {
      tableName: "chatgpt_conversation_score_ai_cron_track",
      timestamps: true,
    }
  );
}
