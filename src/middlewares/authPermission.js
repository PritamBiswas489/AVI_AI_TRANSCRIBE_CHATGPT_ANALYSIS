const authPermission = (...roles) => {
	try {
		return (req, res, next) => {
			const roleToUpper = roles.map((r) => r.toUpperCase());
			if (!roleToUpper.includes(req.user.role)) {
				return res.send({ status: 401, data: [], error: { message: 'Unathorize action', reason: 'Access denied !' } });
			}
			next();
		};
	} catch (e) {
		res.send({ status: 500, data: [], error: { message: 'Something went wrong !', reason: e.message } });
	}
};
export default authPermission;
