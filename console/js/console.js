$(function() {
  init();
  eventListener();
});

function init() {
  $.ajax({
    url: 'https://mil-all.luftaquila.io/api/loginCheck',
    type: 'POST',
    success: function(res) {
      if(res.result) {
        if(res.result == 'true' && res.detail != 'admin') location.href = '/mypage';
        else if(res.result == 'false') location.href = '/login.html';
        else {
          $('#welcomeMSG').text(res.session.name + ' ' + res.session.rank + '님 반갑습니다.');
        }
      }
    }
  });
}
function eventListener() {
  $('.nav-item').click(function() {
    $('.nav-item').removeClass('active');
    $(this).addClass('active');
    $('.container-fluid').css('display', 'none');
    $('.container-fluid#' + $(this).attr('id') + 'Content').css('display', 'block');
  });
}