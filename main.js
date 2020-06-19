$(function() {
  (function () { var script = document.createElement('script'); script.src="//cdn.jsdelivr.net/npm/eruda"; document.body.appendChild(script); script.onload = function () { eruda.init() } })();
  init();
  eventListener();
});

function init() {
  
}

function login() {
  let id = $('#id').val(), pw = $('#pw').val();
  $.ajax({
    url: 'api/login',
    type: 'POST',
    data: { id: id, pw: pw }, 
    success: function(res) {
      if(res.result) {
        if(res.result == 'OK') location.href = 'mypage';
        else alertify.error(res.result);
      }
    }
  });
}

function register() {
  let isCommander = $('input#isCommander').prop('checked');
  let id = $('#id').val(), rank = $('#rank').val(), name = $('#name').val(), pw = $('#pw').val(), code = $('#code').val();
  $.ajax({
    url: 'api/register',
    type: 'POST',
    data: { isCommander: isCommander, id: id, rank: rank, name: name, pw: pw, code: code },
    success: function(res) {
      if(res.result) {
        if(res.result == 'OK') location.href = 'login.html';
        else alertify.error(res.result);
      }
    }
  });
}

function eventListener() {
  $('input#isCommander').click(function() {
    if($(this).prop('checked')) $('#code').attr('placeholder', '생성할 그룹 이름');
    else $('#code').attr('placeholder', '그룹 코드');
  });
}


