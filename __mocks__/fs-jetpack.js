let _initPath = null;

module.exports = {
  cwd: (path) => {
    _initPath = path;

    return {
      path : () => {
        return 'This is a completely bogus path created by __mocks__/fs-jetpack.js';
      }
    };
  },
  path: _initPath
};

// const jetpack = require('fs-jetpack').cwd(app.getAppPath());

// ,
//   remote: {
//     app: {
//       getAppPath: () => {
//         return 'C:\\tmp\\mock_path';
//       }
//     }
//   },
//   dialog: jest.genMockFunction()
