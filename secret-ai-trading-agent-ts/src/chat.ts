import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { TradingAgent } from './main';

async function runChat() {
    console.log("Initializing agent...");
    const agent = new TradingAgent();
    try {
        await agent.initialize(); // Perform async initialization
    } catch (initError: any) {
        console.error("Failed to initialize agent:", initError.message);
        process.exit(1); // Exit if initialization fails
    }


    const user_id = "seanrad_ts"; // Choose a unique user ID
    const rl = readline.createInterface({ input, output });

    console.log("💬 $SCRT Trading AI - Start chatting! (Type 'exit' to quit)");

    while (true) {
        const userInput = await rl.question("You: ");
        if (userInput.toLowerCase() === "exit") {
            console.log("Goodbye!");
            rl.close();
            break;
        }

        try {
            const response = await agent.chat(user_id, userInput);
            console.log("AI:", response);
        } catch (error: any) {
             console.error("Error during chat:", error.message);
             console.log("AI: Sorry, I encountered an internal error.");
        }
    }
     // Ensure the database connection is closed gracefully if the readline interface is closed.
     // The process.on('exit') handler in db.ts should cover this.
}

runChat().catch(error => {
    console.error("Unhandled error in chat application:", error);
    process.exit(1);
}); 