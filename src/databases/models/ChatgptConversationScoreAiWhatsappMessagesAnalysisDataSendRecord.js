export default function ChatgptConversationScoreAiWhatsappMessagesAnalysisDataSendRecord(sequelize, DataTypes) {
    return sequelize.define(
        'ChatgptConversationScoreAiWhatsappMessagesAnalysisDataSendRecord',
        {
            id: {
                type: DataTypes.BIGINT,
                autoIncrement: true,
                primaryKey: true,
            },
            recordIds:{
                type: DataTypes.TEXT('long'),
                allowNull: true,
            }
        },
        {
            tableName: 'chatgpt_conversation_score_ai_whatsapp_messages_send_record',
            timestamps: true,
            underscored: true,
        }
    );
}