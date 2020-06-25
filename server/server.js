const express = require('express');
const mariadb = require('mariadb');
const winston = require('winston');
const bodyParser = require('body-parser');
const session = require('express-session');
const key = require('pbkdf2-password')();
const sessionDatabase = require('express-mysql-session')(session);
const DBOptions = {
  host: 'localhost', 
  user:'milall',
  database: 'milall',
  idleTimeout: 0
};
const app = express();
const pool = mariadb.createPool(DBOptions);
const sessionDB = new sessionDatabase(DBOptions);
(async function() { db = await pool.getConnection(); })();

let logger = new winston.createLogger({
  transports: [
    new winston.transports.File({
      level: 'info',
      filename: '/home/luftaquila/HDD/mil-all/server/server.log',
      maxsize: 10485760, // 10MB
      maxFiles: 1,
      showLevel: true,
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.json()
      )
    })
  ],
  exitOnError: false,
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
 secret: '@+*LU_Ft%AQuI-|!la#@$',
 resave: false,
 saveUninitialized: true,
 store: sessionDB,
 cookie: {expires: new Date(2147483647000)}
}));

app.post('/api/groupMemberCount', async function(req, res) {
  let groups = await db.query("SELECT COUNT(*) FROM `groups`;");
  let members = await db.query("SELECT COUNT(*) FROM `members`;");
  return res.send({ groups: groups[0]['COUNT(*)'].toString(), members: members[0]['COUNT(*)'].toString() });
});

app.post('/api/loginCheck', function(req, res) {
  if(req.session.login) return res.send({ result: "true", detail: req.session.role, session: req.session });
  else return res.send({ result: 'false' });
});

app.post('/api/login', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  let ans = req.body, msg;
  if(!ans.id) msg = "군번을 입력해 주세요";
  else if(!ans.pw) msg = "비밀번호를 입력해 주세요";
  else if(/"|'|;|\\| |%|_|`/g.test(ans.id)) msg = "군번 또는 비밀번호가 올바르지 않습니다.";
  else if(/"|'|;|\\| |%|_|`/g.test(ans.pw)) msg = "군번 또는 비밀번호가 올바르지 않습니다.";
  
  if(msg) return res.send({ result: msg });

  let query = "SELECT * FROM `members` WHERE `id`='" + ans.id + "';";
  let result = await db.query(query);
  
  if(!result.length) return res.send({ result: "군번 또는 비밀번호가 올바르지 않습니다." });
  else result = result[0];
  
  key({ password: ans.pw, salt: result.salt }, async function (err, pass, salt, hash) {
    if(!err) {
      try {
        if(hash == result.pw) {
          if(!result.code) return alertify.error('로그인 처리 중에 문제가 발생했습니다. 다시 시도해 주세요');
          let query = "SELECT * FROM `" + result.code + "` WHERE `id`='" + ans.id + "';";
          let resp = await db.query(query);
          if(resp.length) {
            resp = resp[0];
            req.session.login = true;
            req.session.uid = resp.id;
            req.session.name = resp.name;
            req.session.rank = resp.rank;
            req.session.role = resp.role;
            req.session.age = resp.age;
            req.session.sex = resp.sex;
            req.session.group = resp.group;
            req.session.code = result.code;
            logger.info('Login requested.', { ip: ip, url: 'api/login', detail: resp.id });
            return res.send({ result: 'OK', detail: resp.role });
          }
          else return res.send({ result: "FAILURE_NO_MEMBER_INFO_ON_GROUP_MEMBERS" });
        }
        else return res.send({ result: "군번 또는 비밀번호가 올바르지 않습니다." });
      } catch(e) {
        let err = "FAILURE_WHILE_PROCESSING_LOGIN";
        logger.error('Login failed.', { ip: ip, url: 'api/login', result: e.toString(), detail: err });
        res.send({ result: err });
      }
    }
  });
});

app.post('/api/logout', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  logger.info('Logout requested.', { ip: ip, url: 'api/logout', detail: req.session.uid });
  req.session.destroy();
  return res.send({ result: 'OK' });
});

app.post('/api/register', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  let ans = req.body;
  let query = "SELECT * FROM `members` WHERE `id`='" + ans.id + "';"; // 중복 계정 검사
  let result = await db.query(query);
  if(result.length) return res.send({ result: "FAILURE_DUPLICATE_ID" }); // 이미 존재하는 군번일 경우 거부
  else {
    // 입력정보 유효성 검사
    let msg = '';
    if(!ans.id) msg = "군번을 입력해 주세요";
    else if(ans.id.length > 20) msg = "군번은 20자리를 넘을 수 없습니다";
    else if(/"|'|;|\\| |%|_|`/g.test(ans.id)) msg = "다음 문자는 사용할 수 없습니다 - " + '" ' + "' ; \ % _ ` 공백";
    
    else if(!ans.name) msg = "이름을 입력해 주세요";
    else if(ans.name.length > 10) msg = "이름은 10자리를 넘을 수 없습니다";
    else if(/"|'|;|\\| |%|_|`/g.test(ans.name)) msg = "다음 문자는 사용할 수 없습니다 - " + '" ' + "' ; \ % _ ` 공백";

    else if(!ans.rank) msg = "계급을 입력해 주세요";
    else if(ans.rank.length > 10) msg = "계급은 10자리를 넘을 수 없습니다";
    else if(/"|'|;|\\| |%|_|`/g.test(ans.rank)) msg = "다음 문자는 사용할 수 없습니다 - " + '" ' + "' ; \ % _ ` 공백";

    else if(!ans.pw) msg = "비밀번호를 입력해 주세요";
    else if(ans.pw.length > 20) msg = "비밀번호는 20자리를 넘을 수 없습니다";
    else if(/"|'|;|\\| |%|_|`/g.test(ans.pw)) msg = "다음 문자는 사용할 수 없습니다 - " + '" ' + "' ; \ % _ ` 공백";
    
    else if(!ans.age) msg = "나이를 입력해 주세요";
    else if(!ans.sex) msg = "성별을 선택해 주세요";
    else if(!ans.group) msg = "군 구분을 선택해 주세요";
    
    if(msg) return res.send({ result: msg });
    
    if(ans.isCommander == "true") { // 가입자가 지휘관일 경우
      // 그룹 이름 유효성 검사
      let msg = '';
      if(!ans.code) msg = "그룹 이름을 입력해 주세요";
      else if(ans.code.length > 30) msg = "그룹 명은 30자리를 넘을 수 없습니다";
      else if(/"|'|;|\\|%|_|`/g.test(ans.code)) msg = "다음 문자는 사용할 수 없습니다 - " + '" ' + "' ; \ % _ `";
      if(msg) return res.send({ result: msg });

      let code;
      do { // 그룹 코드 생성
        code = Math.random().toString(36).substr(2, 6).toUpperCase(); // 그룹 코드 생성
        let query = "SELECT * FROM `groups` WHERE `code`='" + code + "';";
        let result = await db.query(query);
      } while(result.length) // 기존 코드와 중복될 경우 재생성
        
      key({ password: ans.pw }, async function (err, pass, salt, hash) { // 비밀번호 암호화
        if(!err) {
          try { // members 테이블에 유저 정보 삽입
            let query = "INSERT INTO `members` VALUES('" + ans.id + "', '" + hash + "', '" + salt + "', '" + code + "');";
            let result = await db.query(query);
            if(result.affectedRows) {
              // groups 테이블에 새 그룹 정보 삽입
              try {
                let query = "INSERT INTO `groups` (`code`, `name`) VALUES('" + code + "', '" + ans.code + "');";
                let result = await db.query(query);
              } catch(e) {
                let err = "FAILURE_INSERT_INTO_GROUPS_ERROR";
                logger.error('Admin register failed.', { ip: ip, url: '/api/register', result: e.toString(), detail: err });
                return res.send({ result: err });
              }   
              
              // 그룹 회원 테이블 생성
              try {
                let query = "CREATE TABLE `" + code + "` (" + 
                    "`id` VARCHAR(20) NOT NULL," +
                    "`name` VARCHAR(10) NOT NULL," +
                    "`rank` VARCHAR(10) NOT NULL," +
                    "`role` VARCHAR(10)," +
                    "`sex` VARCHAR(3)," +
                    "`age` INT," +
                    "`group` VARCHAR(10)," +
                    "`health` TEXT," +
                    "`chat` TEXT," +
                    "FOREIGN KEY(`id`)" +
                    "REFERENCES `members`(`id`) ON DELETE CASCADE);";
                let result = await db.query(query);
              } catch(e) {
                let err = "FAILURE_CREATE_TABLE_GROUPMEMBERS_ERROR";
                logger.error('Admin register failed.', { ip: ip, url: '/api/register', result: e.toString(), detail: err });
                return res.send({ result: err });
              }
              
              // 그룹 회원 테이블에 유저 정보 삽입
              try {
                let query = "INSERT INTO `" + code + "` (`id`, `name`, `rank`, `role`, `age`, `sex`, `group`) VALUES('" + ans.id + "', '" + ans.name + "', '" + ans.rank + "', 'admin', " + ans.age + ", '" + ans.sex + "', '" + ans.group + "');";
                let result = await db.query(query);
              } catch(e) {
                let err = "FAILURE_INSERT_USERINFO_INTO_TABLE_GROUPMEMBERS_ERROR";
                logger.error('Admin register failed.', { ip: ip, url: '/api/register', result: e.toString(), detail: err });
                return res.send({ result: err });
              }              
              // 그룹 게시판 테이블 생성
              try {
                let query = "CREATE TABLE `" + code + "_board` (" +
                    "`timestamp` TIMESTAMP," +
                    "`count` INT PRIMARY KEY AUTO_INCREMENT NOT NULL," +
                    "`anonymous` TINYINT(1) DEFAULT 0," +
                    "`id` VARCHAR(20)," +
                    "`subject` VARCHAR(50)," +
                    "`content` TEXT," +
                    "`reply` TEXT );";
                let result = await db.query(query);
              } catch(e) {
                let err = "FAILURE_CREATE_TABLE_GROUPBOARD_ERROR";
                logger.error('Admin register failed.', { ip: ip, url: '/api/register', result: e.toString(), detail: err });
                return res.send({ result: err });
              }
              logger.info('Admin registered.', { ip: ip, url: '/api/register', detail: ans.id });
              res.send({ result: 'OK' });
            }
          } catch(e) {
            let err = "FAILURE_INSERT_INTO_MEMBERS_ERROR";
            logger.error('Admin register failed.', { ip: ip, url: '/api/register', result: e.toString(), detail: err });
            return res.send({ result: err });
          }
        }
        else return res.send({ result: "FAILURE_ENCRYPT_ERROR" });
      });
    }
    else { // 가입자가 일반 멤버일 경우
      let msg = '';
      if(!ans.code) msg = "그룹 코드를 입력해 주세요";
      else if(!/^[A-Z0-9]{6}$/g.test(ans.code)) msg = "유효한 코드가 아닙니다";
      if(msg) return res.send({ result: msg });
      
      try {
        // 그룹 코드 조회
        let query = "SELECT * FROM `groups` WHERE `code`='" + ans.code + "';";
        let result = await db.query(query);
        if(!result.length) return res.send({ result: "유효한 코드가 아닙니다" });
        } catch(e) {
          let err = "FAILURE_WHILE_GROUP_CODE_CHECK";
          logger.error('Member register failed.', { ip: ip, url: '/api/register', result: e.toString(), detail: err });
          return res.send({ result: err });
        }
      
      key({ password: ans.pw }, async function (err, pass, salt, hash) { // 비밀번호 암호화
        if(!err) {
          try {
            // `members` 테이블에 유저 정보 삽입
            let query = "INSERT INTO `members` VALUES('" + ans.id + "', '" + hash + "', '" + salt + "', '" + ans.code + "');";
            let result = await db.query(query);
          } catch(e) {
            let err = "FAILURE_INSERT_INTO_MEMBERS_ERROR";
            logger.error('Member register failed.', { ip: ip, url: '/api/register', result: e.toString(), detail: err });
            return res.send({ result: err });
          }

          try {
            // 그룹 회원 테이블에 유저 정보 삽입
            let query = "INSERT INTO `" + ans.code + "` (`id`, `name`, `rank`, `role`, `age`, `sex`, `group`) VALUES('" + ans.id + "', '" + ans.name + "', '" + ans.rank + "', 'member', " + ans.age + ", '" + ans.sex + "', '" + ans.group + "');";
            let result = await db.query(query);
          } catch(e) {
            let err = "FAILURE_INSERT_INTO_GROUP_MEMBERS_ERROR";
            logger.error('Member register failed.', { ip: ip, url: '/api/register', result: e.toString(), detail: err });
            return res.send({ result: err });
          }
        }
      });
      logger.info('Member registered.', { ip: ip, url: '/api/register', detail: ans.id });
      res.send({ result: "OK" });
    }
  }
});

app.post('/api/groupdata', async function(req, res) {
  let query = "SELECT * FROM `groups` WHERE `code`='" + req.session.code + "';";
  let result = await db.query(query);
  return res.send(result);
});

app.post('/api/memberdata', async function(req, res) {
  let query = "SELECT * FROM `" + req.session.code + "`;";
  let result = await db.query(query);
  return res.send(result);
});

app.post('/api/mydata', async function(req, res) {
  let query = "SELECT * FROM `" + req.session.code + "` WHERE `id`='" + req.session.uid + "';";
  let result = await db.query(query);
  return res.send(result);
});

app.post('/api/myGroupInfo', async function(req, res) {
  let query = "SELECT * FROM `groups` WHERE `code`='" + req.session.code + "';";
  let result = await db.query(query);
  return res.send(result);
});

app.post('/api/updateHealth', async function(req, res) {
  let query = "UPDATE `" + req.session.code + "` SET `health`='" + req.body.data + "' WHERE `id`='" + req.session.uid + "';";
  let result = await db.query(query);
  return res.send({ result: 'OK' });
});

app.post('/api/updateGroupSettings', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  try {
    let query = "UPDATE `groups` SET `health`='" + req.body.health + "', `notice`='" + req.body.notice + "', `diet`='" + req.body.diet + "' WHERE `code`='" + req.session.code + "';";
    let result = await db.query(query);
    logger.info('Group setting updated.', { ip: ip, url: '/api/updateGroupSettings', detail: req.session.uid });
    return res.send({ result: 'OK' });
  } catch(e) {
    logger.error('Group setting update failed.', { ip: ip, url: '/api/updateGroupSettings', result: e.toString(), detail: req.session.uid });
  }
});

app.post('/api/updateMemberInfo', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  try {
    let query = "UPDATE `" + req.session.code + "` SET `" + req.body.key + "`='" + req.body.value + "' WHERE `id`='" + req.body.uid + "';";
    let result = await db.query(query);
    logger.info('Member setting updated.', { ip: ip, url: '/api/updateMemberInfo', detail: req.session.uid });
    return res.send({ result: 'OK' });
  } catch(e) {
    logger.error('Member setting update failed.', { ip: ip, url: '/api/updateGroupSettings', result: e.toString(), detail: req.session.uid });
  }
});

app.post('/api/requestBoard', async function(req, res) {
  let query = "SELECT `count`, `subject` FROM `" + req.session.code + "_board`;";
  let result = await db.query(query);
  return res.send(result);
});

app.post('/api/commitArticle', async function(req, res) {
  const ip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
  try {
    if(!req.body.subject || !req.body.article) return res.send({ result: "제목과 내용을 모두 입력해 주세요."});
    let subject = req.body.subject.replace(/\"/g, '\\"').replace(/`/g, "'").replace(/\'/g, "\\'");
    let article = req.body.article.replace(/\"/g, '\\"').replace(/`/g, "'").replace(/\'/g, "\\'");
    let query = "INSERT INTO `" + req.session.code + "_board`(`anonymous`, `id`, `subject`, `content`) VALUES(" + 
        (req.body.anonymous == 'true' ? '1' : '0') + ", '" + req.session.uid + "', '" + subject + "', '" + article + "');";
    let result = await db.query(query);
    logger.info('Article posted.', { ip: ip, url: '/api/commitArticle', detail: req.session.uid });
    return res.send({ result: 'OK' });
  } catch(e) {
    logger.error('Article post failed.', { ip: ip, url: '/api/commitArticle', result: e.toString(), detail: req.session.uid });
  }
});

app.post('/api/commitReply', async function(req, res) {
  if(!req.body.reply) return res.send({ result: '답글을 입력해 주세요' });
  let content = req.body.reply.replace(/\"/g, '\\"').replace(/`/g, "'").replace(/\'/g, "\\'");
  let query = "SELECT `reply` FROM `" + req.session.code + "_board` WHERE `count`=" + req.body.count + ";";
  let result = await db.query(query);
  if(result.length) {
    let reply = result[0].reply ? JSON.parse(result[0].reply) : [];
    reply.push({
      timestamp: new Date(),
      id: req.session.uid,
      writer: req.session.rank + ' ' + req.session.name,
      content: content
    });
    query = "UPDATE `" + req.session.code + "_board` SET `reply`='" + JSON.stringify(reply) + "' WHERE `count`=" + req.body.count + ";";
    result = await db.query(query);
    return res.send({ result: 'OK' });
  }
});

app.post('/api/loadArticle', async function(req, res) {
  let query = "SELECT * FROM `" + req.session.code + "_board` WHERE `count`=" + req.body.count + ";";
  let result = await db.query(query);
  if(!result.length) return res.send({ result: "존재하지 않는 게시물입니다." });
  return res.send({
    result: 'OK',
    timestamp: result[0].timestamp,
    writer: result[0].anonymous ? '익명' : formatWriter(await db.query("SELECT `name`, `rank` FROM `" + req.session.code + "` WHERE id='" + result[0].id + "';")),
    subject: result[0].subject,
    content: result[0].content,
    reply: result[0].reply
  });
  function formatWriter(result) {
    return result[0].rank + ' ' + result[0].name;
  }
});

app.listen(3110, async function() {
  db = await pool.getConnection();
  console.log('Express is listening on port 3110');
  logger.info('Server startup finished.', { ip: 'LOCALHOST', url: 'SERVER' });
  setInterval(async function() {
    try { await db.query('SHOW TABLES;'); }
    catch(e) { db = await pool.getConnection(); }
  }, 300000);
});


