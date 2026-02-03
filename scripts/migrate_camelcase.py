import json
import os

DB_PATH = '/home/dandy/Projects/Sen_web/Backend/database/db.json'

MAPPING = {
    "heritage_site_id": "heritageSiteId",
    "user_id": "userId",
    "item_id": "itemId",
    "acquired_at": "acquiredAt",
    "related_heritage": "relatedHeritage",
    "background_image": "backgroundImage",
    "speaking_style": "speakingStyle",
    "path_id": "pathId",
    "content_type": "contentType",
    "content_url": "contentUrl",
    "artifact_id": "artifactId",
    "artifact_ids": "artifactIds",
    "exhibition_ids": "exhibitionIds",
    "heritage_site_ids": "heritageSiteIds",
    "completed_quests": "completedQuests",
    "total_learning_time": "totalLearningTime",
    "bookmarked_artifacts": "bookmarkedArtifacts",
    "bookmarked_sites": "bookmarkedSites",
    "avatar_uncolored": "avatarUncolored",
    "total_coins": "totalCoins",
    "total_petals": "totalPetals",
    "total_items": "totalItems",
    "chapters_completed": "chaptersCompleted",
    "levels_completed": "levelsCompleted",
    "scans_count": "scansCount",
    "claimed_at": "claimedAt",
    "completed_at": "completedAt",
    "quest_id": "questId",
    "reference_id": "referenceId",
    "next_screen_id": "nextScreenId",
    "guide_text": "guideText",
    "fact_popup": "factPopup",
    "show_hint_after": "showHintAfter",
    "ai_hints_enabled": "aiHintsEnabled",
    "reward_coins": "rewardCoins",
    "reward_petals": "rewardPetals",
    "reward_character": "rewardCharacter",
    "current_value": "currentValue",
    "start_date": "startDate",
    "end_date": "endDate",
    "image_url": "imageUrl",
    "related_products": "relatedProducts",
    "is_public": "isPublic",
    "related_artifact_ids": "relatedArtifactIds",
    "related_heritage_ids": "relatedHeritageIds",
    "related_history_ids": "relatedHistoryIds",
    "related_level_ids": "relatedLevelIds"
}

COLLECTIONS_TO_KEEP_SNAKE = [
    "cultural_categories",
    "heritage_sites",
    "game_chapters",
    "game_levels",
    "game_characters",
    "game_progress",
    "game_sessions",
    "game_badges",
    "game_achievements",
    "scan_objects",
    "scan_history",
    "shop_items",
    "user_inventory",
    "user_characters",
    "ai_chat_history",
    "learning_modules",
    "game_quests",
    "user_progress",
    "history_articles"
]

def migrate_obj(obj):
    if isinstance(obj, list):
        return [migrate_obj(i) for i in obj]
    if isinstance(obj, dict):
        new_obj = {}
        for k, v in obj.items():
            new_key = MAPPING.get(k, k)
            new_obj[new_key] = migrate_obj(v)
        return new_obj
    return obj

def main():
    if not os.path.exists(DB_PATH):
        print(f"File not found: {DB_PATH}")
        return

    with open(DB_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    new_data = {}
    for collection_name, items in data.items():
        # collection_name itself stays same (most are already in COLLECTIONS_TO_KEEP_SNAKE)
        new_data[collection_name] = migrate_obj(items)
        print(f"Migrated collection: {collection_name}")

    with open(DB_PATH, 'w', encoding='utf-8') as f:
        json.dump(new_data, f, ensure_ascii=False, indent=2)
    
    print("Migration completed successfully.")

if __name__ == "__main__":
    main()
