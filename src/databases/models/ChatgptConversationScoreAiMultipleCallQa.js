export default function ChatgptConversationScoreAiMultipleCallQa(sequelize, DataTypes) {
    return sequelize.define(
        'ChatgptConversationScoreAiMultipleCallQa',
        {
            id: {
                type: DataTypes.BIGINT,
                autoIncrement: true,
                primaryKey: true,
            },
            
            ticket_number:{
                type: DataTypes.TEXT('long'),
                allowNull: true
            },
            call_ids:{
                type: DataTypes.TEXT('long'),
                allowNull: true
            },
            question:{
                type: DataTypes.TEXT('long'),
                allowNull: true
            },
            answer:{
                type: DataTypes.TEXT('long'),
                allowNull: true
            },
        },
        {
            tableName: 'chatgpt_conversation_score_ai_multiple_call_qa',
            timestamps: true,
            underscored: true,
        }
    );
}