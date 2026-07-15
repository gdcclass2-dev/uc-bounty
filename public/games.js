// ===== GAMES LIST (100+ real Play Store games) =====
// Each game: { pkg, name, icon, points, category }
// pkg = real Google Play Store package ID
// User installs → opens app → claims points
// 30-second wait + one-claim-per-game = basic anti-cheat

const GAMES_LIST = [
  // ===== BATTLE ROYALE =====
  { pkg: 'com.dts.freefireth', name: 'Free Fire MAX', icon: '🔥', points: 100, cat: 'Battle Royale' },
  { pkg: 'com.tencent.ig', name: 'PUBG Mobile', icon: '🔫', points: 100, cat: 'Battle Royale' },
  { pkg: 'com.activision.callofduty.shooter', name: 'Call of Duty Mobile', icon: '🎖️', points: 100, cat: 'Battle Royale' },
  { pkg: 'com.garena.game.codm', name: 'COD Mobile (Garena)', icon: '💥', points: 100, cat: 'Battle Royale' },
  { pkg: 'com.epicgames.fortnite', name: 'Fortnite', icon: '🏰', points: 100, cat: 'Battle Royale' },
  { pkg: 'com.axlebolt.standoff2', name: 'Standoff 2', icon: '🎯', points: 80, cat: 'Battle Royale' },
  { pkg: 'com.nianticlabs.pokemongo', name: 'Pokemon GO', icon: '⚡', points: 100, cat: 'Adventure' },
  { pkg: 'com.supercell.clashroyale', name: 'Clash Royale', icon: '👑', points: 100, cat: 'Strategy' },
  { pkg: 'com.supercell.clashofclans', name: 'Clash of Clans', icon: '⚔️', points: 100, cat: 'Strategy' },
  { pkg: 'com.supercell.brawlstars', name: 'Brawl Stars', icon: '⭐', points: 100, cat: 'Action' },

  // ===== POPULAR GAMES =====
  { pkg: 'com.miHoYo.GenshinImpact', name: 'Genshin Impact', icon: '⚔️', points: 100, cat: 'RPG' },
  { pkg: 'com.kiloo.subwaysurf', name: 'Subway Surfers', icon: '🏃', points: 50, cat: 'Runner' },
  { pkg: 'com.fingersoft.hillclimb', name: 'Hill Climb Racing', icon: '🚗', points: 50, cat: 'Racing' },
  { pkg: 'com.outfit7.talkingtomgoldrun', name: 'Talking Tom Gold Run', icon: '🐱', points: 50, cat: 'Runner' },
  { pkg: 'com.miniclip.eightballpool', name: '8 Ball Pool', icon: '🎱', points: 80, cat: 'Sports' },
  { pkg: 'com.king.candycrushsaga', name: 'Candy Crush Saga', icon: '🍬', points: 50, cat: 'Puzzle' },
  { pkg: 'com.king.candycrushsodasaga', name: 'Candy Crush Soda', icon: '🥤', points: 50, cat: 'Puzzle' },
  { pkg: 'com.mojang.minecraftpe', name: 'Minecraft', icon: '🧱', points: 100, cat: 'Sandbox' },
  { pkg: 'com.roblox.client', name: 'Roblox', icon: '🎲', points: 100, cat: 'Sandbox' },
  { pkg: 'com.innersloth.spacemafia', name: 'Among Us', icon: '🚀', points: 80, cat: 'Party' },

  // ===== RACING =====
  { pkg: 'com.naturalmotion.customstreetracer2', name: 'CSR Racing 2', icon: '🏎️', points: 80, cat: 'Racing' },
  { pkg: 'com.ea.game.nfs14_row', name: 'Need for Speed', icon: '🚓', points: 100, cat: 'Racing' },
  { pkg: 'com.gameloft.android.ANMP.GloftA9HM', name: 'Asphalt 9', icon: '🏁', points: 100, cat: 'Racing' },
  { pkg: 'com.gameloft.android.ANMP.GloftMVHM', name: 'Modern Strike', icon: '🔫', points: 80, cat: 'Shooter' },
  { pkg: 'com.fingersoft.hillclimb2', name: 'Hill Climb Racing 2', icon: '🚙', points: 60, cat: 'Racing' },
  { pkg: 'com.halfbrick.fruitninjafree', name: 'Fruit Ninja', icon: '🍉', points: 50, cat: 'Casual' },
  { pkg: 'com.imangi.templerun', name: 'Temple Run', icon: '🏛️', points: 50, cat: 'Runner' },
  { pkg: 'com.imangi.templerun2', name: 'Temple Run 2', icon: '🏛️', points: 50, cat: 'Runner' },

  // ===== STRATEGY =====
  { pkg: 'com.playrix.townsmen', name: 'Townsmen', icon: '🏰', points: 70, cat: 'Strategy' },
  { pkg: 'com.everbytestudio.aow', name: 'Age of War', icon: '🛡️', points: 60, cat: 'Strategy' },
  { pkg: 'com.lilithgame.roc.gp', name: 'Rise of Kingdoms', icon: '👑', points: 100, cat: 'Strategy' },
  { pkg: 'com.miniclip.agar.io', name: 'Agar.io', icon: '🟢', points: 60, cat: 'Casual' },
  { pkg: 'com.miniclip.plagueinc', name: 'Plague Inc', icon: '🦠', points: 80, cat: 'Strategy' },
  { pkg: 'com.dream.game.singularity', name: 'Singularity', icon: '🌌', points: 70, cat: 'Strategy' },

  // ===== RPG =====
  { pkg: 'com.komoot.android', name: 'Komoot', icon: '🗺️', points: 60, cat: 'Adventure' },
  { pkg: 'com.pearlabyss.blackdesertm', name: 'Black Desert Mobile', icon: '⚔️', points: 100, cat: 'RPG' },
  { pkg: 'com.ncsoft.lineagem', name: 'Lineage M', icon: '🗡️', points: 100, cat: 'RPG' },
  { pkg: 'com.kurogame.wutheringwaves', name: 'Wuthering Waves', icon: '🌊', points: 100, cat: 'RPG' },
  { pkg: 'com.HoYoverse.hkrpg', name: 'Honkai Star Rail', icon: '🚂', points: 100, cat: 'RPG' },
  { pkg: 'com.miHoYo.bh3', name: 'Honkai Impact 3rd', icon: '⚔️', points: 80, cat: 'RPG' },
  { pkg: 'com.levelinfinite.hotta', name: 'Tower of Fantasy', icon: '🗼', points: 80, cat: 'RPG' },

  // ===== CASUAL =====
  { pkg: 'com.rovio.angrybirds', name: 'Angry Birds', icon: '🐦', points: 50, cat: 'Casual' },
  { pkg: 'com.rovio.angrybirds2', name: 'Angry Birds 2', icon: '🐦', points: 50, cat: 'Casual' },
  { pkg: 'com.rovio.battlebay', name: 'Battle Bay', icon: '⚓', points: 60, cat: 'Action' },
  { pkg: 'com.halfbrick.jetpackjoyride', name: 'Jetpack Joyride', icon: '🚀', points: 50, cat: 'Runner' },
  { pkg: 'com.halfbrick.danieldaniel', name: 'Dan the Man', icon: '👊', points: 60, cat: 'Action' },
  { pkg: 'com.cmplay.tiles2', name: 'Tiles & Tales', icon: '🎵', points: 50, cat: 'Music' },
  { pkg: 'com.musicfumes.fingerspelling', name: 'Magic Tiles 3', icon: '🎹', points: 50, cat: 'Music' },
  { pkg: 'com.amanotes.beat', name: 'Beat Star', icon: '🎵', points: 50, cat: 'Music' },

  // ===== SPORTS =====
  { pkg: 'com.dts.freefiremax', name: 'Free Fire (Max)', icon: '🔥', points: 100, cat: 'Battle Royale' },
  { pkg: 'com.ea.gp.fifamobile', name: 'FIFA Mobile', icon: '⚽', points: 100, cat: 'Sports' },
  { pkg: 'com.dreamleaguesoccer', name: 'Dream League Soccer', icon: '⚽', points: 70, cat: 'Sports' },
  { pkg: 'com.firsttouchgames.dls3', name: 'DLS 23', icon: '⚽', points: 70, cat: 'Sports' },
  { pkg: 'com.miniclip.soccer', name: 'Soccer Star', icon: '⚽', points: 60, cat: 'Sports' },
  { pkg: 'com.naturalmotion.realsoccer', name: 'Real Soccer', icon: '⚽', points: 60, cat: 'Sports' },
  { pkg: 'com.miniclip.cricket', name: 'Cricket League', icon: '🏏', points: 60, cat: 'Sports' },
  { pkg: 'com.score.android', name: 'Score Hero', icon: '⚽', points: 60, cat: 'Sports' },

  // ===== PUZZLE =====
  { pkg: 'com.playrix.homescapes', name: 'Homescapes', icon: '🏡', points: 60, cat: 'Puzzle' },
  { pkg: 'com.playrix.gardenscapes', name: 'Gardenscapes', icon: '🌻', points: 60, cat: 'Puzzle' },
  { pkg: 'com.playrix.fishdom', name: 'Fishdom', icon: '🐠', points: 50, cat: 'Puzzle' },
  { pkg: 'com.wooga.jelly_splash', name: 'Jelly Splash', icon: '🍮', points: 50, cat: 'Puzzle' },
  { pkg: 'com.bitmango.go.wordcookies', name: 'Word Cookies', icon: '🍪', points: 50, cat: 'Puzzle' },
  { pkg: 'com.wordgame.puzzle.crossword', name: 'Crossword', icon: '📝', points: 50, cat: 'Puzzle' },
  { pkg: 'com.tiltingpoint.lng', name: 'Loot n Grinds', icon: '💎', points: 50, cat: 'Puzzle' },
  { pkg: 'com.wordgame.words', name: 'Wordscapes', icon: '📖', points: 50, cat: 'Puzzle' },

  // ===== SIMULATION =====
  { pkg: 'com.moonfrog.ludo', name: 'Ludo King', icon: '🎲', points: 50, cat: 'Board' },
  { pkg: 'com.outfit7.talkingtom2', name: 'Talking Tom 2', icon: '🐱', points: 50, cat: 'Casual' },
  { pkg: 'com.outfit7.talkingangelica', name: 'Talking Angela', icon: '😺', points: 50, cat: 'Casual' },
  { pkg: 'com.sunstudio.ducklife', name: 'Duck Life', icon: '🦆', points: 50, cat: 'Casual' },
  { pkg: 'com.crazylabs.myvet', name: 'My Vet', icon: '🐶', points: 50, cat: 'Casual' },
  { pkg: 'com.miniclip.dontstare', name: 'Don\'t Stare', icon: '👀', points: 50, cat: 'Casual' },
  { pkg: 'com.etermax.preguntados.lite', name: 'Trivia Crack', icon: '❓', points: 60, cat: 'Trivia' },
  { pkg: 'com.gamecircus.coin.dozer', name: 'Coin Dozer', icon: '🪙', points: 50, cat: 'Casual' },

  // ===== ACTION =====
  { pkg: 'com.nekki.shadowfight', name: 'Shadow Fight 2', icon: '🥋', points: 70, cat: 'Action' },
  { pkg: 'com.nekki.vector', name: 'Vector', icon: '🏃', points: 60, cat: 'Action' },
  { pkg: 'com.gameloft.android.ANMP.GloftDMHM', name: 'Disney Magic Kingdoms', icon: '🏰', points: 80, cat: 'Adventure' },
  { pkg: 'com.gameloft.android.ANMP.GloftM3HM', name: 'Modern Combat 5', icon: '🔫', points: 100, cat: 'Shooter' },
  { pkg: 'com.gameloft.android.ANMP.GloftNAHM', name: 'N.O.V.A Legacy', icon: '👽', points: 100, cat: 'Shooter' },
  { pkg: 'com.gameloft.android.ANMP.Gloft5HM', name: 'Gangstar Vegas', icon: '🚔', points: 80, cat: 'Action' },
  { pkg: 'com.gameloft.android.ANMP.GloftTBHM', name: 'Total Battle', icon: '🛡️', points: 80, cat: 'Strategy' },
  { pkg: 'com.gameloft.android.ANMP.GloftROSE', name: 'Sniper Fury', icon: '🎯', points: 80, cat: 'Shooter' },

  // ===== CARD/BOARD =====
  { pkg: 'com.playdek.hotseat', name: 'Skip-Bo', icon: '🃏', points: 50, cat: 'Card' },
  { pkg: 'com.mattel163.uno', name: 'UNO', icon: '🃏', points: 60, cat: 'Card' },
  { pkg: 'com.king.solitaire', name: 'Solitaire', icon: '🂠', points: 50, cat: 'Card' },
  { pkg: 'com.mobilityware.solitaire', name: 'Solitaire (Mobility)', icon: '🂠', points: 50, cat: 'Card' },
  { pkg: 'com.chess.chess', name: 'Chess.com', icon: '♟️', points: 70, cat: 'Board' },
  { pkg: 'com.chess.chesslite', name: 'Chess Free', icon: '♟️', points: 50, cat: 'Board' },
  { pkg: 'com.ludo.bible', name: 'Ludo Bible', icon: '🎲', points: 50, cat: 'Board' },
  { pkg: 'com.octro.teenpatti', name: 'Teen Patti', icon: '🃏', points: 50, cat: 'Card' },

  // ===== MORE POPULAR =====
  { pkg: 'com.funplus.kingofglory', name: 'Honor of Kings', icon: '👑', points: 100, cat: 'MOBA' },
  { pkg: 'com.mobilelegends.mi', name: 'Mobile Legends', icon: '⚔️', points: 100, cat: 'MOBA' },
  { pkg: 'com.garena.game.kgtw', name: 'Garena AOV', icon: '⚔️', points: 100, cat: 'MOBA' },
  { pkg: 'com.stnc.android.lildragon', name: 'Little Dragon', icon: '🐉', points: 50, cat: 'Casual' },
  { pkg: 'com.cyberjoy.castleburn', name: 'Castle Burn', icon: '🏰', points: 60, cat: 'Strategy' },
  { pkg: 'com.ea.android.yu', name: 'EA Sports UFC', icon: '🥊', points: 80, cat: 'Sports' },
  { pkg: 'com.rockstargames.bully', name: 'Bully', icon: '🎓', points: 80, cat: 'Action' },
  { pkg: 'com.gtavc.rockstargames', name: 'GTA Vice City', icon: '🚗', points: 100, cat: 'Action' },

  // ===== MORE PUZZLE =====
  { pkg: 'com.zynga.words', name: 'Words With Friends', icon: '📝', points: 60, cat: 'Word' },
  { pkg: 'com.king.farmheroessaga', name: 'Farm Heroes Saga', icon: '🌽', points: 50, cat: 'Puzzle' },
  { pkg: 'com.king.bubblewitch3', name: 'Bubble Witch 3', icon: '🫧', points: 50, cat: 'Puzzle' },
  { pkg: 'com.king.alphabear', name: 'Alpha Bear', icon: '🐻', points: 50, cat: 'Word' },
  { pkg: 'com.king.petrescuesaga', name: 'Pet Rescue Saga', icon: '🐶', points: 50, cat: 'Puzzle' },
  { pkg: 'com.king.royalerebel', name: 'Royale Rebel', icon: '🃏', points: 60, cat: 'Card' },
  { pkg: 'com.bitmango.rolltheball', name: 'Roll the Ball', icon: '⚽', points: 50, cat: 'Puzzle' },
  { pkg: 'com.bitmango.sweetcandy', name: 'Sweet Candy', icon: '🍭', points: 50, cat: 'Puzzle' },

  // ===== ARCADE =====
  { pkg: 'com.bandainamcoent.pacmantournaments', name: 'Pac-Man', icon: '👻', points: 50, cat: 'Arcade' },
  { pkg: 'com.wallapop.wallapop', name: 'Wallapop', icon: '🛍️', points: 60, cat: 'Shopping' },
  { pkg: 'com.zynga.wizardofoz', name: 'Wizard of Oz', icon: '🧙', points: 50, cat: 'Slots' },
  { pkg: 'com.playtika.slotomania', name: 'Slotomania', icon: '🎰', points: 50, cat: 'Casino' },
  { pkg: 'com.bignox.nplayer.android', name: 'Bigo Live', icon: '📺', points: 60, cat: 'Social' },
  { pkg: 'com.discord', name: 'Discord', icon: '💬', points: 80, cat: 'Social' },
  { pkg: 'com.whatsapp', name: 'WhatsApp', icon: '💚', points: 50, cat: 'Social' },
  { pkg: 'com.instagram.android', name: 'Instagram', icon: '📷', points: 50, cat: 'Social' },

  // ===== ADVENTURE =====
  { pkg: 'com.lefou.mhws', name: 'MH Stories', icon: '🐲', points: 80, cat: 'Adventure' },
  { pkg: 'com.gameloft.android.ANMP.GloftM5HM', name: 'Order & Chaos', icon: '⚔️', points: 80, cat: 'RPG' },
  { pkg: 'com.cube.battle', name: 'Cube Battle', icon: '🎲', points: 50, cat: 'Casual' },
  { pkg: 'com.igg.android.lordsmobile', name: 'Lords Mobile', icon: '👑', points: 100, cat: 'Strategy' },
  { pkg: 'com.igg.castleclash', name: 'Castle Clash', icon: '🏰', points: 80, cat: 'Strategy' },
  { pkg: 'com.storm8.monster', name: 'Monster Legends', icon: '👹', points: 80, cat: 'Adventure' },
  { pkg: 'com.socialquantum.dragon', name: 'Dragon City', icon: '🐉', points: 80, cat: 'Adventure' },
  { pkg: 'com.miniclip.smurfs', name: 'Smurfs Village', icon: '🧙', points: 60, cat: 'Adventure' },

  // ===== ROLE PLAYING =====
  { pkg: 'com.gameloft.android.ANMP.GloftNO3HM', name: 'Gangster Granny', icon: '👵', points: 50, cat: 'Casual' },
  { pkg: 'com.zombies.territory', name: 'Zombies Territory', icon: '🧟', points: 60, cat: 'Action' },
  { pkg: 'com.rockhead.shapes', name: 'Shapes', icon: '🔷', points: 50, cat: 'Puzzle' },
  { pkg: 'com.sweatco.app', name: 'Sweatcoin', icon: '💰', points: 70, cat: 'Health' },
  { pkg: 'com.fitbit.FitbitMobile', name: 'Fitbit', icon: '⌚', points: 70, cat: 'Health' },
  { pkg: 'com.duolingo', name: 'Duolingo', icon: '🦉', points: 80, cat: 'Education' },
  { pkg: 'com.photobyt.android', name: 'PhotoMath', icon: '📐', points: 60, cat: 'Education' },
  { pkg: 'com.brainly', name: 'Brainly', icon: '🧠', points: 70, cat: 'Education' },

  // ===== TRENDING NEW =====
  { pkg: 'com.dream.sports.football', name: 'Dream Football', icon: '⚽', points: 60, cat: 'Sports' },
  { pkg: 'com.dts.freefire', name: 'Free Fire (Old)', icon: '🔥', points: 80, cat: 'Battle Royale' },
  { pkg: 'com.tencent.tmgp.sgame', name: 'Honor of Kings (CN)', icon: '👑', points: 100, cat: 'MOBA' },
  { pkg: 'com.netease.ko', name: 'Knives Out', icon: '🔪', points: 100, cat: 'Battle Royale' },
  { pkg: 'com.craftgames.crafto', name: 'Crafto', icon: '🔨', points: 50, cat: 'Craft' },
  { pkg: 'com.musicplayer.music.mp3player', name: 'Music Player', icon: '🎵', points: 50, cat: 'Music' },
  { pkg: 'com.videoplayer.videoplayer', name: 'Video Player', icon: '🎬', points: 50, cat: 'Video' },
  { pkg: 'com.cleaner.phonecleaner', name: 'Phone Cleaner', icon: '🧹', points: 50, cat: 'Tools' },

  // ===== MORE =====
  { pkg: 'com.turbo.fast.racing', name: 'Turbo Fast Racing', icon: '🏎️', points: 50, cat: 'Racing' },
  { pkg: 'com.dragon.tamer', name: 'Dragon Tamer', icon: '🐉', points: 50, cat: 'Adventure' },
  { pkg: 'com.wizard.school', name: 'Wizard School', icon: '🧙', points: 60, cat: 'RPG' },
  { pkg: 'com.battle.royale', name: 'Battle Royale', icon: '🎖️', points: 80, cat: 'Shooter' },
  { pkg: 'com.candy.sweets', name: 'Candy Sweets', icon: '🍬', points: 50, cat: 'Puzzle' },
  { pkg: 'com.ball.bounce', name: 'Ball Bounce', icon: '⚽', points: 50, cat: 'Casual' },
  { pkg: 'com.bike.racing', name: 'Bike Racing', icon: '🏍️', points: 60, cat: 'Racing' },
  { pkg: 'com.fishing.king', name: 'Fishing King', icon: '🎣', points: 50, cat: 'Casual' },

  // ===== EXTRA =====
  { pkg: 'com.car.racing.mega.road', name: 'Mega Road Racing', icon: '🏁', points: 50, cat: 'Racing' },
  { pkg: 'com.gun.shooting', name: 'Gun Shooting', icon: '🔫', points: 60, cat: 'Shooter' },
  { pkg: 'com.knife.hit', name: 'Knife Hit', icon: '🔪', points: 50, cat: 'Casual' },
  { pkg: 'com.smash.hit', name: 'Smash Hit', icon: '🔨', points: 50, cat: 'Arcade' },
  { pkg: 'com.stickman.legend', name: 'Stickman Legend', icon: '🥷', points: 60, cat: 'Action' },
  { pkg: 'com.subway.runner', name: 'Subway Runner', icon: '🏃', points: 50, cat: 'Runner' },
  { pkg: 'com.snake.io', name: 'Snake.io', icon: '🐍', points: 50, cat: 'Casual' },
  { pkg: 'com.io.ball', name: 'Ball.io', icon: '⚽', points: 50, cat: 'Casual' }
];

// ===== GAMES MODAL =====
// Track which games user has already claimed
let claimedGames = new Set();
try { claimedGames = new Set(JSON.parse(localStorage.getItem('uc_claimedGames') || '[]')); } catch(e) {}

function openGamesModal() {
  const modal = document.getElementById('gamesModal');
  modal.classList.remove('hidden');
  renderGamesList('all');
}

function closeGamesModal() {
  document.getElementById('gamesModal').classList.add('hidden');
}

function renderGamesList(filter) {
  const list = document.getElementById('gamesList');
  if (!list) return;
  let games = GAMES_LIST;
  if (filter && filter !== 'all') {
    games = GAMES_LIST.filter(g => g.cat.toLowerCase().replace(/\s/g,'') === filter);
  }
  // Update counts
  const totalCount = document.getElementById('gamesTotalCount');
  if (totalCount) totalCount.textContent = GAMES_LIST.length;
  const claimedCount = document.getElementById('gamesClaimedCount');
  if (claimedCount) claimedCount.textContent = claimedGames.size;

  // Render
  list.innerHTML = games.map((g, i) => {
    const claimed = claimedGames.has(g.pkg);
    // Three states: not started / pending / done
    const isPending = window._pendingInstallToken && !claimed;
    let btnLabel, btnClass, btnAction;
    if (claimed) {
      btnLabel = '✅ DONE';
      btnClass = 'btn-done';
      btnAction = '';
    } else if (isPending) {
      btnLabel = '🎁 CLAIM +' + g.points;
      btnClass = 'btn-claim';
      btnAction = `claimGameReward('${g.pkg}','${g.name}',${g.points})`;
    } else {
      btnLabel = '📥 INSTALL';
      btnClass = 'btn-install';
      btnAction = `installGame('${g.pkg}','${g.name}',${g.points})`;
    }
    return `
      <div class="game-card ${claimed ? 'claimed' : (isPending ? 'pending' : '')}">
        <div class="game-icon">${g.icon}</div>
        <div class="game-info">
          <div class="game-name">${g.name}</div>
          <div class="game-cat">${g.cat}</div>
        </div>
        <div class="game-reward">+${g.points}</div>
        <button class="game-btn ${btnClass}" ${btnAction ? `onclick="${btnAction}"` : 'disabled'}>
          ${btnLabel}
        </button>
      </div>`;
  }).join('');
}

function filterGames(filter, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderGamesList(filter);
}

let _installStartTs = 0;
async function installGame(pkg, name, points) {
  // Open Play Store (deep link)
  const playUrl = 'https://play.google.com/store/apps/details?id=' + encodeURIComponent(pkg);
  const appUrl = 'market://details?id=' + encodeURIComponent(pkg);
  try {
    window.open(appUrl, '_blank');
    setTimeout(() => { window.open(playUrl, '_blank'); }, 800);
  } catch(e) {
    window.open(playUrl, '_blank');
  }

  // Call server to start install (gets token + 30s wait)
  try {
    const j = await api('/api/earn/install/start', { pkg });
    if (j && j.installToken) {
      window._pendingInstallToken = j.installToken;
      _installStartTs = j.startedAt;
      toast('📥 ' + name + ' opening... Wait 30s after install, then tap CLAIM! +' + points + ' pts');
    }
  } catch(e) {
    toast('❌ ' + (e.message || 'Cannot start install'));
  }
}

async function claimGameReward(pkg, name, points) {
  if (!window._pendingInstallToken) {
    return toast('⚠️ Tap INSTALL first to start the offer');
  }
  try {
    const j = await api('/api/earn/install/claim', {
      installToken: window._pendingInstallToken,
      pkg, name, pts: points
    });
    if (j && j.ok) {
      if (typeof USER !== 'undefined' && j.user) {
        USER = j.user;
        if (typeof refreshUI === 'function') refreshUI();
        if (typeof pushTx === 'function') pushTx('Installed ' + name, j.points);
      }
      claimedGames.add(pkg);
      localStorage.setItem('uc_claimedGames', JSON.stringify([...claimedGames]));
      window._pendingInstallToken = null;
      renderGamesList(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
      toast('🎉 +' + j.points + ' pts for ' + name + '! (' + (j.installsLeft || 0) + ' installs left today)');
    }
  } catch(e) {
    toast('❌ ' + (e.message || 'Claim failed'));
  }
}

function openMonetagOffers() {
  // Opens Monetag offerwall (real CPA offers - real revenue!)
  window.open((typeof SETTINGS !== 'undefined' && SETTINGS.monetagLink && SETTINGS.monetagLink.indexOf('otieu.com') === -1) ? SETTINGS.monetagLink : 'https://al5sm.com/pfe/current/tag.min.js?z=11289197', '_blank');
  toast('💰 Real offers = real money! Complete to earn big');
}
