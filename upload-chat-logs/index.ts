import { ChatSecret, Secret } from "secret-ai-sdk-ts";
import { Configuration, Network, Token, StorageApi } from "arweave-storage-sdk";
import dotenv from "dotenv";
import { writeFileSync, appendFileSync } from "node:fs";

dotenv.config();

class ArweaveChatLog {
  name = "arweave-chat-log";
  storageInstance: StorageApi;
  constructor(storageApi: StorageApi) {
    this.storageInstance = storageApi;
  }
  async handleLLMEnd(output: any, runId: any) {
    const tags = [
      { name: "Content-Type", value: "application/json" },
      { name: "Type", value: "Chat-Log" },
      { name: "Run-ID", value: runId },
    ] as any;

    const fileName = `audit-${runId}-${Date.now()}.json`;
    const dataFormatted = JSON.stringify(output, null, 2);
    const blob = new Blob([dataFormatted], { type: "application/json" });
    const uploadDetails = await this.storageInstance.quickUpload(
      await blob.arrayBuffer(),
      {
        name: fileName,
        dataContentType: "text/plain",
        tags,
        size: blob.size,
        overrideFileName: true,
      }
    );

    console.log("Upload details:", uploadDetails);
  }
}

async function main() {
  const arweaveConfig = new Configuration({
    appName: "secret-ai-sdk",
    network: Network.BASE_MAINNET,
    privateKey: process.env.EVM_PRIVATE_KEY!,
    token: Token.USDC,
  });
  const storageApi = new StorageApi(arweaveConfig);
  await storageApi.ready;
  await storageApi.api.login();

  const secretClient = new Secret();
  const models = await secretClient.getModels();
  const urls = await secretClient.getUrls();

  const baseUrl = urls[0];
  const model = models[0];

  const secretLLM = new ChatSecret({
    baseUrl: baseUrl,
    model: model,
    streaming: false,
    callbacks: [new ArweaveChatLog(storageApi)],
  });

  const messages = [
    {
      role: "system",
      content: `You are my therapist. Help me with my issues.`,
    },
    {
      role: "human",
      content: "I miss my cat.",
    },
  ];

  const response = await secretLLM.invoke(messages);
  const resJson = response.content;
  console.log({ resJson });
  // const receipts = await storageApi.api.getUser()
  // console.log(JSON.stringify(receipts, null, 2));
}
main();
