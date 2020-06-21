$(function() {
  (function () { var script = document.createElement('script'); script.src="//cdn.jsdelivr.net/npm/eruda"; document.body.appendChild(script); script.onload = function () { eruda.init() } })();
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
          $('#username').text(res.session.rank + ' ' + res.session.name);
          $('#welcomeMSG').text(res.session.name + ' ' + res.session.rank + '님 반갑습니다.');
        }
      }
    }
  });
  $.ajax({
    url: 'https://mil-all.luftaquila.io/api/groupdata',
    type: 'POST',
    success: function(res) {
      $('#groupcode').text(res[0].code);
      $('#groupname').text(res[0].name);
    }
  });
  membertable = $('#dataTable').DataTable({
    pagingType: "numbers",
    ajax: {
      url: 'https://mil-all.luftaquila.io/api/memberdata',
      type: 'POST',
      dataSrc: ''
    },
    columns: [
      { data: "id" },
      { data: "rank" },
      { data: "name" },
      { data: "role" }
    ]
  });
}
function eventListener() {
  $('.nav-item').click(function() {
    $('.nav-item').removeClass('active');
    $(this).addClass('active');
    $('.container-fluid').css('display', 'none');
    $('.container-fluid#' + $(this).attr('id') + 'Content').css('display', 'block');
  });
  $('#dataTable tbody').on('click', 'tr', function () {
    let data = membertable.row( this ).data();
  });
  
}