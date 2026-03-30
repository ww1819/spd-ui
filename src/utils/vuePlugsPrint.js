// 打印类属性、方法定义
/* eslint-disable */
const Print = function (dom, options, pageSize) {

  if (!(this instanceof Print)) return new Print(dom, options, pageSize);

  this.options = this.extend({
    'noPrint': '.no-print',
    /** 为 false 时不注入通用 @page size，便于业务用命名 @page（如三等分横/纵） */
    'injectPageSize': true,
    /** 可选：统一注入 @page margin，减少预览/实打偏差 */
    'pageMargin': '',
    /** 打印前等待资源渲染稳定（图片/字体） */
    'waitForAssets': true,
    /** 打印前额外等待时间，默认给驱动和浏览器排版缓冲 */
    'beforePrintDelay': 260,
    /** afterprint 兜底超时，避免 iframe 遗留 */
    'cleanupDelay': 15000
  }, options);

  if ((typeof dom) === "string") {
    this.dom = document.querySelector(dom);
  } else {
    this.isDOM(dom)
    this.dom = this.isDOM(dom) ? dom : dom.$el;
  }

  this.init(pageSize);
};
Print.prototype = {
  init: function (pageSize) {
    var content = this.getStyle(pageSize) + this.getHtml();
    this.writeIframe(content);
  },
  extend: function (obj, obj2) {
    for (var k in obj2) {
      obj[k] = obj2[k];
    }
    return obj;
  },

  getStyle: function (pageSize) {
    var str = "",
      styles = document.querySelectorAll('style,link');
    for (var i = 0; i < styles.length; i++) {
      str += styles[i].outerHTML;
    }
    str += "<style>" + (this.options.noPrint ? this.options.noPrint : '.no-print') + "{display:none;}</style>";
    str += "<style>html,body,div{height: auto!important;}</style>";

    str = str.replace('size: A5', `size: ${pageSize}`);
    // 自定义纸张（如三等分 210mm×99mm）：注入 @page，避免仅依赖页面内 style 的替换
    if (this.options.injectPageSize !== false && pageSize && String(pageSize).indexOf('mm') !== -1) {
      str += "<style>@page { size: " + pageSize + " !important; }</style>";
    }
    if (this.options.pageMargin && String(this.options.pageMargin).trim()) {
      str += "<style>@page { margin: " + this.options.pageMargin + " !important; }</style>";
    }

    return str;
  },

  getHtml: function () {
    var inputs = document.querySelectorAll('input');
    var textareas = document.querySelectorAll('textarea');
    var selects = document.querySelectorAll('select');

    for (var k = 0; k < inputs.length; k++) {
      if (inputs[k].type == "checkbox" || inputs[k].type == "radio") {
        if (inputs[k].checked == true) {
          inputs[k].setAttribute('checked', "checked")
        } else {
          inputs[k].removeAttribute('checked')
        }
      } else if (inputs[k].type == "text") {
        inputs[k].setAttribute('value', inputs[k].value)
      } else {
        inputs[k].setAttribute('value', inputs[k].value)
      }
    }

    for (var k2 = 0; k2 < textareas.length; k2++) {
      if (textareas[k2].type == 'textarea') {
        textareas[k2].innerHTML = textareas[k2].value
      }
    }

    for (var k3 = 0; k3 < selects.length; k3++) {
      if (selects[k3].type == 'select-one') {
        var child = selects[k3].children;
        for (var i in child) {
          if (child[i].tagName == 'OPTION') {
            if (child[i].selected == true) {
              child[i].setAttribute('selected', "selected")
            } else {
              child[i].removeAttribute('selected')
            }
          }
        }
      }
    }

    let content = this.dom.outerHTML;
    if (content.indexOf('hidden="hidden"') > -1) {
      content = content.replace(/hidden="hidden"/g, '');
    }
    // 布尔属性 hidden 或多余空格
    content = content.replace(/\s+hidden(?:="hidden")?(?=\s|>)/gi, '');
    return content;
  },

  writeIframe: function (content) {
    var _this = this;
    var iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    iframe.id = "myIframe";
    iframe.setAttribute('style', 'position:absolute;width:0;height:0;top:-10px;left:-10px;');
    var w = iframe.contentWindow || iframe.contentDocument;
    var doc = iframe.contentDocument || iframe.contentWindow.document;

    var printDone = false;
    var cleanupDone = false;
    function cleanup() {
      if (cleanupDone) return;
      cleanupDone = true;
      try {
        if (iframe && iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      } catch (e) {}
    }
    function finishAndPrint() {
      if (printDone) return;
      printDone = true;
      iframe.onload = null;
      _this.prepareAndPrint(w, _this.options).finally(function () {
        setTimeout(cleanup, _this.options.cleanupDelay || 15000);
      });
    }
    // 必须先绑定 onload 再 write/close；部分环境下 load 不触发，需定时兜底否则打印对话框永不出现
    iframe.onload = function () {
      finishAndPrint();
    };
    doc.open();
    doc.write(content);
    doc.close();
    setTimeout(finishAndPrint, 300);
  },

  prepareAndPrint: function (frameWindow, options) {
    var _this = this;
    var tasks = [];
    if (options.waitForAssets !== false) {
      tasks.push(this.waitFontsReady(frameWindow));
      tasks.push(this.waitImagesReady(frameWindow));
    }
    return Promise.all(tasks).catch(function () {}).then(function () {
      return new Promise(function (resolve) {
        setTimeout(function () {
          _this.toPrint(frameWindow, options, resolve);
        }, options.beforePrintDelay || 260);
      });
    });
  },
  waitFontsReady: function (frameWindow) {
    try {
      if (frameWindow.document && frameWindow.document.fonts && frameWindow.document.fonts.ready) {
        return Promise.race([
          frameWindow.document.fonts.ready,
          new Promise(function (resolve) { setTimeout(resolve, 1200); })
        ]);
      }
    } catch (e) {}
    return Promise.resolve();
  },
  waitImagesReady: function (frameWindow) {
    try {
      var imgs = frameWindow.document.querySelectorAll('img');
      if (!imgs || imgs.length === 0) return Promise.resolve();
      var waits = [];
      for (var i = 0; i < imgs.length; i++) {
        var img = imgs[i];
        if (img.complete) continue;
        waits.push(new Promise(function (resolve) {
          var done = false;
          function finish() {
            if (done) return;
            done = true;
            resolve();
          }
          img.addEventListener('load', finish, { once: true });
          img.addEventListener('error', finish, { once: true });
          setTimeout(finish, 1200);
        }));
      }
      return Promise.all(waits);
    } catch (e) {
      return Promise.resolve();
    }
  },
  toPrint: function (frameWindow, options, done) {
    try {
      setTimeout(function () {
        var finished = false;
        function finish() {
          if (finished) return;
          finished = true;
          if (typeof done === 'function') done();
        }
        try {
          frameWindow.onafterprint = finish;
        } catch (e) {}
        frameWindow.focus();
        try {
          if (!frameWindow.document.execCommand('print', false, null)) {
            frameWindow.print();
          }
          if (options.callback ) options.callback()
        } catch (e) {
          frameWindow.print();
        }
        // 部分浏览器 afterprint 不触发，兜底 2s
        setTimeout(finish, 2000);
      }, 10);
    } catch (err) {
      console.log('err', err);
      if (typeof done === 'function') done();
    }
  },
  isDOM: (typeof HTMLElement === 'object') ?
    function (obj) {
      return obj instanceof HTMLElement;
    } :
    function (obj) {
      return obj && typeof obj === 'object' && obj.nodeType === 1 && typeof obj.nodeName === 'string';
    },
};
const MyPlugin = {}
MyPlugin.install = function (Vue, options) {
  // 4. 添加实例方法
  Vue.prototype.$print = Print
}
export default MyPlugin
