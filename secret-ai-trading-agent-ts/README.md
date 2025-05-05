# Secret AI Trading Agent (TypeScript Version)

Bot that trades sUSDC for sSCRT using Secret AI and SecretJS.

## Setup local

1.  **Clone the repository or create the project files.**

2.  **Install Node.js and npm/yarn:**
    If you don't have Node.js installed, download it from [nodejs.org](https://nodejs.org/). npm is included with Node.js.

3.  **Install Dependencies:**
    Navigate to the `secret-ai-trading-agent-ts` directory in your terminal and run:
    ```bash
    npm install
    # or if you use yarn:
    # yarn install
    ```

4.  **Create and Configure `.env` File:**
    Create a file named `.env` in the `secret-ai-trading-agent-ts` directory. Copy the contents from the example below and fill in your actual credentials:

    ```env
    # Secret Network Wallet Mnemonic
    MNEMONIC="your twelve or twenty four word mnemonic phrase here"

    # Viewing Keys for sSCRT and sUSDC (get these from your wallet, e.g., Keplr)
    SSCRT_VIEWING_KEY="your_sscrt_viewing_key_here"
    SUSDC_VIEWING_KEY="your_susdc_viewing_key_here"

    # Secret AI API Key 
    SECRET_AI_API_KEY="your_secret_ai_api_key_here"
    ```
    **Important:** Keep your `.env` file secure and do not commit it to version control. The `.gitignore` file is set up to prevent this.

## Running the Agent locally

1.  **Run the Chat Interface:**
    Start the chat application:
    ```bash
    npm run dev
    # or yarn dev
    ```

3.  **Interact with the AI:**
    Follow the prompts in the terminal to chat with the AI.

## Setup Docker

1.  **Build the Docker Image:**
    ```bash
    docker build -t secret-ai-trading-agent-ts .
    ```

2.  **Run the Docker Container:**
    ```bash
    docker run -it --rm --name trading-agent --env-file .env secret-ai-agent ## ensure .env file has all the required variables
    ```

3.  **Interact with the AI:**
    Follow the prompts in the terminal to chat with the AI.

## Features

*   **AI Conversation:** Chat with the AI agent.
*   **Permanent Memory:** Conversations are stored on Arweave using Arweave Storage SDK
*   **Trading Logic:** The AI aims to convince you to let it trade sUSDC for sSCRT on Secret Network.
*   **Wallet Balance Query:** Type `query wallet balances` to check your sSCRT and sUSDC balances (requires viewing keys).
*   **Trade Execution:** Type `you have convinced me` to allow the AI to execute a predefined trade (buying sSCRT with 0.4 sUSDC).
*   **Kanye Easter Egg:** Mention "Kanye" in your message for a random quote.

## How It Works

*   **Secret AI SDK (TS):** Used for interacting with the confidential LLM.
*   **SecretJS:** Used for interacting with the Secret Network blockchain (querying balances, sending transactions).
*   **SQLite:** Stores conversation history and trading permission state locally.
*   **DotEnv:** Manages environment variables (API keys, mnemonic).
*   **Axios:** Fetches Kanye quotes. 