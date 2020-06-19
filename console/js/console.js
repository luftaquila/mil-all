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
        console.log(res);
        if(res.result == 'true' && res.detail != 'admin') location.href = '/mypage';
        else if(res.result == 'false') location.href = '/login.html';
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