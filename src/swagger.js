import swaggerJsdoc from "swagger-jsdoc";
import "./config/environment.js";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Chatgpt audio transcribe",
      version: "1.0.0",
      description: "API docs with Swagger for travel wallet",
    },
    tags: [
      {
        name: "Testing endpoints",
        description: "Endpoints for testing purposes",
      },
      {
        name: "Webhooks",
        description: "All webhooks endpoints",
      },
      {
        name: "Data endpoints",
        description: "Endpoints for data fetching and manipulation",
      }
    ],
    servers: [
      {
        url: process.env.BASE_URL || "http://localhost:4000",
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Access token for authentication (in Authorization header)",
        },
        refreshToken: {
          type: "apiKey",
          in: "header",
          name: "refreshtoken",
          description:
            "Refresh token for renewing access (in `refreshtoken` header)",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  //   apis: ['./routes/*.js'],
  apis: ["./src/*.js", "./src/routes/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
