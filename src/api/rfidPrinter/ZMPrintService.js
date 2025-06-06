import request from '@/utils/request'
var wsocket;//websocket对象

var numberPrintneed = 1;//需要打印数量
var numberPrinted = 0;//已经打印的数量

export function connection() { //连接打印服务
  var wsserver = "ws://" + document.getElementById("serverIP").value + ":" + document.getElementById("serverPort").value + "/"
  if ('WebSocket' in window) {
    wsocket = new WebSocket(wsserver);
  } else if ('MozWebSocket' in window) {
    wsocket = new MozWebSocket(wsserver);
  } else {
    alert('不支持当前浏览器！');
  }

  //注册各类回调
  wsocket.onopen = function () {
    document.getElementById("printerstatus").value = "连接打印服务成功！";

  }

  wsocket.onclose = function () {
    document.getElementById("printerstatus").value = "与打印服务断开连接！";
  }

  wsocket.onerror = function () {//出错的提示
    alert('数据传输错误，请检查打印服务是否已经运行！');
  }

  wsocket.onmessage = function (receiveMsg) {//接收服务端数据返回
    var receivecontent = receiveMsg.data;
    if (receivecontent.indexOf("PrinterStatus_USB:") == 0) { //打印机状态，返回格式：PrinterStatus_USB:状态码
      var printerstatus = parseInt(receivecontent.replace("PrinterStatus_USB:", ""));
      if (printerstatus != 0) { //0是打印机状态正常
        var statusmsg = "";
        if (printerstatus == 88)
          statusmsg = "打印机已经暂停，请按[暂停]按键，再重新打印!";
        else if (printerstatus == 82)
          statusmsg = "打印机碳带错误，请重新安装碳带后按[取消]按键，再重新打印!";
        else if (printerstatus == 83)
          statusmsg = "打印机标签错误，请重新安装标签后按[取消]按键，再重新打印!";
        else if (printerstatus == 89)
          statusmsg = "标签纸用完了，请安装新标签！";
        else if (printerstatus == 90)
          statusmsg = "RFID标签读写错误，请按[取消]按键，再重新打印!";
        else if (printerstatus == 91 || printerstatus == 92)
          statusmsg = "RFID标签校准错误，请按[取消]按键，再重新打印!";
        else if (printerstatus == -1007)
          statusmsg = "打印机端口异常，请检查打印机是否正常连接且已开机。";
        else {
          document.getElementById("printerstatus").value = "打印机状态异常，错误代码：" + printerstatus;
          alert("打印机状态异常，错误代码：" + printerstatus);
          return;
        }

        document.getElementById("printerstatus").value = "打印机状态异常：" + statusmsg;
        alert("打印机状态异常：" + statusmsg);
        return;
      }
      else//打印机状态正常
      {
        if (numberPrinted < numberPrintneed)
          printlabel();//打印标签
        else
          alert("已打印完 " + numberPrinted + " 张标签。");
      }
    }
    else if (receivecontent.indexOf("Print finished") != -1) { //打印完成，返回格式：打印完成(Print finished).
      numberPrinted++;
      document.getElementById("printerstatus").value = numberPrinted + " 张标签打印完成。";

      if (numberPrinted < numberPrintneed)
        wsocket.send('ZM_GetPrinterStatus_USB|500');//查询USB打印机状态，状态正常才打印。调用此函数后将进入wsocket.onmessage处理打印
    }
    else if (receivecontent.indexOf("ZM_PrintLabel_Preview:") == 0) { //返回的标签预览图片数据
      var imagebase64string = receivecontent.replace("ZM_PrintLabel_Preview:", "");
      if (imagebase64string.length > 0) {
        document.getElementById("pvimg").src = imagebase64string;//赋值图片的Base64字符串数据
      }
    }
    else
      document.getElementById("printerstatus").value = receivecontent;//显示服务传回来的所有数据
  }
}

export function connectprinter() {//连接打印机
  if (wsocket != null) {//如果已经有连接，则断开后重新连接
    wsocket.close();
    wsocket = null;
  }

  connection();//连接打印服务

  //设置0.5秒后查询连接的打印机。connection后不能即刻查询，此时wsocket的状态是正在连接
  setTimeout(function () {
    wsocket.send("ZM_GetPrinterNameAndSN");//查询当前连接的打印机
  }, 500);
}

export function printstart() { //开始打印
  if (wsocket == null) {
    alert("请先连接打印服务");
    return;
  }
  wsocket.send('ZM_GetPrinterStatus_USB|500');//查询USB打印机状态，状态正常才打印。调用此函数后将进入wsocket.onmessage处理打印
}

//打印标签，即将JSON字符串发给打印服务处理
export function printlabel() {
  var jsonstring = document.getElementById("jsontextarea").value;
  var newjsonstring = jsonstring.replace('"Operate":"preview"', '"Operate":"print"');
  wsocket.send(newjsonstring);//发送JSON字符串给打印服务
}

//预览标签，即将JSON字符串发给打印服务处理，将print替换为preview
export function previewlabel() {
  var jsonstring = document.getElementById("jsontextarea").value;
  var newjsonstring = jsonstring.replace('"Operate":"print"', '"Operate":"preview"');
  wsocket.send(newjsonstring);//发送JSON字符串给打印服务
}
