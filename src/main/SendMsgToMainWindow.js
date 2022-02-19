import { MainWindow } from './MainWindowReference';

export const send = (msg, accelerator) => {
  const contents = MainWindow.get().webContents;

  const message = {
    msg
  };

  if (typeof accelerator !== 'undefined') {
    message.accelerator = accelerator;
  }

  contents.send('main-menu', message);
};
