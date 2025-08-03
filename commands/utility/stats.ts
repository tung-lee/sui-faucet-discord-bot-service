import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import axios from "axios";

import { SUI_FAUCET_SERVICE_URL } from "../../config";

let accessTokens: string | null = null;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("stats")
        .setDescription("View service statistics (requires authentication)")
        .addSubcommand(subcommand =>
            subcommand
                .setName("login")
                .setDescription("Login to get access token for stats")
                .addStringOption(option =>
                    option.setName('username')
                        .setDescription('Your username')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('password')
                        .setDescription('Your password')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("view")
                .setDescription("View service statistics")
        ),
    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const subcommand = interaction.options.getSubcommand();

            if (subcommand === "login") {
                await this.handleLogin(interaction);
            } else if (subcommand === "view") {
                await this.handleViewStats(interaction);
            }

        } catch (error) {
            console.error("Error executing stats command:", error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: "❌ There was an error processing your request!",
                    ephemeral: true
                });
            }
        }
    },

    async handleLogin(interaction: ChatInputCommandInteraction) {
        const username = interaction.options.getString('username');
        const password = interaction.options.getString('password');

        if (!username || !password) {
            await interaction.reply({
                content: "❌ Username and password are required!",
                ephemeral: true
            });
            return;
        }

        try {
            // Defer reply since login might take time
            await interaction.deferReply({ ephemeral: true });

            const response = await axios.post(
                `${SUI_FAUCET_SERVICE_URL}/api/v1/auth/login`,
                {
                    username: username,
                    password: password
                }
            );

            if (response.status === 201) {
                const data = response.data;
                accessTokens = data.access_token;

                const embed = new EmbedBuilder()
                    .setColor(0x10b981) // Green color for success
                    .setTitle("🔐 Login Successful!")
                    .setDescription("You are now authenticated and can view service statistics")
                    .addFields(
                        {
                            name: "👤 User",
                            value: username,
                            inline: true
                        }
                    )
                    .setFooter({
                        text: "Use /stats view to see service statistics",
                        iconURL: "https://sui.io/favicon.ico"
                    })
                    .setTimestamp();

                await interaction.editReply({
                    embeds: [embed]
                });
            } else {
                await interaction.editReply({
                    content: "❌ Login failed! Please check your credentials."
                });
            }

        } catch (error: any) {
            console.error("Login error:", error);
            const errorMessage = error.response?.data?.message || "Login failed! Please try again.";
            await interaction.editReply({
                content: `❌ ${errorMessage}`
            });
        }
    },

    async handleViewStats(interaction: ChatInputCommandInteraction) {
        console.log(accessTokens);
        if (!accessTokens) {
            await interaction.reply({
                content: "❌ You need to login first! Use `/stats login` to authenticate.",
                ephemeral: true
            });
            return;
        }

        try {
            await interaction.deferReply({ ephemeral: true });

            // Fetch all analytics data
            const [statsResponse, topSourcesResponse, geographicResponse, performanceResponse] = await Promise.all([
                axios.get(`${SUI_FAUCET_SERVICE_URL}/api/v1/analytics/stats?days=14`, {
                    headers: { 'Authorization': `Bearer ${accessTokens}` }
                }),
                axios.get(`${SUI_FAUCET_SERVICE_URL}/api/v1/analytics/top-sources?days=14`, {
                    headers: { 'Authorization': `Bearer ${accessTokens}` }
                }),
                axios.get(`${SUI_FAUCET_SERVICE_URL}/api/v1/analytics/geographic?days=14`, {
                    headers: { 'Authorization': `Bearer ${accessTokens}` }
                }),
                axios.get(`${SUI_FAUCET_SERVICE_URL}/api/v1/analytics/performance?days=14`, {
                    headers: { 'Authorization': `Bearer ${accessTokens}` }
                })
            ]);

            // Process stats data
            const statsData = statsResponse.data;
            const successStats = statsData.find((item: any) => item._id === 'success') || { count: 0, totalAmount: 0 };
            const failedStats = statsData.find((item: any) => item._id === 'failed') || { count: 0, totalAmount: 0 };
            const totalRequests = successStats.count + failedStats.count;
            const successRate = totalRequests > 0 ? ((successStats.count / totalRequests) * 100).toFixed(1) : '0';

            // Process performance data
            const performanceData = performanceResponse.data;

            // Create main statistics embed
            const mainEmbed = new EmbedBuilder()
                .setColor(0x3b82f6)
                .setTitle("📊 SUI Faucet Analytics Dashboard")
                .setDescription("Comprehensive service performance and usage metrics (Last 14 days)")
                .addFields(
                    {
                        name: "📈 Request Statistics",
                        value: `**Total Requests:** ${totalRequests}\n**Success:** ${successStats.count} (${successRate}%)\n**Failed:** ${failedStats.count}`,
                        inline: true
                    },
                    {
                        name: "💰 Token Distribution",
                        value: `**Total Distributed:** ${successStats.totalAmount + failedStats.totalAmount} SUI\n**Successful:** ${successStats.totalAmount} SUI\n**Failed:** ${failedStats.totalAmount} SUI`,
                        inline: true
                    },
                    {
                        name: "⚡ Performance Metrics",
                        value: `**Avg Response:** ${performanceData.avgResponseTime?.toFixed(0) || 'N/A'}ms\n**Min Response:** ${performanceData.minResponseTime || 'N/A'}ms\n**Max Response:** ${performanceData.maxResponseTime || 'N/A'}ms`,
                        inline: true
                    }
                )
                .setFooter({
                    text: `Last updated • ${new Date().toLocaleString()}`,
                    iconURL: "https://sui.io/favicon.ico"
                })
                .setTimestamp();

            // Create geographic distribution embed
            const geoData = geographicResponse.data;
            const topCountries = geoData.slice(0, 5);
            const geoChart = this.createBarChart(topCountries.map((item: any) => item._id), topCountries.map((item: any) => item.count), "Top Countries");

            const geoEmbed = new EmbedBuilder()
                .setColor(0x10b981)
                .setTitle("🌍 Geographic Distribution")
                .setDescription("Top 5 countries by request volume")
                .addFields(
                    {
                        name: "📊 Country Breakdown",
                        value: topCountries.map((item: any) =>
                            `**${item._id}:** ${item.count} requests (${item.successCount}✅ ${item.failureCount}❌)`
                        ).join('\n'),
                        inline: false
                    },
                    {
                        name: "📈 Visual Chart",
                        value: `\`\`\`\n${geoChart}\n\`\`\``,
                        inline: false
                    }
                );

            // Create source analysis embed
            const sourcesData = topSourcesResponse.data;
            const topSources = sourcesData.slice(0, 5);
            const sourcesChart = this.createBarChart(
                topSources.map((item: any) => item.ipAddress.substring(0, 8) + '...'),
                topSources.map((item: any) => item.count),
                "Top Sources"
            );

            const sourcesEmbed = new EmbedBuilder()
                .setColor(0xf59e0b)
                .setTitle("🔍 Top Request Sources")
                .setDescription("Most active IP addresses")
                .addFields(
                    {
                        name: "📊 Source Breakdown",
                        value: topSources.map((item: any) =>
                            `**${item.ipAddress}:** ${item.count} requests (${item.successCount}✅ ${item.failureCount}❌)`
                        ).join('\n'),
                        inline: false
                    },
                    {
                        name: "📈 Visual Chart",
                        value: `\`\`\`\n${sourcesChart}\n\`\`\``,
                        inline: false
                    }
                );

            // Create success rate chart
            const successChart = this.createPieChart([
                { label: 'Success', value: successStats.count, color: '🟢' },
                { label: 'Failed', value: failedStats.count, color: '🔴' }
            ]);

            const successEmbed = new EmbedBuilder()
                .setColor(0x8b5cf6)
                .setTitle("🎯 Success Rate Analysis")
                .setDescription("Request success vs failure distribution")
                .addFields(
                    {
                        name: "📊 Success Rate",
                        value: `**${successRate}%** (${successStats.count}/${totalRequests})`,
                        inline: true
                    },
                    {
                        name: "📈 Visual Chart",
                        value: `\`\`\`\n${successChart}\n\`\`\``,
                        inline: false
                    }
                );

            // Create refresh button
            const row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('refresh_stats')
                        .setLabel('🔄 Refresh Stats')
                        .setStyle(ButtonStyle.Primary)
                );

            await interaction.editReply({
                embeds: [mainEmbed, geoEmbed, sourcesEmbed, successEmbed],
                components: [row]
            });

        } catch (error: any) {
            console.error("Stats fetch error:", error);

            if (error.response?.status === 401) {
                // Token might be invalid, remove it
                accessTokens = null;
                await interaction.editReply({
                    content: "❌ Your session has expired! Please login again with `/stats login`."
                });
            } else {
                const errorMessage = error.response?.data?.message || "Failed to fetch statistics!";
                await interaction.editReply({
                    content: `❌ ${errorMessage}`
                });
            }
        }
    },

    createBarChart(labels: string[], values: number[], title: string): string {
        const maxValue = Math.max(...values);
        const maxBarLength = 20;

        let chart = `${title}\n`;
        chart += '─'.repeat(title.length) + '\n';

        labels.forEach((label, index) => {
            const value = values[index];
            const barLength = maxValue > 0 ? Math.round((value / maxValue) * maxBarLength) : 0;
            const bar = '█'.repeat(barLength) + '░'.repeat(maxBarLength - barLength);
            chart += `${label.padEnd(12)} ${bar} ${value}\n`;
        });

        return chart;
    },

    createPieChart(data: Array<{ label: string; value: number; color: string }>): string {
        const total = data.reduce((sum, item) => sum + item.value, 0);
        if (total === 0) return "No data available";

        let chart = "Distribution\n";
        chart += "─".repeat(12) + '\n';

        data.forEach(item => {
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
            const barLength = total > 0 ? Math.round((item.value / total) * 20) : 0;
            const bar = item.color.repeat(barLength);
            chart += `${item.label.padEnd(8)} ${bar} ${percentage}%\n`;
        });

        return chart;
    }
}; 