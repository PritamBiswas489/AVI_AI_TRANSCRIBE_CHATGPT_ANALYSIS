export default function ChatgptConversationScoreAiCalls(sequelize, DataTypes) {
    return sequelize.define(
        'ChatgptConversationScoreAiCalls',
        {
            id: {
                type: DataTypes.BIGINT,
                autoIncrement: true,
                primaryKey: true,
            },
            mainRecordId: {
                type: DataTypes.BIGINT,
                allowNull: true,
                field: 'main_record_id'
            },
            ticketNumber: {
                type: DataTypes.TEXT('long'),
                allowNull: true,
                field: 'ticket_number'
            },
            mp3File: {
                type: DataTypes.TEXT('long'),
                allowNull: true,
                field: 'mp3_file'
            },
            wavFile: {
                type: DataTypes.TEXT('long'),
                allowNull: true,
                field: 'wav_file'
            },
            chunkFolderPath: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: 'chunk_folder_path'
            },
            sonixMediaId: {
                type: DataTypes.TEXT('long'),
                allowNull: true,
                field: 'sonix_media_id'
            },
            sonixWebhookResponse: {
                type: DataTypes.TEXT('long'),
                allowNull: true,
                field: 'sonix_webhook_response'
            },
            userEmail: {
                type: DataTypes.STRING(500),
                allowNull: true,
                field: 'userEmail'
            },
            gcsUrl: {
                type: DataTypes.TEXT('long'),
                allowNull: true,
                field: 'gcs_url'
            },
            operationName: {
                type: DataTypes.TEXT('long'),
                allowNull: true,
                field: 'operation_name'
            },
            isCompleteByGoogle: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                field: 'is_complete_by_google'
            },
            speechText: {
                type: DataTypes.TEXT('long'),
                allowNull: true,
                field: 'speech_text'
            },
            chatgptText: {
                type: DataTypes.TEXT('long'),
                allowNull: true,
                field: 'chatgpt_text'
            },
            sendReturn: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                field: 'send_return'
            },
            hookTwoRequest: {
                type: DataTypes.TEXT('long'),
                allowNull: true,
                field: 'hook_two_request'
            },
            durations: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            satisfaction: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0.00
            },
            chatgptModel: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: 'chatgpt_model'
            },
            embedding: {
                type: DataTypes.TEXT('long'),
                allowNull: true,
                field: 'embedding'
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
            tableName: 'chatgpt_conversation_score_ai_calls',
            timestamps: true
        }
    );
}
