(function () {
    'use strict';
    var console = window.console;
    var $ = window.$; // nano.js
    var firebase = null; // = window.firebase; -- replaced when firebase app is loaded
    var Fingerprint2 = null; // = window.Fingerprint2; -- replaced when Fingerprint2 is async loaded
    var DEBUG = window.DEBUG;
    var LOCAL_PLAYER_DEFAULT_ID = 'LOCAL_PLAYER_DEFAULT_ID';
    var AUTO_JOIN_LOCAL_PLAYER = 'AUTO_JOIN_LOCAL_PLAYER';
    var EMPTY_DATA_STRING = '[[],[],[],[],[],0]';

    var methods = window.methods = window.methods || {};
    var uxState = window.uxState = window.uxState || {};
    var network = methods.network = methods.network || {};
    var UX = methods.UX = methods.UX || {};
    var DB = methods.DB = methods.DB || {};

    uxState.currentTerrain = 'forest';
    uxState.currentPlayBoard = 'A';
    uxState.gameBoardStarted = false;
    uxState.showAboutPanel = false;

    uxState.players = { byNumber: {}, byId: {}, byName: {} }
    uxState.lastOpponentNumber = 0;

    uxState.gameState = {
        playerState: {}
        /*
        boardType: 'A',
        gameId: 'wootang',
        players: {
            'Courtney': {
                river: [ [4, 3], [5, 3], [6, 3], [6, 4], [6, 5], [9, 8] ],
                town: [ [2, 6], [3, 6], [3, 7], [3, 8] ],
                field: [ [9, 11], [10, 11], [11, 11] ],
                forest: [ [10, 5], [10, 6], [10, 7], [11, 7] ],
                monster: []
            },
            'Ryan': {
                river: [ [10, 5], [10, 6], [10, 7], [11, 7] ],
                town: [ [9, 11], [10, 11], [11, 11] ],
                field: [ [4, 3], [5, 3], [6, 3], [6, 4], [6, 5], [9, 8] ],
                forest: [ [2, 6], [3, 6], [3, 7], [3, 8] ],
                monster: []
            }
        }
        */
    };

    var FB = null;

    var networkInit = function () {
        if (FB) return; // Already initialized

        var firebaseConfig = {
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
            databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
            appId: import.meta.env.VITE_FIREBASE_APP_ID
        };

        firebase.initializeApp(firebaseConfig);
        FB = firebase.database();
        network.cleanOutOldGames();
    };

    network.reconcileSelfWithDataUpdate = (function () {
        return function (playerFromDB) {
            console.log('RECONCILE SELF -- GOT DATA FROM API!', playerFromDB);
            if (network.doesBoardHaveData(playerFromDB.data)) {
                var player = uxState.players.byId[playerFromDB.id];
                if (player) {
                    player.data = UX.composeDataToUX(playerFromDB.data);
                    uxState.gameState.playerState[player.id] = player.data;
                    UX.updateAllBoards(player);
                }
            }
        };
    })();

    network.composeUXToData = function (ux) {
        var data = [];
        data.push(ux.field || []);
        data.push(ux.forest || []);
        data.push(ux.monster || []);
        data.push(ux.river || []);
        data.push(ux.town || []);
        data.push(ux.score || 0);
        return JSON.stringify(data);
    };

    network.sendPlayerUpdate = function (playerId) {
        if (FB && DB.playersDB[playerId]) {
            var data = network.composeUXToData(uxState.gameState.playerState[playerId]);
            if (data) {
                DB.playersDB[playerId].update({ data: data });
            }
        }
    };

    network.cleanOutOldGames = function () {
        if (!FB) return;
        var ref = FB.ref('/games/');
        var now = Date.now();
        var cutoff = now - 6 * 60 * 60 * 1000; // SIX HOURS AGO
        var old = ref.orderByChild('timestamp').endAt(cutoff).limitToLast(1);

        old.on('child_added', function (snapshot) {
            console.log('TODO -- cleanOutOldGames', snapshot.val());
        });
    };

    network.deleteGameIfEmpty = (function () {
        var clearParticipantNoise = function (participants) {
            var i = participants.length;
            while (i > 0) {
                i--;
                if (participants[i] === 'dummyParticipant' || participants[i] === uxState.localPlayerName) {
                    participants.splice(i, 1);
                }
            }
            return participants;
        };

        return function (gameId) {
            if (!FB) return;
            FB.ref('games/' + gameId).once('value', function (snapshot) {
                var game = snapshot.val();
                if (game && game.participants) {
                    var realParticipants = clearParticipantNoise(Object.keys(game.participants));
                    if (realParticipants.length) {
                        return;
                    }
                }
                var gameToDelete = FB.ref('games/' + gameId);
                gameToDelete.remove();
            });
        };
    })();

    network.exitGame = function () {
        if (!FB) return;
        var localPlayerData = uxState.players.byNumber[0] || {
            id: uxState.lcoalPlayerId,
            name: uxState.lcoalPlayerName,
            data: null
        };
        var gameToExit = uxState.priorGame =
            uxState.pendingGame || uxState.gameState.gameId;

        uxState.pendingGame = '';
        uxState.gameState.id = '';
        uxState.gameState.playerState = {};
        uxState.gameState.playerState[localPlayerData.id] = localPlayerData.data;

        uxState.players.byNumber = { '0': localPlayerData };
        uxState.players.byId = {};
        uxState.players.byName = {};
        uxState.players.byId[localPlayerData.id] = localPlayerData;
        uxState.players.byName[localPlayerData.name] = localPlayerData;

        DB.clearAll();

        var cancelParticipant = FB.ref('games/' + gameToExit + '/participants/' + uxState.localPlayerName);
        cancelParticipant.remove();
        var cancelJoiner = FB.ref('games/' + gameToExit + '/joiners/' + uxState.localPlayerName);
        cancelJoiner.remove();

        network.deleteGameIfEmpty(gameToExit);
    };

    network.cancelPendingJoin = function () {
        network.exitGame();
    };

    var onPlayerData = function (sourcePlayerId) {
        DB.playerListeners[sourcePlayerId] = function (playerSnapshot) {
            var player = playerSnapshot.val();
            if (!player) return;
            if (player.id === uxState.localPlayerId) {
                return network.reconcileSelfWithDataUpdate(player);
            }
            if (!uxState.players.byId[player.id]) {
                UX.addPlayer(player);
            } else {
                UX.updateOpponentDataToUX(player);
                player.localNumber = uxState.players.byId[player.id].localNumber;
                player.galleryBoardId = uxState.players.byId[player.id].galleryBoardId;
                player.featuredBoardId = uxState.players.byId[player.id].featuredBoardId;
                player.mainBoardId = uxState.players.byId[player.id].mainBoardId;

                uxState.players.byNumber[player.localNumber] = player;
                uxState.players.byId[player.id] = player;
                uxState.players.byName[player.name] = player;
                UX.updateAllBoards(player);
            }
        };
        return DB.playerListeners[sourcePlayerId]
    };

    network.addPlayerTracker = function (playerId) {
        if (!playerId || !FB) { return; }
        if (!DB.playersDB[playerId]) {
            DB.playersDB[playerId] = FB.ref('players/' + playerId);
            DB.playersDB[playerId].on('value', onPlayerData(playerId));
        }
    };

    network.removePlayerTracker = function (playerId) {
        if (DB.playersDB[playerId]) {
            DB.playersDB[playerId].off('value', DB.playerListeners[playerId]);
            delete DB.playersDB[playerId];
            delete DB.playerListeners[playerId];
        }
    };

    network.approveJoiner = function (playerName, option) {
        if (!FB) return;
        DB.joinersDB.once('value', function (joinerSnapshot) {
            var joiners = joinerSnapshot.val();
            var playerId = option === AUTO_JOIN_LOCAL_PLAYER
                ? uxState.localPlayerId
                : joiners[playerName];

            if (playerId) {
                delete joiners[playerName];
                DB.joinersDB.set(joiners);
                var participantsUpdate = {};
                participantsUpdate[playerName] = playerId;
                DB.participantsDB.update(participantsUpdate);
            }
        });
    };

    network.checkGameId = function (gameId) {
        return new window.Promise(function (resolve) {
            if (!FB) {
                console.warn('Firebase not ready');
                resolve(null);
                return;
            }
            var gameData = FB.ref('games/' + gameId);
            gameData.once('value').then(function (snapshot) {
                resolve(snapshot.val());
            });
        });
    }

    network.doesBoardHaveData = function (dataOrString) {
        if (!dataOrString) {
            return false;
        }
        var i;
        var data = typeof dataOrString === 'string' ? JSON.parse(dataOrString) : dataOrString;
        for (i = 0; i < 4; i++) {
            if (data[i] && data[i].length) {
                return true;
            }
        }
        return false;
    }

    network.initializeSelf = function () {
        if (!FB) return;
        var selfId = uxState.localPlayerId;
        var selfName = uxState.localPlayerName;

        FB.ref('players/' + selfId).once('value', function (snapshot) {
            var update = {
                id: selfId,
                name: selfName,
            };
            var allPlayersUpdate = {};
            allPlayersUpdate[uxState.localPlayerId] = update;
            var localBoardData = network.composeUXToData(
                UX.collectDataFromDOM('self-main-board', 'requestReturn')
            );

            if (network.doesBoardHaveData(localBoardData)) {
                update.data = localBoardData;
            } else {
                var playerFromDB = snapshot.val();
                if (playerFromDB && playerFromDB.data && network.doesBoardHaveData(playerFromDB.data)) {
                    update.data = playerFromDB.data;
                }
            }

            var allPlayers = FB.ref('players')
            allPlayers.update(allPlayersUpdate);
            network.addPlayerTracker(selfId);
            update.data = UX.composeDataToUX(update.data);
            UX.initializeSelf(selfId, update);
        });
    };

    network.trackJoiners = function () {
        if (!DB.joinersDB) return;
        DB.joinersDB.off('value', DB.joinerListener);
        DB.joinersDB.on('value', DB.joinerListener);
    };

    network.reconcileParticipants = function (currentParticipants) {
        var currentPlayerIds = {};
        Object.keys(currentParticipants).forEach(function (participantName) {
            currentPlayerIds[currentParticipants[participantName]] = true;
            if (participantName !== uxState.localPlayerName &&
                participantName !== 'dummyParticipant'
            ) {
                network.addPlayerTracker(currentParticipants[participantName]);
            }
        });

        var isNonParticipant = function (id) {
            return !currentPlayerIds[id];
        }

        Object.keys(DB.playersDB).forEach(function (tracked) {
            if (isNonParticipant(tracked)) {
                network.removePlayerTracker(tracked);
                UX.removeOpponentPlayer(tracked);
                if (tracked === uxState.localPlayerId) {
                    network.exitGame();
                    UX.exitGameUX();
                }
            }
        });
    };

    network.trackGameParticipants = function () {
        if (!DB.participantsDB) return;
        DB.participantsDB.off('value', DB.participantsListener);
        DB.participantsDB.off('value', DB.participantsListenToJoin);
        DB.participantsDB.on('value', DB.participantsListener);
    };

    network.uponJoinApproval = function (currentParticipants) {
        var gameId = uxState.pendingGame;
        uxState.gameState.gameId = gameId;
        uxState.gameState.playerState = {};
        network.reconcileParticipants(currentParticipants);
        network.trackGameParticipants();
        network.initializeSelf();
        network.trackJoiners();
        UX.showActiveGameUX();
    };

    network.requestGameJoin = function (gameData) {
        if (!FB) return;
        UX.reconcileBoardType(gameData);
        DB.clear(DB.gameDB);
        DB.clear(DB.participantsDB);
        DB.clear(DB.joinersDB);

        DB.gameDB = FB.ref('games/' + gameData.id);
        DB.participantsDB = FB.ref('games/' + gameData.id + '/participants');
        DB.joinersDB = FB.ref('games/' + gameData.id + '/joiners');

        DB.participantsDB.on('value', DB.participantsListenToJoin);

        var joinUpdate = {};
        joinUpdate[uxState.localPlayerName] = uxState.localPlayerId;
        DB.joinersDB.update(joinUpdate);
    };

    network.resetMainBoard = function () {
        if (uxState.localPlayerId && FB) {
            var update = {
                id: uxState.localPlayerId,
                name: uxState.localPlayerName,
                data: EMPTY_DATA_STRING
            };
            FB.ref('players/' + uxState.localPlayerId).set(update);
        }
    };

    network.createNewGame = function () {
        if (!FB) return;
        var gameId = uxState.gameState.gameId;
        var update = {};
        update[uxState.gameState.gameId] = {
            boardType: uxState.gameState.boardType,
            id: gameId,
            joiners: {
                dummyJoiner: 'dummyJoinerXXX'
            },
            participants: {
                dummyParticipant: 'dummyParticipantYYY'
            }
        }
        var tempGamesDB = FB.ref('games/');
        tempGamesDB.update(update);

        var tempGameDB = FB.ref('games/' + uxState.gameState.gameId);
        tempGameDB.once('value', function (snapshot) {
            var results = snapshot.val();
            network.requestGameJoin(results);
            setTimeout(function () {
                network.approveJoiner(uxState.localPlayerName, AUTO_JOIN_LOCAL_PLAYER);
            }, 150);
        });
    };

    var loadFile = function (fileName, callback) {

        var fileRequest = document.createElement('script');
        fileRequest.setAttribute('type', 'text/javascript');
        fileRequest.setAttribute('src', fileName);
        fileRequest.setAttribute('async', true);
        if (callback) {
            fileRequest.onload = callback;
        }

        document.getElementsByTagName('head')[0].appendChild(fileRequest);
    };

    var loadScripts = (function () {

        var loadFirebase = function () {

            var firebaseLoaded = function () {
                firebase = window.firebase;

                networkInit();

                setTimeout(function () {
                    // networkUX.runTests();
                    // network.testAcceptJoin();
                }, 500)
            };

            var phase02 = function () {
                loadFile('https://www.gstatic.com/firebasejs/7.14.2/firebase-database.js', firebaseLoaded);
            }

            loadFile('https://www.gstatic.com/firebasejs/7.14.2/firebase-app.js', phase02);

        };

        var getFingerprint = function () {
            Fingerprint2 = window.Fingerprint2;

            if (!Fingerprint2) {
                console.error('Fingerprint2 not loaded');
                loadFirebase();
                return;
            }

            var options = {
                excludes: {
                    userAgent: true,
                    language: true,
                    webdriver: true,
                    colorDepth: true,
                    deviceMemory: true,
                    pixelRatio: true,
                    hardwareConcurrency: true,
                    screenResolution: true,
                    availableScreenResolution: true,
                    timezoneOffset: true,
                    timezone: true,
                    sessionStorage: true,
                    localStorage: true,
                    indexedDb: true,
                    addBehavior: true,
                    openDatabase: true,
                    cpuClass: true,
                    platform: true,
                    doNotTrack: true,
                    webgl: true,
                    webglVendorAndRenderer: true,
                    adBlock: true,
                    hasLiedLanguages: true,
                    hasLiedResolution: true,
                    hasLiedOs: true,
                    hasLiedBrowser: true,
                    touchSupport: true,
                    fonts: true,
                    fontsFlash: true,
                    audio: true,
                    enumerateDevices: true
                }
            };

            var fingerprintResults = function (components) {
                var canvas = null;
                var plugins = null;

                components.forEach(function (component) {
                    if (component.key === 'canvas') { canvas = JSON.stringify(component.value); }
                    if (component.key === 'plugins') { plugins = JSON.stringify(component.value); }
                });
                var fingerprint = canvas + plugins;
                uxState.localPlayerHashId = Fingerprint2.x64hash128(fingerprint, 31)

                console.groupCollapsed('FINGERPRINT');
                console.log(uxState.localPlayerHashId, components);
                console.groupEnd();
            };


            setTimeout(function () {
                Fingerprint2.get(options, fingerprintResults)
            }, 100)

            // Proceed to load Firebase
            loadFirebase();

        };

        return function () {
            // Fingerprint2 is already loaded via import in main.js
            getFingerprint();
        };
    })();


    var mainInit = function () {
        UX.buildMainDom();
        UX.localInit();
        UX.setupBoardA();
        UX.initializeOpponentUX()

        loadScripts();

    };

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', mainInit);
    } else {
        mainInit();
    }

})();
