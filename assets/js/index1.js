var hg = null;

function addClass(element, new_name) {
    if (!element || !new_name) return false;
    if (element.className) {
        var old_class_name = element.className;
        element.className = old_class_name + " " + new_name;
    } else {
        element.className = new_name;
    }
    return true;
}

function removeClass(element, class_name) {
    if (!element || !class_name) return false;
    if (!element.className) return false;
    var all_names = element.className.split(" ");
    for (var i = 0; i < all_names.length; i++) {
        if (all_names[i] === class_name) {
            all_names.splice(i, 1);
            element.className = "";
            for (var j = 0; j < all_names.length; j++) {
                element.className += " ";
                element.className += all_names[j];
            }
            return true;
        }
    }
}
var orderId = null;
$(function() {
    document.getElementById("levelSwitchBox").addEventListener("webkitAnimationEnd", function() {
        $("#levelSwitchBox").css("display", "none")
            // $("#levelSwitchBoxMain").attr("src","http://img.cbnic.com/hc_doudou/level_2_main.png?v=1.0.0")
        $("#levelSwitchBox").removeClass("hidden")
    })
    $("#levelSwitchBox").addClass("hidden");
           // 游戏加载失败
           if(!HardestGame||typeof(HardestGame)!="function"){
            console.log("游戏加载失败...")
           wx.miniProgram.navigateBack(); 
        }
    if (!hg) {
        $("#levelSwitchBox").css("display", "block");
        console.log("hg-----创建成功")
        createHg(false)
    }
});

function playAudioInWechat(obj) {
    if (window.WeixinJSBridge) {
        WeixinJSBridge.invoke('getNetworkType', {}, function(e) {
            obj.currentTime = 0;
            obj.play();
        }, false);
    } else {
        document.addEventListener("WeixinJSBridgeReady", function() {
            WeixinJSBridge.invoke('getNetworkType', {}, function(e) {
                obj.currentTime = 0;
                obj.play();
            });
        }, false);
    }
}

function createHg(GAMEMODE) {
    console.log("---------已经进入createHg方法------------",typeof(HardestGame));
    // 游戏加载失败
    if(!HardestGame||typeof(HardestGame)!="function"){
        console.log("游戏加载失败...")
       wx.miniProgram.navigateBack(); 
    }
    //初始化游戏, 两个参数分别表示"游戏所处的canvas画布元素"和"关卡设置, 可以省略(省略后将使用默认设置)"
    hg = new HardestGame($("#gameStage").get(0), GAMEMODE);
    // 玩家所有关卡的用时统计
    playerTime = [];
    // 玩家所有关卡通关结果
    levelResult= [false,false,false];
    //游戏成功过关
    hg.levelSuccessHandle = function() {

            if (hg.level < 4) {
                // 记录玩家每局用时
                let levelIndex;
                if (hg.level - 2 < 0) {
                    levelIndex = 0
                } else {
                    levelIndex = hg.level - 2;
                }
                playerTime[levelIndex] = hg.player_time;
                levelResult[levelIndex] = true;
                console.log("----playerTime---", playerTime);
                console.log("----levelResult---", levelResult);
                playAudioInWechat($("#success_audio").get(0));
                document.getElementById("currentLevel").getElementsByTagName("span")[0].innerHTML = hg.level;
                var time = 2;

                var interval = setInterval(function() {
                    time--;
                    if (time <= 0) {
                        clearInterval(interval);
                        hg.gameContinue(true);
                    }
                }, 1000);
            } else {
                // 挑战成功
                var audio = document.getElementById('back_music');
                // 记录玩家每局用时
                let levelIndex;
                if (hg.level - 2 < 0) {
                    levelIndex = 0
                } else {
                    levelIndex = hg.level - 2;
                }
                playerTime[levelIndex] = hg.player_time;
                levelResult[levelIndex] = true;
                audio.pause();
                playAudioInWechat($("#gameSuccess_audio").get(0));
                $("#levelSwitchBox").show();
                $('#levelSwitchBoxMain').attr("src", 'https://img.jammyfm.com/media/image/songquiz_assets/mxtkgo/game-finish-bg.png');
                // $("#app").addClass("blur")
                $("#gameSuccessBox").css("display", "block");
                wx.miniProgram.getEnv(function(res) {
                    if (res.miniprogram) {
                        // try: 0 试玩失败 1：试玩成功
                        var postMsg = {
                            "gameMode": "try",
                            "result": 1,
                            "levelResult1":levelResult[0],
                            "levelResult2":levelResult[1],
                            "levelResult3":levelResult[2],
                            "time1": playerTime[0],
                            "time2": playerTime[1],
                            "time3": playerTime[2]
                        }
                        wx.miniProgram.postMessage({
                            data: postMsg
                        });

                        // 挑战成功--前往按钮
                        $("#get-challange-btn").on("click", function() {
                                if (window.isH5) {
                                    window.history.go(-1);
                                } else {
                                    wx.miniProgram.navigateBack();
                                }
                            })
                            // 挑战成功--直接购买按钮
                        $("#buy-btn-gray").on("click", function() {
                            if (window.isH5) {
                                window.history.go(-1);
                            } else {
                                $(".toastTips").text("该商品已售空，游戏闯关成功仍可免费获得");
                                $(".toastTips").fadeIn();
                                setTimeout(function(){
                                    $(".toastTips").fadeOut();
                                },2000)
                            }
                        })
                    }

                });


            }
        }
        //游戏失败结束
    hg.gameOverHandle = function() {
            // 记录玩家每局用时
            let levelIndex;
            if (hg.level - 1 < 0) {
                levelIndex = 0
            } else {
                levelIndex = hg.level - 1;
            }
            playerTime[levelIndex] = hg.player_time;
            levelResult[levelIndex] = false;
            clearInterval(timeboxInterval);
            hg = null;
            if (hg) { delete hg; }
            var audio = document.getElementById('back_music');
            audio.pause();
            playAudioInWechat($("#gameFail_audio").get(0));

            $("#gameOverBox").css("display", "block");
            // $("#app").addClass("blur")
            $('#levelSwitchBoxMain').attr("src", 'https://img.jammyfm.com/media/image/songquiz_assets/mxtkgo/game-finish-bg.png');
            $("#levelSwitchBox").show();

            wx.miniProgram.getEnv(function(res) {
                if (res.miniprogram) {
                    // try: 0 试玩失败 1：试玩成功
                    var postMsg = {
                        "gameMode": "try",
                        "levelResult1":levelResult[0],
                        "levelResult2":levelResult[1],
                        "levelResult3":levelResult[2],
                        "result": 0,
                        "time1": playerTime[0],
                        "time2": playerTime[1],
                        "time3": playerTime[2]
                    }
                    wx.miniProgram.postMessage({
                        data: postMsg
                    });

                    // 挑战失败--结束游戏按钮
                    $("#end-game-btn").on("click", function() {
                            if (window.isH5) {
                                window.history.go(-1);
                            } else {
                                wx.miniProgram.navigateBack();
                            }
                        })
                        // 挑战失败--直接购买按钮
                    $("#buy-btn-light").on("click", function() {
                        if (window.isH5) {
                            window.history.go(-1);
                        } else {
                            $(".toastTips").text("该商品已售空，游戏闯关成功仍可免费获得");
                            $(".toastTips").fadeIn();
                            setTimeout(function(){
                                $(".toastTips").fadeOut();
                            },2000)
                        }
                    })
                }
            })


        }
        //初始化游戏
    hg.init();
    hg.canvas.parentNode.style.width = hg.canvas.width + "px";
    hg.canvas.parentNode.style.height = hg.canvas.height + "px";
    //游戏开始
    hg.gameStart();

    return true;
}