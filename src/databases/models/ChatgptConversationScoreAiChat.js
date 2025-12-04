export default function ChatgptConversationScoreAiChat(sequelize, DataTypes) {
    return sequelize.define(
        'ChatgptConversationScoreAiChat',
        {
            id: {
                type: DataTypes.BIGINT,
                autoIncrement: true,
                primaryKey: true,
            },
            ticketNumber: {
                type: DataTypes.STRING(255),
                allowNull: true,
                field: 'ticket_number'
            },
            callId: {
                type: DataTypes.BIGINT,
                allowNull: false,
                defaultValue: 0,
                field: 'call_id'
            },
            summary: {
                type: DataTypes.TEXT('long'),
                allowNull: true
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
            },
            messageType:{
                type: DataTypes.STRING(50),
                allowNull: true,
                field: 'message_type'
            }
        },
        {
            tableName: 'chatgpt_conversation_score_ai_chat',
            timestamps: true
        }
    );
}
