/**
 * services/game_character.service.js
 * Service for game characters with AI persona config
 */

const BaseService = require('../utils/BaseService');

class GameCharacterService extends BaseService {
  constructor() {
    super('game_characters');
  }

  /**
   * Get character with full AI config
   * @param {number} characterId 
   * @returns {Promise<Object>} Character with persona, voice, etc
   */
  async getCharacterForAI(characterId) {
    const result = await this.getById(characterId);
    
    if (!result.success) {
      // Fallback to default character (Sen - id: 0)
      return await this.getById(0);
    }

    const character = result.data;

    // Return AI-ready config
    return {
      success: true,
      data: {
        id: character.id,
        name: character.name,
        persona: character.persona,
        speakingStyle: character.speakingStyle,
        voiceId: character.voiceId || 'vi-VN-HoaiMyNeural', // Default female voice
        gender: character.gender || 'female',
        avatar: character.avatar,
        description: character.description
      }
    };
  }

  /**
   * Get all characters for admin management
   */
  async getAllCharacters() {
    return await this.getAll();
  }

  /**
   * Update character persona/voice config
   */
  async updateCharacterConfig(characterId, updates) {
    // Validate voice ID
    const validVoices = ['vi-VN-HoaiMyNeural', 'vi-VN-NamMinhNeural'];
    if (updates.voiceId && !validVoices.includes(updates.voiceId)) {
      return {
        success: false,
        message: 'Invalid voiceId. Must be vi-VN-HoaiMyNeural or vi-VN-NamMinhNeural',
        statusCode: 400
      };
    }

    // Validate gender
    if (updates.gender && !['male', 'female'].includes(updates.gender)) {
      return {
        success: false,
        message: 'Invalid gender. Must be male or female',
        statusCode: 400
      };
    }

    return await this.update(characterId, updates);
  }
}

module.exports = new GameCharacterService();
