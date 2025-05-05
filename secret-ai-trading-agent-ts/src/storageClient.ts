import { StorageApi, Configuration, Network, Token } from 'arweave-storage-sdk';
import dotenv from 'dotenv';

dotenv.config();

export class StorageClient {
    private static instance: StorageClient | null = null;
    private storageApi: StorageApi;
    public readonly ready: Promise<void>;

    private constructor() {
        const privateKey = process.env.COSMOS_NOBLE_PRIVATE_KEY;
        if (!privateKey) {
            throw new Error("COSMOS_NOBLE_PRIVATE_KEY environment variable is not set. Cannot initialize StorageClient.");
        }

        const apillonConfig = new Configuration({
            appName: "secret-ai-sdk-ts-agent",
            network: Network.COSMOS_NOBLE_MAINNET,
            privateKey: privateKey,
            token: Token.USDC,
        });

        this.storageApi = new StorageApi(apillonConfig);

        this.ready = this.initialize();
    }

    private async initialize(): Promise<void> {
        try {
            console.log("Initializing StorageClient...");
            await this.storageApi.ready;
            await this.storageApi.api.login();
            console.log("StorageClient initialized and logged in successfully.");
        } catch (error) {
            console.error("Failed to initialize or login StorageClient:", error);
            throw new Error(`StorageClient initialization failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    public static getInstance(): StorageClient {
        if (!StorageClient.instance) {
            StorageClient.instance = new StorageClient();
        }
        return StorageClient.instance;
    }

    /**
     * Gets the underlying StorageApi instance.
     * Ensures the client is ready before returning.
     * @returns Promise<StorageApi>
     */
    public async getApi(): Promise<StorageApi> {
        await this.ready;
        return this.storageApi;
    }

    /**
     * Example method: Uploads a JSON object to storage.
     * @param data The JSON object to upload.
     * @param fileName The desired name for the file in storage.
     * @returns Promise<any> The result from the storage API upload.
     */

    public async storeMemoryOnArweave(user_id: string, message: string, response: string): Promise<void> {
        await this.ready;
        const jsonData = JSON.stringify({ user_id, message, response });
        const data = new Blob([jsonData], { type: 'application/json' });
        const fileName = `${user_id}-${Date.now()}.json`;
        const tags = [
            { name: 'Content-Type', value: 'application/json' },
            { name: 'User-ID', value: user_id },
            { name: 'Type', value: 'memory' }
        ];
        const upload = await this.storageApi.quickUpload(await data.arrayBuffer(), {
            name: fileName,
            dataContentType: 'application/json',
            tags: tags as any,
            size: data.size,
            overrideFileName: true
        })
        console.log("Uploaded memory to Arweave:", upload);

        if (!upload || !upload.id) {
            throw new Error('Failed to store memory on Arweave');
        }
        console.log("Memory stored on Arweave:", upload.id);
        return upload.id;
    }

    public async getMemoryFromArweave(user_id: string): Promise<{
        message: string;
        response: string;
    }[]> {
        await this.ready;
        const files = await this.storageApi.api.upload.getUploads({ page: 1, limit: 1000 });
        const memoryUploads = files.data.filter((file: any) => file.tags.find((tag: any) => {
            if ((tag.name === 'Type' && tag.value === 'memory')) {
                return true;
            }
            return false;
        }));
        console.log("Memory uploads found on Arweave:", memoryUploads.length);
        const memory: {
            message: string;
            response: string;
            user_id: string;
        }[] = []

        for (const upload of memoryUploads) {
            if (!upload.arweaveTxId) {
                continue;
            }
            const data = await fetch(`https://arweave.net/${upload.arweaveTxId}`);
            const json = await data.json();
            memory.push({
                message: json.message,
                response: json.response,
                user_id: json.user_id,
            });
        }
        const transformedMemory = memory.map((item) => ({
            message: item.message,
            response: item.response,
        }));

        return transformedMemory;
    }

}

export const storageClient = StorageClient.getInstance(); 