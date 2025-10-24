import '../config/environment.js';
import jwt from 'jsonwebtoken';
import { generateToken } from '../libraries/auth.js';
import UserService from '../services/user.service.js';

const { ACCESS_TOKEN_SECRET_KEY, REFRESH_TOKEN_SECRET_KEY, JWT_ALGO, ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } = process.env;

export default async (req, res, next) => {
	const i18n = req.headers.i18n;
	const deviceID = req.headers.deviceid;
	 const routePath = req.originalUrl;
    //get slug of routePath
    const routeSlug = routePath.split("/").pop();
    let checkdeviceid= true;
    if(routeSlug === "save-device-id"){
      checkdeviceid = false;
    }
	console.log("Route Path:", routePath);
	// if(routePath.includes('ninePay')){
	// 	console.log("Skipping JWT verification for NinePay route");
	// 	return next();
	// }
	 

	try {
		const { authorization, refreshtoken } = req.headers;
		// console.log({ authorization, refreshtoken });


		if (!authorization) {
			return res.send({
				status: 401,
				data: [],
				error: { message: i18n.__("UNAUTHORIZED_ACTION"), reason: i18n.__("TOKEN_NOT_FOUND") },
			});
		}
		const token = authorization.split(' ')[1];
		try {
			const verifiedData = jwt.verify(token, ACCESS_TOKEN_SECRET_KEY);
			const getUserById = await UserService.getUserById(verifiedData.id);	
			if(getUserById.status!=='active'){
				return res.send({ status: 403, data: [], error: { message: i18n.__("DEACTIVATED_BY_SYSTEM_ADMIN") } });
			}
			const checkDeviceIdExistance = await UserService.checkDeviceIdExistance(verifiedData.id, deviceID);
			if(!checkDeviceIdExistance && checkdeviceid){
				return res.send({ status: 403, data: [], error: { message: i18n.__("DEVICE_ID_MISMATCH") } });
			}
			req.user = verifiedData;
			return next();
		} catch (e) {
			if (!refreshtoken) {
				return res.send({
					status: 401,
					data: [],
					error: { message: i18n.__("UNAUTHORIZED_ACTION"), reason: i18n.__("REFRESH_TOKEN_NOT_FOUND") },
				});
			}
			jwt.verify(refreshtoken, REFRESH_TOKEN_SECRET_KEY, async (err, data) => {
				if (err) {
					return res.send({ status: 401, data: [], error: { message: i18n.__("UNAUTHORIZED_ACTION") } });
				}

				const payload = {
					id: data.id,
					email: data.email,
					role: data.role,
					avatar: data.avatar,
					name: data.name,
					userName: data.userName,
					// theme: data.theme,
				};

				const getUserById = await UserService.getUserById(data.id);
				 
				if(getUserById.status!=='active'){
					return res.send({ status: 403, data: [], error: { message: i18n.__("DEACTIVATED_BY_SYSTEM_ADMIN") } });
				}
				const checkDeviceIdExistance = await UserService.checkDeviceIdExistance(data.id, deviceID);
				if(!checkDeviceIdExistance && checkdeviceid){
					return res.send({ status: 403, data: [], error: { message: i18n.__("DEVICE_ID_MISMATCH") } });
				}

				req.user = payload;
				const accessToken = await generateToken(payload, JWT_ALGO, ACCESS_TOKEN_SECRET_KEY, Number(ACCESS_TOKEN_EXPIRES_IN));
				const refreshToken = await generateToken(payload, JWT_ALGO, REFRESH_TOKEN_SECRET_KEY, Number(REFRESH_TOKEN_EXPIRES_IN));

				res.set({ accesstoken: accessToken, refreshtoken: refreshToken });
				res.accesstoken = accessToken;
				res.refreshtoken = refreshToken;
				return next();
			});
		}
	} catch (e) {
		res.send({ status: 500, data: [], error: { message: i18n.__("CATCH_ERROR"), reason: e.message } });
	}
};
