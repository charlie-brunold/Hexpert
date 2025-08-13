/**
 * Munchkin Game Module
 * Contains game-specific rules, knowledge base, and response logic for Steve Jackson Games' Munchkin
 */

class MunchkinExpert {
    constructor() {
        this.gameName = "Steve Jackson Games' Munchkin";
        this.gameVersion = "Classic Munchkin";
        this.rulesKnowledge = this.initializeRulesKnowledge();
    }

    /**
     * Initialize the Munchkin rules knowledge base
     * This will be expanded with comprehensive rule information
     */
    initializeRulesKnowledge() {
        return {
            setup: {
                players: "3-6 players (best with 4-5)",
                ageRange: "10 and up",
                playTime: "60-120 minutes",
                components: "168 cards (Door cards and Treasure cards), 6 d6 dice, level counters"
            },
            
            basicRules: {
                objective: "Be the first player to reach Level 10",
                turnStructure: [
                    "1. 'Kick Open the Door' - Draw a Door card face up",
                    "2. 'Look for Trouble' or 'Loot the Room'",
                    "3. 'Charity' - Discard down to 5 cards if needed"
                ],
                levelGain: "Gain levels by killing monsters or through certain cards"
            },

            combat: {
                basics: "Player combat strength + equipment vs Monster level + any bonuses",
                helpingInCombat: "Other players can help for a share of treasure",
                runAway: "Roll 5 or higher on a d6 to escape (4+ if you're an Elf)",
                winCombat: "Gain levels and treasure as specified on monster card",
                loseCombat: "Face the 'Bad Stuff' listed on the monster card"
            },

            commonQuestions: {
                curses: "Curses can be played on any player at any time unless the curse specifies otherwise",
                tradingItems: "Items can be traded freely except during combat",
                handLimit: "5 cards in hand at end of turn, excess must be given to lowest level player",
                multipleClasses: "You can only be one Class at a time (unless you have Super Munchkin)",
                cardsInPlay: "Items and other cards stay in play until removed by game effects"
            }
        };
    }

    /**
     * Process a user question about Munchkin rules
     * @param {string} question - The user's question about Munchkin
     * @returns {string} - AI-formatted response about the rule
     */
    async processQuestion(question) {
        // Convert question to lowercase for keyword matching
        const lowerQuestion = question.toLowerCase();
        
        // Simple keyword-based responses (to be enhanced with OpenAI integration)
        if (lowerQuestion.includes('curse') || lowerQuestion.includes('curses')) {
            return this.explainCurseRules();
        }
        
        if (lowerQuestion.includes('combat') || lowerQuestion.includes('fight') || lowerQuestion.includes('battle')) {
            return this.explainCombatRules();
        }
        
        if (lowerQuestion.includes('level') || lowerQuestion.includes('win')) {
            return this.explainLevelingAndWinning();
        }
        
        if (lowerQuestion.includes('setup') || lowerQuestion.includes('start')) {
            return this.explainGameSetup();
        }
        
        // Default response for unmatched questions
        return this.getDefaultResponse(question);
    }

    /**
     * Explain curse card rules
     */
    explainCurseRules() {
        return "Curse cards can be played on any player at any time, unless the specific curse card states otherwise. " +
               "Most curses take effect immediately when played. Some curses affect items, others affect the player directly. " +
               "You cannot curse yourself unless the card specifically allows it.";
    }

    /**
     * Explain combat mechanics
     */
    explainCombatRules() {
        return "In combat, add your Level plus your equipment bonuses to fight the monster. " +
               "If your total equals or exceeds the monster's level, you win! " +
               "Other players can help you for a share of the treasure. " +
               "If you lose, you can try to Run Away by rolling 5 or higher on a d6 (Elves need 4+). " +
               "If you fail to run away, you face the Bad Stuff on the monster card.";
    }

    /**
     * Explain leveling and winning
     */
    explainLevelingAndWinning() {
        return "You gain levels primarily by killing monsters - usually 1 level per monster, but some give more. " +
               "Certain cards can also give you levels. " +
               "The first player to reach Level 10 wins the game! " +
               "However, you must reach Level 10 through combat - you cannot win with a card effect or 'Go Up a Level' card.";
    }

    /**
     * Explain game setup
     */
    explainGameSetup() {
        return "Shuffle the Door and Treasure decks separately. " +
               "Deal 4 Door cards and 4 Treasure cards to each player. " +
               "Everyone starts at Level 1 with no class or race. " +
               "The player with the most unusual hair goes first, or roll dice to determine starting player. " +
               "Place both decks within reach of all players.";
    }

    /**
     * Default response for unrecognized questions
     */
    getDefaultResponse(question) {
        return `I heard your question about "${question}" but I'm not sure how to answer that specific Munchkin rule question yet. ` +
               "Could you try rephrasing it, or ask about curses, combat, leveling, or game setup? " +
               "My knowledge base is still growing!";
    }

    /**
     * Get game information
     */
    getGameInfo() {
        return {
            name: this.gameName,
            version: this.gameVersion,
            setup: this.rulesKnowledge.setup
        };
    }
}

module.exports = MunchkinExpert;