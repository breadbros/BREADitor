import { BrowserWindow } from 'electron';

let win:BrowserWindow;

const set = (w:BrowserWindow):void => {
  win = w;
};

const get = ():BrowserWindow => {
  return win;
};

export const MainWindow = {
  set,
  get
};