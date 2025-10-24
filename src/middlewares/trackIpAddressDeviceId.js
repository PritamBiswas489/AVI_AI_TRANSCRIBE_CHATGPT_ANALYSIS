import axios from "axios";

import TrackIpAddressDeviceIdService from "../services/trackIpAddressDeviceId.service.js";
import "../config/environment.js";
import * as Sentry from "@sentry/node";

const trackIpAddressDeviceId = async (req, res, next) => {
  try {
    // console.log(req?.headers);
    const ip = req?.headers?.["x-ip-address"] || "186.102.114.93"; // Default IP for testing
    const deviceId = req?.headers?.["x-device-id"] || "api-developer-device-id-6666"; // Default Device ID for testing
    const deviceName = req?.headers?.["x-device-name"] || "api-developer-device-name-12310"; // Default Device Name for testing
    const deviceType = req?.headers?.["x-device-type"] || "Android"; // Default Device Type for testing
    let deviceLocation = req?.headers?.["x-device-location"] || ""; // Default Device Location for testing
    if(process.env.NODE_ENV === "development"){
      deviceLocation = "51.5074,-0.1278";  
    }
    const routePath = req.originalUrl;

    let ipCountry = "";
    let ipRegion = "";
    let ipCity = "";
    let ipIsp = "";
    let ipLat = "";
    let ipLon = "";
    let ipTimezone = "";
    let userId = "";

    const getTrackByIpAddress =
      await TrackIpAddressDeviceIdService.getTrackByIpAddress(ip);

    if (getTrackByIpAddress?.data?.id) {
        // console.log("Track already exists for IP:", ip);
        ipCountry = getTrackByIpAddress.data.ipCountry || "";
        ipRegion = getTrackByIpAddress.data.ipRegion || "";
        ipCity = getTrackByIpAddress.data.ipCity || "";
        ipIsp = getTrackByIpAddress.data.ipIsp || "";
        ipLat = getTrackByIpAddress.data.ipLat || "";
        ipLon = getTrackByIpAddress.data.ipLon || "";
        ipTimezone = getTrackByIpAddress.data.ipTimezone || "";
        userId = req?.user?.id || null;
    } else {
      const apiUrl = `https://pro.ip-api.com/json/${ip}?key=${process.env.IP_TRACKER_API_KEY}&fields=status,message,country,countryCode,region,regionName,city,district,zip,lat,lon,timezone,currency,isp,org,as,mobile,proxy,query`;

      const response = await axios.get(apiUrl);
      let extractData = {};
      try {
        if (response.data && typeof response.data === "object") {
          extractData = response.data;
        }
      } catch (err) {
        process.env.SENTRY_ENABLED === "true" && Sentry.captureException(err);
        extractData = {};
      }

      // console.log("extractData:", extractData);

      ipCountry = extractData?.country || "";
      ipRegion = extractData?.regionName || "";
      ipCity = extractData?.city || "";
      ipIsp = extractData?.isp || "";
      ipLat = extractData?.lat || "";
      ipLon = extractData?.lon || "";
      ipTimezone = extractData?.timezone || "";
      userId = req?.user?.id || null;
    }

    await TrackIpAddressDeviceIdService.createTrackIpAddressDeviceId({
      ip,
      deviceId,
      userId,
      routePath,
      ipCountry,
      ipRegion,
      ipCity,
      ipIsp,
      ipLat,
      ipLon,
      ipTimezone,
    });
     req.headers['deviceid'] = deviceId;
     req.headers['deviceName'] = deviceName;  
     req.headers['deviceType'] = deviceType;
     req.headers['deviceLocation'] = deviceLocation;
  } catch (e) {
    process.env.SENTRY_ENABLED === "true" && Sentry.captureException(e);
    console.error("Error tracking IP address and device ID:", e.message);
  }
 
  next();
};

export default trackIpAddressDeviceId;
