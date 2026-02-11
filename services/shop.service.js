const db = require('../config/database');

exports.getShopItems = async () => {
    const items = db.findAll('shop_items');
    return items || [];
};

exports.getUserInventory = async (userId) => {
    // Find inventory record for user
    const userInv = db.findOne('user_inventory', { userId: userId });
    return userInv ? userInv.items : [];
};

exports.buyItem = async (userId, itemId, quantity = 1) => {
    // 1. Validate Item
    // Use findById since shop items have IDs
    const item = db.findById('shop_items', itemId);
    if (!item) throw new Error('Item not found');

    // 2. Validate User Balance
    const progress = db.findOne('game_progress', { userId: userId });
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
    let userInv = db.findOne('user_inventory', { userId: userId });

    // If no inventory record exists, create one using db.create (assigns ID automatically)
    if (!userInv) {
        userInv = db.create('user_inventory', { userId: userId, items: [] });
    }

    // Clone items array to avoid direct mutation before update (though adapter returns ref, cleaner to be explicit)
    const currentItems = [...userInv.items];
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
    db.update('game_progress', progress.id, {
        coins: newCoins,
        totalSenPetals: newPetals
    });

    // Update Inventory
    db.update('user_inventory', userInv.id, {
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

    // [New] Trigger Hidden Unlock: Buying "Trang phục chú Tễu" (ID 3) unlocks "Chú Tễu" (Character ID 1)
    if (itemId === 3) {
        const teuCharacterId = 1;
        const existingChar = db.findOne('user_characters', { userId: userId, characterId: teuCharacterId });
        if (!existingChar) {
            db.create('user_characters', {
                userId: userId,
                characterId: teuCharacterId,
                unlockedAt: new Date().toISOString(),
                unlockType: 'bonus_with_skin'
            });
            // Update return message to inform user
            return {
                ...successResult,
                message: 'Mua thành công! Bạn đã nhận được cả nhân vật Chú Tễu!'
            };
        }
    }

    return successResult;
};
