$(function() {
  medical();
  $('input[name=term]').change(function() {
    covidStat(Number($(this).val()));
  });
});

// 코로나19 현황
function covidStat(term) {
  $.ajax({
    url: 'https://luftaquila.io/api/proxy?url=' + encodeURIComponent('http://openapi.data.go.kr/openapi/service/rest/Covid19/getCovid19InfStateJson?serviceKey=2O%2BuM6vSRCF6GmbRLmsCMl38w0g%2F40UY5Vtd57XSnbhwJHPuasjf58ZnVHSSPul0o8aixY7Zkvpg42TtOzQqeQ%3D%3D&startCreateDt=20200310/'),
    dataType: 'xml',
    success: function(resp) {
      let tgt = resp.getElementsByTagName('item');
      if(tgt.length < 10) return covidStat(term);
      let covid = [], dcdBfr = 0;
      for(let i = (term ? term : tgt.length - 1); i + 1; i--) {
        let dt = $('stateDt', tgt[i]).text();
        let cnt = $('decideCnt', tgt[i]).text();
        let date = new Date(dt.substr(0, 4), dt.substr(4, 2) - 1, dt.substr(6, 2));
        let diff = cnt - dcdBfr;
        if(i == term || i == (tgt.length - 1)) diff = 0;
        if(diff > 2000 || diff < 0) continue;
        covid.push({ t: date, y: diff });
        dcdBfr = cnt;
      };
      covid[0].y = 0;
      covidChart = new Chart(document.getElementById("covidChart"), {
        type: 'line',
        data: {
          datasets: [{
            label: '일일 신규 확진자',
            backgroundColor: getColor(0.1, 0),
            borderColor: getColor(0.1, 0.8),
            data: covid
          }]
        },
        options: {
          maintainAspectRatio: false,
          scales: {
            xAxes: [{
              type: 'time',
              time: {
                unit: 'day',
                displayFormats: {
                  day: 'YYYY/M/D'
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
            }]
          }
        }
      });   
    }
  });
}

function medical() {
  covidStat(14);

  // 군 병원 정보
  $.ajax({
    url: 'https://luftaquila.io/api/proxy?url=' + encodeURIComponent('http://openapi.mnd.go.kr/3935313636323230393330353732313532/json/DS_WHLNAT_ROKAHSPT_ADDR/1/13/'),
    dataType: 'json',
    success: function(dat) {
      let hosp = JSON.parse(JSON.stringify(dat.DS_WHLNAT_ROKAHSPT_ADDR.row));
      function geo_success(position) {
        let lat = position.coords.latitude;
        let lon = position.coords.longitude;
        for(let i in hosp) hosp[i].dist = calcDist({ lat: hosp[i].ltd, lon: hosp[i].lngt }, { lat: lat, lon: lon });
        hosp.sort((a, b) => parseFloat(a.dist) - parseFloat(b.dist));
        drawTable(hosp);
      }
      function geo_error(error) {
        $('#locinfo').html('위치 정보 권한이 없습니다.<br>사이트 설정에서 위치 정보를 허용해 주세요.');
        for(let i in hosp) hosp[i].dist = '???';
        drawTable(hosp);
      }
      let geo_options = {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 27000
      };
      function deg2rad(deg) { return deg * (Math.PI / 180); }
      function calcDist(pos1, pos2) {
        let r = 6371; //지구의 반지름(km)
        let dLat = deg2rad(pos2.lat - pos1.lat);
        let dLon = deg2rad(pos2.lon - pos1.lon);
        let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(pos1.lat)) * Math.cos(deg2rad(pos2.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        let d = r * c; // Distance in km
        return Math.round(d * 10) / 10;
      }
      function drawTable(hosp) {
        hospital = $('#hosp').DataTable({
          data: hosp,
          paging: false,
          order: [[ 1, 'asc']],
          columns: [
            { data: "hsptnm", orderable: false },
            { data: "dist", orderable: false },
            { data: "hspt_cntadr", orderable: false },
            { data: "hspt_addr", orderable: false }
          ],
          language: { "search" : "검색 : ", "lengthMenu" : "_MENU_ 개씩 보기", "info" : "_START_ - _END_ (총 _TOTAL_ 개 데이터)", "infoFiltered" : "(전체 _MAX_ 개 데이터 중 검색 결과)", "zeroRecords" : "검색 결과가 없습니다.",  "infoEmpty" : "0개 데이터" }
        });
      }
      
      navigator.geolocation.getCurrentPosition(geo_success, geo_error, geo_options);
    }
  });
  
  // 군 내 전염병 감염 현황
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
function getColor(value, opacity) {
    //value from 0 to 1
    var hue = (value * 360).toString(10);
    return ["hsla(", hue, ", 100%, 50%, " + opacity + ")"].join("");
}

  