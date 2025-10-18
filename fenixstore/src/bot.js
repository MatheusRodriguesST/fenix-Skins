// src/bot.js
// Separate Node.js script for bot management. Run this separately, e.g., with pm2 or as a service.
// Requires: npm i steam-user steam-tradeoffer-manager steamcommunity node-cron steam-totp @supabase/supabase-js dotenv
// Config: env with BOT_ACCOUNTS = JSON array [{username, password, shared_secret, identity_secret, steamid}]
// SUPABASE_URL, SUPABASE_KEY

require('dotenv').config({ path: '../.env' }); // Load .env from project root; adjust path if needed

const SteamUser = require('steam-user');
const TradeOfferManager = require('steam-tradeoffer-manager');
const SteamCommunity = require('steamcommunity');
const SteamTotp = require('steam-totp');
const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');
const util = require('util');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

console.log('Starting bot script...');
console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Not set');
console.log('Supabase Key:', supabaseKey ? 'Set' : 'Not set');

const botAccounts = JSON.parse(process.env.BOT_ACCOUNTS || "[]"); // [{username, password, shared_secret, identity_secret, steamid}]
console.log('Bot accounts loaded:', botAccounts.length);

const bots = {};

botAccounts.forEach((botConfig, index) => {
  console.log(`Initializing bot ${index + 1}: ${botConfig.steamid}`);
  const client = new SteamUser();
  const community = new SteamCommunity();
  const manager = new TradeOfferManager({
    steam: client,
    community: community,
    pollInterval: 10000, // Poll every 10s
  });

  const logOnBot = () => {
    const twoFactorCode = SteamTotp.generateAuthCode(botConfig.shared_secret);
    console.log(`Generated two-factor code for bot ${botConfig.steamid}`);
    client.logOn({
      accountName: botConfig.username,
      password: botConfig.password,
      twoFactorCode,
    });
  };

  console.log(`Logging on bot ${botConfig.steamid}`);
  logOnBot();

  client.on('loggedOn', () => {
    console.log(`Bot ${botConfig.steamid} logged on successfully`);
    client.setPersona(SteamUser.EPersonaState.Online);
    console.log(`Bot ${botConfig.steamid} set to Online`);
  });

  client.on('error', (err) => {
    console.error(`Bot ${botConfig.steamid} login error:`, err);
    if (err.eresult === SteamUser.EResult.RateLimitExceeded) {
      console.log(`RateLimitExceeded, waiting 30min before retry...`);
      setTimeout(logOnBot, 30 * 60 * 1000);
    } else if (err.eresult === SteamUser.EResult.InvalidPassword || err.eresult === SteamUser.EResult.AccountLoginDeniedNeedTwoFactor) {
      console.error(`Invalid credentials or two-factor issue for bot ${botConfig.steamid}`);
    }
  });

  client.on('webSession', (sessionID, cookies) => {
    console.log(`Bot ${botConfig.steamid} received web session`);
    manager.setCookies(cookies);
    community.setCookies(cookies);
    console.log(`Bot ${botConfig.steamid} cookies set for manager and community`);
  });

  manager.on('sentOfferChanged', async (offer, oldState) => {
    console.log(`Offer ${offer.id} changed from state ${oldState} to ${offer.state} for bot ${botConfig.steamid}`);
    
    const pendingQuery = supabase.from('pending_sells').select('*').eq('trade_offer_id', offer.id).single();
    const { data: pending, error: fetchError } = await pendingQuery;
    if (fetchError || !pending) {
      console.error(`Error fetching pending for offer ${offer.id} or no pending found:`, fetchError);
      return;
    }

    if (offer.state === TradeOfferManager.EOfferState.Accepted) {
      console.log(`Processing accepted offer ${offer.id}`);
      // Get full received items with descriptions
      const getReceivedItems = util.promisify(offer.getReceivedItems.bind(offer));
      let receivedItems;
      try {
        receivedItems = await getReceivedItems(true); // true to force refresh descriptions
      } catch (err) {
        console.error(`Error getting received items for offer ${offer.id}:`, err);
        await supabase.from('pending_sells').update({ status: 'failed' }).eq('id', pending.id);
        return;
      }

      console.log(`Received items count: ${receivedItems.length}`);
      const expectedAssetId = pending.asset_id;
      const expectedMarketName = pending.market_hash_name;
      const matchingItem = receivedItems.find((item) => item.assetid === expectedAssetId && item.market_hash_name === expectedMarketName);
      if (matchingItem) {
        console.log(`Item match found for ${expectedAssetId}`);
        // Fetch full inspect data
        const inspectAction = matchingItem.actions?.find(action => action.name === 'Inspect in Game...');
        if (!inspectAction) {
          console.error(`No inspect link for item ${expectedAssetId}`);
          await supabase.from('pending_sells').update({ status: 'failed' }).eq('id', pending.id);
          return;
        }
        const inspectUrl = inspectAction.link.replace('%owner_steamid%', botConfig.steamid).replace('%assetid%', matchingItem.assetid);

        const httpRequest = util.promisify(community.httpRequest.bind(community));
        let body;
        try {
          const response = await httpRequest(inspectUrl, {});
          body = response.body.toString('utf8');
        } catch (err) {
          console.error(`Error fetching inspect URL for item ${expectedAssetId}:`, err);
          await supabase.from('pending_sells').update({ status: 'failed' }).eq('id', pending.id);
          return;
        }

        const match = body.match(/var g_rgItemInfo = ({.*?});/s);
        let itemInfo = {};
        if (match && match[1]) {
          try {
            itemInfo = JSON.parse(match[1]);
          } catch (parseErr) {
            console.error(`Error parsing itemInfo for ${expectedAssetId}:`, parseErr);
          }
        } else {
          console.warn(`No itemInfo found in inspect response for ${expectedAssetId}`);
        }

        // Build full item JSON
        const fullItem = {
          id: matchingItem.assetid,
          displayName: matchingItem.market_hash_name,
          price: pending.price,
          seller_payout: parseFloat((pending.price * 0.95).toFixed(2)),
          tradable: true,
          float: itemInfo.paintwear || matchingItem.paintwear || null,
          pattern: itemInfo.paintseed || matchingItem.paintseed || null,
          stickers: itemInfo.stickers || matchingItem.stickers || [],
          charms: itemInfo.charms || matchingItem.charms || null, // Fallback to null if charms not supported
          appid: matchingItem.appid,
          contextid: matchingItem.contextid,
          classid: matchingItem.classid,
          instanceid: matchingItem.instanceid,
          icon_url: matchingItem.icon_url,
          weapon: matchingItem.market_hash_name.split(' | ')[0] || null,
          skin: matchingItem.market_hash_name.split(' | ')[1] || null,
        };

        // Create listing
        const { data: listing, error: insertError } = await supabase.from('listings').insert({
          seller_id: pending.user_id,
          item: fullItem,
          price: pending.price,
          status: 'active',
        }).select().single();

        if (insertError) {
          console.error(`Error creating listing for accepted ${pending.id}:`, insertError);
          await supabase.from('pending_sells').update({ status: 'failed' }).eq('id', pending.id);
          return;
        }

        const { error: updateError } = await supabase.from('pending_sells').update({ status: 'listed', listing_id: listing.id }).eq('id', pending.id);
        if (updateError) {
          console.error(`Error updating pending ${pending.id} to listed:`, updateError);
        } else {
          console.log(`Trade ${offer.id} accepted, verified, and listing ${listing.id} created for item ${expectedAssetId}`);
        }
      } else {
        console.error(`Trade ${offer.id} accepted but items mismatch!`);
        await supabase.from('pending_sells').update({ status: 'failed' }).eq('id', pending.id);
      }
    } else if (offer.state === TradeOfferManager.EOfferState.Countered) {
      console.log(`Offer ${offer.id} was countered (modified by user), attempting to decline...`);
      offer.decline(async (err) => {
        if (err) {
          console.error(`Error declining countered offer ${offer.id}:`, err);
        } else {
          console.log(`Declined countered offer ${offer.id}`);
        }
        await supabase.from('pending_sells').update({ status: 'failed' }).eq('id', pending.id);
      });
    } else if ([TradeOfferManager.EOfferState.Declined, TradeOfferManager.EOfferState.Canceled, TradeOfferManager.EOfferState.InvalidItems].includes(offer.state)) {
      console.log(`Offer ${offer.id} failed with state ${offer.state}`);
      await supabase.from('pending_sells').update({ status: 'failed' }).eq('id', pending.id);
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

// Cron job every minute to process pending, timed-out, and accepted
cron.schedule('* * * * *', async () => {
  console.log('Cron job started: Processing pending, timed-out, and accepted sells');

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
      if (!bot || !bot.client.loggedOn) {
        console.warn(`Bot ${pending.bot_steam_id} not found or not logged on, skipping pending ${pending.id}`);
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
        const { error: updateError } = await supabase.from('pending_sells').update({ status: 'failed' }).eq('id', pending.id);
        if (updateError) {
          console.error(`Error updating pending ${pending.id}:`, updateError);
        }
        continue;
      }
      console.log(`User trade_url found for pending ${pending.id}: ${user.trade_url}`);

      console.log(`Creating offer for pending ${pending.id}`);
      const offer = bot.manager.createOffer(user.trade_url);
      offer.addTheirItem({ assetid: pending.asset_id, appid: 730, contextid: 2 }); // CS:GO appid
      offer.setMessage("Trade for selling your item on FenixStore");
      console.log(`Offer created with item ${pending.asset_id}`);

      console.log(`Sending offer for pending ${pending.id}`);
      offer.send(async (err, status) => {
        if (err) {
          console.error(`Error sending offer for pending ${pending.id}:`, err);
          const { error: updateError } = await supabase.from('pending_sells').update({ status: 'failed' }).eq('id', pending.id);
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

  // 2. Process timed-out offers: cancel if >10 min and active
  const timeoutThreshold = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: timedOuts, error: timedOutsError } = await supabase.from('pending_sells').select('*').eq('status', 'offer_sent').lt('updated_at', timeoutThreshold);
  if (timedOutsError) {
    console.error('Error fetching timed-outs:', timedOutsError);
  } else {
    console.log(`Found ${timedOuts ? timedOuts.length : 0} timed-out offers`);
    for (const timedOut of timedOuts || []) {
      console.log(`Processing timed-out offer ${timedOut.trade_offer_id} for pending ${timedOut.id}`);
      const bot = bots[timedOut.bot_steam_id];
      if (!bot || !bot.client.loggedOn) {
        console.warn(`Bot ${timedOut.bot_steam_id} not found or not logged on, deleting pending ${timedOut.id}`);
        const { error: deleteError } = await supabase.from('pending_sells').delete().eq('id', timedOut.id);
        if (deleteError) {
          console.error(`Error deleting timed-out pending ${timedOut.id}:`, deleteError);
        } else {
          console.log(`Successfully deleted timed-out pending ${timedOut.id} from database (no bot)`);
        }
        continue;
      }

      try {
        const getOffer = util.promisify(bot.manager.getOffer.bind(bot.manager));
        const offer = await getOffer(timedOut.trade_offer_id);
        if (!offer) {
          console.warn(`Offer ${timedOut.trade_offer_id} not found, proceeding to delete pending ${timedOut.id}`);
        } else if (offer.state === TradeOfferManager.EOfferState.Active) {
          const cancelOffer = util.promisify(offer.cancel.bind(offer));
          try {
            await cancelOffer();
            console.log(`Canceled timed-out offer ${timedOut.trade_offer_id}`);
          } catch (cancelErr) {
            console.error(`Error canceling timed-out offer ${timedOut.trade_offer_id}:`, cancelErr);
          }
        } else {
          console.log(`Offer ${timedOut.trade_offer_id} is not active (state: ${offer.state}), proceeding to delete`);
        }
      } catch (err) {
        console.error(`Error loading offer ${timedOut.trade_offer_id}:`, err);
      }

      // Delete from DB regardless of cancel success
      const { error: deleteError } = await supabase.from('pending_sells').delete().eq('id', timedOut.id);
      if (deleteError) {
        console.error(`Error deleting timed-out pending ${timedOut.id}:`, deleteError);
      } else {
        console.log(`Successfully deleted timed-out pending ${timedOut.id} from database`);
      }
    }
  }

  // 3. Process accepted: already handled in sentOfferChanged, no need for cron check
  console.log('Cron job completed');
});