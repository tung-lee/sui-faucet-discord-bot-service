import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
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
                    walletAddress: address
                }
            );

            if (response.status === 201) {
                const data = response.data;
                console.log(data);

                // Create rich embed message
                const embed = new EmbedBuilder()
                    .setColor(0x6366f1) // Indigo color for a unique look
                    .setTitle("🚀 Faucet Request Successful!")
                    .setDescription("Your testnet tokens have been dispatched to your wallet")
                    .addFields(
                        {
                            name: "🎯 Token Type",
                            value: "SUI Testnet Tokens",
                            inline: true
                        },
                        {
                            name: "📬 Destination",
                            value: `\`${address.substring(0, 10)}...${address.substring(address.length - 8)}\``,
                            inline: true
                        },
                        {
                            name: "🔗 Blockchain",
                            value: "Sui Testnet",
                            inline: true
                        }
                    )
                    .setFooter({
                        text: "⚡ Powered by SUI Faucet Service • Testnet tokens for development only",
                        iconURL: "https://sui.io/favicon.ico"
                    })
                    .setTimestamp();

                // Add transaction hash if available in response
                if (data.digest) {
                    embed.addFields({
                        name: "📋 Transaction ID",
                        value: `[\`${data.digest.substring(0, 12)}...${data.digest.substring(data.digest.length - 12)}\`](https://suiexplorer.com/txblock/${data.digest}?network=testnet)`,
                        inline: false
                    });
                }

                // Create button to view transaction (if hash is available)
                const row = new ActionRowBuilder<ButtonBuilder>();
                if (data.digest) {
                    row.addComponents(
                        new ButtonBuilder()
                            .setLabel("🔍 View on Explorer")
                            .setStyle(ButtonStyle.Link)
                            .setURL(`https://suiexplorer.com/txblock/${data.digest}?network=testnet`)
                    );
                }

                await interaction.reply({
                    embeds: [embed],
                    components: data.digest ? [row] : [],
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: `❌ Failed to send tokens to ${address}!`,
                    ephemeral: true
                });
            }

        } catch (error) {
            console.error("Error executing faucet command:", error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: "There was an error providing faucet!", ephemeral: true });
            }
        }
    },
};
