// src/bot.js
// Separate Node.js script for bot management. Run this separately, e.g., with pm2 or as a service.
// Requires: npm i steam-user steam-tradeoffer-manager steamcommunity node-cron steam-totp @supabase/supabase-js dotenv
// Config: env with BOT_ACCOUNTS = JSON array [{username, password, shared_secret, identity_secret, steamid}]
// SUPABASE_URL, SUPABASE_KEY

require('dotenv').config({ path: '../.env' });  // Load .env from project root; adjust path if needed

const SteamUser = require('steam-user');
const TradeOfferManager = require('steam-tradeoffer-manager');
const SteamCommunity = require('steamcommunity');
const SteamTotp = require('steam-totp');
const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

console.log('Starting bot script...');
console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Not set');
console.log('Supabase Key:', supabaseKey ? 'Set' : 'Not set');

const botAccounts = JSON.parse(process.env.BOT_ACCOUNTS || "[]");  // [{username, password, shared_secret, identity_secret, steamid}]
console.log('Bot accounts loaded:', botAccounts.length);

const bots = {};

botAccounts.forEach((botConfig, index) => {
  console.log(`Initializing bot ${index + 1}: ${botConfig.steamid}`);
  const client = new SteamUser();
  const community = new SteamCommunity();
  const manager = new TradeOfferManager({
    steam: client,
    community: community,
    pollInterval: 10000,  // Poll every 10s
  });

  console.log(`Logging on bot ${botConfig.steamid}`);
  client.logOn({
    accountName: botConfig.username,
    password: botConfig.password,
    sharedSecret: botConfig.shared_secret,
    identitySecret: botConfig.identity_secret,
  });

  client.on('loggedOn', () => {
    console.log(`Bot ${botConfig.steamid} logged on successfully`);
    client.setPersona(SteamUser.EPersonaState.Online);
    console.log(`Bot ${botConfig.steamid} set to Online`);
  });

  client.on('error', (err) => {
    console.error(`Bot ${botConfig.steamid} login error:`, err);
  });

  client.on('webSession', (sessionID, cookies) => {
    console.log(`Bot ${botConfig.steamid} received web session`);
    manager.setCookies(cookies);
    community.setCookies(cookies);
    console.log(`Bot ${botConfig.steamid} cookies set for manager and community`);
  });

  manager.on('sentOfferChanged', async (offer, oldState) => {
    console.log(`Offer ${offer.id} changed from state ${oldState} to ${offer.state} for bot ${botConfig.steamid}`);
    if (offer.state === TradeOfferManager.EOfferState.Accepted) {
      console.log(`Processing accepted offer ${offer.id}`);
      const { data: pending, error: fetchError } = await supabase.from('pending_sells').select('*').eq('trade_offer_id', offer.id).eq('status', 'offer_sent').single();
      if (fetchError) {
        console.error(`Error fetching pending for offer ${offer.id}:`, fetchError);
        return;
      }
      if (pending) {
        console.log(`Found pending ${pending.id} for offer ${offer.id}`);
        const receivedItems = offer.itemsToReceive;
        console.log(`Received items count: ${receivedItems.length}`);
        const expectedAssetId = pending.asset_id;
        const expectedMarketName = pending.market_hash_name;
        const matchingItem = receivedItems.find((item) => item.assetid === expectedAssetId && item.market_hash_name === expectedMarketName);
        if (matchingItem) {
          console.log(`Item match found for ${expectedAssetId}`);
          const { error: updateError } = await supabase.from('pending_sells').update({ status: 'accepted' }).eq('id', pending.id);
          if (updateError) {
            console.error(`Error updating pending ${pending.id} to accepted:`, updateError);
          } else {
            console.log(`Trade ${offer.id} accepted and verified for item ${expectedAssetId}`);
          }
        } else {
          console.error(`Trade ${offer.id} accepted but items mismatch!`);
          const { error: updateError } = await supabase.from('pending_sells').update({ status: 'failed', note: 'items mismatch' }).eq('id', pending.id);
          if (updateError) {
            console.error(`Error updating pending ${pending.id} to failed:`, updateError);
          }
        }
      } else {
        console.log(`No pending found for accepted offer ${offer.id}`);
      }
    }
  });

  manager.on('newOffer', (offer) => {
    console.log(`Received new unsolicited offer ${offer.id} for bot ${botConfig.steamid}`);
    offer.decline((err) => {
      if (err) {
        console.error(`Error declining unsolicited offer ${offer.id}:`, err);
      } else {
        console.log(`Declined unsolicited offer ${offer.id}`);
      }
    });
  });

  bots[botConfig.steamid] = { client, manager, community, config: botConfig };
  console.log(`Bot ${botConfig.steamid} initialized`);
});

// Cron job every minute to process pending and accepted
cron.schedule('* * * * *', async () => {
  console.log('Cron job started: Processing pending and accepted sells');
  
  // 1. Process pending: send offers
  const { data: pendings, error: pendingsError } = await supabase.from('pending_sells').select('*').eq('status', 'pending');
  if (pendingsError) {
    console.error('Error fetching pendings:', pendingsError);
    return;
  }
  console.log(`Found ${pendings ? pendings.length : 0} pending sells`);
  if (pendings) {
    for (const pending of pendings) {
      console.log(`Processing pending ${pending.id} for user ${pending.user_id}, bot ${pending.bot_steam_id}`);
      const bot = bots[pending.bot_steam_id];
      if (!bot) {
        console.warn(`Bot ${pending.bot_steam_id} not found, skipping pending ${pending.id}`);
        continue;
      }

      // Get user trade_url from DB
      const { data: user, error: userError } = await supabase.from('users').select('trade_url, steam_id').eq('id', pending.user_id).single();
      if (userError) {
        console.error(`Error fetching user for pending ${pending.id}:`, userError);
        continue;
      }
      if (!user || !user.trade_url) {
        console.log(`No user or trade_url for pending ${pending.id}, updating to failed`);
        const { error: updateError } = await supabase.from('pending_sells').update({ status: 'failed', note: 'no trade_url' }).eq('id', pending.id);
        if (updateError) {
          console.error(`Error updating pending ${pending.id}:`, updateError);
        }
        continue;
      }
      console.log(`User trade_url found for pending ${pending.id}: ${user.trade_url}`);

      console.log(`Creating offer for pending ${pending.id}`);
      const offer = bot.manager.createOffer(user.trade_url);
      offer.addTheirItem({ assetid: pending.asset_id, appid: 730, contextid: 2 });  // CS:GO appid
      offer.setMessage("Trade for selling your item on FenixStore");
      console.log(`Offer created with item ${pending.asset_id}`);

      console.log(`Sending offer for pending ${pending.id}`);
      offer.send(async (err, status) => {
        if (err) {
          console.error(`Error sending offer for pending ${pending.id}:`, err);
          const { error: updateError } = await supabase.from('pending_sells').update({ status: 'failed', note: err.message }).eq('id', pending.id);
          if (updateError) {
            console.error(`Error updating pending ${pending.id} to failed:`, updateError);
          }
        } else {
          console.log(`Offer sent successfully: ID ${offer.id}, status ${status}`);
          const { error: updateError } = await supabase.from('pending_sells').update({ status: 'offer_sent', trade_offer_id: offer.id }).eq('id', pending.id);
          if (updateError) {
            console.error(`Error updating pending ${pending.id} to offer_sent:`, updateError);
          } else {
            console.log(`Updated pending ${pending.id} to offer_sent with trade_offer_id ${offer.id}`);
          }
        }
      });
    }
  }

  // 2. Process accepted: create listing
  const { data: accepteds, error: acceptedsError } = await supabase.from('pending_sells').select('*').eq('status', 'accepted');
  if (acceptedsError) {
    console.error('Error fetching accepteds:', acceptedsError);
    return;
  }
  console.log(`Found ${accepteds ? accepteds.length : 0} accepted sells`);
  if (accepteds) {
    for (const accepted of accepteds) {
      console.log(`Processing accepted ${accepted.id} for asset ${accepted.asset_id}`);
      // Fetch full item data (assume from Steam or stored)
      // For simplicity, create listing with item = {id: asset_id, displayName: market_hash_name, price: accepted.price, ...} - add more if needed
      const item = {
        id: accepted.asset_id,
        displayName: accepted.market_hash_name,
        // Add weapon, skin, etc. - may need to fetch from Steam API or store earlier
        price: accepted.price,
        tradable: true,
        // ...
      };
      console.log(`Item data prepared for listing: ${JSON.stringify(item)}`);

      console.log(`Inserting listing for accepted ${accepted.id}`);
      const { data: listing, error } = await supabase.from('listings').insert({
        seller_id: accepted.user_id,
        item: item,
        price: accepted.price,
        status: 'active',
      }).select().single();

      if (error) {
        console.error(`Error creating listing for accepted ${accepted.id}:`, error);
        continue;
      }
      console.log(`Listing created: ID ${listing.id}`);

      const { error: updateError } = await supabase.from('pending_sells').update({ status: 'listed', listing_id: listing.id }).eq('id', accepted.id);
      if (updateError) {
        console.error(`Error updating accepted ${accepted.id} to listed:`, updateError);
      } else {
        console.log(`Listing ${listing.id} created for accepted ${accepted.id}`);
      }
    }
  }
  
  console.log('Cron job completed');
});

// In confirmCheckout (SkinsPage.tsx), no change needed, as listing.seller_id is the original user, payout goes there.