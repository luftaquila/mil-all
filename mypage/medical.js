$(function() {
  medical();
});

function medical() {
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

  