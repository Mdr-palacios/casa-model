// Protección sencilla para la página de la casa: antes de ver el contenido,
// hay que responder correctamente una pregunta. La respuesta se guarda en
// este navegador para no tener que contestarla cada vez.
//
// Nota: esto es solo para que personas al azar no vean el contenido por
// casualidad — no es una protección de verdad, porque el código de la
// página es público. No usar para información que deba mantenerse en
// secreto de forma segura.
(function () {
  var STORAGE_KEY = 'casaManzanarezUnlocked';
  // SHA-256 de la respuesta correcta (solo los dígitos del año).
  var ANSWER_HASH = '59279341ea59fbf34025024596b670b6df2c9f80e71b9ad19aea71ba43b083fc';

  var unlocked = false;
  try {
    unlocked = localStorage.getItem(STORAGE_KEY) === 'yes';
  } catch (e) {}

  if (unlocked) return;

  // Ocultar el contenido de inmediato para que no se vea ni un instante
  // antes de mostrar la pregunta.
  document.documentElement.style.visibility = 'hidden';

  function digitsOnly(str) {
    return (str || '').replace(/\D/g, '');
  }

  function sha256Hex(text) {
    var enc = new TextEncoder().encode(text);
    return crypto.subtle.digest('SHA-256', enc).then(function (buf) {
      var bytes = new Uint8Array(buf);
      var hex = '';
      for (var i = 0; i < bytes.length; i++) {
        hex += bytes[i].toString(16).padStart(2, '0');
      }
      return hex;
    });
  }

  function injectStyles() {
    var style = document.createElement('style');
    style.textContent = [
      '#casaAuthOverlay{position:fixed;inset:0;z-index:9999;display:flex;',
      'visibility:visible!important;',
      'align-items:center;justify-content:center;padding:20px;',
      'background:#efe7d8;',
      'background-image:radial-gradient(circle at 12% 8%, rgba(181,87,60,0.12), transparent 45%),',
      'radial-gradient(circle at 88% 92%, rgba(122,146,105,0.14), transparent 45%);',
      'font-family:\'General Sans\',-apple-system,sans-serif;}',
      '#casaAuthOverlay *{box-sizing:border-box;}',
      '#casaAuthOverlay .box{width:100%;max-width:380px;background:#fdf9f1;',
      'border:1px solid rgba(60,45,30,0.14);border-radius:16px;',
      'box-shadow:0 12px 40px rgba(50,35,20,0.14);padding:32px 28px;text-align:center;}',
      '#casaAuthOverlay h1{font-family:\'Fraunces\',serif;font-weight:600;font-size:20px;',
      'margin:0 0 8px;color:#2c2318;}',
      '#casaAuthOverlay p.q{margin:0 0 18px;font-size:14px;color:#6b5c47;line-height:1.5;}',
      '#casaAuthOverlay input{width:100%;font-size:16px;padding:11px 14px;',
      'border:1px solid rgba(60,45,30,0.2);border-radius:10px;background:#fff;',
      'color:#2c2318;margin-bottom:12px;text-align:center;}',
      '#casaAuthOverlay input:focus{outline:2px solid #b5573c;outline-offset:1px;}',
      '#casaAuthOverlay button{width:100%;font-size:15px;font-weight:600;padding:11px 14px;',
      'border:none;border-radius:10px;background:#b5573c;color:#fff;cursor:pointer;',
      'transition:background 150ms ease;}',
      '#casaAuthOverlay button:hover{background:#8a3f2a;}',
      '#casaAuthOverlay .err{color:#b5573c;font-size:13px;margin:10px 0 0;min-height:16px;}',
    ].join('');
    document.head.appendChild(style);
  }

  function buildOverlay() {
    injectStyles();
    var overlay = document.createElement('div');
    overlay.id = 'casaAuthOverlay';
    overlay.innerHTML =
      '<div class="box">' +
      '<h1>Casa Manzanarez</h1>' +
      '<p class="q">Para entrar, contesta esta pregunta:<br><strong>&iquest;En qu\u00e9 a&ntilde;o naci\u00f3 Ana?</strong></p>' +
      '<form id="casaAuthForm">' +
      '<input type="text" id="casaAuthInput" inputmode="numeric" autocomplete="off" placeholder="A\u00f1o" autofocus />' +
      '<button type="submit">Entrar</button>' +
      '<p class="err" id="casaAuthErr"></p>' +
      '</form>' +
      '</div>';
    document.body.appendChild(overlay);

    var form = document.getElementById('casaAuthForm');
    var input = document.getElementById('casaAuthInput');
    var err = document.getElementById('casaAuthErr');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var guessDigits = digitsOnly(input.value);
      if (!guessDigits) {
        err.textContent = 'Escribe el a\u00f1o para continuar.';
        return;
      }
      sha256Hex(guessDigits).then(function (hash) {
        if (hash === ANSWER_HASH) {
          try {
            localStorage.setItem(STORAGE_KEY, 'yes');
          } catch (e) {}
          overlay.remove();
          document.documentElement.style.visibility = 'visible';
        } else {
          err.textContent = 'Esa respuesta no es correcta. Int\u00e9ntalo de nuevo.';
          input.select();
        }
      });
    });
  }

  function init() {
    if (document.body) {
      buildOverlay();
    } else {
      document.addEventListener('DOMContentLoaded', buildOverlay);
    }
  }

  init();
})();
