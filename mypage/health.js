$(function() {
  health();
});

function health() {
  $.ajax({
    url: 'https://luftaquila.io/api/proxy?url=' + encodeURIComponent('http://openapi.mnd.go.kr/3935313636323230393330353732313532/json/DS_MND_MILPRSN_PHSTR_OFAPRV/1/5000'),
    dataType: "json",
    success: function(res) {
      let test = res.DS_MND_MILPRSN_PHSTR_OFAPRV.row;
      $.ajax({
        url: '/api/myGroupInfo',
        type: 'POST',
        success: function(groupinfo) {
          groupinfo = groupinfo[0];
          $.ajax({
            url: '/api/mydata',
            type: 'POST',
            success: function(info) {
              info = info[0];
              let health = JSON.parse(info.health) || [], today;
              $('#date').change(function() {
                today = health.findIndex(o => o.date == $('#date').val());
                if (today >= 0) {
                  $('#date').val(health[today].date);
                  $('table input#3km_min').val(Math.floor(health[today]['3km'] / 60));
                  $('table input#3km_sec').val(health[today]['3km'] % 60);
                  $('table input#pullup').val(health[today].pullup);
                  $('table input#pushup').val(health[today].pushup);
                  $('table input#bench').val(health[today].bench);
                  $('table input#lift').val(health[today].lift);
                  $('table input#squat').val(health[today].squat);
                  $('table input#calorie').val(health[today].calorie);
                } else $('table input').val('');
              });
              $('#saverecord').click(function() {
                let data = {
                  date: $('#date').val(),
                  '3km': $('table input#3km_min').val() * 60 + $('table input#3km_sec').val() * 1 || 5999,
                  pullup: Number($('table input#pullup').val()) || 0,
                  pushup: Number($('table input#pushup').val()) || 0,
                  bench: Number($('table input#bench').val()) || 0,
                  lift: Number($('table input#lift').val()) || 0,
                  squat: Number($('table input#squat').val()) || 0,
                  calorie: Number($('table input#calorie').val()) || 0
                }
                today = health.findIndex(o => o.date == $('#date').val());
                if (today >= 0) health[today] = data;
                else health.push(data);
                $.ajax({
                  url: '/api/updateHealth',
                  type: 'POST',
                  data: {
                    data: JSON.stringify(health)
                  },
                  success: function() {
                    alertify.success('저장되었습니다!');
                  }
                });
              });
              $('#date').val(new Date().format('yyyy-mm-dd')).trigger('change');
              let target = test.filter(o => ((Number(o.age_lwlmtprcdc) < info.age) && (Number(o.age_uprlmtprcdc) >= info.age)));
              let maxRecord = {
                '3km': Math.min.apply(Math, health.map(function(o) { return o['3km']; })),
                pullup: Math.max.apply(Math, health.map(function(o) { return o.pullup; })),
                pushup: Math.max.apply(Math, health.map(function(o) { return o.pushup; })),
                bench: Math.max.apply(Math, health.map(function(o) { return o.bench; })),
                lift: Math.max.apply(Math, health.map(function(o) { return o.lift; })),
                squat: Math.max.apply(Math, health.map(function(o) { return o.squat; }))
              }
              let ctg = [{
                ctg: "3Km달리기",
                max: "12:30",
                min: "15:37"
              }, {
                ctg: "팔굽혀펴기(2분)",
                max: 72,
                min: 47
              }, {
                ctg: "윗몸일으키기(2분)",
                max: 86,
                min: 61
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
              let data = healthPercentTranslator(maxRecord, ctg);
              let groupgoal = healthPercentTranslator(JSON.parse(groupinfo.health), ctg);

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
                    data: [data['3km'], data.pullup, 0, 0, 0, data.pushup],
                    pointRadius: 0,
                    borderJoinStyle: "round",
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderColor: 'rgb(255, 99, 132)'
                  }, {
                    label: '3대 웨이트',
                    data: [0, data.pullup, data.bench, data.squat, data.lift, data.pushup],
                    pointRadius: 0,
                    borderJoinStyle: "round",
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgb(54, 162, 235)'
                  }]
                },
                options: {
                  maintainAspectRatio: false,
                  responsive: false,
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
                      this.height = this.height + 10;
                    };
                  }
                }]
              });
            }
          });
        }
      });
    }
  });
}

function healthPercentTranslator(data, ctg) {
  if(!data) return { '3km': 0, pushup: 0, pullup: 0, bench: 0, lift: 0, squat: 0 }
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