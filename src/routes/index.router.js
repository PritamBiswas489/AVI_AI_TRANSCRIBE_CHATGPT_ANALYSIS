import express from 'express';
import DataController from '../controllers/data.controller.js';
import db from "../databases/models/index.js";
import { checkSchema, validationResult } from "express-validator";
const { ChatgptConversationScoreAi, ChatgptConversationScoreAiCalls } = db;
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
 * /api/execute-chatgpt-transcription-analysis-gpt-4-1:
 *   post:
 *     summary: Execute chatgpt transcription analysis  gpt-4-1 endpoint
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
 *         description: execute-chatgpt-transcription-analysis-gpt-4-1 endpoint is working
 */

router.post('/execute-chatgpt-transcription-analysis-gpt-4-1', async (req, res) => {
     const callId = req.body.call_id;
    if (!callId) {
        return res.status(400).json({ error: 'call_id is required' });
    }
    const getcall = await ChatgptConversationScoreAiCalls.findOne({ where: { id: callId } });

    if (!getcall) {
        return res.status(404).json({ error: 'Call record not found' });
    }
    // console.log("getcall", getcall);
    await DataController.chatgptTranscriptionAnalysis_gpt_4_1(getcall);
    res.return({ message: 'ChatGPT transcription processing started' });

});

/**
 * @swagger
 * /api/execute-chatgpt-transcription-analysis-gpt-4-1-mini:
 *   post:
 *     summary: Execute chatgpt transcription analysis  gpt-4-1-mini endpoint
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
 *         description: execute-chatgpt-transcription-analysis-gpt-4-1-mini endpoint is working
 */


router.post('/execute-chatgpt-transcription-analysis-gpt-4-1-mini', async (req, res) => {
     const callId = req.body.call_id;
    if (!callId) {
        return res.status(400).json({ error: 'call_id is required' });
    }
    const getcall = await ChatgptConversationScoreAiCalls.findOne({ where: { id: callId } });

    if (!getcall) {
        return res.status(404).json({ error: 'Call record not found' });
    }
    console.log("getcall", getcall);
    await DataController.chatgptTranscriptionAnalysis_gpt_4_1_mini(getcall);
    res.return({ message: 'ChatGPT transcription processing started' });

});

/**
 * @swagger
 * /api/execute-chatgpt-transcription-analysis-gpt-4-1-nano:
 *   post:
 *     summary: Execute chatgpt transcription analysis  gpt-4-1-nano endpoint
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
 *         description: execute-chatgpt-transcription-analysis-gpt-4-1-nano endpoint is working
 */

router.post('/execute-chatgpt-transcription-analysis-gpt-4-1-nano', async (req, res) => {
     const callId = req.body.call_id;
    if (!callId) {
        return res.status(400).json({ error: 'call_id is required' });
    }
    const getcall = await ChatgptConversationScoreAiCalls.findOne({ where: { id: callId } });

    if (!getcall) {
        return res.status(404).json({ error: 'Call record not found' });
    }
    console.log("getcall", getcall);
    await DataController.chatgptTranscriptionAnalysis_gpt_4_1_nano(getcall);
    res.return({ message: 'ChatGPT transcription processing started' });
});

/**
 * @swagger
 * /api/execute-chatgpt-transcription-analysis-gpt-3-5-turbo:
 *   post:
 *     summary: Execute chatgpt transcription analysis  gpt-3-5-turbo endpoint
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
 *         description: execute-chatgpt-transcription-analysis-gpt-3-5-turbo endpoint is working
 */
router.post('/execute-chatgpt-transcription-analysis-gpt-3-5-turbo', async (req, res) => {
    const callId = req.body.call_id;
    if (!callId) {
      return res.status(400).json({ error: "call_id is required" });
    }
    const getcall = await ChatgptConversationScoreAiCalls.findOne({
      where: { id: callId },
    });

    if (!getcall) {
      return res.status(404).json({ error: "Call record not found" });
    }
    console.log("getcall", getcall);
    await DataController.chatgptTranscriptionAnalysis_gpt_3_5_turbo(getcall);
    res.return({ message: "ChatGPT transcription processing started" });


});

/**
 * @swagger
 * /api/execute-chatgpt-transcription-analysis-gpt-5:
 *   post:
 *     summary: Execute chatgpt transcription analysis  gpt-5 endpoint
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
 *         description: execute-chatgpt-transcription-analysis-gpt-5 endpoint is working
 */
router.post(
  "/execute-chatgpt-transcription-analysis-gpt-5",
  async (req, res) => {
    const callId = req.body.call_id;
    if (!callId) {
      return res.status(400).json({ error: "call_id is required" });
    }
    const getcall = await ChatgptConversationScoreAiCalls.findOne({
      where: { id: callId },
    });

    if (!getcall) {
      return res.status(404).json({ error: "Call record not found" });
    }
    console.log("getcall", getcall);
    await DataController.chatgptTranscriptionAnalysis_gpt_5(getcall);
    res.return({ message: "ChatGPT transcription processing started" });
  }
);

/**
 * @swagger
 * /api/execute-chatgpt-transcription-analysis-gpt-5-mini:
 *   post:
 *     summary: Execute chatgpt transcription analysis  gpt-5-mini endpoint
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
 *         description: execute-chatgpt-transcription-analysis-gpt-5-mini endpoint is working
 */
router.post(
  "/execute-chatgpt-transcription-analysis-gpt-5-mini",
  async (req, res) => {
    const callId = req.body.call_id;
    if (!callId) {
      return res.status(400).json({ error: "call_id is required" });
    }
    const getcall = await ChatgptConversationScoreAiCalls.findOne({
      where: { id: callId },
    });

    if (!getcall) {
      return res.status(404).json({ error: "Call record not found" });
    }
    console.log("getcall", getcall);
    await DataController.chatgptTranscriptionAnalysis_gpt_5_mini(getcall);
    res.return({ message: "ChatGPT transcription processing started" });
  }
);







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
    const response = await DataController.chatgptChatTranscription({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
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
 *     responses:
 *       200:
 *         description: Returns chat transcription messages
 */
router.get('/chatgpt-chat-transcription-messages', async (req, res) => {
    const response = await DataController.getChatgptChatTranscriptionMessages({ payload: { ...req.params, ...req.query, ...req.body }, headers: req.headers });
    res.return(response);
});





 

export default router;
