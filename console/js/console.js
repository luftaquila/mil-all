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
          uid = res.session.uid;
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
      let health = JSON.parse(res[0].health/*.slice(0, -1).substr(1)*/);
      $('#groupcode').text(res[0].code);
      $('#groupname').text(res[0].name);
      $('#notice').val(res[0].notice);
      $("#diet").val(res[0].diet);
      if($('#diet').val()) $('#diet').trigger('change');
      firstCall = false;
      if(health) {
        $('input#3km_min').val(Math.floor(health['3km'] / 60));
        $('input#3km_sec').val(health['3km'] % 60);
        $('input#pullup').val(health.pullup);
        $('input#pushup').val(health.pushup);
        $('input#bench').val(health.bench);
        $('input#lift').val(health.lift);
        $('input#squat').val(health.squat);
      }
      $.ajax({
        url: 'https://luftaquila.io/api/proxy?url=' + encodeURIComponent('http://openapi.mnd.go.kr/3935313636323230393330353732313532/json/DS_MND_MILPRSN_PHSTR_OFAPRV/1/5000'),
        dataType: "json",
        success: function(proxy) {
          let target = proxy.DS_MND_MILPRSN_PHSTR_OFAPRV.row.filter(o => ((Number(o.age_lwlmtprcdc) < 22) && (Number(o.age_uprlmtprcdc) >= 22)));
          for (let category of ctg) {
            for (let item of target) {
              if (item.kind == category.ctg) {
                if (item.grd == "특급(합격)") category.max = item.std_lwlmtprcdc;
                else if (item.grd == "불합격") {
                  if (category.ctg == "3Km달리기") category.min = item.std_lwlmtprcdc;
                  else category.min = item.std_uprlmtprcdc;
                }
              }
            }
          }
          groupgoal = healthPercentTranslator(JSON.parse(res[0].health), ctg);
        }
      });
    }
  });
  membertable = $('#dataTable').DataTable({
    pagingType: "numbers",
    ajax: {
      url: 'https://mil-all.luftaquila.io/api/memberdata',
      type: 'POST',
      dataSrc: ''
    },
    initComplete: function(set, res) { memberData = res; },
    columns: [
      { data: "id" },
      { data: "rank" },
      { data: "name" },
      { data: "role" }
    ]
  });
  board = $('#boardtable').DataTable({
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
  $.ajax({
    url: 'https://mil-all.luftaquila.io/res/diet.json',
    type: 'GET',
    dataType: 'json',
    success: function(res) {
      let html = '<option disabled selected value> 급양대를 선택하세요 </option>';
      for(let unit of res.data) {
        html += "<option value='" + unit.unit + "'>" + (!isNaN(unit.unit) ? unit.unit + '부대' : '육군훈련소') + "</option>";
      }
      $('#diet').html(html).change(function() {
        let item = $(this).val();
        $('#morning, #lunch, #dinner').text('로딩 중...');
        $.ajax({
          url: 'https://luftaquila.io/api/proxy?url=' + encodeURIComponent('http://openapi.mnd.go.kr/3935313636323230393330353732313532/json/DS_TB_MNDT_DATEBYMLSVC_' + item + '/1/5000'),
          dataType: 'json',
          success: function(data) {
            let flag = false;
            let menu = {
              brst: "",
              lunc: "",
              dinr: ""
            }
            for(let obj of data['DS_TB_MNDT_DATEBYMLSVC_' + item].row) {
              if(obj.dates == new Date().format('yyyymmdd')) {
                flag = true;
                menu.brst += obj.brst + ' ';
                menu.lunc += obj.lunc + ' ' + obj.adspcfd + ' ';
                menu.dinr += obj.dinr + ' ';
                
                continue;
              }
              else if(flag && !obj.dates) {
                menu.brst += obj.brst + ' ';
                menu.lunc += obj.lunc + ' ' + obj.adspcfd + ' ';
                menu.dinr += obj.dinr + ' ';
                continue;
              }
              else if(flag && obj.dates) break;
            }
            $('#morning').text(menu.brst);
            $('#lunch').text(menu.lunc);
            $('#dinner').text(menu.dinr);
          }
        });
      });
    }
  });
  $.ajax({
    url: 'https://mil-all.luftaquila.io/res/plague.json',
    dataType: "json",
    success: function(res) {
      let result = res.DATA.map(o => o.sicknsnm), datasets = [];
      let plagues = Array.from(new Set(result));
      for(const [i, plague] of plagues.entries()) {
        let target = res.DATA.filter(o => o.sicknsnm == plague), data = [];
        for(let obj of target) data.push({ t: new Date(obj.years + '/' + (obj.qtrdvs * 3)), y: Number(obj.prsts) });
        datasets.push({
          label: plague,
          backgroundColor: getColor(1 / plagues.length * i, 0.2),
          borderColor: getColor(1 / plagues.length * i, 0.8),
 					fill: false,
          data: data
        });
      }
      let chart = new Chart(document.getElementById("medicalChart"), {
        type: 'line',
        data: {
          datasets: datasets
        },
        options: {
          maintainAspectRatio: false,
          //responsive: false,
          legend: {
            position: 'top'
          },
          scales: {
            xAxes: [{
              type: 'time',
              time: {
                unit: 'quarter',
                displayFormats: {
                  quarter: 'YYYY MMM'
                }
              },
              ticks: {
                min: 0
              }
            }],
            yAxes: [{
              ticks: {
                min: 0
              }
            }],
          }
        },
        plugins: [{
          beforeInit: function(chart, options) {
            chart.legend.afterFit = function() {
              this.height = this.height + 30;
            };
          }
        }]
      });
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
  $('#dataTable tbody').on('click', 'tr', function () {
    let data = membertable.row( this ).data();
    $('#memberDetail-title').text(data.rank + ' ' + data.name + ' 님');
    $('#memberDetail-id').text(data.id);
    $('#memberDetail-group').text(data.group);
    $('#memberDetail-age').text(data.age + '세');
    $('#memberDetail-role').val(data.role);
    if(uid == data.id) $('#memberDetail-role').attr('disabled', true);
    else $('#memberDetail-role').attr('disabled', false);
    $('#memberDetail-sex').text(data.sex == 'M' ? '남성' : '여성');
    
    let health = JSON.parse(data.health);
    let maxRecord = {
      '3km': Math.min.apply(Math, health.map(function(o) { return o['3km']; })),
      pullup: Math.max.apply(Math, health.map(function(o) { return o.pullup; })),
      pushup: Math.max.apply(Math, health.map(function(o) { return o.pushup; })),
      bench: Math.max.apply(Math, health.map(function(o) { return o.bench; })),
      lift: Math.max.apply(Math, health.map(function(o) { return o.lift; })),
      squat: Math.max.apply(Math, health.map(function(o) { return o.squat; }))
    }
    let memberHealth = healthPercentTranslator(maxRecord, ctg);
    let chart = new Chart(document.getElementById("healthChart"), {
      type: 'radar',
      data: {
        labels: ["3km 달리기", "윗몸일으키기", "벤치프레스", "스쿼트", "데드리프트", "팔굽혀펴기"],
        datasets: [{
          label: '그룹 목표',
          data: [groupgoal['3km'], groupgoal.pullup, groupgoal.bench, groupgoal.squat, groupgoal.lift, groupgoal.pushup],
          pointRadius: 0,
          borderJoinStyle: "round",
          backgroundColor: 'rgba(54, 162, 235, 0)',
          borderColor: 'rgb(105,105,105)'
        }, {
          label: '장병 체력검정',
          data: [memberHealth['3km'], memberHealth.pullup, 0, 0, 0, memberHealth.pushup],
          pointRadius: 0,
          borderJoinStyle: "round",
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgb(255, 99, 132)'
        }, {
          label: '3대 웨이트',
          data: [0, memberHealth.pullup, memberHealth.bench, memberHealth.squat, memberHealth.lift, memberHealth.pushup],
          pointRadius: 0,
          borderJoinStyle: "round",
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgb(54, 162, 235)'
        }]
      },
      options: {
        maintainAspectRatio: false,
        aspectRatio: 1,
        //responsive: false,
        scale: {
          gridLines: {
            //color: 'rgb(46, 49, 56)'
          },
          pointLabels: {
            fontSize: 15,
            fontStyle: 'bold',
            //fontColor: 'rgb(43, 104, 195)'
          },
          ticks: {
            min: 0,
            max: 100,
            stepSize: 25,
            //backdropColor: 'rgb(29, 32, 39)'
          }
        }
      },
      plugins: [{
        beforeInit: function(chart, options) {
          chart.legend.afterFit = function() {
            this.height = this.height + 30;
          };
        }
      }]
    });
    MicroModal.show('memberDetail');
  });
  $('#settingArea input, #settingArea textarea, #settingArea select').change(function() {
    if(firstCall) return;
    let data = {
      notice: $('#settingArea textarea').val(),
      health: {
        '3km': $('#3km_min').val() * 60 + $('#3km_sec').val() * 1,
        pushup: $('#pushup').val(),
        pullup: $('#pullup').val(),
        bench: $('#bench').val(),
        lift: $('#lift').val(),
        squat: $('#squat').val()
      },
      diet: $('#diet').val()
    }
    data.health = JSON.stringify(data.health);
    $.ajax({
      url: '/api/updateGroupSettings',
      type: 'POST',
      data: data,
      success: function(res) { if(res.result) { if(res.result == 'OK' ) alertify.success('설정이 변경되었습니다.'); } }
    });
  });
  $('#memberDetail-role').change(function() {
    $.ajax({
      url: '/api/updateMemberInfo',
      type: 'POST',
      data: { key: 'role', value: $(this).val(), uid: $('#memberDetail-id').text() },
      success: function(res) { if(res.result) { if(res.result == 'OK' ) { alertify.success('직책이 변경되었습니다.'); membertable.ajax.reload(); } } }
    });
  });
  $('#boardtable tbody').on('click', 'tr', function () {
    let data = board.row( this ).data();
    $('#read-replies').html('');
    loadArticle(data.count);
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
  let count = $('#count').val();
  $.ajax({
    url: '/api/commitReply',
    type: 'POST',
    data: { reply: $('#reply').val(), count: count },
    success: function(res) {
      if(res.result) {
        if(res.result == 'OK') { $('#reply').val(''); loadArticle(count); }
        else alertify.error(res.result);
      }
    }
  });
}

function loadArticle(count) {
  $.ajax({
    url: '/api/loadArticle',
    type: 'POST',
    data: { count: count },
    success: function(article) {
      if(article.result) {
        if(article.result == 'OK') {
          $('#count').val(count);
          $('#read-subject').text(article.subject);
          $('#read-timestamp').text(new Date(article.timestamp).format('yyyy-mm-dd HH:MM:ss'));
          $('#read-writer').text(article.writer);
          $('#read-content').text(article.content);
          if(article.reply) {
            let reply = JSON.parse(article.reply), html = '';
            for(let obj of reply) {
              html += "<span>&nbsp;&nbsp;↪&nbsp;" + new Date(obj.timestamp).format('yyyy-mm-dd HH:MM:ss') + ' ' + obj.writer + "</span>" +
                '<br><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + obj.content + '</span><br><br>';
            }
            $('#read-replies').html(html);
          }
          MicroModal.show('read');
        }
        else alertify.error(article.result);
      }
    }
  });
}


let firstCall = true;
let memberData = [];

function getColor(value, opacity) {
    //value from 0 to 1
    var hue = (value * 360).toString(10);
    return ["hsla(", hue, ", 100%, 50%, " + opacity + ")"].join("");
}

function healthPercentTranslator(data, ctg) {
  let returnData = {
    '3km': 100 * (data['3km'] - (ctg[0].max.split(':')[0] * 60 + ctg[0].max.split(':')[1] * 1)) / ((ctg[0].min.split(':')[0] * 60 + ctg[0].min.split(':')[1] * 1) - (ctg[0].max.split(':')[0] * 60 + ctg[0].max.split(':')[1] * 1)),
    pushup: 100 * (data.pushup - ctg[1].min) / (ctg[1].max - ctg[1].min),
    pullup: 100 * (data.pullup - ctg[2].min) / (ctg[2].max - ctg[2].min),
    bench: 100 * (data.bench - ctg[3].min) / (ctg[3].max - ctg[3].min),
    lift: 100 * (data.lift - ctg[4].min) / (ctg[4].max - ctg[4].min),
    squat: 100 * (data.squat - ctg[5].min) / (ctg[5].max - ctg[5].min),
  }
  Object.keys(returnData).forEach(function(key) {
    if (key == '3km') returnData[key] = returnData[key] < 0 ? 100 : (returnData[key] > 100 ? 0 : (100 - returnData[key]));
    returnData[key] = returnData[key] < 0 ? 0 : (returnData[key] > 100 ? 100 : returnData[key]);
  });
  return returnData;
}

let groupgoal, ctg = [{
  ctg: "3Km달리기",
  max: 0,
  min: 0
}, {
  ctg: "팔굽혀펴기(2분)",
  max: 0,
  min: 0
}, {
  ctg: "윗몸일으키기(2분)",
  max: 0,
  min: 0
}, {
  ctg: "벤치프레스",
  max: 156,
  min: 58
}, {
  ctg: "데드리프트",
  max: 249,
  min: 67
}, {
  ctg: "스쿼트",
  max: 217,
  min: 54
}];

var dateFormat = function () {
  var	token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
    timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
    timezoneClip = /[^-+\dA-Z]/g,
    pad = function (val, len) {
      val = String(val);
      len = len || 2;
      while (val.length < len) val = "0" + val;
      return val;
    };
  return function (date, mask, utc) {
    var dF = dateFormat;
    if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
      mask = date;
      date = undefined;
    }
    date = date ? new Date(date) : new Date;
    if (isNaN(date)) throw SyntaxError("invalid date");
    mask = String(dF.masks[mask] || mask || dF.masks["default"]);
    if (mask.slice(0, 4) == "UTC:") {
      mask = mask.slice(4);
      utc = true;
    }
    var	_ = utc ? "getUTC" : "get",
      d = date[_ + "Date"](),
      D = date[_ + "Day"](),
      m = date[_ + "Month"](),
      y = date[_ + "FullYear"](),
      H = date[_ + "Hours"](),
      M = date[_ + "Minutes"](),
      s = date[_ + "Seconds"](),
      L = date[_ + "Milliseconds"](),
      o = utc ? 0 : date.getTimezoneOffset(),
      flags = {
        d:    d,
        dd:   pad(d),
        ddd:  dF.i18n.dayNames[D],
        dddd: dF.i18n.dayNames[D + 7],
        m:    m + 1,
        mm:   pad(m + 1),
        mmm:  dF.i18n.monthNames[m],
        mmmm: dF.i18n.monthNames[m + 12],
        yy:   String(y).slice(2),
        yyyy: y,
        h:    H % 12 || 12,
        hh:   pad(H % 12 || 12),
        H:    H,
        HH:   pad(H),
        M:    M,
        MM:   pad(M),
        s:    s,
        ss:   pad(s),
        l:    pad(L, 3),
        L:    pad(L > 99 ? Math.round(L / 10) : L),
        t:    H < 12 ? "a"  : "p",
        tt:   H < 12 ? "am" : "pm",
        T:    H < 12 ? "A"  : "P",
        TT:   H < 12 ? "오전" : "오후",
        Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
        o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
        S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
      };
    return mask.replace(token, function ($0) {
      return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
    });
  };
}();
dateFormat.masks = {"default":"ddd mmm dd yyyy HH:MM:ss"};
dateFormat.i18n = {
  dayNames: [
    "일", "월", "화", "수", "목", "금", "토",
    "일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"
  ],
  monthNames: [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
  ]
};
Date.prototype.format = function (mask, utc) { return dateFormat(this, mask, utc); };

  