$(function() {
  $.ajax({
    url: '/api/loginCheck',
    type: 'POST',
    success: function(res) {
      if(res.result) {
        if(res.result == 'true' && res.detail != 'member') location.href = '/console';
        else if(res.result == 'false') location.href = '/login.html';
        else {
          
        }
      }
    }
  });
  event();
});

function event() {
  $('.hexagon').on('click', function() {
    if($(this).hasClass('clicked')) return;
    $('.hexagon.clicked').css('transform', 'scale(0.6) rotate(30deg)').removeClass('clicked').addClass('notClicked');
    if($(this).hasClass('notClicked')) $(this).css('transform', 'scale( 0.8 ) rotate(30deg)').removeClass('notClicked').addClass('clicked');
    if($(this).attr('id') != 'portrait') location.href = $(this).attr('id') + '.html';
    else location.href = '/mypage';
  });
}