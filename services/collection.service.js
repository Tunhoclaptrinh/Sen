const BaseService = require('../utils/BaseService');
const db = require('../config/database');

class CollectionService extends BaseService {
    constructor() {
        super('collections');
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
            if (collection.artifact_ids && Array.isArray(collection.artifact_ids)) {
                items = items.concat(collection.artifact_ids.map(id => ({
                    id: parseInt(id),
                    type: 'artifact',
                    addedAt: collection.createdAt
                })));
            }
            if (collection.heritage_site_ids && Array.isArray(collection.heritage_site_ids)) {
                items = items.concat(collection.heritage_site_ids.map(id => ({
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
                        short_description: details.short_description || details.description
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

        // Check duplicate
        const exists = items.find(i => i.id === itemData.id && i.type === itemData.type);
        if (exists) {
            return {
                success: false,
                message: 'Item already exists in collection',
                statusCode: 400
            };
        }

        const newItem = {
            id: itemData.id,
            type: itemData.type,
            addedAt: new Date().toISOString(),
            note: itemData.note || ''
        };

        const updated = await db.update('collections', collectionId, {
            items: [...items, newItem],
            total_items: items.length + 1,
            updatedAt: new Date().toISOString()
        });

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

        const newItems = items.filter(i => !(i.id === parseInt(itemId) && i.type === type));

        if (newItems.length === items.length) {
            return {
                success: false,
                message: 'Item not found in collection',
                statusCode: 404
            };
        }

        const updated = await db.update('collections', collectionId, {
            items: newItems,
            total_items: newItems.length,
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
