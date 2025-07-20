import dotenv from "dotenv";

dotenv.config();

export const CLIENT_ID = process.env.CLIENT_ID as string;
export const GUILD_ID = process.env.GUILD_ID as string;
export const TOKEN = process.env.DISCORD_TOKEN as string;
export const SUI_FAUCET_SERVICE_URL = process.env.SUI_FAUCET_SERVICE_URL as string;

if (!CLIENT_ID || !GUILD_ID || !TOKEN) {
    console.error("Missing required environment variables");
    process.exit(1);
}