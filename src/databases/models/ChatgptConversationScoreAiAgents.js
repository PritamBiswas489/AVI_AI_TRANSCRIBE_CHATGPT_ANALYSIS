export default function ChatgptConversationScoreAiAgents(sequelize, DataTypes) {
return sequelize.define(
    "ChatgptConversationScoreAiAgents",
    {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        apiId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        role: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        roleId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        avatarUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        onlineStatus: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        status: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        gender: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        lastPswdChange: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        twofactorAuth: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        voiceStatus: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        sipPhoneId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        apiPhoneId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        tableName: "chatgpt_conversation_score_ai_agents",
        timestamps: true,
        underscored: true,
    }
);
}
