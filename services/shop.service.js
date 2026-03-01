const db = require('../config/database');
const notificationService = require('./notification.service');

exports.getShopItems = async (options = {}) => {
    return await db.findAllAdvanced('shop_items', options);
};

exports.getUserInventory = async (userId) => {
    // Find inventory record for user
    const userInv = await db.findOne('user_inventory', { userId: userId });
    return userInv ? userInv.items : [];
};

exports.buyItem = async (userId, itemId, quantity = 1) => {
    // 1. Validate Item
    // Use findById since shop items have IDs
    const item = await db.findById('shop_items', itemId);
    if (!item) throw new Error('Item not found');

    // 2. Validate User Balance
    const progress = await db.findOne('game_progress', { userId: userId });
    if (!progress) throw new Error('User game progress not found');

    const totalCost = item.price * quantity;

    // Calculate new balance
    let newCoins = progress.coins || 0;
    let newPetals = progress.totalSenPetals || 0;

    if (item.currency === 'petals') {
        if (newPetals < totalCost) throw new Error('Insufficient funds (Petals)');
        newPetals -= totalCost;
    } else {
        if (newCoins < totalCost) throw new Error('Insufficient funds (Coins)');
        newCoins -= totalCost;
    }

    // 3. Add to Inventory
    let userInv = await db.findOne('user_inventory', { userId: userId });

    // If no inventory record exists, create one using db.create (assigns ID automatically)
    if (!userInv) {
        userInv = await db.create('user_inventory', { userId: userId, items: [] });
    }

    // Clone items array to avoid direct mutation before update
    const currentItems = [...(userInv.items || [])];
    const existingItemIndex = currentItems.findIndex(i => i.itemId === itemId);

    if (existingItemIndex > -1) {
        // Double check permanent items logic
        if (!item.isActive) {
            throw new Error('Item already owned');
        }
        currentItems[existingItemIndex].quantity += quantity;
    } else {
        currentItems.push({
            itemId: itemId,
            quantity: quantity,
            acquiredAt: new Date().toISOString()
        });
    }

    // 4. Persist Changes (Atomic-like sequence)

    // Update Progress (Coins/Petals)
    await db.update('game_progress', progress.id, {
        coins: newCoins,
        totalSenPetals: newPetals
    });

    // Update Inventory
    await db.update('user_inventory', userInv.id, {
        items: currentItems
    });

    const successResult = {
        success: true,
        message: 'Purchase successful',
        item: item,
        quantity: quantity,
        newBalance: {
            coins: newCoins,
            petals: newPetals
        },
        inventory: currentItems
    };

    // TRIGGER PURCHASE NOTIFICATION
    try {
        await notificationService.notify(
            userId,
            'Mua sắm thành công! 🛒',
            `Bạn đã mua thành công "${item.name}" x${quantity}.`,
            'system'
        );
    } catch (e) { console.error('Shop notification failed', e); }

    // [New] Trigger Hidden Unlock: Buying "Trang phục chú Tễu" (ID 3) unlocks "Chú Tễu" (Character ID 1)
    if (itemId === 3) {
        const teuCharacterId = 1;
        const hasCharacter = progress.collectedCharacters && progress.collectedCharacters.includes(teuCharacterId);
        
        if (!hasCharacter) {
            const updatedCharacters = [...(progress.collectedCharacters || []), teuCharacterId];
            await db.update('game_progress', progress.id, {
                collectedCharacters: updatedCharacters
            });

            // TRIGGER CHARACTER UNLOCK NOTIFICATION
            try {
                await notificationService.notify(
                    userId,
                    'Nhân vật mới! 🎭',
                    'Chúc mừng! Bạn đã nhận được thêm nhân vật "Chú Tễu" như một phần quà đặc biệt!',
                    'system'
                );
            } catch (e) { console.error('Bonus notification failed', e); }

            // Update return message to inform user
            return {
                ...successResult,
                message: 'Mua thành công! Bạn đã nhận được cả nhân vật Chú Tễu!'
            };
        }
    }

    return successResult;
};

// Admin CRUD Methods

exports.createItem = async (data) => {
    // Ensure isActive is boolean
    const itemData = {
        ...data,
        isActive: data.isActive !== undefined ? !!data.isActive : true,
    };
    return await db.create('shop_items', itemData);
};

exports.updateItem = async (id, data) => {
    const item = await db.findById('shop_items', id);
    if (!item) throw new Error('Item not found');

    return await db.update('shop_items', id, data);
};

exports.deleteItem = async (id) => {
    const item = await db.findById('shop_items', id);
    if (!item) throw new Error('Item not found');

    return await db.delete('shop_items', id);
};
