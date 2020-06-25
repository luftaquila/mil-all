$(function() {
  communication();
});

function communication() {
  board = $('#board').DataTable({
    pagingType: "numbers",
    ajax: {
      url: 'https://mil-all.luftaquila.io/api/requestBoard',
      type: 'POST',
      dataSrc: ''
    },
    order: [[ 0, 'desc']],
    //initComplete: function(set, res) { memberData = res; },
    columns: [
      { data: "count", orderable: false },
      { data: "subject", orderable: false }
    ]
  });
  $('#board tbody').on('click', 'tr', function () {
    let data = board.row( this ).data();
    location.href = '/mypage/board?' + data.count;
  });
}

function commitArticle() {
  let subject = $('#subject').val();
  let article = $('#article').val();
  let anonymous = $('#anonymous').is(':checked');
  $.ajax({
    url: '/api/commitArticle',
    type: 'POST',
    data: {
      subject: subject,
      article: article,
      anonymous: anonymous
    },
    success: function(res) {
      if(res.result) {
        if(res.result == 'OK') {
          alertify.success('게시물이 등록되었습니다.');
          $('#subject').val('');
          $('#article').val('');
          MicroModal.close('write');
          board.ajax.reload();
        }
        else alertify.error(res.result);
      }
    }
  });
}

function commitReply() {
  let count = location.search.substr(location.search.indexOf("?") + 1);
  $.ajax({
    url: '/api/commitReply',
    type: 'POST',
    data: { reply: $('#reply').val(), count: count },
    success: function(res) {
      if(res.result) {
        if(res.result == 'OK') { $('#reply').val(''); loadArticle(); }
        else alertify.error(res.result);
      }
    }
  });
}

function loadArticle() {
  let count = location.search.substr(location.search.indexOf("?") + 1);
  $.ajax({
    url: '/api/loadArticle',
    type: 'POST',
    data: { count: count },
    success: function(article) {
      if(article.result) {
        if(article.result == 'OK') {
          $('#subject').text(article.subject);
          $('#timestamp').text(new Date(article.timestamp).format('yyyy-mm-dd HH:MM:ss'));
          $('#writer').text(article.writer);
          $('#content').text(article.content);
          if(article.reply) {
            let reply = JSON.parse(article.reply), html = '';
            for(let obj of reply) {
              html += "<span>&nbsp;&nbsp;↪&nbsp;" + new Date(obj.timestamp).format('yyyy-mm-dd HH:MM:ss') + ' ' + obj.writer + "</span>" +
                '<br><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + obj.content + '</span><br><br>';
            }
            $('#replies').html(html);
          }
        }
        else alertify.error(article.result);
      }
    }
  });
}

