/**
 * Created by yusuke on 2013/12/20.
 * Modified by rotsuya on 2014/06/07.
 */

// APIキー
var APIKEY = '6165842a-5c0d-11e3-b514-75d3313b9d05';

// Callオブジェクト
var existingCall;

var getListTimer = -1;
var myId = '';

// Compatibility
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

// PeerJSオブジェクトを生成
var peer = new Peer({ key: APIKEY, debug: 3});

// 初期化
$(document).on('ready', function(){

    // 相手に接続
    $('#buttonCall').click(function(){
        var call = peer.call($('#theirIds').val(), window.localStream);
        makeCall(call);
    });

    // 切断
    $('#buttonClose').click(function(){
        existingCall.close();
        showCallUI();
    });

    // メディアストリームを再取得
    $('#buttonLocalAudioRetry').click(function(){
        location.reload();
    });

    // ステップ１実行
    showLocalAudio();

    //ユーザリスト取得開始
    getListTimer = setInterval(getUserList, 2000);
    $(window).on('beforeunload', function() {
        clearInterval(getListTimer);
        peer.destroy();
    });
});

// PeerIDを生成
peer.on('open', function(){
    myId = peer.id;
    $('#myId').val(myId);
});

// 相手からのコールを受信したら自身のメディアストリームをセットして返答
peer.on('call', function(call){
    call.answer(window.localStream);
    makeCall(call);
});

// エラーハンドラー
peer.on('error', function(err){
    alert(err.message);
    showCallUI();
});

function showLocalAudio () {
    // メディアストリームを取得する
    navigator.getUserMedia({audio: true, video: false}, function(stream){
        // ビデオタグのsrc属性に設定する
        window.localStream = stream;
        showCallUI();
    }, function(){
        $('#warnLocalAudio').hide();
        $('#alertLocalAudio').show();
    });
}

function showCallUI () {
    //UIコントロール
    $('body').removeClass('status-getting-local-audio status-calling').addClass('status-waiting-for-call');
}

function makeCall (call) {
    // すでに接続中の場合はクローズする
    if (existingCall) {
        existingCall.close();
    }

    // 相手からのメディアストリームを待ち受ける
    call.on('stream', function(stream){
        $('#theirAudio').attr('src', URL.createObjectURL(stream));
    });

    // 相手がクローズした場合
    call.on('close', showCallUI);

    // Callオブジェクトを保存
    existingCall = call;

    // UIコントロール
    $('#theirId').val(call.peer);
    $('body').removeClass('status-getting-local-audio status-waiting-for-call').addClass('status-calling');
}

function getUserList () {
    //ユーザリストを取得
    $.get('https://skyway.io/active/list/' + APIKEY, function (list) {
        var $theirIds = $('#theirIds');
        for (var i = 0, length = list.length; i < length; i++) {
            var id = list[i];
            if (id === myId) {
                continue;
            }
            if ($theirIds.find('[value=' + id + ']').length === 0) {
                $('<option>').attr('value', id).text(id).appendTo($theirIds);
            }
        }
        $theirIds.find('option').each(function() {
            var $this = $(this);
            if (list.indexOf($this.attr('value')) === -1) {
                $this.remove();
            }
        });
    });
}