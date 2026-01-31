const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database/db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Special mapping for common snake_case keys that might exist
const keyMap = {
  'short_description': 'shortDescription',
  'historical_context': 'historicalContext',
  'cultural_significance': 'culturalSignificance',
  'heritage_site_id': 'heritageSiteId',
  'category_id': 'categoryId',
  'artifact_id': 'artifactId',
  'user_id': 'userId',
  'level_id': 'levelId',
  'chapter_id': 'chapterId',
  'artifact_type': 'artifactType',
  'year_created': 'yearCreated',
  'year_discovered': 'yearDiscovered',
  'year_established': 'yearEstablished',
  'year_restored': 'yearRestored',
  'total_reviews': 'totalReviews',
  'visit_hours': 'visitHours',
  'entrance_fee': 'entranceFee',
  'is_active': 'isActive',
  'unesco_listed': 'unescoListed',
  'historical_events': 'historicalEvents',
  'visit_count': 'visitCount',
  'related_artifact_ids': 'relatedArtifactIds',
  'related_heritage_ids': 'relatedHeritageIds',
  'related_history_ids': 'relatedHistoryIds',
  'related_level_ids': 'relatedLevelIds',
  'related_product_ids': 'relatedProductIds',
  'required_petals': 'requiredPetals',
  'created_by': 'createdBy',
  'created_at': 'createdAt',
  'updated_at': 'updatedAt',
  'current_chapter': 'currentChapter',
  'total_sen_petals': 'totalSenPetals',
  'total_points': 'totalPoints',
  'unlocked_chapters': 'unlockedChapters',
  'finished_chapters': 'finishedChapters',
  'completed_levels': 'completedLevels',
  'collected_characters': 'collectedCharacters',
  'museum_open': 'museumOpen',
  'museum_income': 'museumIncome',
  'streak_days': 'streakDays',
  'last_login': 'lastLogin',
  'status_reason': 'statusReason',
  'current_screen_id': 'currentScreenId',
  'current_screen_index': 'currentScreenIndex',
  'collected_items': 'collectedItems',
  'answered_questions': 'answeredQuestions',
  'timeline_order': 'timelineOrder',
  'total_screens': 'totalScreens',
  'completed_screens': 'completedScreens',
  'screen_states': 'screenStates',
  'time_spent': 'timeSpent',
  'hints_used': 'hintsUsed',
  'started_at': 'startedAt',
  'last_activity': 'lastActivity',
  'completed_at': 'completedAt',
  'expired_at': 'expiredAt',
  'expired_reason': 'expiredReason',
  'speaking_style': 'speakingStyle',
  'avatar_uncolored': 'avatarUncolored',
  'is_collectible': 'isCollectible',
  'avatar_locked': 'avatarLocked',
  'avatar_unlocked': 'avatarUnlocked',
  'persona_amnesia': 'personaAmnesia',
  'persona_restored': 'personaRestored',
  'museum_interaction': 'museumInteraction',
  'is_consumable': 'isConsumable',
  'max_stack': 'maxStack',
  'item_id': 'itemId',
  'object_id': 'objectId',
  'scanned_at': 'scannedAt',
  'acquired_at': 'acquiredAt',
  'background_image': 'backgroundImage',
  'background_music': 'backgroundMusic',
  'next_screen_id': 'nextScreenId',
  'skip_allowed': 'skipAllowed',
  'guide_text': 'guideText',
  'fact_popup': 'factPopup',
  'on_collect_effect': 'onCollectEffect',
  'ai_hints_enabled': 'aiHintsEnabled',
  'required_items': 'requiredItems',
  'is_correct': 'isCorrect',
  'time_limit': 'timeLimit',
  'passing_score': 'passingScore',
  'artifact_ids': 'artifactIds'
};

function toCamel(s) {
  return s.replace(/([-_][a-z])/ig, ($1) => {
    return $1.toUpperCase()
      .replace('-', '')
      .replace('_', '');
  });
}

function convert(obj) {
  if (Array.isArray(obj)) {
    return obj.map(convert);
  } else if (obj !== null && typeof obj === 'object') {
    const newObj = {};
    for (let key in obj) {
      const newKey = keyMap[key] || toCamel(key);
      newObj[newKey] = convert(obj[key]);

      // If the old key was both snake_case and its camelCase exists, 
      // the newObj will only have the camelCase one now.
      // This automatically handles the "duplicate" issue.
    }
    return newObj;
  }
  return obj;
}

const migratedDb = convert(db);

fs.writeFileSync(dbPath, JSON.stringify(migratedDb, null, 2), 'utf8');
console.log('✅ db.json migrated to camelCase successfully!');
