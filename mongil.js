// module
var async = {
	series: require('async').series
}
var srlib = require('./srlib');
var setting = require('./setting');

var debug = false;
var std = {
	title: function(message) {
		process.stdout.write('\n'+message+'\n');
	}
};
var rand = function(low, high) {
	return Math.floor(Math.random() * (high - low) + low);
};
var waitForNext = function(time, callback) {
	var inter = time / 10;
	if (inter > 1000) inter = 1000;
	var timer = setInterval(function() {
		process.stdout.write('.');
	}, inter);

	setTimeout(function() {
		process.stdout.write('\n');
		clearInterval(timer);
		callback();
	}, time);
};

gamebox(setting.userid,	setting.cookie);

function gamebox(userid, cookie) {
	var loginInfo = {};
	var gameInfo = {};
	var waitTime = 10 * 60;
	var levelupMode = false;

	var rankList = [];
	var rankInfo = [];


	/* network library
	 -------------------------------------------------------------------------------------------------------------------------- */ 
	var lastPos = '';
	var loginErrorCount = 0;
	function login(opt, callback) {
		std.title('[login]');

		var param = {
			userid: '',
			img_url: 'jIAD+QohLrII5WLVqx/iG1gJVb8ms0ven6O07cLJt3jaFOrOFufikopxQir/LhFAuhcvZHc4j/4yo2fEIlvlTGCsk9jwVf0SQYNGcWB42Sj4W3tec1OdkZdcwEdqE2jkkEzNgcAI/4kmzBLN+uiL/PcUJkuTf7urXqSkZOImdtQv33cnfz3cl6C4ljUJJeplSfCUPxJE1qe8q/TmcLx7b06yYRKd+8NTsuDsvKbRRv3cpBRZ+9Q+KJji5+pQSioP',
			ver: '2.08',
			platform: 'Android',
			cookie: cookie
		};
		for (var k in opt) param[k] = opt[k];
		if (debug) console.log(param);

		srlib.login(param, function(success, retval) {
			if (!success) {
				return gamebox_error('login', retval);
			}
			if (debug) console.log(retval);

			loginInfo = retval;
			console.log('login success.');
			console.log('life:' + loginInfo.detail.life);
			console.log('survival_life:' + loginInfo.detail.survival_life);
			console.log('characters:' + loginInfo.detail.characters.length);
			console.log('sid:' + loginInfo.detail.sid);

			callback();
		});
	};
	function startgame(stage, callback) {
		std.title('[startgame]');

		var param = {
			sid: loginInfo.detail.sid,
			stage: stage,
			cookie: cookie
		};
		if (debug) console.log(param);
		srlib.startgame(param, function(success, retval) {
			if (!success) {
				if (retval.reason == 'startgame-no-life') {
					console.log('[startgame-no-life]');
					console.log('5분후 재시작합니다');
					waitForNext(5 * 60 * 1000, function() {
						dungeon();
					});
				} else {
					gamebox_error('startgame', retval);
				}
				return;
			}
			if (debug) console.log(retval);
			console.log('gamekey:' + retval.detail.gamekey);
			console.log('coin:' + retval.detail.coin);
			console.log('life:' + retval.detail.life);
			console.log('survival_life:' + retval.detail.survival_life);

			gameInfo = retval;
			loginInfo.detail.life = gameInfo.detail.life;
			loginInfo.detail.survival_life = gameInfo.detail.survival_life;

			callback();
		});
	};
	function gameover(opt, callback) {
		std.title('[gameover]');

		var param = {
			sid: loginInfo.detail.sid,
			gamekey: gameInfo.detail.gamekey,
			coin: 0,
			chestopencnt: 0,
			tagcnt: 0
		};
		for (var k in opt) param[k] = opt[k];
		param['cookie'] = cookie;
		if (debug) console.log(param);

		srlib.gameover(param, function(success, retval) {
			if (!success) {
				return gamebox_error('gameover', retval);
			}
			if (debug) console.log(retval);
			console.log('expget:' + retval.detail.expget);
			console.log('addcoin:' + retval.detail.addcoin);
			console.log('updatecharacter=>');
			if (retval.detail.updatecharacter && retval.detail.updatecharacter.length) {
				var levelCount = 0;
				for (var i=0; i<retval.detail.updatecharacter.length; i++) {
					if (retval.detail.updatecharacter[i].lv==30) levelCount++;
					console.log(retval.detail.updatecharacter[i]);
				}
				if (levelCount==3) {
					levelupMode = false;
				} else {
					levelupMode = true;
				}
			}
			
			callback();
		});
	};

	function getdropitem(callback) {
		waitForNext(1000, function() {
			std.title('[getdropitem]');

			var param = {
				sid: loginInfo.detail.sid,
				retry: 0,
				cookie: cookie
			};
			if (debug) console.log(param);
			srlib.getdropitem(param, function(success, retval) {
				if (!success) {
					return gamebox_error('getdropitem', retval);
				}
				if (debug) console.log(retval);
				console.log('item:');
				console.log(retval.detail.item);
				console.log('character:');
				console.log(retval.detail.character);

				callback();
			});
		});
	};
	function getdungeoncleartime(stage, callback) {
		waitForNext(1000, function() {
			std.title('[getdungeoncleartime]');

			var param = {
				sid: loginInfo.detail.sid,
				stage: stage,
				cookie: cookie
			};
			if (debug) console.log(param);
			srlib.getdungeoncleartime(param, function(success, retval) {
				if (!success) {
					return gamebox_error('getdungeoncleartime', retval);
				}
				if (debug) console.log(retval);
				console.log('stage:' + retval.detail.stage);
				//console.log('sec:' + retval.detail.sec);

				callback();
			});
		});
	};
	// pvp
	function getpvprank(callback) {
		waitForNext(1000, function() {
			std.title('[getpvprank]');

			var param = {
				sid: loginInfo.detail.sid,
				cookie: cookie
			};
			if (debug) console.log(param);
			srlib.server('getpvprank', param, function(success, retval) {
				if (!success) {
					return gamebox_error('getpvprank', retval);
				}
				if (debug) console.log(retval);

				rankInfo = retval;
				console.log(rankInfo);

				callback();
			});
		});
	};
	function getpvpranklist(page, callback) {
		waitForNext(1000, function() {
			std.title('[getpvpranklist]');

			var param = {
				sid: loginInfo.detail.sid,
				page: page,
				cookie: cookie
			};
			if (debug) console.log(param);
			srlib.server('getpvpranklist', param, function(success, retval) {
				if (!success) {
					return gamebox_error('getpvpranklist', retval);
				}
				if (debug) console.log(retval);

				rankList = retval.detail.ranklist;

				callback();
			});
		});
	};
	function getpvpranklistaroundme(callback) {
		waitForNext(1000, function() {
			std.title('[getpvpranklistaroundme]');

			var param = {
				sid: loginInfo.detail.sid,
				cookie: cookie
			};
			if (debug) console.log(param);
			srlib.server('getpvpranklistaroundme', param, function(success, retval) {
				if (!success) {
					return gamebox_error('getpvpranklistaroundme', retval);
				}
				if (debug) console.log(retval);

				rankList = retval.detail.ranklist;

				callback();
			});
		});
	};
	function pvpstart(fusn, callback) {
		waitForNext(1000, function() {
			std.title('[pvpstart]');

			var param = {
				sid: loginInfo.detail.sid,
				fusn: fusn,
				cookie: cookie
			};
			if (debug) console.log(param);
			srlib.server('pvpstart', param, function(success, retval) {
				if (!success) {
					return gamebox_error('pvpstart', retval);
				}
				if (debug) console.log(retval);

				console.log('pvp_life:' + retval.detail.pvp_life);

				gameInfo = retval;
				loginInfo.detail.pvp_life = gameInfo.detail.pvp_life;

				callback();
			});
		});
	};
	function pvpend(win, callback) {
		waitForNext(1000, function() {
			std.title('[pvpend]');

			var param = {
				sid: loginInfo.detail.sid,
				gamekey: gameInfo.detail.gamekey,
				win: win,
				cookie: cookie
			};
			if (debug) console.log(param);
			srlib.server('pvpend', param, function(success, retval) {
				if (!success) {
					return gamebox_error('pvpend', retval);
				}
				if (debug) console.log(retval);

				console.log('win:' + retval.detail.win);
				console.log('win_streak:' + retval.detail.win_streak);
				console.log('elo:' + retval.detail.elo);
				console.log('add_rating:' + retval.detail.add_rating);

				callback();
			});
		});
	};
	/*
	// boss
	function bossstart(callback) {
		waitForNext(1000, function() {
			std.title('[bossstart]');

			var param = {
				sid: loginInfo.detail.sid,
				cookie: cookie
			};
			if (debug) console.log(param);
			srlib.server('bossstart', param, function(success, retval) {
				if (!success) {
					return gamebox_error('bossstart', retval);
				}
				if (debug) console.log(retval);

				gameInfo = retval;

				callback();
			});
		});
	};
	function bossend(opt, callback) {
		waitForNext(1000, function() {
			std.title('[bossend]');

			var param = {
				sid: loginInfo.detail.sid,
				gamekey: gameInfo.detail.gamekey,
				chestopencnt: 0,
				tagcnt: 0,
				points: 0,
				cookie: cookie
			};
			for (var k in opt) param[k] = opt[k];
			if (debug) console.log(param);
			srlib.server('bossend', param, function(success, retval) {
				if (!success) {
					return gamebox_error('bossend', retval);
				}
				if (debug) console.log(retval);

				callback();
			});
		});
	};
	*/

	/* method
	 -------------------------------------------------------------------------------------------------------------------------- */ 
	function dungeon() {
		var success = false;
		waitForNext(1000, function() {
			var startTime = +new Date();
			var spendTime = 0;
			var gameTime = 0;
			var curStage = '';

			async.series([
				function(next) {
					//var stage_major = 71;
					//var stage_minor = '0' + rand(1,6);
					//var stage_diff = '0' + rand(2,3);
					var stage_major = '72';
					var stage_minor = '01';
					var stage_diff = '03';
					var stage = stage_major + stage_diff + stage_minor;
					if (levelupMode) {
						stage_major = 6;
						stage_minor = rand(8,12);
						if (stage_minor < 10) stage_minor = '0'+stage_minor;
						stage = stage_major + "01" + stage_minor;
					}
					curStage = stage;
					startgame(stage, next);
				},
				function(next) {
					gameTime = rand(300, 330);
					var delayTime = gameTime;
					//if (gameInfo.detail.life > 0) { //걍 10초
						delayTime = 10;
					//}

					waitTime = 10 * 60 - delayTime;
					console.log(delayTime+'초 소요 (기록은 '+gameTime+'초)');
					waitForNext(delayTime*1000, function() {
						next();
					});
				},
				function(next) {
					var coin = rand(5000, 7000);
					var exp = 0;
					if (levelupMode) {
						coin = rand(999, 1999);
						exp = rand(20000, 35000);
					}
					gameover({
						coin: coin,
						exp: exp,
						cleartime: gameTime,
						autoplay: 1,
					}, next);
				},
				getdropitem,
				function (next) {
					getdungeoncleartime(curStage, next);
				},
				function (next) { 
					var currTime = +new Date();
					spendTime = startTime - currTime;
					success = true;
					console.log('game success'); 
					process.nextTick(function(){
						next();
					});
				}
			], function(err) {
				if (err) {
					throw err;
				}
				gamebox_restart(success, spendTime);
			});
		});
	};

	function survival() {
		var success = false;
		waitForNext(1000, function() {
			var startTime = +new Date();
			var spendTime = 0;
			var gameTime = 0;
			var gameRound = 0;
			
			async.series([
				function(next) {
					startgame('1', next);
				},
				function(next) {
					gameRound = rand(70, 90);
					gameTime = gameRound * 5;
					var delayTime = gameTime;
					if (gameInfo.detail.life > 0) {
						delayTime = 10;
					}

					waitTime = 10 * 60 - delayTime;
					console.log(delayTime+'초 소요 (기록은 '+gameTime+'초)');
					waitForNext(delayTime*1000, function() {
						next();
					});
				},
				function(next) {
					var round = gameRound;
					var coin = round * 50 + rand(100, 300);
					var points = round * 9000 + rand(100, 500);
					gameover({
						coin: coin,
						points: points,
						round: round,
						firstboxround: 0,
						firsttaground: 0
					}, next);
				},
				function (next) { 
					var currTime = +new Date();
					spendTime = startTime - currTime;
					success = true;
					console.log('game success'); 
					process.nextTick(function(){
						next();
					});
				}
			], function(err) {
				if (err) {
					throw err;
				}
				gamebox_restart(success, spendTime);
			});
		});
	};

	function pvpfight() {
		var success = false;
		waitForNext(1000, function() {
			var startTime = +new Date();
			var spendTime = 0;
			
			async.series([
				function(next) {
					if (!rankInfo) {
						getpvprank(next);
					} else {
						process.nextTick(function(){
							next();
						});
					}
				},
				function(next) {
					if (!rankInfo) return;
					var page = parseInt(rankInfo.detail.rank / 50);
					getpvpranklist(page, next);
					//getpvpranklistaroundme(next);
				},
				function(next) {
					if (!rankList.length) return;
					var enermy = rankList[rand(0, rankList.length-1)];
					pvpstart(enermy.usn, next);
				},
				function(next) {
					waitForNext(60*1000, function() {
						next();
					});
				},
				function(next) {
					var round = rand(0,2);
					pvpend(round==0?'1':'0', next);
				},
				function (next) { 
					var currTime = +new Date();
					spendTime = startTime - currTime;
					success = true;
					console.log('game success'); 
					process.nextTick(function(){
						next();
					});
				}
			], function(err) {
				if (err) {
					throw err;
				}
				gamebox_restart(success, spendTime);
			});
		});
	};

	function gamebox_error(pos, err) {
		std.title('['+pos+'-error]');

		if (pos=='login' && pos==lastPos) {
			if (++loginErrorCount==5) {
				console.error('로그인에 문제가 생겼습니다. 확인해주세요.');
				return;
			}
		} else {
			loginErrorCount = 0;
		}

		if (err.reason && err.reason.indexOf('session-expired')!=-1) {
			console.error('세션만료 30분후 처음부터 재시작');
			waitForNext(30 * 60 * 1000, function() {
				gamebox_start();
			});
		} else {
			console.error('알수 없는 오류 30분후 처음부터 재시작');
			console.error('err: '+ err.err);
			console.error('reason: ' + err.reason);
			waitForNext(30 * 60 * 1000, function() {
				gamebox_start();
			});
		}
		lastPos = pos;
	};
	function gamebox_restart(success, spendTime) {
		console.log('[gamebox_restart] success:'+success);

		if (gameInfo && gameInfo.detail) {
			console.log('remain-life:'+gameInfo.detail.life);
		}

		if (!success || !gameInfo) {
			std.title('[실패 10분후 재시작]');
			waitForNext(10 * 60 * 1000 - spendTime, function() {
				dungeon();
			});
			return;
		}

		if (debug) console.log(loginInfo);
		if (loginInfo.detail.life > 0) {
			std.title('[dungeon start]');
			waitForNext(3000, function() {
				dungeon();
			});
		} else if (loginInfo.detail.survival_life > 0) {
			std.title('[survival start]');
			waitForNext(3000, function() {
				survival();
			});
		/*
		} else if (loginInfo.detail.pvp_life > 0) {
			std.title('[pvp start]');
			pvpfight();
		*/
		} else {
			rankInfo = null;

			std.title('[wait-restart]');
			waitForNext(10 * 60 * 1000 - spendTime, function() {
				dungeon();
			});
		}
	};
	function gamebox_start() {
		login({userid: userid}, function() {
			dungeon();
		});
	};

	gamebox_start();
	/*
	var gamebox_start = function () {
		login({userid: userid}, function() {
			pvpfight();
			return;
			async.series([
				function(next) {
					bossstart(next);
				},
				function(next) {
					waitForNext(10000, function() {
						next();
					});
				},
				function (next) { 
					bossend({
						chestopencnt: rand(3,6),
						tagcnt: rand(3,5),
						points: rand(26106,34106),
					}, next);
				}
			], function(err) {
				if (err) {
					throw err;
				}
			});
		});
	};
	*/

	/* 중간시작테스트
	loginInfo = {
		detail: {
			sid: '000136997302541e3c0a16ff9ee2daa7f35eda69fa'
		}
	};
	gameInfo = {
		detail: {
			gamekey: 'game1369973-1408696602093',
			life: 1
		}
	};
	async.series([
		gameover,
		getdropitem,
		getdungeoncleartime,
	], function() {
		console.log('[end]');
	});

	return;
	*/
}
