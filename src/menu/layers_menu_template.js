import { send } from '../main/SendMsgToMainWindow';

const makeLayer = (title, accelerator) => {
  return { label: title, accelerator, click () {
    send(`focus-layer-${  accelerator}`, accelerator);
  } };
};

// TODO: make this update with the real layer names on load / add
export const layersMenuTemplate = {
  label: 'Layers',
  submenu: [
    makeLayer('Obstructions', 'O'),
    makeLayer('Zones', 'Z'),
    makeLayer('Entities', 'E'),
    { type: 'separator' },
    makeLayer('Layer 1', '1'),
    makeLayer('Layer 2', '2'),
    makeLayer('Layer 3', '3'),
    makeLayer('Layer 4', '4'),
    makeLayer('Layer 5', '5'),
    makeLayer('Layer 6', '6'),
    makeLayer('Layer 7', '7'),
    makeLayer('Layer 8', '8'),
    makeLayer('Layer 9', '9')
  ]
};
