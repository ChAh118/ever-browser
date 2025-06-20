var regedit = require('regedit')

var installPath = process.execPath

var keysToCreate = [
  'HKCU\\Software\\Classes\\Ever Browser',
  'HKCU\\Software\\Classes\\Ever Browser\\Application',
  'HKCU\\Software\\Classes\\Ever Browser\\DefaulIcon',
  'HKCU\\Software\\Classes\\Ever Browser\\shell\\open\\command',
  'HKCU\\Software\\Clients\\StartMenuInternet\\Ever Browser\\Capabilities\\FileAssociations',
  'HKCU\\Software\\Clients\\StartMenuInternet\\Ever Browser\\Capabilities\\StartMenu',
  'HKCU\\Software\\Clients\\StartMenuInternet\\Ever Browser\\Capabilities\\URLAssociations',
  'HKCU\\Software\\Clients\\StartMenuInternet\\Ever Browser\\DefaultIcon',
  'HKCU\\Software\\Clients\\StartMenuInternet\\Ever Browser\\InstallInfo',
  'HKCU\\Software\\Clients\\StartMenuInternet\\Ever Browser\\shell\\open\\command'
]

var registryConfig = {
  'HKCU\\Software\\RegisteredApplications': {
    Ever Browser: {
      value: 'Software\\Clients\\StartMenuInternet\\Ever Browser\\Capabilities',
      type: 'REG_SZ'
    }
  },
  'HKCU\\Software\\Classes\\Ever Browser': {
    default: {
      value: 'Ever Browser Browser Document',
      type: 'REG_DEFAULT'
    }
  },
  'HKCU\\Software\\Classes\\Ever Browser\\Application': {
    ApplicationIcon: {
      value: installPath + ',0',
      type: 'REG_SZ'
    },
    ApplicationName: {
      value: 'Ever Browser',
      type: 'REG_SZ'
    },
    AppUserModelId: {
      value: 'Ever Browser',
      type: 'REG_SZ'
    }
  },
  'HKCU\\Software\\Classes\\Ever Browser\\DefaulIcon': {
    ApplicationIcon: {
      value: installPath + ',0',
      type: 'REG_SZ'
    }
  },
  'HKCU\\Software\\Classes\\Ever Browser\\shell\\open\\command': {
    default: {
      value: '"' + installPath + '" "%1"',
      type: 'REG_DEFAULT'
    }
  },
  'HKCU\\Software\\Classes\\.htm\\OpenWithProgIds': {
    Ever Browser: {
      value: 'Empty',
      type: 'REG_SZ'
    }
  },
  'HKCU\\Software\\Classes\\.html\\OpenWithProgIds': {
    Ever Browser: {
      value: 'Empty',
      type: 'REG_SZ'
    }
  },
  'HKCU\\Software\\Clients\\StartMenuInternet\\Ever Browser\\Capabilities\\FileAssociations': {
    '.htm': {
      value: 'Ever Browser',
      type: 'REG_SZ'
    },
    '.html': {
      value: 'Ever Browser',
      type: 'REG_SZ'
    }
  },
  'HKCU\\Software\\Clients\\StartMenuInternet\\Ever Browser\\Capabilities\\StartMenu': {
    StartMenuInternet: {
      value: 'Ever Browser',
      type: 'REG_SZ'
    }
  },
  'HKCU\\Software\\Clients\\StartMenuInternet\\Ever Browser\\Capabilities\\URLAssociations': {
    http: {
      value: 'Ever Browser',
      type: 'REG_SZ'
    },
    https: {
      value: 'Ever Browser',
      type: 'REG_SZ'
    }
  },
  'HKCU\\Software\\Clients\\StartMenuInternet\\Ever Browser\\DefaultIcon': {
    default: {
      value: installPath + ',0',
      type: 'REG_DEFAULT'
    }
  },
  'HKCU\\Software\\Clients\\StartMenuInternet\\Ever Browser\\InstallInfo': {
    IconsVisible: {
      value: 1,
      type: 'REG_DWORD'
    }
  },
  'HKCU\\Software\\Clients\\StartMenuInternet\\Ever Browser\\shell\\open\\command': {
    default: {
      value: installPath,
      type: 'REG_DEFAULT'
    }
  }
}

var registryInstaller = {
  install: function () {
    return new Promise(function (resolve, reject) {
      regedit.createKey(keysToCreate, function (err) {
        regedit.putValue(registryConfig, function (err) {
          if (err) {
            reject()
          } else {
            resolve()
          }
        })
      })
    })
  },
  uninstall: function () {
    return new Promise(function (resolve, reject) {
      regedit.deleteKey(keysToCreate, function (err) {
        if (err) {
          reject()
        } else {
          resolve()
        }
      })
    })
  }
}
