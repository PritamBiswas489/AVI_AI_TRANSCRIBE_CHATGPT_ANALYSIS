export default function ChatgptConversationScoreAi(sequelize, DataTypes) {
	return sequelize.define(
		'ChatgptConversationScoreAi',
		{
			id: {
				type: DataTypes.BIGINT,
				autoIncrement: true,
				primaryKey: true,
			},
			ticketNumber: {
				type: DataTypes.TEXT,
				allowNull: true,
				field: 'ticket_number'
			},
			phoneNumber: {
				type: DataTypes.TEXT,
				allowNull: true,
				field: 'phone_number'
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
			tableName: 'chatgpt_conversation_score_ai',
			timestamps: true
		}
	);
}
