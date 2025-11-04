#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// Type definitions for the API
interface DataRow {
  [key: string]: string | number;
}

interface PredictRequest {
  rows: DataRow[];
  index_column?: string;
}

interface PredictionResult {
  [key: string]: any;
}

interface PredictResponse {
  prediction: {
    id: string;
    metadata: {
      num_columns: number;
      num_predict_rows: number;
      num_predict_tokens: number;
      num_rows: number;
    };
    predictions: PredictionResult[];
  };
  delay: number;
}

// Get API key from environment variable
const API_KEY = process.env.SAP_RPT1_API_KEY;

if (!API_KEY) {
  console.error("Error: SAP_RPT1_API_KEY environment variable is required");
  console.error("Get your API key from: https://rpt.cloud.sap/docs");
  process.exit(1);
}

const API_BASE_URL = "https://rpt.cloud.sap";

// Define the predict tool
const PREDICT_TOOL: Tool = {
  name: "sap_rpt1_predict",
  description: `Submit data for prediction using SAP-RPT-1 model with in-context learning.
The model learns from example rows (context rows) and predicts values for query rows that contain the [PREDICT] placeholder.

Constraints:
- Minimum 1 query row (rows with [PREDICT])
- Maximum 25 query rows
- Minimum 2 context rows (rows without [PREDICT])
- Maximum 2,048 context rows
- Maximum 4 target columns (columns containing [PREDICT])
- Maximum 50 columns total per row
- Maximum 2,073 rows total
- Maximum 1,000 characters per cell
- Maximum 100 characters per column name`,
  inputSchema: {
    type: "object",
    properties: {
      rows: {
        type: "array",
        description: "Array of data rows. Context rows have complete data (no [PREDICT] values) and are used as examples. Query rows contain [PREDICT] placeholder values indicating what to predict.",
        items: {
          type: "object",
          additionalProperties: true,
        },
      },
      index_column: {
        type: "string",
        description: "Optional column name to use as row identifier in the response",
      },
    },
    required: ["rows"],
  },
};

// Create server instance
const server = new Server(
  {
    name: "sap-rpt-1-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [PREDICT_TOOL],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "sap_rpt1_predict") {
    const { rows, index_column } = request.params.arguments as {
      rows: DataRow[];
      index_column?: string;
    };

    try {
      // Validate inputs
      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error("rows must be a non-empty array");
      }

      // Build request body
      const requestBody: PredictRequest = {
        rows,
      };

      if (index_column) {
        requestBody.index_column = index_column;
      }

      // Make API request
      const response = await fetch(`${API_BASE_URL}/api/predict`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `API request failed with status ${response.status}`;

        try {
          const errorJson = JSON.parse(errorText);
          errorMessage += `: ${JSON.stringify(errorJson)}`;
        } catch {
          errorMessage += `: ${errorText}`;
        }

        // Add retry information if available
        const retryAfter = response.headers.get("Retry-After");
        if (retryAfter) {
          errorMessage += `\nRetry after: ${retryAfter} seconds`;
        }

        throw new Error(errorMessage);
      }

      const data: PredictResponse = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("SAP-RPT-1 MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
