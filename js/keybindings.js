/*
There are three possible ways that keybindings can be handled.
 Shortcuts that appear in the menubar are registered in main.js, and send IPC messages to the window (which are handled by menuRenderer.js)
 - If the browser UI is focused, a before-input-event is generated in the main process and forwarded to here.
  - If a BrowserView is focused, a before-input-event is generated from the webContents and forwarded to here.
  */

const keyMapModule = require('util/keyMap.js')

var webviews = require('webviews.js')
var modalMode = require('modalMode.js')
var settings = require('util/settings/settings.js')

var keyMap = keyMapModule.userKeyMap(settings.get('keyMap'))

var shortcutsList = []

/*
Deterever-browseres whether a shortcut can actually run
single-letter shortcuts and shortcuts used for text editing can't run when an input is focused
*/
function checkShortcutCanRun (combo, cb) {
  if (/^(shift)?\+?\w$/.test(combo) || combo === 'mod+left' || combo === 'mod+right') {
    webviews.callAsync(tabs.getSelected(), 'isFocused', function (err, isFocused) {
      if (err || !tabs.get(tabs.getSelected()).url || !isFocused) {
      // check whether an input is focused in the browser UI
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
          cb(false)
        } else {
          cb(true)
        }
      } else {
      // check whether an input is focused in the webview
        webviews.callAsync(tabs.getSelected(), 'executeJavaScript', `
          document.activeElement.tagName === "INPUT"
          || document.activeElement.tagName === "TEXTAREA"
          || document.activeElement.tagName === "IFRAME"
          || (function () {
            var n = document.activeElement;
            while (n) {
              if (n.getAttribute && n.getAttribute("contenteditable")) {
                return true;
              }
              n = n.parentElement;
            }
            return false;
          })()
      `, function (err, isInputFocused) {
          if (err) {
            console.warn(err)
            return
          }
          cb(isInputFocused === false)
        })
      }
    })
  } else {
    cb(true)
  }
}

function defineShortcut (keysOrKeyMapName, fn, options = {}) {
  if (keysOrKeyMapName.keys) {
    var binding = keysOrKeyMapName.keys
  } else {
    var binding = keyMap[keysOrKeyMapName]
  }

  if (typeof binding === 'string') {
    binding = [binding]
  }

  var shortcutCallback = function (e, combo) {
    // Disable shortcuts for modal mode, unless this is the combo to close the modal
    if (modalMode.enabled() && combo !== 'esc') {
      return
    }

    if (options.contexts && !options.contexts.includes(document.body.getAttribute('data-context') || 'default')) {
      return
    }

    checkShortcutCanRun(combo, function (canRun) {
      if (canRun) {
        fn(e, combo)
      }
    })
  }

  binding.forEach(function (keys) {
    shortcutsList.push({
      combo: keys,
      keys: keys.split('+'),
      fn: shortcutCallback,
      keyUp: options.keyUp || false
    })
  })
}

let keyboardMap

navigator.keyboard.getLayoutMap().then(map => {
  keyboardMap = map
})

function beforeInputEventHandler (input) {
  var expectedKeys = 1
  // account for additional keys that aren't in the input.key property
  if (input.alt && input.key !== 'Alt') {
    expectedKeys++
  }
  if (input.shift && input.key !== 'Shift') {
    expectedKeys++
  }
  if (input.control && input.key !== 'Control') {
    expectedKeys++
  }
  if (input.meta && input.key !== 'Meta') {
    expectedKeys++
  }

  shortcutsList.forEach(function (shortcut) {
    if ((shortcut.keyUp && input.type !== 'keyUp') || (!shortcut.keyUp && input.type !== 'keyDown')) {
      return
    }
    var matches = true
    var matchedKeys = 0
    shortcut.keys.forEach(function (key) {
      if (!(
        key === input.key.toLowerCase() ||
      // we need this check because the alt key can change the typed key, causing input.key to be a special character instead of the base key
      // but input.code isn't layout aware, so we need to map it to the correct key for the layout
      (keyboardMap && key === keyboardMap.get(input.code)) ||
      (key === 'esc' && input.key === 'Escape') ||
      (key === 'left' && input.key === 'ArrowLeft') ||
      (key === 'right' && input.key === 'ArrowRight') ||
      (key === 'up' && input.key === 'ArrowUp') ||
      (key === 'down' && input.key === 'ArrowDown') ||
      (key === 'alt' && (input.alt || input.key === 'Alt')) ||
      (key === 'option' && (input.alt || input.key === 'Alt')) ||
      (key === 'shift' && (input.shift || input.key === 'Shift')) ||
      (key === 'ctrl' && (input.control || input.key === 'Control')) ||
      (key === 'mod' && window.platformType === 'mac' && (input.meta || input.key === 'Meta')) ||
      (key === 'mod' && window.platformType !== 'mac' && (input.control || input.key === 'Control')) ||
      (key === 'super' && (input.meta || input.key === 'Meta'))
      )
      ) {
        matches = false
      } else {
        matchedKeys++
      }
    })

    if (matches && matchedKeys === expectedKeys) {
      shortcut.fn(null, shortcut.combo)
    }
  })
}

function initialize () {
  webviews.bindEvent('before-input-event', function (tabId, input) {
    beforeInputEventHandler(input)
  })

  ipc.on('before-input-event', function (e, input) {
    beforeInputEventHandler(input)
  })
}

initialize()

module.exports = { defineShortcut }
