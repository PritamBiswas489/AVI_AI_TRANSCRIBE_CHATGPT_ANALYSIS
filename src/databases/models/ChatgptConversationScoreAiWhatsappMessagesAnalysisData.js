export default function ChatgptConversationScoreAiWhatsappMessagesAnalysisData(sequelize, DataTypes) {
    return sequelize.define(
        'ChatgptConversationScoreAiWhatsappMessagesAnalysisData',
        {
            id: {
                type: DataTypes.BIGINT,
                autoIncrement: true,
                primaryKey: true,
            },
            
            ticket_number:{
                type: DataTypes.STRING,
                allowNull: true
            },
            message_id:{
                type: DataTypes.STRING,
                allowNull: true
            },
            exchange_rate_resistance:{
                type: DataTypes.STRING,
                allowNull: true
            },
            exchange_rate_resistance_details:{
                type: DataTypes.TEXT('long'),
                allowNull: true
            },
            competitors_mentioned:{
                type: DataTypes.STRING,
                allowNull: true

            },
            competitor_names:{
                type: DataTypes.TEXT('long'),
                allowNull: true
            },
            payment_terms_resistance:{
                type: DataTypes.STRING,
                allowNull: true
            },
            payment_terms_resistance_details:{
                type: DataTypes.TEXT('long'),
                allowNull: true
            },
            cancellation_policy_resistance:{
                type: DataTypes.STRING,
                allowNull: true
            },
            cancellation_policy_resistance_details:{
                type: DataTypes.TEXT('long'),
                allowNull: true
            },
            agent_advised_independent_flight_booking:{
                type: DataTypes.STRING,
                allowNull: true
            },
            agent_advised_independent_flight_booking_details:{
                type: DataTypes.TEXT('long'),
                allowNull: true
            },
            messageDate: {
                type: DataTypes.DATE,
                allowNull: true,
                
            },
        },
        {
            tableName: 'chatgpt_conversation_score_ai_whatsapp_messages_analysis_data',
            timestamps: true,
            underscored: true,
        }
    );
}