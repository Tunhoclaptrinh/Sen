const BaseService = require('../utils/BaseService');
const db = require('../config/database');

class CollectionService extends BaseService {
    constructor() {
        super('collections');
    }

    normalizeType(type) {
        if (type === 'heritageSite' || type === 'heritage_site') return 'heritage';
        return type;
    }

    /**
     * Get collection by ID and populate items
     */
    async getById(id) {
        const result = await super.findById(id);
        if (!result.success) return result;

        const collection = result.data;
        let items = collection.items || [];

        // LEGACY MIGRATION: If items is empty but legacy IDs exist, construct them
        if (items.length === 0) {
            if (collection.artifactIds && Array.isArray(collection.artifactIds)) {
                items = items.concat(collection.artifactIds.map(id => ({
                    id: parseInt(id),
                    type: 'artifact',
                    addedAt: collection.createdAt
                })));
            }
            if (collection.heritageSiteIds && Array.isArray(collection.heritageSiteIds)) {
                items = items.concat(collection.heritageSiteIds.map(id => ({
                    id: parseInt(id),
                    type: 'heritage',
                    addedAt: collection.createdAt
                })));
            }
        }

        const populatedItems = [];

        for (const item of items) {
            let details = null;
            const lookupId = Number(item.id);

            if (item.type === 'heritage') {
                details = await db.findById('heritage_sites', lookupId);
            } else if (item.type === 'artifact') {
                details = await db.findById('artifacts', lookupId);
            }

            if (details) {
                populatedItems.push({
                    ...item,
                    details: {
                        id: details.id,
                        name: details.name,
                        image: details.image || (details.images && details.images[0]) || details.thumbnail,
                        shortDescription: details.shortDescription || details.description
                    }
                });
            } else {
                // If item not found, push with null details so frontend handles it gracefully
                populatedItems.push({
                    ...item,
                    details: null
                });
            }
        }

        // Return new object with populated items, ensuring raw items are overridden
        return {
            success: true,
            data: {
                ...collection,
                items: populatedItems
            }
        };
    }

    async addItem(collectionId, itemData) {
        const result = await this.findById(collectionId);
        if (!result.success) return result;

        const collection = result.data;
        const items = collection.items || [];
        const type = this.normalizeType(itemData.type);

        // Check duplicate
        const exists = items.find(i => i.id === itemData.id && i.type === type);
        if (exists) {
            return {
                success: false,
                message: 'Item already exists in collection',
                statusCode: 400
            };
        }

        const newItem = {
            id: itemData.id,
            type: type,
            addedAt: new Date().toISOString(),
            note: itemData.note || ''
        };

        const updated = await db.update('collections', collectionId, {
            items: [...items, newItem],
            totalItems: items.length + 1,
            updatedAt: new Date().toISOString()
        });

        // TRIGGER QUEST UPDATE
        try {
            const questService = require('./quest.service');
            // Assuming 'collect_artifact' is the type
            await questService.checkAndAdvance(collection.userId, 'collect_artifact', 1);
        } catch (e) {
            console.error('Quest trigger failed', e);
        }

        return {
            success: true,
            message: 'Item added to collection',
            data: updated
        };
    }

    async removeItem(collectionId, itemId, type) {
        const result = await this.findById(collectionId);
        if (!result.success) return result;

        const collection = result.data;
        const items = collection.items || [];

        const normalizedType = this.normalizeType(type);
        const newItems = items.filter(i => !(i.id === parseInt(itemId) && i.type === normalizedType));

        if (newItems.length === items.length) {
            return {
                success: false,
                message: 'Item not found in collection',
                statusCode: 404
            };
        }

        const updated = await db.update('collections', collectionId, {
            items: newItems,
            totalItems: newItems.length,
            updatedAt: new Date().toISOString()
        });

        return {
            success: true,
            message: 'Item removed from collection',
            data: updated
        };
    }
}

module.exports = new CollectionService();
