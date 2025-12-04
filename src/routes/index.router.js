import express from 'express';
import "../config/environment.js";
import DataController from '../controllers/data.controller.js';
import db from "../databases/models/index.js";
import { checkSchema, validationResult } from "express-validator";
import { type } from 'os';
const { ChatgptConversationScoreAi, ChatgptConversationScoreAiCalls, ChatgptConversationScoreAiWhatsappMessages } = db;
const router = express.Router();
 

/**
 * @swagger
 * /api/webhookOne:
 *   get:
 *     summary: Webhook one endpoint
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *           nullable: true
 *         description: Code parameter
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *           nullable: true
 *         description: Phone parameter
 *     responses:
 *       200:
 *         description: webhookOne endpoint is working
 */
router.get('/webhookOne', async (req, res, next) => {
    const response = await DataController.webhookOne({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
    res.return(response);
});


/**
 * @swagger
 * /api/webhookTwo:
 *   post:
 *     summary: Webhook two endpoint
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties: {}
 *     responses:
 *       200:
 *         description: webhookTwo endpoint is working
 */
router.post('/webhookTwo', async (req, res, next) => {
    const response = await DataController.webhookTwo({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
    res.return(response);
});
/**
 * @swagger
 * /api/webhookMessage:
 *   post:
 *     summary: Webhook message endpoint
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string,
 *                 description: Type of message
 *                 example: agent
 *               message:
 *                 type: string
 *                 description: Message content
 *                 example: Simple message content
 *               ticket:
 *                 type: string
 *                 description: Ticket identifier
 *                 example: TICKET-12345
 *               agent:
 *                 type: string
 *                 description: Agent identifier
 *                 example: AGENT-67890
 *     responses:
 *       200:
 *         description: webhookMessage endpoint is working
 */
router.post('/webhookMessage', async (req, res, next) => {
    const response = await DataController.webhookMessage({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
    res.return(response);
});

/**
 * @swagger
 * /api/call-list:
 *   post:
 *     summary: Call list endpoint
 *     tags: [Data endpoints]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               page:
 *                 type: integer
 *                 default: 1
 *                 description: Page number
 *               limit:
 *                 type: integer
 *                 default: 10
 *                 description: Number of items per page
 *     responses:
 *       200:
 *         description: webhookOne endpoint is working
 */
router.post('/call-list', async (req, res) => {
   const response = await DataController.callList({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
   res.return(response)
});


/**
 * @swagger
 * /api/get-phone-call:
 *   get:
 *     summary: Get phone call by phone number
 *     tags: [Data endpoints]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: phoneNumbers
 *         schema:
 *           type: string
 *           nullable: true
 *         description: Phone number to search for
 *     responses:
 *       200:
 *         description: Returns phone call data
 */
router.get('/get-phone-call', async (req, res) => {
    const response = await DataController.getPhoneCalls({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
    res.return(response);
});

/**
 * @swagger
 * /api/count-phone-call:
 *   get:
 *     summary: Count phone calls
 *     tags: [Data endpoints]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: phoneNumbers
 *         schema:
 *           type: string
 *           nullable: true
 *         description: Phone number to search for
 *     responses:
 *       200:
 *         description: Returns phone call count
 */
router.get('/count-phone-call', async (req, res) => {
    const response = await DataController.countPhoneCalls({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
    res.return(response);
});






/**
 * @swagger
 * /api/call-details:
 *   get:
 *     summary: Get call details by call ID
 *     tags: [Data endpoints]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: callId
 *         schema:
 *           type: string
 *           nullable: true
 *         description: Call ID to search for
 *     responses:
 *       200:
 *         description: Returns call details
 */
router.get('/call-details', async (req, res) => {
    const response = await DataController.getCallDetails({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
    res.return(response);
});


/**
 * @swagger
 * /api/pending-call-list:
 *   get:
 *     summary: Get pending call list
 *     tags: [Data endpoints]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Returns pending call list
 */
router.get('/pending-call-list', async (req, res) => {
    const response = await DataController.getPendingCalls({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
    res.return(response);
});


/**
 * @swagger
 * /api/completed-call-list:
 *   get:
 *     summary: Get completed call list
 *     tags: [Data endpoints]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Returns completed call list
 */
router.get('/completed-call-list', async (req, res) => {
    const response = await DataController.getCompletedCalls({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
    res.return(response);
});


/**
 * @swagger
 * /api/email-analysis-data:
 *   get:
 *     summary: Get email analysis data
 *     tags: [Data endpoints]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Returns email analysis data
 */
router.get('/email-analysis-data', async (req, res) => {
    const response = await DataController.emailAnalysis({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
    res.return(response);
});


// /**
//  * @swagger
//  * /api/get-exchange-rate-resistance-data:
//  *   get:
//  *     summary: Get exchange rate resistance data
//  *     tags: [Data endpoints]
//  *     security:
//  *       - bearerAuth: []
//  *       - refreshToken: []
//  *     parameters:
//  *       - in: query
//  *         name: page
//  *         schema:
//  *           type: integer
//  *           default: 1
//  *         description: Page number
//  *       - in: query
//  *         name: limit
//  *         schema:
//  *           type: integer
//  *           default: 10
//  *         description: Number of items per page
//  *       - in: query
//  *         name: fromDate
//  *         schema:
//  *           type: string
//  *           format: date
//  *           nullable: true
//  *         description: Start date for filtering data
//  *       - in: query
//  *         name: toDate
//  *         schema:
//  *           type: string
//  *           format: date
//  *           nullable: true
//  *         description: End date for filtering data
//  *     responses:
//  *       200:
//  *         description: Returns exchange rate resistance data
//  */
// router.get('/get-exchange-rate-resistance-data', async (req, res) => {
//     const response = await DataController.exchangeRateResistanceData({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
//     res.return(response);
// });

/**
 * @swagger
 * /api/get-competitors-mentioned-data:
 *   get:
 *     summary: Get competitors mentioned data
 *     tags: [Data endpoints]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *           nullable: true
 *         description: Start date for filtering data
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *           nullable: true
 *         description: End date for filtering data
 *       - in: query
 *         name: emails
 *         schema:
 *           type: string
 *           nullable: true
 *         example: ""
 *         description: Comma-separated list of emails to filter by
 *     responses:
 *       200:
 *         description: Returns competitors mentioned data
 */
router.get('/get-competitors-mentioned-data', async (req, res) => {
    const response = await DataController.competitorsMentionedData({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
    res.return(response);
});

/**
 * @swagger
 * /api/get-payment-terms-or-exchange-rates-resistance-data:
 *   get:
 *     summary: Get payment terms resistance data
 *     tags: [Data endpoints]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *           nullable: true
 *         description: Start date for filtering data
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *           nullable: true
 *         description: End date for filtering data
 *       - in: query
 *         name: emails
 *         schema:
 *           type: string
 *           nullable: true
 *         example: ""
 *         description: Comma-separated list of emails to filter by
 *     responses:
 *       200:
 *         description: Returns payment terms resistance data
 */
router.get('/get-payment-terms-or-exchange-rates-resistance-data', async (req, res) => {
    const response = await DataController.paymentTermsResistanceData({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
    res.return(response);
});


/**
 * @swagger
 * /api/get-cancellation-policy-resistance-data:
 *   get:
 *     summary: Get cancellation policy resistance data
 *     tags: [Data endpoints]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *           nullable: true
 *         description: Start date for filtering data
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *           nullable: true
 *         description: End date for filtering data
 *       - in: query
 *         name: emails
 *         schema:
 *           type: string
 *           nullable: true
 *         example: ""
 *         description: Comma-separated list of emails to filter by
 *     responses:
 *       200:
 *         description: Returns cancellation policy resistance data
 */
router.get('/get-cancellation-policy-resistance-data', async (req, res) => {
    const response = await DataController.cancellationPolicyResistanceData({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
    res.return(response);
});


/**
 * @swagger
 * /api/get-agent-advised-independent-flight-booking-data:
 *   get:
 *     summary: Get agent advised independent flight booking data
 *     tags: [Data endpoints]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *           nullable: true
 *         description: Start date for filtering data
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *           nullable: true
 *         description: End date for filtering data
 *       - in: query
 *         name: emails
 *         schema:
 *           type: string
 *           nullable: true
 *         example: ""
 *         description: Comma-separated list of emails to filter by
 *     responses:
 *       200:
 *         description: Returns agent advised independent flight booking data
 */
router.get('/get-agent-advised-independent-flight-booking-data', async (req, res) => {
    const response = await DataController.agentAdvisedIndependentFlightBookingData({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
    res.return(response);
});


/**
 * @swagger
 * /api/whatappmessage/email-analysis-data:
 *   get:
 *     summary: Get email analysis data
 *     tags: [Data endpoints]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Returns email analysis data
 */
router.get('/whatappmessage/email-analysis-data', async (req, res) => {
    const response = await DataController.whatappmessageEmailAnalysis({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
    res.return(response);
});

/**
 * @swagger
 * /api/whatappmessage/email-analysis-data/mark-as-sent:
 *   post:
 *     summary: Mark email analysis data as sent
 *     tags: [Data endpoints]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recordId:
 *                 type: string
 *                 description: Record ID to mark as sent
 *             required:
 *               - recordId
 *     responses:
 *       200:
 *         description: Record marked as sent successfully
 */
router.post('/whatappmessage/email-analysis-data/mark-as-sent', async (req, res) => {
    const response = await DataController.markWhatsappMessageAnalysisDataAsSent({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
    res.return(response);

});

/**
 * @swagger
 * /api/whatappmessage/get-competitors-mentioned-data:
 *   get:
 *     summary: Get competitors mentioned data
 *     tags: [Data endpoints]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *           nullable: true
 *         description: Start date for filtering data
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *           nullable: true
 *         description: End date for filtering data
 *       - in: query
 *         name: emails
 *         schema:
 *           type: string
 *           nullable: true
 *         example: ""
 *         description: Comma-separated list of emails to filter by
 *     responses:
 *       200:
 *         description: Returns competitors mentioned data
 */
router.get('/whatappmessage/get-competitors-mentioned-data', async (req, res) => {
    const response = await DataController.whatappmessageCompetitorsMentionedData({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
    res.return(response);
});






/**
 * @swagger
 * /api/whatappmessage/get-payment-terms-or-exchange-rates-resistance-data:
 *   get:
 *     summary: Get payment terms resistance data
 *     tags: [Data endpoints]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *           nullable: true
 *         description: Start date for filtering data
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *           nullable: true
 *         description: End date for filtering data
 *       - in: query
 *         name: emails
 *         schema:
 *           type: string
 *           nullable: true
 *         example: ""
 *         description: Comma-separated list of emails to filter by
 *     responses:
 *       200:
 *         description: Returns payment terms resistance data
 */
router.get('/whatappmessage/get-payment-terms-or-exchange-rates-resistance-data', async (req, res) => {
    const response = await DataController.whatappmessagePaymentTermsResistanceData({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
    res.return(response);
});




/**
 * @swagger
 * /api/whatappmessage/get-cancellation-policy-resistance-data:
 *   get:
 *     summary: Get cancellation policy resistance data
 *     tags: [Data endpoints]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *           nullable: true
 *         description: Start date for filtering data
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *           nullable: true
 *         description: End date for filtering data
 *       - in: query
 *         name: emails
 *         schema:
 *           type: string
 *           nullable: true
 *         example: ""
 *         description: Comma-separated list of emails to filter by
 *     responses:
 *       200:
 *         description: Returns cancellation policy resistance data
 */
router.get('/whatappmessage/get-cancellation-policy-resistance-data', async (req, res) => {
    const response = await DataController.whatsappMessageCancellationPolicyResistanceData({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
    res.return(response);
});

/**
 * @swagger
 * /api/whatappmessage/get-agent-advised-independent-flight-booking-data:
 *   get:
 *     summary: Get agent advised independent flight booking data
 *     tags: [Data endpoints]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *           nullable: true
 *         description: Start date for filtering data
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *           nullable: true
 *         description: End date for filtering data
 *       - in: query
 *         name: emails
 *         schema:
 *           type: string
 *           nullable: true
 *         example: ""
 *         description: Comma-separated list of emails to filter by
 *     responses:
 *       200:
 *         description: Returns agent advised independent flight booking data
 */
router.get('/whatappmessage/get-agent-advised-independent-flight-booking-data', async (req, res) => {
    const response = await DataController.whatappmessageAgentAdvisedIndependentFlightBookingData({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
    res.return(response);
});
/**
 * @swagger
 * /api/execute-generate-chunk-media:
 *   post:
 *     summary: Execute generate chunk media endpoint
 *     tags: [Execute data individually]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               call_id:
 *                 type: string
 *                 description: Call ID parameter
 *     responses:
 *       200:
 *         description: execute-generate-chunk-media endpoint is working
 */
router.post('/execute-generate-chunk-media', async (req, res) => {
    const callId = req.body.call_id;
    if (!callId) {
        return res.status(400).json({ error: 'call_id is required' });
    }
    const getcall = await ChatgptConversationScoreAiCalls.findOne({ where: { id: callId } });

    if (!getcall) {
        return res.status(404).json({ error: 'Call record not found' });
    }
    console.log("getcall", getcall);
    await DataController.chunkmediafiles(getcall);
    res.return({ message: 'Chunk media processing started' });

});
/**
 * @swagger
 * /api/execute-chatgpt-transcription:
 *   post:
 *     summary: Execute chatgpt transcription endpoint
 *     tags: [Execute data individually]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               call_id:
 *                 type: string
 *                 description: Call ID parameter
 *     responses:
 *       200:
 *         description: execute-chatgpt-transcription endpoint is working
 */
router.post('/execute-chatgpt-transcription', async (req, res) => {
    const callId = req.body.call_id;
    if (!callId) {
        return res.status(400).json({ error: 'call_id is required' });
    }
    const getcall = await ChatgptConversationScoreAiCalls.findOne({ where: { id: callId } });

    if (!getcall) {
        return res.status(404).json({ error: 'Call record not found' });
    }
    // console.log("getcall", getcall);
    await DataController.chatgptTranscription(getcall);
    res.return({ message: 'ChatGPT transcription processing started' });
});


/**
 * @swagger
 * /api/execute-chatgpt-transcription-analysis:
 *   post:
 *     summary: Execute chatgpt transcription analysis endpoint
 *     tags: [Execute data individually]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               call_id:
 *                 type: string
 *                 description: Call ID parameter
 *     responses:
 *       200:
 *         description: execute-chatgpt-transcription-analysis endpoint is working
 */
router.post('/execute-chatgpt-transcription-analysis', async (req, res) => {
    const callId = req.body.call_id;
    if (!callId) {
        return res.status(400).json({ error: 'call_id is required' });
    }
    const getcall = await ChatgptConversationScoreAiCalls.findOne({ where: { id: callId } });

    if (!getcall) {
        return res.status(404).json({ error: 'Call record not found' });
    }
    console.log("getcall", getcall);
    await DataController.chatgptTranscriptionAnalysis(getcall);
    res.return({ message: 'ChatGPT transcription processing started' });
});

/**
 * @swagger
 * /api/execute-insert-analysis-record:
 *   post:
 *     summary: Execute insert analysis record endpoint
 *     tags: [Execute data individually]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               call_id:
 *                 type: string
 *                 description: Call ID parameter
 *     responses:
 *       200:
 *         description: execute-insert-analysis-record endpoint is working
 */
router.post('/execute-insert-analysis-record', async (req, res) => {
    const callId = req.body.call_id;
    if (!callId) {
        return res.status(400).json({ error: 'call_id is required' });
    }
    const getcall = await ChatgptConversationScoreAiCalls.findOne({ where: { id: callId } });
    if (!getcall) {
        return res.status(404).json({ error: 'Call record not found' });
    }
    await DataController.insertAnalysisRecord(getcall);
    res.return({ message: 'Analysis record insertion started' });

});
/**
 * @swagger
 * /api/execute-generate-embeddings:
 *   post:
 *     summary: Execute generate embeddings endpoint
 *     tags: [Execute data individually]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               call_id:
 *                 type: string
 *                 description: Call ID parameter
 *     responses:
 *       200:
 *         description: execute-generate-embeddings endpoint is working
 */
router.post('/execute-generate-embeddings', async (req, res) => {
    const callId = req.body.call_id;
    if (!callId) {
        return res.status(400).json({ error: 'call_id is required' });
    }
    const getcall = await ChatgptConversationScoreAiCalls.findOne({ where: { id: callId } });
    if (!getcall) {
        return res.status(404).json({ error: 'Call record not found' });
    }
    await DataController.generateEmbeddings(getcall);
    res.return({ message: 'Embeddings generation started' });

});



/**
 * @swagger
 * /api/execute-generate-embeddings-ask-question:
 *   post:
 *     summary: Execute generate embeddings ask question endpoint
 *     tags: [Execute data individually]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               call_id:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of Call ID parameters
 *                 default: ["1", "2"]
 *               question:
 *                 type: string
 *                 description: Question to ask about the embeddings
 *     responses:
 *       200:
 *         description: execute-generate-embeddings-ask-question endpoint is working
 */
router.post('/execute-generate-embeddings-ask-question', async (req, res) => {
    const callId = req.body.call_id;
    const question = req.body.question;
    if (callId.length === 0) {
        return res.status(400).json({ error: 'call_id is required' });
    }
     
    const getcalls = await ChatgptConversationScoreAiCalls.findAll({ where: { id: { [db.Sequelize.Op.in]: callId } } });
   
    if (!getcalls) {
        return res.status(404).json({ error: 'Call record not found' });
    }
    await Promise.all(getcalls.map(async (call) => {
        if (!call.embedding) {
            if(process.env.MODEL_TYPE === 'gemini') {
                await DataController.generateGeminiEmbeddings(call);
            }
            if(process.env.MODEL_TYPE === 'chatgpt') {
                await DataController.generateEmbeddings(call);
            }
        }
    }));
    let data = {};
    if(process.env.MODEL_TYPE === 'chatgpt') {
       data = await DataController.generateEmbeddingsAskQuestion(getcalls, question);
    }
    if(process.env.MODEL_TYPE === 'gemini') {
       data = await DataController.generateGeminiEmbeddingsAskQuestion(getcalls, question);
    }
    data.MODEL_TYPE = process.env.MODEL_TYPE;
    res.return(data);

});


/**
 * @swagger
 * /api/embedding-qa-list:
 *   get:
 *     summary: Get embedding Q&A list
 *     tags: [Data endpoints]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: ticketNumber
 *         schema:
 *           type: string
 *           nullable: true
 *         description: Ticket number to filter by
 *     responses:
 *       200:
 *         description: Returns embedding Q&A list
 */
router.get('/embedding-qa-list', async (req, res) => {
    const response = await DataController.embeddingQaList({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
    res.return(response);
});







/**
 * @swagger
 * /api/send-record-to-client:
 *   post:
 *     summary: Send record to client endpoint
 *     tags: [Execute data individually]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               call_id:
 *                 type: string
 *                 description: Call ID parameter
 *     responses:
 *       200:
 *         description: send-record-to-client endpoint is working
 */
router.post('/send-record-to-client', async (req, res) => {
    const callId = req.body.call_id;
    if (!callId) {
        return res.status(400).json({ error: 'call_id is required' });
    }
    const getcall = await ChatgptConversationScoreAiCalls.findOne({ where: { id: callId } });

    if (!getcall) {
        return res.status(404).json({ error: 'Call record not found' });
    }
    console.log("getcall", getcall);
    await DataController.sendRecordToClient(getcall);
    res.return({ message: 'ChatGPT transcription processing started' });
});



/**
 * @swagger
 * /api/gemini-transcribe:
 *   post:
 *     summary: Gemini transcribe endpoint
 *     tags: [Execute data individually]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               call_id:
 *                 type: string
 *                 description: Call ID parameter
 *     responses:
 *       200:
 *         description: gemini-transcribe endpoint is working
 */
router.post('/gemini-transcribe', async (req, res) => {
    const callId = req.body.call_id;
    if (!callId) {
        return res.status(400).json({ error: 'call_id is required' });
    }
    const getcall = await ChatgptConversationScoreAiCalls.findOne({ where: { id: callId } });

    if (!getcall) {
        return res.status(404).json({ error: 'Call record not found' });
    }
    // console.log("getcall", getcall);
    const result = await DataController.geminiTranscribe(getcall);
    res.return({ message: 'ChatGPT transcription processing started', result });
});


/**
 * @swagger
 * /api/gemini-execute-generate-embeddings:
 *   post:
 *     summary: Gemini execute generate embeddings endpoint
 *     tags: [Execute data individually]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               call_id:
 *                 type: string
 *                 description: Call ID parameter
 *     responses:
 *       200:
 *         description: gemini-execute-generate-embeddings endpoint is working
 */
router.post('/gemini-execute-generate-embeddings', async (req, res) => {
    const callId = req.body.call_id;
    if (!callId) {
        return res.status(400).json({ error: 'call_id is required' });
    }
    const getcall = await ChatgptConversationScoreAiCalls.findOne({ where: { id: callId } });
    if (!getcall) {
        return res.status(404).json({ error: 'Call record not found' });
    }
    await DataController.generateGeminiEmbeddings(getcall);
    res.return({ message: 'Embeddings generation started' });

});


/**
 * @swagger
 * /api/execute-gemini-generate-embeddings-ask-question:
 *   post:
 *     summary: Execute generate embeddings ask question endpoint
 *     tags: [Execute data individually]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               call_id:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of Call ID parameters
 *                 default: ["1", "2"]
 *               question:
 *                 type: string
 *                 description: Question to ask about the embeddings
 *     responses:
 *       200:
 *         description: execute-gemini-generate-embeddings-ask-question endpoint is working
 */
router.post('/execute-gemini-generate-embeddings-ask-question', async (req, res) => {
    const callId = req.body.call_id;
    const question = req.body.question;
    if (callId.length === 0) {
        return res.status(400).json({ error: 'call_id is required' });
    }
     
    const getcalls = await ChatgptConversationScoreAiCalls.findAll({ where: { id: { [db.Sequelize.Op.in]: callId } } });
   
    if (!getcalls) {
        return res.status(404).json({ error: 'Call record not found' });
    }
    await Promise.all(getcalls.map(async (call) => {
        if (!call.embedding) {
            await DataController.generateGeminiEmbeddings(call);
        }
    }));
    
    const data = await DataController.generateGeminiEmbeddingsAskQuestion(getcalls, question);
    res.return(data);

});





/**
 * @swagger
 * /api/delete-call-files:
 *   post:
 *     summary: Delete call files endpoint
 *     tags: [Execute data individually]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               call_id:
 *                 type: string
 *                 description: Call ID parameter
 *     responses:
 *       200:
 *         description: delete-call-files endpoint is working
 */

router.post('/delete-call-files', async (req, res) => {
    const callId = req.body.call_id;
    if (!callId) {
        return res.status(400).json({ error: 'call_id is required' });
    }
    const getcall = await ChatgptConversationScoreAiCalls.findOne({ where: { id: callId } });

    if (!getcall) {
        return res.status(404).json({ error: 'Call record not found' });
    }
    console.log("getcall", getcall);
    await DataController.deleteCallFiles(getcall);
    res.return({ message: 'ChatGPT transcription processing started' });
});


/**
 * @swagger
 * /api/send-call-data-btc-thai:
 *   post:
 *     summary: Send call data to BTC Thai endpoint
 *     tags: [Execute data individually]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: send-call-data-btc-thai endpoint is working
 */
router.post('/send-call-data-btc-thai', async (req, res) => {
    const getcalls = await ChatgptConversationScoreAiCalls.findAll(
        { 
            where: { sendToBtc: false },
            attributes: ['id', 'ticketNumber','hookTwoRequest'],
            limit:2,
            order: [['createdAt', 'DESC']]
        },
    );

     
    if (getcalls.length === 0) {
        return res.status(404).json({ error: 'Call record not found' });
    }
    

     const d = [];
     const callIds = []; 
     
     for (const call of getcalls) {
        d.push({ ticket_code: call.ticketNumber, data: JSON.parse(call.hookTwoRequest)});
        callIds.push(call.id);
     }
    const result = await DataController.sendCallDataBtcThai(d, callIds);
    res.return({ message: 'Call data sent to BTC Thai started', result });

});

/**
 * @swagger
 * /api/send-agent-message-btc-offer:
 *   post:
 *     summary: Send call data to BTC Thai endpoint
 *     tags: [Execute data individually]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: send-call-data-btc-thai endpoint is working
 */

router.post('/send-agent-message-btc-offer', async (req, res) => {
    const getmessages  = await ChatgptConversationScoreAiWhatsappMessages.findAll({ 
            where: { sendToBtc: false, type: 'agent' },
            attributes: ['id', 'message','ticket', 'agent', 'createdAt'],
            limit:2,
            order: [['createdAt', 'DESC']]
        },
    );
    if (getmessages.length === 0) {
        return res.status(404).json({ error: 'Messages not found' });
    }

    const d = [];
    const messageIds = [];

    for (const message of getmessages) {
        d.push({ ticket: message.ticket, agent: message.agent, message: message.message, createdAt: message.createdAt });
        messageIds.push(message.id);
    }

    console.log("Messages to send:", d);
    console.log("Message IDs:", messageIds);

    const result = await DataController.sendMessageDataBtcThai(d, messageIds);
    res.return({ message: 'Call data sent to BTC Thai started', result });


});



// ✅ Define validation middleware
const validateChatgptChatTranscription = checkSchema({
  ticketNumber: { notEmpty: true, errorMessage: "ticketNumber is required" },
  callId: { notEmpty: true, errorMessage: "callId is required" },
  message: {
    notEmpty: true,
    isString: true,
  },
});

/**
 * @swagger
 * /api/chatgpt-chat-transcription:
 *   post:
 *     summary: ChatGPT chat transcription endpoint
 *     tags: [Data endpoints]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ticketNumber:
 *                 type: string
 *                 description: Ticket number
 *               callId:
 *                 type: string
 *                 description: Call ID
 *               message:
 *                 type: string
 *                 description: Message content
 *               messageType:
 *                 type: string
 *                 description: Message type
 *             required:
 *               - ticketNumber
 *               - callId
 *               - message
 *     responses:
 *       200:
 *         description: Chat transcription processed successfully
 */
router.post('/chatgpt-chat-transcription',validateChatgptChatTranscription,  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    let response = {};
    if(process.env.MODEL_TYPE === 'chatgpt') {
        response = await DataController.chatgptChatTranscription({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
    }
    if(process.env.MODEL_TYPE === 'gemini') {
        response = await DataController.geminiChatTranscription({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });

    }
    response.MODEL_TYPE = process.env.MODEL_TYPE;
   
    res.return(response);
});

/**
 * @swagger
 * /api/chatgpt-chat-transcription-messages:
 *   get:
 *     summary: Get ChatGPT chat transcription messages
 *     tags: [Data endpoints]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: ticketNumber
 *         schema:
 *           type: string
 *         required: true
 *         description: Ticket number to retrieve messages for
 *       - in: query
 *         name: callId
 *         schema:
 *           type: string
 *         required: true
 *         description: Call ID to retrieve messages for
 *       - in: query
 *         name: messageType
 *         schema:
 *           type: string
 *           nullable: true
 *         description: Message type to filter by
 *     responses:
 *       200:
 *         description: Returns chat transcription messages
 */
router.get('/chatgpt-chat-transcription-messages', async (req, res) => {
    const response = await DataController.getChatgptChatTranscriptionMessages({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
    res.return(response);
});


/**
 * @swagger
 * /api/get-cron-track-data:
 *   get:
 *     summary: Get cron track data
 *     tags: [Data endpoints]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: cron_function
 *         schema:
 *           type: string
 *           nullable: true
 *         description: Cron function name to filter by
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *           nullable: true
 *         description: Date to filter by
 *     responses:
 *       200:
 *         description: Returns cron track data
 */
router.get('/get-cron-track-data', async (req, res) => {
    const response = await DataController.getCronTrackData({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
    res.return(response);
});



/**
 * @swagger
 * /api/whatsapp-messages-date-id-by-tktno:
 *   get:
 *     summary:  Get WhatsApp messages with date ID by ticket number
 *     tags: [Data endpoints]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: ticketNumber
 *         schema:
 *           type: string
 *           nullable: true
 *         description: Ticket number to filter by
 *     responses:
 *       200:
 *         description: Returns WhatsApp messages with analysis
 */
router.get('/whatsapp-messages-date-id-by-tktno', async (req, res) => {
    const response = await DataController.getWhatsappMessagesDateIdByTktno({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
    res.return(response);
});


/**
 * @swagger
 * /api/whatsapp-message-with-summary-analysis-by-id:
 *   get:
 *     summary: Get WhatsApp message with summary analysis by ID
 *     tags: [Data endpoints]
 *     security:
 *       - bearerAuth: []
 *       - refreshToken: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Message ID to retrieve analysis for
 *     responses:
 *       200:
 *         description: Returns WhatsApp message with summary analysis
 */
router.get('/whatsapp-message-with-summary-analysis-by-id', async (req, res) => {
    const response = await DataController.getWhatsappMessageWithSummaryAnalysisById({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
    res.return(response);
});










 

export default router;
