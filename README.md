# SAP-RPT-1 MCP Server

An MCP (Model Context Protocol) server for the SAP-RPT-1 prediction API. This server allows Claude Desktop to interact with the SAP-RPT-1 model for in-context learning predictions.

## Features

- **In-Context Learning Predictions**: Submit data rows with examples and get predictions for rows with `[PREDICT]` placeholders
- **Multiple Column Prediction**: Predict values for up to 4 columns simultaneously
- **Large Context Support**: Up to 2,048 context rows and 25 query rows per request

## Prerequisites

- Node.js 18 or higher
- An API key from SAP-RPT-1 (get yours at https://rpt.cloud.sap/docs)

## Installation

### Option 1: Install from Local Directory

1. Clone or download this repository
2. Install dependencies and build:

```bash
npm install
npm run build
```

### Option 2: Install Globally

```bash
npm install -g .
```

## Configuration

### Get Your API Key

Visit https://rpt.cloud.sap/docs to obtain your personal API token.

### Configure Claude Desktop

Add the server to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

#### Configuration with Local Installation:

```json
{
  "mcpServers": {
    "sap-rpt-1": {
      "command": "node",
      "args": ["/absolute/path/to/sap-rpt-1-mcp/build/index.js"],
      "env": {
        "SAP_RPT1_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

#### Configuration with Global Installation:

```json
{
  "mcpServers": {
    "sap-rpt-1": {
      "command": "sap-rpt-1-mcp",
      "env": {
        "SAP_RPT1_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**Important**: Replace `your-api-key-here` with your actual API key from https://rpt.cloud.sap/docs

After updating the configuration, restart Claude Desktop for the changes to take effect.

## Usage

Once configured, Claude Desktop will have access to the `sap_rpt1_predict` tool. You can ask Claude to make predictions using the SAP-RPT-1 model.

### Example 1: Binary Classification (Churn Prediction)

```
Can you predict customer churn for customer C002 using this data:

Context rows:
- Customer C001: age 35, subscription_months 12, churn No
- Customer C042: age 20, subscription_months 1, churn Yes

Query row:
- Customer C002: age 28, subscription_months 3, churn [PREDICT]
```

The tool will receive:
```json
{
  "rows": [
    {
      "customer_id": "C001",
      "age": 35,
      "subscription_months": 12,
      "churn": "No"
    },
    {
      "customer_id": "C042",
      "age": 20,
      "subscription_months": 1,
      "churn": "Yes"
    },
    {
      "customer_id": "C002",
      "age": 28,
      "subscription_months": 3,
      "churn": "[PREDICT]"
    }
  ],
  "index_column": "customer_id"
}
```

### Example 2: Multiple Column Prediction

```
Predict quantity and revenue for Widget A given these examples:
- Widget B: price 25.95, quantity 2, revenue 10025.78
- Widget C: price 39.99, quantity 150, revenue 5998.50

Query:
- Widget A: price 29.99, quantity [PREDICT], revenue [PREDICT]
```

## API Constraints

- Minimum 1 query row (rows with `[PREDICT]`)
- Maximum 25 query rows
- Minimum 2 context rows (rows without `[PREDICT]`)
- Maximum 2,048 context rows
- Maximum 4 target columns (columns containing `[PREDICT]`)
- Maximum 50 columns total per row
- Maximum 2,073 rows total
- Maximum 1,000 characters per cell
- Maximum 100 characters per column name

## Error Handling

The server handles various API errors:

- **400**: Invalid data format or validation error
- **401**: Invalid or missing API token
- **429**: Rate limit exceeded (check `Retry-After` header)
- **500**: Internal server error
- **503**: Service unavailable (check `Retry-After` header)

## Development

### Project Structure

```
sap-rpt-1-mcp/
├── src/
│   └── index.ts          # Main MCP server implementation
├── build/                # Compiled JavaScript output
├── package.json          # Project dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

### Building

```bash
npm run build
```

### Testing

After building, you can test the server directly:

```bash
SAP_RPT1_API_KEY="your-api-key" node build/index.js
```

## Security

- **Keep your API token secure**: Never commit it to version control or share it publicly
- The API token is passed via environment variable for security
- Get your token from: https://rpt.cloud.sap/docs

## Support

For issues with:
- **SAP-RPT-1 API**: Visit https://rpt.cloud.sap/docs
- **This MCP server**: Open an issue in the repository

## License

This MCP server is provided as-is. Please refer to SAP-RPT-1's terms of service at https://rpt.cloud.sap/docs for API usage terms.
