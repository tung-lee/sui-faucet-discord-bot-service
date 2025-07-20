import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import axios from "axios";

import { isValidSuiAddress } from "../../utils";
import { SUI_FAUCET_SERVICE_URL } from "../../config";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("faucet")
        .setDescription("Request Sui tokens on the testnet.")
        .addStringOption(
            option =>
                option.setName('address')
                    .setDescription('The Sui address to request tokens for (0x followed by 64 hex characters)')
                    .setRequired(true)
                    .setMinLength(66) // 0x + 64 hex characters
                    .setMaxLength(66)
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const address = interaction.options.getString('address');

            if (!address) {
                await interaction.reply({
                    content: "❌ Address is required!",
                    ephemeral: true
                });
                return;
            }

            // Custom validation
            if (!isValidSuiAddress(address)) {
                await interaction.reply({
                    content: "❌ Invalid Sui address format! Address must be 0x followed by 64 hexadecimal characters.",
                    ephemeral: true
                });
                return;
            }

            const response = await axios.post(
                `${SUI_FAUCET_SERVICE_URL}/api/v1/sui/faucet`,
                {
                    address: address
                }
            );

            if (response.status === 201) {
                const data = response.data;
                console.log(data);
                await interaction.reply({ content: `🎉 Successfully sent tokens to ${address}!`, ephemeral: true });
            } else {
                await interaction.reply({ content: `❌ Failed to send tokens to ${address}!`, ephemeral: true });
            }

        } catch (error) {
            console.error("Error executing faucet command:", error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: "There was an error providing faucet!", ephemeral: true });
            }
        }
    },
};
