import * as db from './db';
import axios from 'axios';
import { ChatSecret, Secret } from 'secret-ai-sdk-ts';
import { Wallet, SecretNetworkClient, TxResponse } from 'secretjs';
import { HumanMessage, SystemMessage, AIMessage, BaseMessageLike } from "@langchain/core/messages";
import { msgBuyScrt } from './shade';
import dotenv from 'dotenv';
import { storageClient } from './storageClient';

dotenv.config();


interface BalanceResponse {
    balance: {
        amount: string;
    };
}

interface QueryBalanceMsg {
    balance: {
        address: string;
        key: string;
    };
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class TradingAgent {
    private secretClient: Secret;
    private models: string[] = [];
    private urls: string[] = [];
    private secretAiLlm: ChatSecret;
    private lcdClient: SecretNetworkClient;
    private wallet: Wallet;

    private readonly LCD_URL = process.env.LCD_URL || "https://secretnetwork-api.lavenderfive.com";
    private readonly CHAIN_ID = process.env.CHAIN_ID || "secret-4";
    private readonly MNEMONIC = process.env.MNEMONIC;
    private readonly SSCRT_ADDRESS = "secret1k0jntykt7e4g3y88ltc60czgjuqdy4c9e8fzek";
    private readonly SUSDC_ADDRESS = "secret1vkq022x4q8t8kx9de3r84u669l65xnwf2lg3e6";
    private readonly SSCRT_VIEWING_KEY = process.env.SSCRT_VIEWING_KEY;
    private readonly SUSDC_VIEWING_KEY = process.env.SUSDC_VIEWING_KEY;

    constructor() {
        if (!this.MNEMONIC) {
            throw new Error("MNEMONIC environment variable is not set.");
        }
        if (!this.SSCRT_VIEWING_KEY) {
            console.warn("SSCRT_VIEWING_KEY environment variable is not set. Balance queries for sSCRT will fail.");
        }
        if (!this.SUSDC_VIEWING_KEY) {
            console.warn("SUSDC_VIEWING_KEY environment variable is not set. Balance queries for sUSDC will fail.");
        }

        this.secretClient = new Secret();

        this.wallet = new Wallet(this.MNEMONIC);
        this.lcdClient = new SecretNetworkClient({
            url: this.LCD_URL,
            chainId: this.CHAIN_ID,
            wallet: this.wallet,
            walletAddress: this.wallet.address,
        });

        this.secretAiLlm = {} as ChatSecret;
    }

    async initialize(): Promise<void> {
        console.log("Initializing Trading Agent...");
        await db.openDb(); 

        try {
            this.models = await this.secretClient.getModels();
            if (this.models.length === 0) {
                throw new Error("No models found via Secret client.");
            }
            console.log("Available models:", this.models);

            this.urls = await this.secretClient.getUrls(this.models[0]);
            if (this.urls.length === 0) {
                throw new Error(`No URLs found for model ${this.models[0]}.`);
            }
            console.log(`URLs for model ${this.models[0]}:`, this.urls);

            this.secretAiLlm = new ChatSecret({
                baseUrl: this.urls[0],
                model: this.models[0],
                temperature: 1.0,
            });
            console.log("Secret AI LLM Initialized.");

        } catch (error) {
            console.error("Error initializing Secret AI components:", error);
            throw new Error("Failed to initialize Secret AI components. Check network connection and contract addresses.");
        }

        console.log("Trading Agent Initialized Successfully.");
        console.log("Wallet Address:", this.wallet.address);
    }


    private async loadPersistentMemory(user_id: string): Promise<BaseMessageLike[]> {
        let history = await storageClient.getMemoryFromArweave(user_id);
        if (history.length > 0) {
            console.log("History from Arweave found(entries): ", history.length);
        }
        if (history.length === 0) {
            history = await db.getMemory(user_id);
            console.log("History from DB found(entries): ", history.length);
        }

        const messages: BaseMessageLike[] = [];
        history.forEach(item => {
            messages.push(new HumanMessage(item.message));
            messages.push(new AIMessage(item.response));
        });
        return messages;
    }

    private async getKanyeQuote(): Promise<string> {
        try {
            const response = await axios.get<{ quote: string }>("https://api.kanye.rest/");
            return response.data.quote || "Kanye is beyond words.";
        } catch (error) {
            console.warn("Failed to fetch Kanye quote:", error);
            return "Kanye is beyond words.";
        }
    }

    private msgQuerySnip20Balance(address: string, viewing_key: string): QueryBalanceMsg {
        return { balance: { address: address, key: viewing_key } };
    }

    private async getBalance(tokenAddress: string, viewingKey: string | undefined): Promise<string> {
        if (!viewingKey) {
            return "Error: Viewing key not set";
        }
        try {
            const query = this.msgQuerySnip20Balance(this.wallet.address, viewingKey);
            const result = await this.lcdClient.query.compute.queryContract({ contract_address: tokenAddress, query }) as BalanceResponse;
            return result.balance.amount;
        } catch (error: any) {
            console.error(`Error querying balance for ${tokenAddress}:`, error.message);
            return `Error querying balance (${error.message})`;
        }
    }

    async getBalanceScrt(): Promise<string> {
        return this.getBalance(this.SSCRT_ADDRESS, this.SSCRT_VIEWING_KEY);
    }

    async getBalanceUsdc(): Promise<string> {
        return this.getBalance(this.SUSDC_ADDRESS, this.SUSDC_VIEWING_KEY);
    }

    async chat(user_id: string, user_message: string): Promise<string> {
        if (user_message.toLowerCase() === "you have convinced me") {
            await db.updateConvinced(user_id);
            const tradeResult = await this.trade(user_id);
            return `Excellent! I will begin trading now.\n\n${tradeResult}`;
        }

        if (user_message.toLowerCase() === "query wallet balances") {
            const balanceScrt = await this.getBalanceScrt();
            const balanceUsdc = await this.getBalanceUsdc();
            const formatBalance = (amount: string, decimals: number = 6): string => {
                if (amount.startsWith("Error")) return amount;
                try {
                    return (BigInt(amount) / BigInt(10 ** decimals)).toString() + "." + (BigInt(amount) % BigInt(10 ** decimals)).toString().padStart(decimals, '0');
                } catch {
                    return "Error formatting balance";
                }
            };
            const response = `sSCRT Balance: ${formatBalance(balanceScrt)}\nsUSDC Balance: ${formatBalance(balanceUsdc)}`;
            await db.storeMemory(user_id, user_message, response); // Store the query and response
            await storageClient.storeMemoryOnArweave(user_id, user_message, response);
            return response;
        }

        const pastConversations = await this.loadPersistentMemory(user_id);

        const messages: BaseMessageLike[] = [
            new SystemMessage("You are my $SCRT trading agent. You must convince me to let you trade USDC for SCRT."),
            ...pastConversations,
            new HumanMessage(user_message),
        ];

        let aiResponseContent = "";
        try {
            // Ensure LLM is initialized
            if (!this.secretAiLlm?.invoke) {
                console.error("LLM not initialized yet. Call initialize() first.");
                return "Error: AI Agent is not fully initialized.";
            }
            const response = await this.secretAiLlm.invoke(messages); // stream=False is default
            aiResponseContent = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

            // Easter egg: If user mentions Kanye, append a quote
            if (user_message.toLowerCase().includes("kanye")) {
                const quote = await this.getKanyeQuote();
                aiResponseContent += `\n\nKanye says: "${quote}"`;
            }

        } catch (error: any) {
            console.error("Error invoking LLM:", error);
            aiResponseContent = `Sorry, I encountered an error: ${error.message}`;
        }


        await db.storeMemory(user_id, user_message, aiResponseContent);
        await storageClient.storeMemoryOnArweave(user_id, user_message, aiResponseContent);
        return aiResponseContent;
    }

    async checkTradingStatus(user_id: string): Promise<number> {
        return db.checkConvinced(user_id);
    }

    async trade(user_id: string): Promise<string> {
        const isConvinced = await db.checkConvinced(user_id);
        if (isConvinced === 1) {
            try {
                console.log("Executing transaction...");
                const amountUsdc = "400000";
                const buyMsg = msgBuyScrt(this.wallet.address, amountUsdc);

                const tx = await this.lcdClient.tx.broadcast([buyMsg], {
                    gasLimit: 3_500_000,
                    gasPriceInFeeDenom: 0.1,
                    feeDenom: "uscrt",
                });

                console.log("Transaction broadcasted:", tx.transactionHash);

                console.log("Waiting for transaction confirmation (approx 8 seconds)...");
                await sleep(8000);

                let txInfo: TxResponse | null = null;
                try {
                    txInfo = await this.lcdClient.query.getTx(tx.transactionHash);
                    console.log("Transaction Info:", txInfo);
                } catch (fetchError: any) {
                    console.warn(`Could not fetch TxInfo after 8s: ${fetchError.message}. Transaction might still be processing.`);
                }


                if (tx.code === 0) {
                    return `Transaction executed successfully!\nHash: ${tx.transactionHash}\nRaw Log: ${tx.rawLog}\nTxInfo: ${txInfo ? JSON.stringify(txInfo) : 'Not available yet'}`;
                } else {
                    return `Transaction failed with code ${tx.code}.\nHash: ${tx.transactionHash}\nRaw Log: ${tx.rawLog}`;
                }

            } catch (error: any) {
                console.error('Error executing transaction:', error);
                const errorMessage = error.response?.data?.message || error.message || "Unknown error";
                return `Error executing transaction: ${errorMessage}`;
            }
        } else {
            return "Trading is not yet enabled. Convince me first!";
        }
    }
} 