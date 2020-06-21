$(function() {
  health();
});

function health() {
  $.ajax({
    url:'https://luftaquila.io/api/proxy?url=' + encodeURIComponent('http://openapi.mnd.go.kr/3935313636323230393330353732313532/json/DS_MND_MILPRSN_PHSTR_OFAPRV/1/5000'),
    dataType: "json",
    success: function(res) {
      let test = res.DS_MND_MILPRSN_PHSTR_OFAPRV.row;
      let category = ["3km 달리기", "윗몸일으키기", " 벤치프레스", "스쿼트", "데드리프트", "팔굽혀펴기"];
      $.ajax({
        url: '/api/mydata',
        type: 'POST',
        success: function(info) {
          let target = test.filter(o => ((Number(o.age_lwlmtprcdc) < info.age) && (Number(o.age_uprlmtprcdc) > info.age)));
          console.log(target)
          
          let chart = new Chart(document.getElementById("healthChart"), {
            type: 'radar',
            data: {
              labels: category,
              datasets: [{
                data: [94, 72, 0, 0, 0, 21],
                pointRadius: 0,
                borderJoinStyle: "round",
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgb(255, 99, 132)'
              }, {
                data: [0, 72, 44, 25, 83, 21],
                pointRadius: 0,
                borderJoinStyle: "round",
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgb(54, 162, 235)'
              }]
            },
            options: {
              maintainAspectRatio : false,
              responsive: false,
              legend: {
                display: false
              },
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
            }
          });
        }
      });
    }
  });
}4444444