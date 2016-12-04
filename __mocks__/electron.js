module.exports = {
  require: jest.genMockFunction(),
  match: jest.genMockFunction(),
  remote: {
    app: {
      getAppPath: () => {
        return "C:\\tmp\\mock_path";
      }
    }
  },
  dialog: jest.genMockFunction()
};
