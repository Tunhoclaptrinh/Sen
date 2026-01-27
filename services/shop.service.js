const db = require('../config/database');

exports.getShopItems = async () => {
    const items = db.findAll('shop_items');
    return items || [];
};

exports.getUserInventory = async (userId) => {
    // Find inventory record for user
    const userInv = db.findOne('user_inventory', { user_id: userId });
    return userInv ? userInv.items : [];
};

exports.buyItem = async (userId, itemId, quantity = 1) => {
    // 1. Validate Item
    // Use findById since shop items have IDs
    const item = db.findById('shop_items', itemId);
    if (!item) throw new Error('Item not found');

    // 2. Validate User Balance
    const progress = db.findOne('game_progress', { user_id: userId });
    if (!progress) throw new Error('User game progress not found');

    const totalCost = item.price * quantity;
    
    // Calculate new balance
    let newCoins = progress.coins || 0;
    let newPetals = progress.total_sen_petals || 0;

    if (item.currency === 'petals') {
        if (newPetals < totalCost) throw new Error('Insufficient funds (Petals)');
        newPetals -= totalCost;
    } else {
        if (newCoins < totalCost) throw new Error('Insufficient funds (Coins)');
        newCoins -= totalCost;
    }

    // 3. Add to Inventory
    let userInv = db.findOne('user_inventory', { user_id: userId });
    
    // If no inventory record exists, create one using db.create (assigns ID automatically)
    if (!userInv) {
        userInv = db.create('user_inventory', { user_id: userId, items: [] });
    }

    // Clone items array to avoid direct mutation before update (though adapter returns ref, cleaner to be explicit)
    const currentItems = [...userInv.items];
    const existingItemIndex = currentItems.findIndex(i => i.item_id === itemId);

    if (existingItemIndex > -1) {
        // Double check permanent items logic
        if (!item.is_consumable) {
             throw new Error('Item already owned');
        }
        currentItems[existingItemIndex].quantity += quantity;
    } else {
        currentItems.push({
            item_id: itemId,
            quantity: quantity,
            acquired_at: new Date().toISOString()
        });
    }

    // 4. Persist Changes (Atomic-like sequence)
    
    // Update Progress (Coins/Petals)
    db.update('game_progress', progress.id, {
        coins: newCoins,
        total_sen_petals: newPetals
    });

    // Update Inventory
    db.update('user_inventory', userInv.id, {
        items: currentItems
    });

    return {
        success: true,
        message: 'Purchase successful',
        item: item,
        quantity: quantity,
        new_balance: {
            coins: newCoins,
            petals: newPetals
        },
        inventory: currentItems
    };
};
