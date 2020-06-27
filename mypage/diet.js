$(function() {
  diet();
});

function diet() {
  $('#date').val(new Date().format('yyyy-mm-dd'));
  $.ajax({
    url: '/api/myGroupInfo',
    type: 'POST',
    success: function(groupinfo) {
      group = groupinfo[0];
      $.ajax({
        url: '/api/mydata',
        type: 'POST',
        success: function(info) {
          person = info[0];
          $.ajax({
            url: 'https://luftaquila.io/api/proxy?url=' + encodeURIComponent('http://openapi.mnd.go.kr/3935313636323230393330353732313532/json/DS_TB_MNDT_DATEBYMLSVC_' + group.diet + '/1/5000'),
            type: 'GET',
            dataType: 'json',
            success: function(res) {
              dietMenu = res;
              $('#date').trigger('change');
            }
          });
        }
      });
    }
  });
  $('.dateMover').click(function() {
    let date = new Date($('#date').val());
    if($(this).attr('class').includes('left')) date.setDate(date.getDate() - 1);
    else if($(this).attr('class').includes('right')) date.setDate(date.getDate() + 1);
    $('#date').val(date.format('yyyy-mm-dd')).trigger('change');
  });
  $('#date').change(function() {
    let flag = false;
    let menu = {
      brst: "",
      brst_cal: 0,
      lunc: "",
      lunc_cal: 0,
      dinr: "",
      dinr_cal: 0,
      sum_cal: 0
    }
    $('table span').text('0');
    for(let obj of dietMenu['DS_TB_MNDT_DATEBYMLSVC_' + group.diet].row) {
      if(obj.dates == new Date($('#date').val()).format('yyyymmdd')) {
        flag = true;
        menu.brst += obj.brst.replace(/\(.+\)/g, '') + ' ';
        menu.lunc += obj.lunc.replace(/\(.+\)/g, '') + ' ' + obj.adspcfd.replace(/\(.+\)/g, '') + ' ';
        menu.dinr += obj.dinr.replace(/\(.+\)/g, '') + ' ';
        continue;
      }
      else if(flag && !obj.dates) {
        menu.brst += obj.brst.replace(/\(.+\)/g, '') + ' ';
        menu.lunc += obj.lunc.replace(/\(.+\)/g, '') + ' ' + obj.adspcfd.replace(/\(.+\)/g, '') + ' ';
        menu.dinr += obj.dinr.replace(/\(.+\)/g, '') + ' ';

        if(obj.sum_cal) {
          menu.brst_cal = Number(obj.brst_cal.replace(',', ''));
          menu.lunc_cal = Number(obj.lunc_cal.replace(',', '')) + Number(obj.adspcfd_cal.replace(',', ''));
          menu.dinr_cal = Number(obj.dinr_cal.replace(',', ''));
          menu.sum_cal = Number(obj.sum_cal.replace(',', ''));
        }
        continue;
      }
      else if(flag && obj.dates) break;
    }
    let health = JSON.parse(person.health);
    let target = health.find(o => o.date == new Date($('#date').val()).format('yyyy-mm-dd'));
    if(target) {
      if(target.calorie) $('#add_cal').text(Math.round(target.calorie * 100) / 100);
      let exercise = (target['3km'] ? target['3km'] : 0) / 60 * 14 + ((target.pushup ? target.pushup : 0) + (target.pullup ? target.pullup : 0)) / 3 + (target.bench ? 98 : 0) + (target.lift ? 98 : 0) + (target.squat ? 86 : 0);
      $('#exe_cal').text(Math.round(exercise * 100) / 100);
    }
    $('#feeding').text(isNaN(group.diet) ? '육군훈련소' : group.diet + '부대');
    $('#brst').text(menu.brst);
    $('#lunc').text(menu.lunc);
    $('#dinr').text(menu.dinr);
    $('#brst_cal').text(Math.round(menu.brst_cal * 100) / 100);
    $('#lunc_cal').text(Math.round(menu.lunc_cal * 100) / 100);
    $('#dinr_cal').text(Math.round(menu.dinr_cal * 100) / 100);
    $('#sum_cal').text(Math.round(menu.sum_cal * 100) / 100);
    $('#init_cal').text(Math.round((person.age * 3.87 + 1631.25) * 100) / 100);
    $('#act_cal').text('1200');
    
    let total = Number($('#sum_cal').text()) + Number($('#add_cal').text()) - Number($('#init_cal').text()) - Number($('#exe_cal').text()) - 1200;
    $('#tot_cal').text(Math.round(total * 100) / 100);
  });
}


