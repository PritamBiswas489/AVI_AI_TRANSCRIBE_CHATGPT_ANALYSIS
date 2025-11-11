 
import './environment.js';
const dbConfig = {
	username: process.env.DB_USERNAME ,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_DATABASE  ,
	options: {
		host: process.env.DB_HOST  ,
		dialect: 'mysql',
		logging:false,
		pool: {
			max: 5,
			min: 0,
			acquire: 3000,
			idle: 1000,
		},
		timezone: '+00:00',
	},
};
export default dbConfig;
