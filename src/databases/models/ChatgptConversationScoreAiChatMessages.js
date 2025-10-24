export default function ChatgptConversationScoreAiChatMessages(sequelize, DataTypes) {
    return sequelize.define(
        'ChatgptConversationScoreAiChatMessages',
        {
            id: {
                type: DataTypes.BIGINT,
                autoIncrement: true,
                primaryKey: true,
            },
            chatId: {
                type: DataTypes.BIGINT,
                allowNull: false,
                defaultValue: 0,
                field: 'chat_id'
            },
            sender: {
                type: DataTypes.STRING(255),
                allowNull: true
            },
            message: {
                type: DataTypes.TEXT('long'),
                allowNull: true
            },
            summarized: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
                field: 'created_at'
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
                field: 'updated_at'
            }
        },
        {
            tableName: 'chatgpt_conversation_score_ai_chat_messages',
            timestamps: true
        }
    );
}
